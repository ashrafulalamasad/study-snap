"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, BookOpen, Brain, CheckCircle, ShieldAlert, Loader2, FileQuestion } from "lucide-react";
import { UploadZone, type PreparedImage } from "./components/UploadZone";
import { LanguageToggle } from "./components/LanguageToggle";
import { useDeviceId } from "@/lib/deviceId";

export default function HomePage() {
  const router = useRouter();
  const deviceId = useDeviceId();

  const [noteImages, setNoteImages] = useState<PreparedImage[]>([]);
  const [pastImages, setPastImages] = useState<PreparedImage[]>([]);
  const [language, setLanguage] = useState<"bn" | "en">("en");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [streamProgress, setStreamProgress] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (noteImages.length === 0 || isAnalyzing || !deviceId) return;

    setIsAnalyzing(true);
    setError(null);
    setStreamProgress("Preparing high-res resized images for vision model...");

    const formData = new FormData();
    formData.append("language", language);
    formData.append("deviceId", deviceId);

    noteImages.forEach((img, i) => {
      formData.append(`note_${i}`, img.file);
    });

    pastImages.forEach((img, i) => {
      formData.append(`past_${i}`, img.file);
    });

    try {
      setStreamProgress("Reading handwritten pages with Gemma 4 31B Vision...");

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body received from server");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      let reading = true;
      while (reading) {
        const { done, value } = await reader.read();
        if (done) {
          reading = false;
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;

          try {
            const data = JSON.parse(trimmed.slice(6));

            if (data.error) {
              throw new Error(data.error);
            }

            if (data.chunk) {
              setStreamProgress("Synthesizing lecture notes & generating verified quiz...");
            }

            if (data.done && data.session?.id) {
              setStreamProgress("Study session generated! Opening results...");
              // Navigate to results
              router.push(`/results/${data.session.id}`);
              return;
            }
          } catch (err) {
            // Check if it's the custom error thrown
            if (err instanceof Error && err.message !== "Unexpected end of JSON input") {
              throw err;
            }
          }
        }
      }
    } catch (err) {
      const e = err as Error;
      console.error("Analyze error:", e);
      setError(
        e.message || "Failed to analyze your notes. Please make sure the handwriting is legible and try again."
      );
      setIsAnalyzing(false);
      setStreamProgress("");
    }
  };

  return (
    <div className="space-y-10 py-2 sm:py-6 max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold shadow-sm animate-pulse-glow">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Multimodal Open-Weight AI for University Students</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Snap Your Lecture Notes.
          <br />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
            Ace Your Exam in Bangla or English.
          </span>
        </h1>

        <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Upload 1–4 photos of handwritten notebooks or board slides. Get an instant, structured summary, 
          verified 5-question quiz with exact note line citations, and exam-topic detection.
        </p>

        {/* Value Prop Badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zero Hallucination Quizzes</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/5">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>Bangla & English Output</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/5">
            <FileQuestion className="w-3.5 h-3.5 text-purple-400" />
            <span>Past-Paper Exam Prioritization</span>
          </div>
        </div>
      </div>

      {/* Upload Zone & Controls */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-white/10">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Step 1: Choose Your Language
            </span>
            <span className="text-xs text-slate-500">
              AI writes summary and quiz in your chosen language
            </span>
          </div>
          <LanguageToggle
            language={language}
            onChange={setLanguage}
            disabled={isAnalyzing}
          />
        </div>

        {/* Upload Zone Component */}
        <UploadZone
          noteImages={noteImages}
          setNoteImages={setNoteImages}
          pastImages={pastImages}
          setPastImages={setPastImages}
          disabled={isAnalyzing}
        />

        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs sm:text-sm flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-300">Analysis Error</p>
              <p className="text-xs text-rose-200/90 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Streaming Progress Bar */}
        {isAnalyzing && (
          <div className="glass-panel rounded-2xl p-5 border border-indigo-500/30 bg-indigo-950/20 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-indigo-300 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                {streamProgress}
              </span>
              <span className="text-[11px] text-slate-400">Streaming response...</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full w-2/3 animate-pulse" />
            </div>
          </div>
        )}

        {/* Big Action Button */}
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={noteImages.length === 0 || isAnalyzing}
          className={`w-full py-4 px-6 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-2xl transition-all cursor-pointer ${
            noteImages.length === 0 || isAnalyzing
              ? "bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed opacity-60"
              : "bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.01]"
          }`}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Analyzing Notes & Building Quiz...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>
                Analyze {noteImages.length > 0 ? `${noteImages.length} Page(s)` : "Notes"} & Generate Quiz
              </span>
              <ArrowRight className="w-5 h-5 ml-1" />
            </>
          )}
        </button>
      </div>

      {/* Trust & Model Info Section */}
      <div className="pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-400">
        <div className="glass-panel p-4 rounded-xl border border-white/5">
          <p className="font-semibold text-slate-200 mb-1">Gemma 4 31B Vision</p>
          <p className="text-[11px] text-slate-400">
            Open-weight multimodal intelligence capable of deciphering handwritten Bengali & English scripts.
          </p>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-white/5">
          <p className="font-semibold text-slate-200 mb-1">100% Strict Provenance</p>
          <p className="text-[11px] text-slate-400">
            Every quiz question cites the exact line in your notes where the answer is found. No hallucinations.
          </p>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-white/5">
          <p className="font-semibold text-slate-200 mb-1">Zero Sign-Up Required</p>
          <p className="text-[11px] text-slate-400">
            Your study sessions are preserved locally via an anonymous device token in localStorage.
          </p>
        </div>
      </div>
    </div>
  );
}
