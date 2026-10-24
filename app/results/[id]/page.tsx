"use client";

import { useEffect, useState, use, Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, HelpCircle, MessageSquare, Layers } from "lucide-react";
import { SummaryCard } from "@/app/components/SummaryCard";
import { FocusChips } from "@/app/components/FocusChips";
import { QuizCard, type QuestionData } from "@/app/components/QuizCard";
import { ShortQuestionCard } from "@/app/components/ShortQuestionCard";
import { ScoreCard } from "@/app/components/ScoreCard";
import { ChatBox } from "@/app/components/ChatBox";

interface SessionDetail {
  id: string;
  title: string;
  language: string;
  summary: string;
  keyPoints: string[];
  focusTopics: string[];
  createdAt: string;
  questions: QuestionData[];
  shortQuestions?: { question: string; modelAnswer: string }[];
}

function SessionViewer({ sessionId }: { sessionId: string }) {
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quiz state
  const [answers, setAnswers] = useState<Record<string, { correct: boolean; topic: string }>>({});
  const [filterWeakOnly, setFilterWeakOnly] = useState(false);
  const [quizKey, setQuizKey] = useState(0); // For retaking the quiz
  const [activeTab, setActiveTab] = useState<"quiz" | "short" | "chat">("quiz");

  useEffect(() => {
    async function loadSession() {
      try {
        setLoading(true);
        const res = await fetch(`/api/sessions/${sessionId}`);
        if (!res.ok) {
          throw new Error(`Failed to load session (status ${res.status})`);
        }
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        setSession(data.session);

        // Pre-populate any existing attempts if reopening past session
        if (data.session.questions) {
          const initialAnswers: Record<string, { correct: boolean; topic: string }> = {};
          data.session.questions.forEach((q: QuestionData) => {
            if (q.userAttempt) {
              initialAnswers[q.id] = {
                correct: q.userAttempt.correct,
                topic: q.topic,
              };
            }
          });
          setAnswers(initialAnswers);
        }
      } catch (err) {
        const e = err as Error;
        setError(e.message || "Failed to load session");
      } finally {
        setLoading(false);
      }
    }

    loadSession();
  }, [sessionId, quizKey]);

  const handleAnswer = (questionId: string, correct: boolean, topic: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { correct, topic },
    }));
  };

  const handleRetakeAll = () => {
    setAnswers({});
    setFilterWeakOnly(false);
    setQuizKey((prev) => prev + 1);
  };

  const handleToggleWeakFilter = () => {
    setFilterWeakOnly((prev) => !prev);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 animate-spin">
          <Sparkles className="w-6 h-6" />
        </div>
        <p className="text-sm text-slate-300 font-medium">
          Loading your study session notes & quiz...
        </p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <div className="p-6 rounded-2xl glass-panel border border-rose-500/20 bg-rose-500/5 mb-4">
          <p className="text-rose-300 font-semibold mb-2">Session Not Found</p>
          <p className="text-xs text-slate-400">{error || "Could not retrieve the requested notes."}</p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white shadow-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Upload New Notes</span>
        </Link>
      </div>
    );
  }

  const allQuestions = session.questions || [];
  const answeredCount = Object.keys(answers).length;
  const correctCount = Object.values(answers).filter((a) => a.correct).length;

  // Weak topics: topics where the student answered incorrectly
  const weakTopicsSet = new Set<string>();
  Object.values(answers).forEach((a) => {
    if (!a.correct && a.topic) {
      weakTopicsSet.add(a.topic);
    }
  });
  const weakTopics = Array.from(weakTopicsSet);

  // Filter questions if weak-only mode is active
  const displayedQuestions = filterWeakOnly
    ? allQuestions.filter((q) => weakTopics.includes(q.topic))
    : allQuestions;

  return (
    <div className="space-y-8 pb-12">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Snap Another Lecture</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Session ID:</span>
          <code className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
            {sessionId.slice(0, 8)}...
          </code>
        </div>
      </div>

      {/* Focus Chips (if any detected from past papers) */}
      <FocusChips topics={session.focusTopics} />

      {/* Structured Summary Card */}
      <SummaryCard
        title={session.title}
        summary={session.summary}
        keyPoints={session.keyPoints}
        language={session.language}
      />

      {/* Interactive Tabs: Quiz vs Short Questions vs Chat */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("quiz")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "quiz"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>Interactive Quiz ({allQuestions.length})</span>
            </button>

            {session.shortQuestions && session.shortQuestions.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab("short")}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === "short"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Short Questions ({session.shortQuestions.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab("chat")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "chat"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Ask Notes</span>
            </button>
          </div>

          {activeTab === "quiz" && (
            <div className="text-xs font-medium text-slate-400">
              Answered: <span className="text-indigo-400 font-bold">{answeredCount}</span>/{allQuestions.length}
            </div>
          )}
        </div>

        {/* Tab 1: Interactive MCQs */}
        {activeTab === "quiz" && (
          <div className="space-y-6">
            {answeredCount > 0 && (
              <ScoreCard
                total={allQuestions.length}
                correctCount={correctCount}
                weakTopics={weakTopics}
                onRetakeAll={handleRetakeAll}
                onFilterWeakOnly={handleToggleWeakFilter}
                hasWeakOnlyFilterActive={filterWeakOnly}
              />
            )}

            <div className="space-y-5" key={quizKey}>
              {displayedQuestions.map((q, idx) => (
                <QuizCard
                  key={`${q.id}-${quizKey}`}
                  questionNumber={idx + 1}
                  question={q}
                  onAnswer={handleAnswer}
                />
              ))}

              {displayedQuestions.length === 0 && (
                <div className="text-center py-8 glass-panel rounded-2xl p-6 text-slate-400 text-xs">
                  No questions match the current filter.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Short Questions */}
        {activeTab === "short" && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400 mb-2">
              Deepen conceptual understanding with short-answer questions directly synthesized from your lecture slides:
            </p>
            {session.shortQuestions?.map((sq, idx) => (
              <ShortQuestionCard
                key={idx}
                questionNumber={idx + 1}
                question={sq.question}
                modelAnswer={sq.modelAnswer}
              />
            ))}
          </div>
        )}

        {/* Tab 3: Grounded Follow-up Chat */}
        {activeTab === "chat" && (
          <ChatBox sessionId={session.id} />
        )}
      </div>
    </div>
  );
}

function ResolvedSessionViewer({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolved = use(params);
  return <SessionViewer sessionId={resolved.id} />;
}

export default function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 animate-spin">
            <Sparkles className="w-6 h-6" />
          </div>
          <p className="text-sm text-slate-300 font-medium">Loading session...</p>
        </div>
      }
    >
      <ResolvedSessionViewer params={params} />
    </Suspense>
  );
}
