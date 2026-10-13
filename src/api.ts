import type {
  ChatResponse, DocumentItem, Progress, QuizQuestion, QuizResult,
} from "./types";

const USE_MOCK = true; // flip to false when the backend is ready
const BASE = import.meta.env.VITE_API_URL;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, options);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

// export async function getDocuments(): Promise<DocumentItem[]> {
//   if (USE_MOCK) {
//     await sleep(500);
//     return [
//       { id: "1", name: "OS Unit 3 - Deadlocks.pdf", status: "ready" },
//       { id: "2", name: "DBMS Normalization.pptx", status: "processing" },
//     ];
//   }
//   return request("/documents");
// }

// export async function uploadDocument(file: File): Promise<DocumentItem> {
//   if (USE_MOCK) {
//     await sleep(800);
//     return { id: crypto.randomUUID(), name: file.name, status: "processing" };
//   }
//   const form = new FormData();
//   form.append("file", file);
//   return request("/documents", { method: "POST", body: form });
// }
const mockDocs: (DocumentItem & { readyAt?: number })[] = [
  { id: "1", name: "OS Unit 3 - Deadlocks.pdf", status: "ready" },
  {
    id: "2",
    name: "DBMS Normalization.pptx",
    status: "processing",
    readyAt: Date.now() + 8000,
  },
];

export async function getDocuments(): Promise<DocumentItem[]> {
  if (USE_MOCK) {
    await sleep(500);
    return mockDocs.map(({ readyAt, ...doc }) => ({
      ...doc,
      status: readyAt && Date.now() >= readyAt ? "ready" : doc.status,
    }));
  }
  return request("/documents");
}

export async function uploadDocument(file: File): Promise<DocumentItem> {
  if (USE_MOCK) {
    await sleep(800);
    const doc: DocumentItem = {
      id: crypto.randomUUID(),
      name: file.name,
      status: "processing",
    };
    mockDocs.unshift({ ...doc, readyAt: Date.now() + 8000 });
    return doc;
  }
  const form = new FormData();
  form.append("file", file);
  return request("/documents", { method: "POST", body: form });
}

export async function askQuestion(question: string): Promise<ChatResponse> {
  if (USE_MOCK) {
    await sleep(1200);
    if (question.toLowerCase().includes("quantum")) {
      return { answer: "", citations: [], sufficientEvidence: false };
    }
    return {
      answer:
        "Deadlock needs four conditions at the same time: mutual exclusion, hold and wait, no preemption, and circular wait.",
      citations: [
        {
          source: "OS Unit 3 - Deadlocks.pdf",
          page: 12,
          text: "A deadlock can arise only if four conditions hold simultaneously: mutual exclusion, hold and wait, no preemption, and circular wait.",
        },
        {
          source: "OS Unit 3 - Deadlocks.pdf",
          page: 13,
          text: "Circular wait: a set of processes P0...Pn exists such that each waits for a resource held by the next.",
        },
      ],
      sufficientEvidence: true,
    };
  }
  return request("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
}

export async function generateQuiz(topic: string): Promise<QuizQuestion[]> {
  if (USE_MOCK) {
    await sleep(800);
    return [
      {
        id: "q1",
        text: "Which is NOT a necessary condition for deadlock?",
        options: ["Mutual exclusion", "Hold and wait", "Preemption", "Circular wait"],
        concept: "Deadlock conditions",
        difficulty: "easy",
      },
    ];
  }
  return request("/quiz/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic }),
  });
}

export async function submitQuiz(answers: Record<string, string>): Promise<QuizResult> {
  if (USE_MOCK) {
    await sleep(600);
    return {
      score: 1,
      total: 1,
      feedback: [{ questionId: "q1", correct: true, explanation: "Preemption must NOT be possible for deadlock to occur." }],
    };
  }
  return request("/quiz/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers }),
  });
}

export async function getProgress(): Promise<Progress> {
  if (USE_MOCK) {
    await sleep(500);
    return {
      topics: [
        { name: "Deadlock conditions", mastery: 40 },
        { name: "Process scheduling", mastery: 75 },
        { name: "Memory management", mastery: 20 },
      ],
      recommendation: { action: "reteach", topic: "Memory management" },
    };
  }
  return request("/progress");
}