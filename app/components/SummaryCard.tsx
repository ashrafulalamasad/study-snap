"use client";

import { useState } from "react";
import { BookOpen, CheckCircle2, Volume2, VolumeX, Copy, Check } from "lucide-react";

interface SummaryCardProps {
  title: string;
  summary: string;
  keyPoints: string[];
  language: string;
}

export function SummaryCard({
  title,
  summary,
  keyPoints,
  language,
}: SummaryCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);

  const toggleSpeech = async () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    const textToRead = `${title}. ${summary}. Key points: ${keyPoints.join(". ")}`;
    setIsPlaying(true);
    if (!("speechSynthesis" in window)) {
      setIsPlaying(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = language === "bn" ? "bn-BD" : "en-US";
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const copyToClipboard = async () => {
    const fullText = `# ${title}\n\n${summary}\n\n## Key Points\n${keyPoints.map((k) => `• ${k}`).join("\n")}`;
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-white/10 shadow-2xl relative overflow-hidden">
      {/* Ambient gradient top bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

      {/* Header with Title and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10 mb-5">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 mt-0.5">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {language === "bn" ? "বাংলা নোটস" : "English Notes"}
              </span>
              <span className="text-xs text-slate-400">Comprehensive Synthesis</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {title}
            </h2>
          </div>
        </div>

        {/* Read aloud & Copy actions */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={toggleSpeech}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              isPlaying
                ? "bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse"
                : "bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10"
            }`}
            title={isPlaying ? "Stop Read-Aloud" : "Read Aloud with Text-to-Speech"}
          >
            {isPlaying ? (
              <>
                <VolumeX className="w-3.5 h-3.5" />
                <span>Stop</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                <span>Listen with ElevenLabs</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={copyToClipboard}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            title="Copy summary & key points"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Summary Body */}
      <div className="prose prose-invert max-w-none mb-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          Structured Summary
        </h3>
        <p className="text-slate-200 text-sm sm:text-base leading-relaxed whitespace-pre-line">
          {summary}
        </p>
      </div>

      {/* Key Points */}
      {keyPoints && keyPoints.length > 0 && (
        <div className="pt-4 border-t border-white/10">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-3 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            Core Concepts to Retain
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {keyPoints.map((point, index) => (
              <li
                key={index}
                className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors"
              >
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5 border border-indigo-500/30">
                  {index + 1}
                </span>
                <span className="text-xs sm:text-sm text-slate-300 leading-snug">
                  {point}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
