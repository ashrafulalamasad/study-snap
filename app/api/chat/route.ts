import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { callModel, type ModelMessage } from "@/lib/ai";
import { getChatPrompt } from "@/lib/prompts";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, question, deviceId } = body;

    if (!sessionId || !question || !deviceId) {
      return NextResponse.json(
        { error: "sessionId, question, and deviceId are required" },
        { status: 400 }
      );
    }

    // Load session context
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    if (session.deviceId !== deviceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const systemPrompt = getChatPrompt(
      session.summary,
      session.keyPoints as string[]
    );

    const messages: ModelMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: question },
    ];

    const answer = await callModel(messages);

    return NextResponse.json({ answer });
  } catch (err) {
    const error = err as Error;
    console.error("[chat] Error:", error.message);
    return NextResponse.json(
      { error: "Failed to get answer. Please try again." },
      { status: 500 }
    );
  }
}
