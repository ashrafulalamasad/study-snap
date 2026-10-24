"use client";

import { useState } from "react";
import { Check, X, HelpCircle, Quote, Tag } from "lucide-react";
import { useDeviceId } from "@/lib/deviceId";

export interface QuestionData {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  source: string;
  topic: string;
  userAttempt?: {
    correct: boolean;
  } | null;
}

interface QuizCardProps {
  questionNumber: number;
  question: QuestionData;
  onAnswer?: (questionId: string, correct: boolean, topic: string) => void;
}

export function QuizCard({
  questionNumber,
  question,
  onAnswer,
}: QuizCardProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answered, setAnswered] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const deviceId = useDeviceId();

  // Parse options if stored as JSON string or array
  const optionsList: string[] = Array.isArray(question.options)
    ? question.options
    : typeof question.options === "string"
    ? JSON.parse(question.options)
    : [];

  const handleSelect = async (index: number) => {
    if (answered || submitting || !deviceId) return;

    setSelectedIndex(index);
    setAnswered(true);
    setSubmitting(true);

    const isCorrect = index === question.answerIndex;

    // Notify parent for live score and weak topics
    if (onAnswer) {
      onAnswer(question.id, isCorrect, question.topic);
    }

    // Post to /api/attempts
    try {
      await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.id,
          correct: isCorrect,
          deviceId,
        }),
      });
    } catch (err) {
      console.error("Failed to record attempt:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const optionLetters = ["A", "B", "C", "D"];

  return (
    <div
      className={`glass-panel rounded-2xl p-5 sm:p-6 border transition-all duration-300 ${
        answered
          ? selectedIndex === question.answerIndex
            ? "border-emerald-500/40 bg-emerald-950/10 shadow-lg shadow-emerald-500/10"
            : "border-rose-500/40 bg-rose-950/10 shadow-lg shadow-rose-500/10"
          : "border-white/10 hover:border-white/20"
      }`}
    >
      {/* Question Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold text-xs flex items-center justify-center border border-indigo-500/30">
            {questionNumber}
          </span>
          <span className="text-xs font-medium text-slate-400">Multiple Choice</span>
        </div>

        {question.topic && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/5 border border-white/10 text-slate-300">
            <Tag className="w-3 h-3 text-indigo-400" />
            {question.topic}
          </span>
        )}
      </div>

      {/* Question Text */}
      <h3 className="text-base sm:text-lg font-semibold text-white mb-5 leading-snug">
        {question.question}
      </h3>

      {/* 4 Options Grid */}
      <div className="space-y-2.5 mb-5">
        {optionsList.map((option, idx) => {
          const isSelected = selectedIndex === idx;
          const isCorrect = idx === question.answerIndex;

          let optionStyle =
            "border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.07] hover:border-white/20 cursor-pointer";
          let badgeStyle = "bg-white/10 text-slate-300 border-white/10";

          if (answered) {
            if (isCorrect) {
              optionStyle =
                "border-emerald-500/60 bg-emerald-500/20 text-emerald-200 font-medium cursor-default ring-1 ring-emerald-500/40";
              badgeStyle = "bg-emerald-500 text-slate-950 font-bold";
            } else if (isSelected) {
              optionStyle =
                "border-rose-500/60 bg-rose-500/20 text-rose-200 cursor-default ring-1 ring-rose-500/40";
              badgeStyle = "bg-rose-500 text-white font-bold";
            } else {
              optionStyle = "border-white/5 bg-white/[0.01] text-slate-500 cursor-default opacity-50";
              badgeStyle = "bg-white/5 text-slate-500 border-white/5";
            }
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={answered}
              onClick={() => handleSelect(idx)}
              className={`w-full text-left p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all duration-200 ${optionStyle}`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-6 h-6 rounded-lg text-xs flex items-center justify-center shrink-0 border ${badgeStyle}`}
                >
                  {optionLetters[idx] || idx + 1}
                </span>
                <span className="text-sm leading-snug">{option}</span>
              </div>

              {answered && (
                <div className="shrink-0">
                  {isCorrect ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  ) : isSelected ? (
                    <div className="w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center text-white">
                      <X className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  ) : null}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Answer Feedback / Explanation & Proof Line */}
      {answered && (
        <div className="pt-4 border-t border-white/10 space-y-3 animate-fadeIn">
          {/* Status Banner */}
          <div
            className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs font-semibold ${
              selectedIndex === question.answerIndex
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                : "bg-rose-500/15 border-rose-500/30 text-rose-300"
            }`}
          >
            {selectedIndex === question.answerIndex ? (
              <>
                <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                <span>Correct! Excellent recall from your lecture notes.</span>
              </>
            ) : (
              <>
                <X className="w-4 h-4 text-rose-400 stroke-[3]" />
                <span>
                  Incorrect. Correct answer is Option {optionLetters[question.answerIndex]}:{" "}
                  {optionsList[question.answerIndex]}
                </span>
              </>
            )}
          </div>

          {/* Explanation */}
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs sm:text-sm text-slate-300 leading-relaxed">
            <span className="font-semibold text-white block mb-1">Explanation:</span>
            {question.explanation}
          </div>

          {/* Proof line from notes */}
          {question.source && (
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200 flex items-start gap-2.5">
              <Quote className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-indigo-300">From your notes: </span>
                <span className="italic">“{question.source}”</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
