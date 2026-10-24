import rawPapers from "./pastPapersData.json";

export interface StoragePastPaper {
  id: string;
  type: "mid-questions" | "final-questions";
  examType: "Midterm" | "Final";
  semester: string; // "1st sem", etc.
  semesterNumber: number; // 1 to 8
  semesterLabel: string; // "1st Semester"
  termYear: string; // "Autumn 2025", "Spring 2023", etc.
  fileName: string;
  title: string;
  relativePath: string;
  url: string;
  sizeBytes: number;
  formattedSize: string;
}

const SUPABASE_STORAGE_BASE_URL =
  "https://ymjtrmjbqsnhqmdfpsoj.supabase.co/storage/v1/object/public/past-papers";

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function parseTermYear(raw: string): string {
  let cleaned = raw.replace(/\.pdf$/i, "");
  cleaned = cleaned.replace(
    /^(1st|2nd|3rd|4th|5th|6th|7th|8th)[_\s]*(mid|final)[_\s]*/i,
    ""
  );
  cleaned = cleaned.replace(/^[_-\s]+/, "").trim();

  // Normalize common terms
  cleaned = cleaned.replace(/Aut-?(\d+)/i, "Autumn 20$1");
  cleaned = cleaned.replace(/SP-?(\d+)/i, "Spring 20$1");
  cleaned = cleaned.replace(/Autumn\s*(\d{4})/i, "Autumn $1");
  cleaned = cleaned.replace(/Spring\s*(\d{4})/i, "Spring $1");

  return cleaned || "Past Exam Paper";
}

export const ALL_STORAGE_PAST_PAPERS: StoragePastPaper[] = rawPapers.map(
  (item, idx) => {
    const isMid = item.type === "mid-questions";
    const examType: "Midterm" | "Final" = isMid ? "Midterm" : "Final";
    const semNumMatch = item.semester.match(/(\d+)/);
    const semesterNumber = semNumMatch ? parseInt(semNumMatch[1], 10) : 1;

    const ordinals = ["", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];
    const semesterLabel = `${ordinals[semesterNumber] || semesterNumber} Semester`;
    const termYear = parseTermYear(item.fileName);

    const title = `${semesterLabel} ${examType} (${termYear})`;
    // Encode each path component so spaces become %20
    const encodedPath = item.relativePath
      .split("/")
      .map(encodeURIComponent)
      .join("/");
    const url = `${SUPABASE_STORAGE_BASE_URL}/${encodedPath}`;

    return {
      id: `sp_${idx + 1}_${item.fileName.replace(/[^a-zA-Z0-9]/g, "_")}`,
      type: item.type as "mid-questions" | "final-questions",
      examType,
      semester: item.semester,
      semesterNumber,
      semesterLabel,
      termYear,
      fileName: item.fileName,
      title,
      relativePath: item.relativePath,
      url,
      sizeBytes: item.size,
      formattedSize: formatBytes(item.size),
    };
  }
);

export function getFilteredPastPapers(options: {
  semester?: number | "all";
  examType?: "all" | "Midterm" | "Final";
  query?: string;
}): StoragePastPaper[] {
  const { semester = "all", examType = "all", query = "" } = options;
  const q = query.toLowerCase().trim();

  return ALL_STORAGE_PAST_PAPERS.filter((paper) => {
    if (semester !== "all" && paper.semesterNumber !== semester) {
      return false;
    }
    if (examType !== "all" && paper.examType !== examType) {
      return false;
    }
    if (q) {
      const match =
        paper.title.toLowerCase().includes(q) ||
        paper.semesterLabel.toLowerCase().includes(q) ||
        paper.termYear.toLowerCase().includes(q) ||
        paper.fileName.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });
}
