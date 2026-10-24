"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Search, FileText, ArrowLeft, Sparkles, Filter, Database, BookOpen } from "lucide-react";
import { PastPaperCard } from "@/app/components/PastPaperCard";
import type { StoragePastPaper } from "@/lib/pastPapers";

export default function PastPapersPage() {
  const [papers, setPapers] = useState<StoragePastPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState<number | "all">("all");
  const [selectedExamType, setSelectedExamType] = useState<"all" | "Midterm" | "Final">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const semesters = [
    { id: "all", label: "All Semesters" },
    { id: 1, label: "1st Sem" },
    { id: 2, label: "2nd Sem" },
    { id: 3, label: "3rd Sem" },
    { id: 4, label: "4th Sem" },
    { id: 5, label: "5th Sem" },
    { id: 6, label: "6th Sem" },
    { id: 7, label: "7th Sem" },
    { id: 8, label: "8th Sem" },
  ];

  useEffect(() => {
    async function fetchStoragePapers() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (selectedSemester !== "all") params.append("semester", String(selectedSemester));
        if (selectedExamType !== "all") params.append("examType", selectedExamType);
        if (searchQuery.trim()) params.append("q", searchQuery.trim());

        const res = await fetch(`/api/past-papers?${params.toString()}`);
        const data = await res.json();
        setPapers(data.storagePapers || []);
      } catch (err) {
        console.error("Failed to load past papers:", err);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(fetchStoragePapers, 150);
    return () => clearTimeout(timer);
  }, [selectedSemester, selectedExamType, searchQuery]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-400" />
                <span>Past Question Papers Bank</span>
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                IIUC Storage
              </span>
            </div>
            <p className="text-xs text-slate-400">
              105 verified Midterm and Final exam papers hosted directly in Supabase Storage bucket (<code className="text-purple-300">past-papers</code>)
            </p>
          </div>
        </div>

        <Link
          href="/"
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Snap Notes & Study</span>
        </Link>
      </div>

      {/* Controls & Filter Bar */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/10 space-y-4">
        {/* Row 1: Search & Exam Type Toggle */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by year (2025, 2023), term (Autumn, Spring), semester..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/60 transition-colors"
            />
          </div>

          {/* Exam Type Filter Pills */}
          <div className="inline-flex rounded-xl p-1 bg-white/5 border border-white/10 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setSelectedExamType("all")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                selectedExamType === "all"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              All Types
            </button>
            <button
              type="button"
              onClick={() => setSelectedExamType("Midterm")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                selectedExamType === "Midterm"
                  ? "bg-amber-600 text-white shadow-md shadow-amber-600/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Midterms (52)
            </button>
            <button
              type="button"
              onClick={() => setSelectedExamType("Final")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                selectedExamType === "Final"
                  ? "bg-pink-600 text-white shadow-md shadow-pink-600/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Finals (53)
            </button>
          </div>
        </div>

        {/* Row 2: Semester Tabs */}
        <div>
          <div className="flex items-center gap-2 mb-2 text-xs text-slate-400 font-medium">
            <Filter className="w-3.5 h-3.5 text-purple-400" />
            <span>Filter by Semester:</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {semesters.map((sem) => {
              const active = selectedSemester === sem.id;
              return (
                <button
                  key={String(sem.id)}
                  type="button"
                  onClick={() => setSelectedSemester(sem.id as number | "all")}
                  className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-400/30"
                      : "bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border border-white/5"
                  }`}
                >
                  {sem.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Results Header Count */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>
          Showing <strong className="text-white">{papers.length}</strong> exam papers
          {selectedSemester !== "all" && ` for ${selectedSemester}${selectedSemester === 1 ? "st" : selectedSemester === 2 ? "nd" : selectedSemester === 3 ? "rd" : "th"} Semester`}
          {selectedExamType !== "all" && ` (${selectedExamType}s)`}
        </span>
        <span className="flex items-center gap-1 text-[11px] text-purple-300">
          <Database className="w-3.5 h-3.5" />
          <span>Bucket: past-papers</span>
        </span>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
          <p className="text-xs text-slate-400">Loading semester exam papers...</p>
        </div>
      ) : papers.length === 0 ? (
        <div className="text-center py-16 glass-panel rounded-2xl p-8 border border-white/10 max-w-md mx-auto">
          <FileText className="w-10 h-10 text-purple-400 mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-semibold text-white mb-1">No Exam Papers Found</h3>
          <p className="text-xs text-slate-400 mb-4">
            No papers match your filter criteria. Try clearing the search query or selecting a different semester.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedSemester("all");
              setSelectedExamType("all");
              setSearchQuery("");
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {papers.map((paper) => (
            <PastPaperCard key={paper.id} paper={paper} />
          ))}
        </div>
      )}
    </div>
  );
}
