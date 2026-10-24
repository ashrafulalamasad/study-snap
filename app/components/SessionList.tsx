"use client";

import Link from "next/link";
import { BookOpen, Calendar, HelpCircle, ArrowRight, Tag } from "lucide-react";

export interface SessionItem {
  id: string;
  title: string;
  language: string;
  focusTopics: string[];
  createdAt: string;
  _count: {
    questions: number;
  };
}

interface SessionListProps {
  sessions: SessionItem[];
}

export function SessionList({ sessions }: SessionListProps) {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-12 glass-panel rounded-2xl p-8 border border-white/10 max-w-md mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-3 border border-indigo-500/30">
          <BookOpen className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-white mb-1">No Saved Sessions</h3>
        <p className="text-xs text-slate-400 mb-5">
          You haven&apos;t analyzed any lecture notes on this device yet.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all"
        >
          <span>Snap Your First Note</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {sessions.map((s) => {
        const formattedDate = new Date(s.createdAt).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        });

        return (
          <Link
            key={s.id}
            href={`/results/${s.id}`}
            className="glass-panel glass-panel-hover rounded-2xl p-5 border border-white/10 block group"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {s.language === "bn" ? "বাংলা" : "English"}
              </span>

              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formattedDate}</span>
              </div>
            </div>

            <h3 className="text-base font-semibold text-white group-hover:text-indigo-300 transition-colors mb-3 line-clamp-1">
              {s.title}
            </h3>

            {/* Focus Topics preview */}
            {s.focusTopics && s.focusTopics.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {s.focusTopics.slice(0, 3).map((topic, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/5 text-slate-300 border border-white/5"
                  >
                    <Tag className="w-2.5 h-2.5 text-amber-400" />
                    {topic}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                <span>{s._count.questions} Quiz Questions</span>
              </span>

              <span className="text-indigo-400 font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                <span>Review</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
