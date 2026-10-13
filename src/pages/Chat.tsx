import { useRef, useEffect, useState } from "react";
import { askQuestion } from "../api";
import type { Citation } from "../types";
import { citationLabel } from "../util";

interface Message {
  role: "user" | "ai";
  text: string;
  citations?: Citation[];
  insufficient?: boolean;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState<Citation | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const question = input.trim();
    if (!question || loading) return;
    setMessages((m) => [...m, { role: "user", text: question }]);
    setInput("");
    setLoading(true);
    try {
      const res = await askQuestion(question);
      setMessages((m) => [
        ...m,
        {
          role: "ai",
          text: res.answer,
          citations: res.citations,
          insufficient: !res.sufficientEvidence,
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "ai", text: "Something went wrong. Please try again.", insufficient: true },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-4">
      {/* Chat column */}
      <div className="flex h-[75vh] flex-1 flex-col rounded-xl border bg-white">
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.length === 0 && (
            <p className="mt-20 text-center text-slate-400">
              Ask a question about your uploaded material.
            </p>
          )}

          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  m.role === "user"
                    ? "bg-indigo-600 text-white"
                    : m.insufficient
                    ? "border border-amber-300 bg-amber-50 text-amber-900"
                    : "bg-slate-100"
                }`}
              >
                {m.insufficient && !m.text ? (
                  <p>Your material doesn't contain enough information to answer this.</p>
                ) : (
                  <p>{m.text}</p>
                )}

                {m.citations && m.citations.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {m.citations.map((c, j) => (
                      <button
                        key={j}
                        onClick={() => setActive(c)}
                        className="rounded-full border border-indigo-300 bg-white px-2 py-0.5 text-xs text-indigo-700 hover:bg-indigo-50"
                      >
                        {citationLabel(c)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-slate-100 px-4 py-2 text-slate-500">Thinking...</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="flex gap-2 border-t p-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="e.g. What are the four conditions for deadlock?"
            className="flex-1 rounded-lg border px-3 py-2 outline-none focus:border-indigo-500"
          />
          <button
            onClick={send}
            disabled={loading}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-white disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>

      {/* Source panel */}
      {active && (
        <aside className="h-fit w-72 rounded-xl border bg-white p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold">Source</h3>
            <button onClick={() => setActive(null)} className="text-slate-400 hover:text-slate-700">
              ✕
            </button>
          </div>
          <p className="text-sm text-slate-500">
            {active.source} · {citationLabel(active)}
          </p>
          <blockquote className="mt-3 border-l-4 border-indigo-300 pl-3 text-sm">
            {active.text}
          </blockquote>
        </aside>
      )}
    </div>
  );
}