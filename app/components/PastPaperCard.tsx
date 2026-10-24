"use client";

import { FileText, Download, ExternalLink, Sparkles, BookOpen } from "lucide-react";
import type { StoragePastPaper } from "@/lib/pastPapers";

interface PastPaperCardProps {
  paper: StoragePastPaper;
}

export function PastPaperCard({ paper }: PastPaperCardProps) {
  const isMid = paper.examType === "Midterm";

  return (
    <div className="glass-panel glass-panel-hover rounded-2xl p-5 border border-white/10 flex flex-col justify-between relative overflow-hidden group">
      {/* Top accent gradient bar */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 ${
          isMid
            ? "bg-gradient-to-r from-amber-500 to-indigo-500"
            : "bg-gradient-to-r from-purple-500 to-pink-500"
        }`}
      />

      <div>
        {/* Badges row */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            {paper.semesterLabel}
          </span>

          <span
            className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-lg border ${
              isMid
                ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                : "bg-purple-500/15 text-purple-300 border-purple-500/30"
            }`}
          >
            {paper.examType} Exam
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-white group-hover:text-indigo-300 transition-colors mb-1.5 leading-snug line-clamp-2">
          {paper.title}
        </h3>

        {/* Metadata info */}
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
          <div className="flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-mono text-[11px] text-slate-300 truncate max-w-[180px]">
              {paper.fileName}
            </span>
          </div>
          <span>•</span>
          <span className="text-slate-400">{paper.formattedSize}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
        <a
          href={paper.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
          <span>View PDF</span>
        </a>

        <a
          href={paper.url}
          download={paper.fileName}
          className="inline-flex items-center justify-center p-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors"
          title="Download PDF"
        >
          <Download className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
