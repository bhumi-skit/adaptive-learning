import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { generateQuiz, submitQuiz } from "../api";
import type { QuizQuestion, QuizResult } from "../types";
import {
  GraduationCapIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  RefreshCwIcon,
  SparklesIcon,
  MessageSquareIcon,
  BarChartIcon,
} from "../components/Icons";

const difficultyStyles = {
  easy: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  medium: "bg-amber-50 text-amber-700 ring-amber-200",
  hard: "bg-rose-50 text-rose-700 ring-rose-200",
};

const SUGGESTED_TOPICS = [
  "Deadlock conditions",
  "Process scheduling",
  "Memory management",
  "Deadlock prevention",
];

export default function Quiz() {
  const [searchParams] = useSearchParams();
  const [topic, setTopic] = useState("Deadlock conditions");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Check if a topic was passed in URL params (e.g. from Dashboard recommendation)
  useEffect(() => {
    const topicParam = searchParams.get("topic");
    if (topicParam) {
      setTopic(topicParam);
    }
  }, [searchParams]);

  async function handleStart() {
    if (!topic.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    setAnswers({});
    setIndex(0);
    try {
      const qList = await generateQuiz(topic.trim());
      setQuestions(qList);
    } catch {
      setError("Couldn't generate the quiz for this topic. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleFinish() {
    setLoading(true);
    setError("");
    try {
      const res = await submitQuiz(answers);
      setResult(res);
    } catch {
      setError("Failed to evaluate quiz answers. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // SCREEN 1: Setup / Start Quiz
  if (questions.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-xs">
              <GraduationCapIcon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Adaptive Assessment</h1>
              <p className="text-xs text-slate-500">
                Source-grounded questions with concept tagging and difficulty weighting
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-600 mb-5 leading-relaxed">
            The assessment engine pulls verified chunks from your study materials to generate targeted
            multiple-choice questions. Your answers update your mastery in the learner model.
          </p>

          <div className="space-y-4">
            <div>
              <label htmlFor="topic-input" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Target Topic or Concept
              </label>
              <input
                id="topic-input"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Deadlock conditions, Normalization"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {/* Quick-Pick Topics */}
            <div>
              <p className="text-xs font-medium text-slate-400 mb-2">Popular concepts to test:</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_TOPICS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTopic(t)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                      topic === t
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                <AlertCircleIcon className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleStart}
              disabled={loading || !topic.trim()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-xs transition-all hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RefreshCwIcon className="h-4 w-4 animate-spin" />
                  <span>Generating grounded questions...</span>
                </>
              ) : (
                <>
                  <span>Start Adaptive Quiz</span>
                  <ArrowRightIcon className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Informational Callout */}
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 text-xs text-slate-500 flex items-start gap-3">
          <SparklesIcon className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-700">How Adaptive Assessment Works:</span>{" "}
            Questions assess specific concepts across varied difficulties. Once evaluated, the learner
            model recalculates your mastery score to recommend whether to reteach, practice, or advance.
          </div>
        </div>
      </div>
    );
  }

  // SCREEN 2: Polished Results View
  if (result) {
    const percentage = Math.round((result.score / result.total) * 100);
    const passed = percentage >= 70;
    const needsWork = percentage < 40;

    return (
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Results Banner Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <span className="inline-block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Assessment Complete
              </span>
              <h1 className="text-2xl font-bold text-slate-900 mt-1">
                Score: {result.score} / {result.total}{" "}
                <span className="text-slate-400 font-normal">({percentage}%)</span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">Topic: {topic}</p>
            </div>

            <div
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold ring-1 ${
                passed
                  ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                  : needsWork
                  ? "bg-rose-50 text-rose-800 ring-rose-200"
                  : "bg-amber-50 text-amber-800 ring-amber-200"
              }`}
            >
              {passed ? (
                <>
                  <CheckCircleIcon className="h-4 w-4 text-emerald-600" />
                  <span>Demonstrated Mastery</span>
                </>
              ) : needsWork ? (
                <>
                  <AlertCircleIcon className="h-4 w-4 text-rose-600" />
                  <span>Needs Reteaching</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="h-4 w-4 text-amber-600" />
                  <span>Developing Mastery</span>
                </>
              )}
            </div>
          </div>

          {/* Next Action Suggestion */}
          <div className="mt-5 rounded-xl bg-slate-50 p-4 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span>
              {passed
                ? "Excellent! Your mastery on this concept has been recorded. Ready to advance to the next topic."
                : needsWork
                ? "We recommend a quick reteach session with the AI Tutor to review the source material."
                : "Good progress. Take another practice quiz to solidify your understanding."}
            </span>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 shrink-0 font-semibold text-indigo-600 hover:text-indigo-800"
            >
              <BarChartIcon className="h-3.5 w-3.5" />
              <span>Check Dashboard</span>
            </Link>
          </div>
        </div>

        {/* Detailed Question Review */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Review Questions ({result.feedback.length})
          </h2>

          <div className="space-y-3">
            {result.feedback.map((f, i) => {
              const q = questions.find((x) => x.id === f.questionId);
              const userAnswer = answers[f.questionId];

              return (
                <div
                  key={f.questionId}
                  className={`rounded-2xl border p-5 shadow-xs transition-all ${
                    f.correct
                      ? "border-emerald-200 bg-white"
                      : "border-rose-200 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold text-slate-500">
                      Question {i + 1} {q?.concept ? `· ${q.concept}` : ""}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        f.correct
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                          : "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                      }`}
                    >
                      {f.correct ? "Correct" : "Incorrect"}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-slate-900 mb-2">{q?.text}</p>

                  <div className="rounded-xl bg-slate-50 p-3 text-xs space-y-1.5">
                    <p className="text-slate-700">
                      <span className="font-semibold text-slate-900">Your Answer:</span>{" "}
                      {userAnswer || "(No answer selected)"}
                    </p>
                    <p className="text-slate-600 leading-relaxed border-t border-slate-200/60 pt-1.5">
                      <span className="font-semibold text-slate-900">Grounded Explanation:</span>{" "}
                      {f.explanation}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => {
              setQuestions([]);
              setResult(null);
            }}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <RefreshCwIcon className="h-4 w-4" />
            <span>Try Another Quiz</span>
          </button>

          <Link
            to={`/chat?topic=${encodeURIComponent(topic)}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <MessageSquareIcon className="h-4 w-4 text-indigo-600" />
            <span>Ask Tutor About Missed Concepts</span>
          </Link>
        </div>
      </div>
    );
  }

  // SCREEN 3: Active Question View
  const q = questions[index];
  const isLast = index === questions.length - 1;
  const progressPercent = Math.round(((index + 1) / questions.length) * 100);
  const selectedOption = answers[q.id];

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Progress Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        {/* Progress Bar & Header */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>
              Question {index + 1} of {questions.length}
            </span>
            <span>{progressPercent}% Complete</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Question Metadata */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
            <SparklesIcon className="h-3.5 w-3.5 text-indigo-500" />
            <span>Concept: {q.concept}</span>
          </span>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ${
              difficultyStyles[q.difficulty] || difficultyStyles.medium
            }`}
          >
            {q.difficulty}
          </span>
        </div>

        {/* Question Text */}
        <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">{q.text}</h2>

        {/* Answer Options */}
        <div className="space-y-2.5 pt-1">
          {q.options.map((opt, optIndex) => {
            const isSelected = selectedOption === opt;
            const letter = String.fromCharCode(65 + optIndex);

            return (
              <button
                key={opt}
                type="button"
                onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                className={`group flex w-full items-center gap-3.5 rounded-xl border p-3.5 text-left text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  isSelected
                    ? "border-indigo-600 bg-indigo-50/80 text-indigo-950 font-medium ring-1 ring-indigo-200 shadow-xs"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/60"
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                    isSelected
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  {letter}
                </span>
                <span className="flex-1 leading-snug">{opt}</span>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            <AlertCircleIcon className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => setIndex((i) => i - 1)}
            disabled={index === 0}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ArrowLeftIcon className="h-3.5 w-3.5" />
            <span>Previous</span>
          </button>

          {isLast ? (
            <button
              type="button"
              onClick={handleFinish}
              disabled={!selectedOption || loading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <>
                  <RefreshCwIcon className="h-3.5 w-3.5 animate-spin" />
                  <span>Evaluating...</span>
                </>
              ) : (
                <>
                  <span>Submit Quiz</span>
                  <CheckCircleIcon className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIndex((i) => i + 1)}
              disabled={!selectedOption}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <span>Next</span>
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}