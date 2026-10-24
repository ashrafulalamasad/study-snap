"use client";

import { FileText, ExternalLink } from "lucide-react";
import type { StoragePastPaper } from "@/lib/pastPapers";

interface PastPaperCardProps {
  paper: StoragePastPaper;
}

export function PastPaperCard({ paper }: PastPaperCardProps) {
  return (
    <div className="glass-panel glass-panel-hover rounded-2xl p-5 border border-white/10 flex flex-col justify-between relative overflow-hidden group">
      {/* Top accent gradient bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1 bg-[#1c1b1a]"
      />

      <div>
        {/* Badges row */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            {paper.semesterLabel}
          </span>

          <span
            className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-lg border bg-[#f5f2ec] text-[#1c1b1a] border-[#e5e1d8]"
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

      </div>
    </div>
  );
}
