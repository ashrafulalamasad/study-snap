import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { questionId, correct, deviceId } = body;

    if (!questionId || typeof correct !== "boolean" || !deviceId) {
      return NextResponse.json(
        { error: "questionId, correct (boolean), and deviceId are required" },
        { status: 400 }
      );
    }

    // Verify the question exists
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { session: { select: { deviceId: true } } },
    });

    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    if (question.session.deviceId !== deviceId) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const attempt = await prisma.attempt.create({
      data: {
        questionId,
        correct,
      },
    });

    return NextResponse.json({ attempt });
  } catch (err) {
    const error = err as Error;
    console.error("[attempts] Error:", error.message);
    return NextResponse.json(
      { error: "Failed to record attempt" },
      { status: 500 }
    );
  }
}
