import { useEffect, useRef, useState } from "react";
import { getDocuments, uploadDocument } from "../api";
import type { DocumentItem, DocStatus } from "../types";

const ALLOWED = [".pdf", ".pptx", ".docx", ".mp4", ".mp3"];
const MAX_MB = 50;

const badge: Record<DocStatus, string> = {
  uploading: "bg-blue-100 text-blue-700",
  processing: "bg-amber-100 text-amber-700",
  ready: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

export default function Library() {
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function load() {
    try {
      setDocs(await getDocuments());
    } catch {
      setError("Couldn't load documents.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Poll while anything is still processing
  const needsPolling = docs.some(
    (d) => d.status === "processing" || d.status === "uploading"
  );
  useEffect(() => {
    if (!needsPolling) return;
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [needsPolling]);

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    setError("");
    setUploading(true);
    for (const file of Array.from(files)) {
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      if (!ALLOWED.includes(ext)) {
        setError(`${file.name}: unsupported type. Allowed: ${ALLOWED.join(", ")}`);
        continue;
      }
      if (file.size > MAX_MB * 1024 * 1024) {
        setError(`${file.name}: larger than ${MAX_MB} MB.`);
        continue;
      }
      try {
        const doc = await uploadDocument(file);
        setDocs((d) => [doc, ...d]);
      } catch {
        setError(`${file.name}: upload failed.`);
      }
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Your Library</h1>

      <div
        onClick={() => inputRef.current?.click()}
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
        className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center ${
          dragging ? "border-indigo-500 bg-indigo-50" : "border-slate-300 bg-white"
        }`}
      >
        <p className="font-medium">
          {uploading ? "Uploading..." : "Drag and drop files here, or click to browse"}
        </p>
        <p className="mt-1 text-sm text-slate-400">
          PDF, PPTX, DOCX, MP4, MP3 · up to {MAX_MB} MB
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-6 space-y-2">
        {loading && <p className="text-slate-400">Loading...</p>}
        {!loading && docs.length === 0 && (
          <p className="text-slate-400">No files yet. Upload your first one above.</p>
        )}
        {docs.map((d) => (
          <div
            key={d.id}
            className="flex items-center justify-between rounded-lg border bg-white px-4 py-3"
          >
            <span>{d.name}</span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${badge[d.status]}`}
            >
              {d.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}