"use client";

import { Award, AlertTriangle, RotateCcw, Target, BookOpen, CheckCircle2 } from "lucide-react";

interface ScoreCardProps {
  total: number;
  correctCount: number;
  weakTopics: string[];
  onRetakeAll: () => void;
  onFilterWeakOnly?: () => void;
  hasWeakOnlyFilterActive?: boolean;
}

export function ScoreCard({
  total,
  correctCount,
  weakTopics,
  onRetakeAll,
  onFilterWeakOnly,
  hasWeakOnlyFilterActive = false,
}: ScoreCardProps) {
  const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  let badgeColor = "from-emerald-500 to-teal-500";
  let gradeText = "Outstanding! Exam Ready 🎯";
  let description = "You have mastered the core concepts from these lecture notes.";

  if (percentage < 60) {
    badgeColor = "from-rose-500 to-amber-500";
    gradeText = "Needs Revision 📚";
    description = "Review the weak topics below before sitting for the term exam.";
  } else if (percentage < 85) {
    badgeColor = "from-indigo-500 to-purple-500";
    gradeText = "Solid Understanding 👍";
    description = "Good grasp of the concepts. A quick review of missed points will lock it in.";
  }

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/15 shadow-2xl relative overflow-hidden bg-gradient-to-b from-white/[0.04] to-transparent">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5 text-indigo-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Quiz Completed
            </span>
          </div>
          <h3 className="text-2xl font-bold text-white tracking-tight">{gradeText}</h3>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-md">{description}</p>
        </div>

        {/* Circular / Large Score Badge */}
        <div className="flex items-center gap-4 self-start sm:self-auto">
          <div className={`p-4 rounded-2xl bg-gradient-to-tr ${badgeColor} text-white shadow-xl shadow-indigo-500/20 text-center min-w-[100px]`}>
            <div className="text-3xl font-extrabold tracking-tight">
              {correctCount}
              <span className="text-lg opacity-80">/{total}</span>
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-wider opacity-90 mt-0.5">
              {percentage}% Score
            </div>
          </div>
        </div>
      </div>

      {/* Weak Topics Section */}
      {weakTopics.length > 0 ? (
        <div className="pt-6 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-300">
              Identified Weak Topics to Revisit
            </h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {weakTopics.map((topic, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium bg-amber-500/15 border border-amber-500/30 text-amber-200"
              >
                <Target className="w-3.5 h-3.5 text-amber-400" />
                {topic}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="pt-6 pb-4 flex items-center gap-2 text-xs text-emerald-400">
          <CheckCircle2 className="w-4 h-4" />
          <span>No weak topics identified! Perfect accuracy across all tested concepts.</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/10">
        <button
          type="button"
          onClick={onRetakeAll}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/15 transition-all shadow-md cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Retake Quiz</span>
        </button>

        {weakTopics.length > 0 && onFilterWeakOnly && (
          <button
            type="button"
            onClick={onFilterWeakOnly}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              hasWeakOnlyFilterActive
                ? "bg-amber-500 text-slate-950 border-amber-400 font-bold"
                : "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>
              {hasWeakOnlyFilterActive
                ? "Showing Weak Topics Only"
                : "Practice Weak Topics Only"}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
