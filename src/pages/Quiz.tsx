import { useState } from "react";
import { generateQuiz, submitQuiz } from "../api";
import type { QuizQuestion, QuizResult } from "../types";

const difficultyColor = {
  easy: "bg-green-100 text-green-700",
  medium: "bg-amber-100 text-amber-700",
  hard: "bg-red-100 text-red-700",
};

export default function Quiz() {
  const [topic, setTopic] = useState("Deadlock conditions");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function start() {
    setLoading(true);
    setError("");
    setResult(null);
    setAnswers({});
    setIndex(0);
    try {
      setQuestions(await generateQuiz(topic));
    } catch {
      setError("Couldn't generate the quiz. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function finish() {
    setLoading(true);
    setError("");
    try {
      setResult(await submitQuiz(answers));
    } catch {
      setError("Couldn't submit answers. Try again.");
    } finally {
      setLoading(false);
    }
  }

  // Start screen
  if (questions.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-6">
        <h1 className="mb-4 text-xl font-semibold">Quiz</h1>
        <label className="text-sm text-slate-500">Topic</label>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="mb-4 mt-1 w-full rounded-lg border px-3 py-2"
        />
        <button
          onClick={start}
          disabled={loading || !topic.trim()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Generating..." : "Start quiz"}
        </button>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  // Results screen
  if (result) {
    return (
      <div className="rounded-xl border bg-white p-6">
        <h1 className="text-xl font-semibold">
          Score: {result.score}/{result.total}
        </h1>
        <div className="mt-4 space-y-3">
          {result.feedback.map((f, i) => {
            const q = questions.find((x) => x.id === f.questionId);
            return (
              <div
                key={f.questionId}
                className={`rounded-lg border p-3 ${
                  f.correct ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"
                }`}
              >
                <p className="font-medium">
                  {i + 1}. {q?.text}
                </p>
                <p className="text-sm">
                  {f.correct ? "Correct" : "Incorrect"}
                  {answers[f.questionId] && ` · You answered: ${answers[f.questionId]}`}
                </p>
                <p className="mt-1 text-sm text-slate-600">{f.explanation}</p>
              </div>
            );
          })}
        </div>
        <button
          onClick={() => {
            setQuestions([]);
            setResult(null);
          }}
          className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-white"
        >
          Try another quiz
        </button>
      </div>
    );
  }

  // Question screen
  const q = questions[index];
  const isLast = index === questions.length - 1;

  return (
    <div className="rounded-xl border bg-white p-6">
      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="text-slate-500">
          Question {index + 1} of {questions.length} · {q.concept}
        </span>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${difficultyColor[q.difficulty]}`}
        >
          {q.difficulty}
        </span>
      </div>

      <h2 className="mb-4 text-lg font-medium">{q.text}</h2>

      <div className="space-y-2">
        {q.options.map((opt) => (
          <button
            key={opt}
            onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
            className={`block w-full rounded-lg border px-4 py-2 text-left ${
              answers[q.id] === opt ? "border-indigo-600 bg-indigo-50" : "hover:bg-slate-50"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      <div className="mt-5 flex justify-between">
        <button
          onClick={() => setIndex((i) => i - 1)}
          disabled={index === 0}
          className="rounded-lg border px-4 py-2 disabled:opacity-40"
        >
          Back
        </button>
        {isLast ? (
          <button
            onClick={finish}
            disabled={!answers[q.id] || loading}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-white disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        ) : (
          <button
            onClick={() => setIndex((i) => i + 1)}
            disabled={!answers[q.id]}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-white disabled:opacity-50"
          >
            Next
          </button>
        )}
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}