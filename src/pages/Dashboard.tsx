import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProgress } from "../api";
import type { Progress, Recommendation } from "../types";

const rec: Record<Recommendation, { label: string; desc: string; to: string }> = {
  reteach: {
    label: "Reteach",
    desc: "Let's go over this again using your material.",
    to: "/chat",
  },
  practice: {
    label: "Guided practice",
    desc: "Take a targeted quiz to build confidence.",
    to: "/quiz",
  },
  revise: {
    label: "Revise",
    desc: "A quick refresher will keep this fresh.",
    to: "/quiz",
  },
  advance: {
    label: "Next topic",
    desc: "You've got this one. Time to move on.",
    to: "/chat",
  },
};

function barColor(m: number) {
  if (m < 40) return "bg-red-500";
  if (m < 70) return "bg-amber-500";
  return "bg-green-500";
}

export default function Dashboard() {
  const [data, setData] = useState<Progress | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getProgress()
      .then(setData)
      .catch(() => setError("Couldn't load your progress."));
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return <p className="text-slate-400">Loading...</p>;

  const r = rec[data.recommendation.action];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border-2 border-indigo-300 bg-indigo-50 p-5">
        <p className="text-sm text-indigo-600">Recommended next</p>
        <h2 className="text-lg font-semibold">
          {r.label}: {data.recommendation.topic}
        </h2>
        <p className="text-sm text-slate-600">{r.desc}</p>
        <Link
          to={r.to}
          className="mt-3 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-white"
        >
          Go
        </Link>
      </div>

      <div className="rounded-xl border bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold">Topic mastery</h2>
        <div className="space-y-4">
          {data.topics.map((t) => (
            <div key={t.name}>
              <div className="mb-1 flex justify-between text-sm">
                <span>{t.name}</span>
                <span className="text-slate-500">{t.mastery}%</span>
              </div>
              <div className="h-3 rounded-full bg-slate-200">
                <div
                  className={`h-3 rounded-full ${barColor(t.mastery)}`}
                  style={{ width: `${t.mastery}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}