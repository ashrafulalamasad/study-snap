import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  callModelStreaming,
  cleanModelOutput,
  type ModelMessage,
  type ModelContentPart,
} from "@/lib/ai";
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
  if (!Array.isArray(d.mcq) || d.mcq.length !== 10) return false;
  if (!Array.isArray(d.shortQuestions) || d.shortQuestions.length !== 3)
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
  // Strip <thought>...</thought> blocks if returned by model
  let cleaned = text.replace(/<thought>[\s\S]*?<\/thought>/gi, "").trim();

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
    const requestedLanguage = formData.get("language");
    const language = requestedLanguage === "bn" ? "bn" : "en";
    const deviceId = formData.get("deviceId") as string;

    if (!deviceId) {
      return NextResponse.json(
        { error: "deviceId is required" },
        { status: 400 }
      );
    }

    // Collect all rendered note pages. PDFs are rendered in the browser before upload.
    const noteImages: string[] = [];
    const noteEntries = Array.from(formData.entries())
      .filter(([key, value]) => key.startsWith("note_") && value instanceof File)
      .sort(([a], [b]) => {
        const aIndex = Number(a.slice(5));
        const bIndex = Number(b.slice(5));
        return aIndex - bIndex;
      });
    for (const [, value] of noteEntries) {
      const file = value as File;
      if (file) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const base64 = buffer.toString("base64");
        const mimeType = file.type.startsWith("image/") ? file.type : "image/jpeg";
        noteImages.push(`data:${mimeType};base64,${base64}`);
      }
    }

    if (noteImages.length === 0) {
      return NextResponse.json(
        { error: "At least one note image is required" },
        { status: 400 }
      );
    }

    // Build multimodal message
    const systemPrompt = getAnalyzePrompt(language);

    const userContent: ModelContentPart[] = [
      {
        type: "text" as const,
        text: `Analyze every uploaded note/question file (${noteImages.length} file(s)). The requested output language is ${
          language === "bn" ? "Bangla (বাংলা)" : "English"
        }.`,
      },
    ];

    // Add note images
    for (const img of noteImages) {
      userContent.push({
        type: "image_url" as const,
        image_url: { url: img },
      });
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
          const { reader } = await callModelStreaming(messages);
          const decoder = new TextDecoder();
          let fullText = "";
          let sseBuffer = "";
          let reading = true;

          // Forward chunks to the client and accumulate full text
          while (reading) {
            const { done, value } = await reader.read();
            if (done) {
              sseBuffer += decoder.decode();
              break;
            }

            sseBuffer += decoder.decode(value, { stream: true });
            const events = sseBuffer.split(/\r?\n\r?\n/);
            sseBuffer = events.pop() || "";

            for (const event of events) {
              const trimmed = event
                .split(/\r?\n/)
                .find((line) => line.startsWith("data:"))
                ?.slice(5)
                .trim();
              if (!trimmed) continue;
              const dataStr = trimmed;

              if (dataStr === "[DONE]") {
                reading = false;
                break;
              }

              try {
                const parsed = JSON.parse(dataStr);
                const delta = parsed.choices?.[0]?.delta?.content;
                if (delta) {
                  fullText += delta;
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ chunk: delta })}\n\n`)
                  );
                }
              } catch {
                // Partial JSON, skip
              }
            }
          }

          // Clean reasoning tags and parse JSON
          const cleanedText = cleanModelOutput(fullText);
          const jsonStr = extractJSON(cleanedText);

          let result: AnalyzeResult;
          try {
            result = JSON.parse(jsonStr);
          } catch (error) {
            console.error(
              "[analyze] Model returned invalid JSON:",
              error instanceof Error ? error.message : "unknown error"
            );
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  error: "The model returned an invalid study result. Please try again.",
                })}\n\n`
              )
            );
            controller.close();
            return;
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
                error: "Model is busy, switching to a backup model… Please try again.",
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
