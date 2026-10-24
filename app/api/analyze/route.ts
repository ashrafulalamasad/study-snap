import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { callModelStreaming, type ModelMessage } from "@/lib/openrouter";
import { getAnalyzePrompt } from "@/lib/prompts";

// JSON schema for validation
interface AnalyzeResult {
  title: string;
  summary: string;
  keyPoints: string[];
  focusTopics: string[];
  mcq: {
    question: string;
    options: string[];
    answerIndex: number;
    explanation: string;
    source: string;
    topic: string;
  }[];
  shortQuestions: {
    question: string;
    modelAnswer: string;
  }[];
}

function validateResult(data: unknown): data is AnalyzeResult {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;

  if (typeof d.title !== "string") return false;
  if (typeof d.summary !== "string") return false;
  if (!Array.isArray(d.keyPoints)) return false;
  if (!Array.isArray(d.focusTopics)) return false;
  if (!Array.isArray(d.mcq) || d.mcq.length < 1) return false;
  if (!Array.isArray(d.shortQuestions) || d.shortQuestions.length < 1)
    return false;

  for (const q of d.mcq as Record<string, unknown>[]) {
    if (typeof q.question !== "string") return false;
    if (!Array.isArray(q.options) || q.options.length !== 4) return false;
    if (typeof q.answerIndex !== "number") return false;
    if (typeof q.explanation !== "string") return false;
    if (typeof q.source !== "string") return false;
    if (typeof q.topic !== "string") return false;
  }

  for (const q of d.shortQuestions as Record<string, unknown>[]) {
    if (typeof q.question !== "string") return false;
    if (typeof q.modelAnswer !== "string") return false;
  }

  return true;
}

function extractJSON(text: string): string {
  // Try to extract JSON from possible markdown fences or surrounding text
  let cleaned = text.trim();

  // Remove markdown code fences
  const fenceMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  // Find the first { and last }
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  return cleaned;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const language = (formData.get("language") as string) || "en";
    const deviceId = formData.get("deviceId") as string;

    if (!deviceId) {
      return NextResponse.json(
        { error: "deviceId is required" },
        { status: 400 }
      );
    }

    // Collect note images (up to 4)
    const noteImages: string[] = [];
    for (let i = 0; i < 4; i++) {
      const file = formData.get(`note_${i}`) as File | null;
      if (file) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const base64 = buffer.toString("base64");
        const mimeType = file.type || "image/jpeg";
        noteImages.push(`data:${mimeType};base64,${base64}`);
      }
    }

    if (noteImages.length === 0) {
      return NextResponse.json(
        { error: "At least one note image is required" },
        { status: 400 }
      );
    }

    // Collect past-question images (up to 2)
    const pastQuestionImages: string[] = [];
    for (let i = 0; i < 2; i++) {
      const file = formData.get(`past_${i}`) as File | null;
      if (file) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const base64 = buffer.toString("base64");
        const mimeType = file.type || "image/jpeg";
        pastQuestionImages.push(`data:${mimeType};base64,${base64}`);
      }
    }

    // Build multimodal message
    const systemPrompt = getAnalyzePrompt(language as "bn" | "en");

    const userContent: import("@/lib/openrouter").ModelContentPart[] = [
      {
        type: "text" as const,
        text:
          pastQuestionImages.length > 0
            ? `Here are my lecture notes (${noteImages.length} image(s)) and past-question papers (${pastQuestionImages.length} image(s)). Please analyze them.`
            : `Here are my lecture notes (${noteImages.length} image(s)). Please analyze them.`,
      },
    ];

    // Add note images
    for (const img of noteImages) {
      userContent.push({
        type: "image_url" as const,
        image_url: { url: img },
      });
    }

    // Add past-question images
    if (pastQuestionImages.length > 0) {
      userContent.push({
        type: "text" as const,
        text: "The following are past-exam question papers. Identify the topics tested and prioritize them in focusTopics and in the quiz questions:",
      });
      for (const img of pastQuestionImages) {
        userContent.push({
          type: "image_url" as const,
          image_url: { url: img },
        });
      }
    }

    const messages: ModelMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ];

    // Stream the response to avoid Vercel 10s timeout
    const encoder = new TextEncoder();

    const responseStream = new ReadableStream({
      async start(controller) {
        try {
          const { stream, fullText } = await callModelStreaming(messages);
          const reader = stream.getReader();

          // Forward chunks to the client
          let reading = true;
          while (reading) {
            const { done, value } = await reader.read();
            if (done) {
              reading = false;
              break;
            }
            // Send chunk as SSE event
            const text = new TextDecoder().decode(value);
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ chunk: text })}\n\n`)
            );
          }

          // Get the full text and parse it
          const rawText = await fullText;
          const jsonStr = extractJSON(rawText);

          let result: AnalyzeResult;
          try {
            result = JSON.parse(jsonStr);
          } catch {
            // Retry: ask the model to fix the JSON
            console.error("[analyze] First JSON parse failed, retrying...");
            const { callModel } = await import("@/lib/openrouter");
            const fixedText = await callModel([
              {
                role: "system",
                content:
                  "Fix the following broken JSON and return ONLY valid JSON with no other text:",
              },
              { role: "user", content: rawText },
            ]);
            const fixedJson = extractJSON(fixedText);
            result = JSON.parse(fixedJson);
          }

          if (!validateResult(result)) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ error: "Model returned invalid response structure. Please try again." })}\n\n`
              )
            );
            controller.close();
            return;
          }

          // Save to database
          const session = await prisma.session.create({
            data: {
              deviceId,
              title: result.title,
              language,
              summary: result.summary,
              keyPoints: result.keyPoints,
              focusTopics: result.focusTopics,
              questions: {
                create: result.mcq.map((q) => ({
                  question: q.question,
                  options: q.options,
                  answerIndex: q.answerIndex,
                  explanation: q.explanation,
                  source: q.source,
                  topic: q.topic,
                })),
              },
            },
            include: {
              questions: true,
            },
          });

          // Save past paper if images were provided
          if (pastQuestionImages.length > 0) {
            await prisma.pastPaper.create({
              data: {
                deviceId,
                course: result.title,
                topics: result.focusTopics,
                text: result.summary.slice(0, 500),
              },
            });
          }

          // Send final result with session data + short questions
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                done: true,
                session: {
                  ...session,
                  shortQuestions: result.shortQuestions,
                },
              })}\n\n`
            )
          );
          controller.close();
        } catch (err) {
          const error = err as Error;
          console.error("[analyze] Error:", error.message);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                error:
                  error.message || "Failed to analyze notes. Please try again.",
              })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(responseStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    const error = err as Error;
    console.error("[analyze] Unhandled error:", error.message);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
