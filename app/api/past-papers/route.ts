import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFilteredPastPapers, ALL_STORAGE_PAST_PAPERS } from "@/lib/pastPapers";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const deviceId = searchParams.get("deviceId");
    const query = searchParams.get("q") || "";
    const semParam = searchParams.get("semester");
    const examTypeParam = searchParams.get("examType") as "all" | "Midterm" | "Final" | null;

    const semester = semParam && semParam !== "all" ? parseInt(semParam, 10) : "all";
    const examType = examTypeParam || "all";

    // 1. Fetch filtered Supabase storage papers
    const storagePapers = getFilteredPastPapers({
      semester,
      examType,
      query,
    });

    // 2. Fetch user custom uploaded papers if deviceId provided
    let userPapers: unknown[] = [];
    if (deviceId) {
      userPapers = await prisma.pastPaper.findMany({
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
    }

    return NextResponse.json({
      storagePapers,
      totalStorageCount: ALL_STORAGE_PAST_PAPERS.length,
      userPapers,
    });
  } catch (err) {
    const error = err as Error;
    console.error("[past-papers] Error:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch past papers" },
      { status: 500 }
    );
  }
}
