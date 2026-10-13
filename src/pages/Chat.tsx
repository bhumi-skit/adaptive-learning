import { useRef, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { askQuestion } from "../api";
import type { Citation } from "../types";
import { citationLabel } from "../util";
import {
  SparklesIcon,
  SendIcon,
  AlertCircleIcon,
  BookOpenIcon,
  XIcon,
  FileTextIcon,
} from "../components/Icons";

interface Message {
  role: "user" | "ai";
  text: string;
  citations?: Citation[];
  insufficient?: boolean;
}

const STARTER_PROMPTS = [
  "What are the four necessary conditions for deadlock?",
  "How can the hold-and-wait condition be prevented?",
  "What is the circular wait condition?",
  "Does our material cover quantum computing?", // Tests insufficient evidence
];

export default function Chat() {
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check URL params for pre-filled query or topic
  useEffect(() => {
    const qParam = searchParams.get("q");
    const topicParam = searchParams.get("topic");
    if (qParam) {
      setInput(qParam);
      inputRef.current?.focus();
    } else if (topicParam) {
      setInput(`Can you explain the key concepts of "${topicParam}" using my notes?`);
      inputRef.current?.focus();
    }
  }, [searchParams]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend(questionText?: string) {
    const query = (questionText ?? input).trim();
    if (!query || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: query }]);
    setInput("");
    setLoading(true);

    try {
      const res = await askQuestion(query);
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: res.answer,
          citations: res.citations,
          insufficient: !res.sufficientEvidence,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "An error occurred while communicating with the tutor service. Please check your connection and try again.",
          insufficient: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex flex-col lg:flex-row gap-5 h-[calc(100vh-10rem)] min-h-[550px]">
      {/* Main Chat Column */}
      <div className="flex flex-1 flex-col rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {/* Chat Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
              <SparklesIcon className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">RAG Grounded Tutor</h2>
              <p className="text-xs text-slate-500">
                Answers verified strictly against your uploaded study materials
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={() => {
                setMessages([]);
                setActiveCitation(null);
              }}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
            >
              Clear conversation
            </button>
          )}
        </div>

        {/* Message Thread */}
        <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
          {messages.length === 0 && (
            <div className="my-auto flex flex-col items-center justify-center py-10 text-center max-w-md mx-auto">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-4 shadow-xs">
                <SparklesIcon className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">
                What would you like to learn today?
              </h3>
              <p className="mt-1.5 text-xs text-slate-500">
                Ask any question about your indexed course materials. The AI tutor cites sources and
                alerts you if evidence is insufficient.
              </p>

              {/* Starter Question Chips */}
              <div className="mt-6 w-full space-y-2">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Suggested Questions
                </p>
                <div className="grid gap-2 text-left">
                  {STARTER_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSend(prompt)}
                      className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-900 transition-all text-left"
                    >
                      <span>{prompt}</span>
                      <span className="text-slate-400 group-hover:text-indigo-600 ml-2">→</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.role === "ai" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs text-xs font-bold">
                  AI
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 shadow-xs ${
                  m.role === "user"
                    ? "bg-indigo-600 text-white rounded-br-xs"
                    : m.insufficient
                    ? "border border-amber-300 bg-amber-50/80 text-amber-950 rounded-bl-xs"
                    : "border border-slate-200 bg-slate-50/60 text-slate-900 rounded-bl-xs"
                }`}
              >
                {/* Insufficient Evidence Warning Banner */}
                {m.insufficient && (
                  <div className="mb-2 flex items-start gap-2 rounded-lg bg-amber-100/80 p-2.5 text-xs text-amber-900">
                    <AlertCircleIcon className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
                    <div>
                      <span className="font-semibold">Insufficient Evidence Grounding:</span>{" "}
                      Your indexed course documents do not contain enough verified evidence to
                      answer this question without hallucinating.
                    </div>
                  </div>
                )}

                {/* Message Text */}
                {m.text && <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.text}</p>}

                {/* Citations List */}
                {m.citations && m.citations.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-200/80">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1">
                      <BookOpenIcon className="h-3 w-3" />
                      <span>Retrieved Sources ({m.citations.length})</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {m.citations.map((c, j) => {
                        const isSelected = activeCitation === c;
                        return (
                          <button
                            key={j}
                            onClick={() => setActiveCitation(isSelected ? null : c)}
                            className={`group inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
                              isSelected
                                ? "bg-indigo-600 text-white ring-2 ring-indigo-300"
                                : "border border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300"
                            }`}
                            title={`View excerpt from ${c.source}`}
                          >
                            <FileTextIcon className="h-3 w-3" />
                            <span>{citationLabel(c)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading / Generating State */}
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs text-xs font-bold">
                AI
              </div>
              <div className="flex items-center gap-2 rounded-2xl rounded-bl-xs border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium text-slate-600">
                <span className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-indigo-600 animate-bounce" />
                  <span className="h-2 w-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]" />
                  <span className="h-2 w-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]" />
                </span>
                <span>Searching knowledge vectors & synthesizing answer...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 border-t border-slate-100 bg-white p-3 sm:p-4"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your study material..."
            disabled={loading}
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-all hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Ask</span>
            <SendIcon className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>

      {/* Source Citation Panel (Sidebar on Desktop, Overlay/Bottom Sheet on Mobile) */}
      {activeCitation && (
        <aside className="fixed inset-x-4 bottom-4 z-40 lg:static lg:inset-auto lg:z-auto flex flex-col w-auto lg:w-80 rounded-2xl border border-slate-200 bg-white p-5 shadow-xl lg:shadow-xs transition-all max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-indigo-700">
              <BookOpenIcon className="h-4 w-4" />
              <h3 className="text-sm font-bold">Source Evidence</h3>
            </div>
            <button
              onClick={() => setActiveCitation(null)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              aria-label="Close source panel"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 space-y-3">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Document</p>
              <p className="text-sm font-medium text-slate-900 break-words mt-0.5">
                {activeCitation.source}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Location</p>
              <span className="inline-block mt-0.5 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200/50">
                {citationLabel(activeCitation)}
              </span>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Grounded Excerpt
              </p>
              <blockquote className="rounded-xl border-l-4 border-indigo-500 bg-slate-50 p-3.5 text-xs leading-relaxed text-slate-700 italic">
                "{activeCitation.text}"
              </blockquote>
            </div>

            <p className="text-[11px] text-slate-400">
              This citation was retrieved by pgvector semantic chunk search to guarantee factual
              accuracy.
            </p>
          </div>
        </aside>
      )}
    </div>
  );
}