import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const deviceId = searchParams.get("deviceId");
    const query = searchParams.get("q") || "";

    if (!deviceId) {
      return NextResponse.json(
        { error: "deviceId is required" },
        { status: 400 }
      );
    }

    const pastPapers = await prisma.pastPaper.findMany({
      where: {
        deviceId,
        ...(query
          ? {
              OR: [
                { course: { contains: query, mode: "insensitive" } },
                { topics: { hasSome: [query] } },
                { text: { contains: query, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ pastPapers });
  } catch (err) {
    const error = err as Error;
    console.error("[past-papers] Error:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch past papers" },
      { status: 500 }
    );
  }
}
