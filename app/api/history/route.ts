import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const deviceId = searchParams.get("deviceId");

    if (!deviceId) {
      return NextResponse.json(
        { error: "deviceId is required" },
        { status: 400 }
      );
    }

    const sessions = await prisma.session.findMany({
      where: { deviceId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        language: true,
        focusTopics: true,
        createdAt: true,
        _count: {
          select: { questions: true },
        },
      },
    });

    return NextResponse.json({ sessions });
  } catch (err) {
    const error = err as Error;
    console.error("[history] Error:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 }
    );
  }
}
