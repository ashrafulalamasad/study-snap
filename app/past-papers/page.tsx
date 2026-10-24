"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, FileText, ArrowLeft, Tag, Calendar, Sparkles, Loader2 } from "lucide-react";
import { useDeviceId } from "@/lib/deviceId";

interface PastPaperItem {
  id: string;
  course: string;
  topics: string[];
  text: string;
  createdAt: string;
}

export default function PastPapersPage() {
  const deviceId = useDeviceId();
  const [papers, setPapers] = useState<PastPaperItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!deviceId) return;

    async function fetchPapers() {
      try {
        setLoading(true);
        const url = `/api/past-papers?deviceId=${encodeURIComponent(deviceId)}${
          query ? `&q=${encodeURIComponent(query)}` : ""
        }`;
        const res = await fetch(url);
        const data = await res.json();
        setPapers(data.pastPapers || []);
      } catch (err) {
        console.error("Failed to fetch past papers:", err);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      fetchPapers();
    }, 250);

    return () => clearTimeout(timer);
  }, [deviceId, query]);

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
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-400" />
              <span>Past Question Papers Bank</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Search high-yield exam questions and topics extracted from previous semesters
            </p>
          </div>
        </div>

        <Link
          href="/"
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Upload New Paper</span>
        </Link>
      </div>

      {/* Search Input Bar */}
      <div className="relative max-w-lg">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by course name, topic (e.g. thermodynamics, data structures)..."
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/60 transition-colors"
        />
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
          <p className="text-xs text-slate-400">Searching your past papers...</p>
        </div>
      ) : papers.length === 0 ? (
        <div className="text-center py-12 glass-panel rounded-2xl p-8 border border-white/10 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-3 border border-purple-500/30">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1">No Past Papers Found</h3>
          <p className="text-xs text-slate-400 mb-5 leading-relaxed">
            {query
              ? "No past papers match your search query."
              : "Whenever you upload a past question paper during a study snap, it automatically gets indexed into your personal bank."}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30 transition-all"
          >
            <span>Snap Notes & Past Paper</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {papers.map((p) => {
            const dateStr = new Date(p.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <div
                key={p.id}
                className="glass-panel glass-panel-hover rounded-2xl p-5 border border-purple-500/20 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Exam Paper
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Calendar className="w-3 h-3" />
                      {dateStr}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-white mb-2 line-clamp-1">
                    {p.course}
                  </h3>

                  {p.text && (
                    <p className="text-xs text-slate-300 line-clamp-3 mb-3 leading-relaxed">
                      {p.text}
                    </p>
                  )}
                </div>

                {p.topics && p.topics.length > 0 && (
                  <div className="pt-3 border-t border-white/5">
                    <div className="text-[10px] uppercase font-semibold text-slate-400 mb-1.5">
                      Extracted Exam Topics:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {p.topics.map((t, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20"
                        >
                          <Tag className="w-2.5 h-2.5 text-purple-400" />
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
