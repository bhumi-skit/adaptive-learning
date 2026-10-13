import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { getProgress } from "../api";
import type { Progress, Recommendation } from "../types";
import {
  BarChartIcon,
  SparklesIcon,
  ArrowRightIcon,
  RefreshCwIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  GraduationCapIcon,
  MessageSquareIcon,
  BookOpenIcon,
} from "../components/Icons";

interface RecConfig {
  label: string;
  badge: string;
  desc: string;
  actionText: string;
  to: (topic: string) => string;
  theme: {
    bg: string;
    border: string;
    badgeBg: string;
    badgeText: string;
    badgeRing: string;
    btn: string;
  };
  icon: typeof SparklesIcon;
}

const recConfig: Record<Recommendation, RecConfig> = {
  reteach: {
    label: "Reteach Recommended",
    badge: "Low Mastery (<40%)",
    desc: "Your mastery score indicates foundational gaps. The learner model recommends reviewing this concept with the AI tutor using your lecture materials.",
    actionText: "Review with AI Tutor",
    to: (topic) => `/chat?topic=${encodeURIComponent(topic)}`,
    theme: {
      bg: "bg-rose-50/70",
      border: "border-rose-200",
      badgeBg: "bg-rose-100",
      badgeText: "text-rose-800",
      badgeRing: "ring-rose-200",
      btn: "bg-rose-600 hover:bg-rose-700",
    },
    icon: MessageSquareIcon,
  },
  practice: {
    label: "Guided Practice",
    badge: "Developing (40% - 69%)",
    desc: "You are making steady progress. Take another targeted adaptive quiz to build confidence and solidify understanding.",
    actionText: "Take Practice Quiz",
    to: (topic) => `/quiz?topic=${encodeURIComponent(topic)}`,
    theme: {
      bg: "bg-amber-50/70",
      border: "border-amber-200",
      badgeBg: "bg-amber-100",
      badgeText: "text-amber-800",
      badgeRing: "ring-amber-200",
      btn: "bg-amber-600 hover:bg-amber-700",
    },
    icon: GraduationCapIcon,
  },
  revise: {
    label: "Scheduled Revision",
    badge: "Retention Refresher",
    desc: "Maintain mastery stability over time with a fast refresher quiz to prevent concept decay.",
    actionText: "Take Refresher Quiz",
    to: (topic) => `/quiz?topic=${encodeURIComponent(topic)}`,
    theme: {
      bg: "bg-blue-50/70",
      border: "border-blue-200",
      badgeBg: "bg-blue-100",
      badgeText: "text-blue-800",
      badgeRing: "ring-blue-200",
      btn: "bg-blue-600 hover:bg-blue-700",
    },
    icon: RefreshCwIcon,
  },
  advance: {
    label: "Ready to Advance",
    badge: "Demonstrated Mastery (≥70%)",
    desc: "High proficiency achieved! The learner model recommends moving forward to next-tier concepts or advanced course units.",
    actionText: "Explore Next Topic",
    to: (topic) => `/chat?topic=${encodeURIComponent(topic)}`,
    theme: {
      bg: "bg-emerald-50/70",
      border: "border-emerald-200",
      badgeBg: "bg-emerald-100",
      badgeText: "text-emerald-800",
      badgeRing: "ring-emerald-200",
      btn: "bg-emerald-600 hover:bg-emerald-700",
    },
    icon: CheckCircleIcon,
  },
};

function getMasteryTier(score: number) {
  if (score < 40) {
    return {
      label: "Needs Reteaching",
      color: "bg-rose-500",
      text: "text-rose-700",
      bg: "bg-rose-50",
      ring: "ring-rose-200",
    };
  }
  if (score < 70) {
    return {
      label: "Developing",
      color: "bg-amber-500",
      text: "text-amber-700",
      bg: "bg-amber-50",
      ring: "ring-amber-200",
    };
  }
  return {
    label: "Mastered",
    color: "bg-emerald-500",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    ring: "ring-emerald-200",
  };
}

export default function Dashboard() {
  const [data, setData] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProgress = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getProgress();
      setData(res);
    } catch {
      setError("Unable to load learner progress data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  if (loading && !data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
        <RefreshCwIcon className="h-6 w-6 animate-spin mx-auto mb-3 text-indigo-600" />
        <p className="text-sm font-semibold text-slate-900">Calculating Learner Model Mastery...</p>
        <p className="text-xs text-slate-500 mt-1">
          Evaluating concept accuracy, question difficulty, and recent attempt history.
        </p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center shadow-xs">
        <AlertCircleIcon className="h-6 w-6 text-rose-600 mx-auto mb-2" />
        <p className="text-sm font-semibold text-rose-900">{error}</p>
        <button
          onClick={loadProgress}
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 transition-all"
        >
          <RefreshCwIcon className="h-3.5 w-3.5" />
          <span>Retry loading</span>
        </button>
      </div>
    );
  }

  if (!data) return null;

  const currentRec = recConfig[data.recommendation.action] || recConfig.practice;
  const RecIcon = currentRec.icon;
  const averageMastery =
    data.topics.length > 0
      ? Math.round(
          data.topics.reduce((acc, t) => acc + t.mastery, 0) / data.topics.length
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Progress & Recommendations</h1>
          <p className="mt-1 text-xs text-slate-500 max-w-xl">
            Concept-level mastery calculated by the learner model based on quiz accuracy, question
            difficulty, and recency.
          </p>
        </div>
        <button
          onClick={loadProgress}
          disabled={loading}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 transition-all"
        >
          <RefreshCwIcon className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh stats</span>
        </button>
      </div>

      {/* Prominent Recommended Next Activity Card */}
      <div
        className={`rounded-2xl border ${currentRec.theme.border} ${currentRec.theme.bg} p-6 sm:p-7 shadow-xs relative overflow-hidden`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${currentRec.theme.badgeBg} ${currentRec.theme.badgeText} ${currentRec.theme.badgeRing}`}
              >
                <RecIcon className="h-3 w-3" />
                <span>{currentRec.label}</span>
              </span>
              <span className="text-xs font-medium text-slate-500">
                · Learner Model Decision
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Focus Topic: {data.recommendation.topic}
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {currentRec.desc}
            </p>
          </div>

          <div className="shrink-0 self-start sm:self-center">
            <Link
              to={currentRec.to(data.recommendation.topic)}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-xs sm:text-sm font-semibold text-white shadow-xs transition-all ${currentRec.theme.btn} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500`}
            >
              <span>{currentRec.actionText}</span>
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Overall Average Mastery
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{averageMastery}%</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Across {data.topics.length} concepts</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Concepts Mastered (≥70%)
          </p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {data.topics.filter((t) => t.mastery >= 70).length} / {data.topics.length}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Ready for advancement</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Needs Reteach (&lt;40%)
          </p>
          <p className="text-2xl font-bold text-rose-600 mt-1">
            {data.topics.filter((t) => t.mastery < 40).length}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Scheduled for tutor review</p>
        </div>
      </div>

      {/* Concept Mastery Breakdown */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChartIcon className="h-4 w-4 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">Topic Mastery Breakdown</h2>
            </div>
            <p className="text-xs text-slate-500">
              Thresholds: Needs Reteaching (&lt;40%) · Developing (40–69%) · Mastered (≥70%)
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
              <span>&lt;40%</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              <span>40–69%</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span>≥70%</span>
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {data.topics.map((t) => {
            const tier = getMasteryTier(t.mastery);

            return (
              <div
                key={t.name}
                className="group rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:bg-slate-50 hover:border-slate-200"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-semibold text-slate-900">{t.name}</span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${tier.bg} ${tier.text} ${tier.ring}`}
                    >
                      {tier.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-700">{t.mastery}%</span>
                    <Link
                      to={`/quiz?topic=${encodeURIComponent(t.name)}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-indigo-300 hover:text-indigo-600 shadow-xs transition-colors"
                      title={`Launch quiz for ${t.name}`}
                    >
                      <GraduationCapIcon className="h-3 w-3" />
                      <span>Quiz</span>
                    </Link>
                  </div>
                </div>

                {/* Progress Track */}
                <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${tier.color}`}
                    style={{ width: `${Math.max(5, t.mastery)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* System Architecture Callout (From PDF Spec) */}
      <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/60 to-slate-50 p-5 text-xs text-slate-600 flex items-start gap-3.5 shadow-xs">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
          <BookOpenIcon className="h-4 w-4" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
            Architecture Distinction: Grounded RAG vs. Learner Model
          </h3>
          <p className="leading-relaxed">
            <span className="font-semibold text-indigo-900">1. RAG Knowledge Base:</span> The AI
            Tutor retrieves facts directly from your course materials and displays verified citations
            to eliminate hallucinations.
          </p>
          <p className="leading-relaxed">
            <span className="font-semibold text-indigo-900">2. Adaptive Learner Model:</span> After
            every quiz, Bayesian/rule-based heuristics recalculate your concept mastery to prescribe
            what you should do next (reteach, guided practice, or advancement).
          </p>
        </div>
      </div>
    </div>
  );
}