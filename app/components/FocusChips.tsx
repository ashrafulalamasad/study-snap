"use client";

import { Flame, Target } from "lucide-react";

interface FocusChipsProps {
  topics: string[];
}

export function FocusChips({ topics }: FocusChipsProps) {
  if (!topics || topics.length === 0) return null;

  return (
    <div className="glass-panel rounded-2xl p-4 border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10">
      <div className="flex items-center gap-2 mb-2">
        <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
        <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-300">
          High-Yield Exam Focus Topics
        </h4>
        <span className="text-[10px] text-slate-400">
          (Identified from past-paper patterns & note emphasis)
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {topics.map((topic, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-400/15 text-amber-200 border border-amber-400/30 shadow-sm"
          >
            <Target className="w-3 h-3 text-amber-400" />
            {topic}
          </span>
        ))}
      </div>
    </div>
  );
}
