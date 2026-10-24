"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { History, BookOpen, ArrowLeft, Loader2 } from "lucide-react";
import { SessionList, type SessionItem } from "@/app/components/SessionList";
import { useDeviceId } from "@/lib/deviceId";

export default function HistoryPage() {
  const deviceId = useDeviceId();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!deviceId) return;

    async function fetchHistory() {
      try {
        setLoading(true);
        const res = await fetch(`/api/history?deviceId=${encodeURIComponent(deviceId)}`);
        if (!res.ok) throw new Error("Failed to load history");

        const data = await res.json();
        setSessions(data.sessions || []);
      } catch (err) {
        const e = err as Error;
        setError(e.message || "Failed to load past study sessions");
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [deviceId]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-400" />
              <span>Past Study Sessions</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Review prior lecture syntheses, verified quizzes, and weak topics
            </p>
          </div>
        </div>

        <Link
          href="/"
          className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>New Snap</span>
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
          <p className="text-xs text-slate-400">Loading your past sessions...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs text-center max-w-md mx-auto">
          {error}
        </div>
      ) : (
        <SessionList sessions={sessions} />
      )}
    </div>
  );
}
