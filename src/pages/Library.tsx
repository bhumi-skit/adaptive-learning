import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { getDocuments, uploadDocument } from "../api";
import type { DocumentItem, DocStatus } from "../types";
import {
  UploadCloudIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  RefreshCwIcon,
  MessageSquareIcon,
  BookOpenIcon,
  FileFormatIcon,
} from "../components/Icons";

const ALLOWED = [".pdf", ".pptx", ".docx", ".mp4", ".mp3"];
const MAX_MB = 50;

const badgeStyles: Record<
  DocStatus,
  { bg: string; text: string; ring: string; label: string; icon: typeof CheckCircleIcon }
> = {
  uploading: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    ring: "ring-blue-200",
    label: "Uploading...",
    icon: RefreshCwIcon,
  },
  processing: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    ring: "ring-amber-200",
    label: "Indexing & embedding",
    icon: RefreshCwIcon,
  },
  ready: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    ring: "ring-emerald-200",
    label: "Ready for RAG",
    icon: CheckCircleIcon,
  },
  failed: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    ring: "ring-rose-200",
    label: "Processing failed",
    icon: AlertCircleIcon,
  },
};

export default function Library() {
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const data = await getDocuments();
      setDocs(data);
    } catch {
      setErrors((prev) =>
        prev.includes("Couldn't refresh documents.")
          ? prev
          : [...prev, "Couldn't refresh documents."]
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    getDocuments()
      .then((data) => {
        if (!ignore) setDocs(data);
      })
      .catch(() => {
        if (!ignore) setErrors(["Couldn't load documents."]);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  // Poll while any document is in uploading or processing state
  const needsPolling = docs.some(
    (d) => d.status === "processing" || d.status === "uploading"
  );

  useEffect(() => {
    if (!needsPolling) return;
    const interval = setInterval(load, 4000);
    return () => clearInterval(interval);
  }, [needsPolling, load]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const newErrors: string[] = [];
    setUploading(true);

    for (const file of Array.from(files)) {
      const ext = "." + (file.name.split(".").pop()?.toLowerCase() || "");
      if (!ALLOWED.includes(ext)) {
        newErrors.push(
          `"${file.name}": Unsupported format. Allowed: ${ALLOWED.join(", ")}`
        );
        continue;
      }
      if (file.size > MAX_MB * 1024 * 1024) {
        newErrors.push(`"${file.name}": File size exceeds limit of ${MAX_MB} MB.`);
        continue;
      }

      try {
        const doc = await uploadDocument(file);
        setDocs((prev) => [doc, ...prev]);
      } catch {
        newErrors.push(`"${file.name}": Upload failed. Please try again.`);
      }
    }

    setErrors(newErrors);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Course Materials Library</h1>
          <p className="mt-1 text-xs text-slate-500 max-w-xl">
            Upload PDFs, slide decks, documents, or lecture media. Files are chunked, embedded, and
            indexed into the vector store so the tutor can ground its answers in verified evidence.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 transition-all"
        >
          <RefreshCwIcon className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh status</span>
        </button>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`group relative cursor-pointer rounded-2xl border-2 border-dashed p-8 sm:p-10 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
          dragging
            ? "border-indigo-500 bg-indigo-50/70 scale-[1.005]"
            : "border-slate-300 bg-white hover:border-indigo-400 hover:bg-slate-50/60 shadow-xs"
        }`}
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-3 group-hover:scale-105 transition-transform">
          <UploadCloudIcon className="h-6 w-6" />
        </div>
        <p className="text-sm font-semibold text-slate-900">
          {uploading ? "Uploading files..." : "Drag and drop study materials, or browse"}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Supports <span className="font-medium text-slate-700">PDF, PPTX, DOCX, MP4, MP3</span> ·
          up to <span className="font-medium text-slate-700">{MAX_MB} MB</span> per file
        </p>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.pptx,.docx,.mp4,.mp3"
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Errors Banner */}
      {errors.length > 0 && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-900">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircleIcon className="h-4 w-4 text-rose-600" />
            <span>Could not upload some files:</span>
          </div>
          <ul className="mt-2 list-disc list-inside space-y-1 text-rose-800">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Processing Status Banner */}
      {needsPolling && (
        <div className="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-2.5 text-xs text-amber-900">
          <RefreshCwIcon className="h-4 w-4 text-amber-600 animate-spin shrink-0" />
          <span>
            Document ingestion in progress. Chunks, embeddings, and citations are being generated in
            the background.
          </span>
        </div>
      )}

      {/* Documents List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Indexed Files ({docs.length})</h2>
          <span className="text-xs text-slate-400">RAG Knowledge Base</span>
        </div>

        {loading && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
            <RefreshCwIcon className="h-5 w-5 animate-spin mx-auto mb-2 text-indigo-600" />
            Loading course documents...
          </div>
        )}

        {!loading && docs.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
              <BookOpenIcon className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">No documents in library</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              Upload your course PDFs, lecture slides, or recordings above to activate grounded AI
              tutoring and personalized quizzes.
            </p>
          </div>
        )}

        <div className="space-y-2">
          {docs.map((doc) => {
            const badge = badgeStyles[doc.status] || badgeStyles.processing;
            const BadgeIcon = badge.icon;
            const isReady = doc.status === "ready";

            return (
              <div
                key={doc.id}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-slate-300"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 border border-slate-100">
                    <FileFormatIcon filename={doc.name} className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{doc.name}</p>
                    <p className="text-[11px] text-slate-400">ID: {doc.id.slice(0, 8)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${badge.bg} ${badge.text} ${badge.ring}`}
                  >
                    <BadgeIcon
                      className={`h-3.5 w-3.5 ${
                        doc.status === "processing" || doc.status === "uploading"
                          ? "animate-spin"
                          : ""
                      }`}
                    />
                    <span>{badge.label}</span>
                  </span>

                  {/* Ask About This button */}
                  {isReady && (
                    <Link
                      to={`/chat?q=${encodeURIComponent(
                        `Can you summarize the main concepts covered in "${doc.name}"?`
                      )}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100/70 hover:border-indigo-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                      title="Ask the AI tutor about this document"
                    >
                      <MessageSquareIcon className="h-3.5 w-3.5" />
                      <span>Ask about this</span>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}