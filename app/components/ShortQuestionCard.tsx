"use client";

import { useState } from "react";
import { Eye, EyeOff, Sparkles } from "lucide-react";

interface ShortQuestionProps {
  questionNumber: number;
  question: string;
  modelAnswer: string;
}

export function ShortQuestionCard({
  questionNumber,
  question,
  modelAnswer,
}: ShortQuestionProps) {
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <div className="glass-panel rounded-2xl p-5 border border-white/10 hover:border-white/20 transition-all">
      <div className="flex items-start justify-between gap-3 mb-2">
        <span className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-300 font-bold text-xs flex items-center justify-center border border-purple-500/30">
          Q{questionNumber}
        </span>
        <button
          type="button"
          onClick={() => setShowAnswer(!showAnswer)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors"
        >
          {showAnswer ? (
            <>
              <EyeOff className="w-3.5 h-3.5 text-slate-400" />
              <span>Hide Answer</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5 text-purple-400" />
              <span>Show Model Answer</span>
            </>
          )}
        </button>
      </div>

      <h4 className="text-sm sm:text-base font-semibold text-white mb-3">
        {question}
      </h4>

      {showAnswer ? (
        <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs sm:text-sm text-purple-100 leading-relaxed">
          <div className="flex items-center gap-1.5 text-purple-300 font-semibold mb-1 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Model Answer:</span>
          </div>
          <p>{modelAnswer}</p>
        </div>
      ) : (
        <p className="text-xs text-slate-500 italic">
          Try answering in your head or on scratch paper, then tap Show Model Answer to verify.
        </p>
      )}
    </div>
  );
}
