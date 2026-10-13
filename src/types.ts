export type DocStatus = "uploading" | "processing" | "ready" | "failed";

export interface DocumentItem {
  id: string;
  name: string;
  status: DocStatus;
}

export interface Citation {
  source: string;
  page?: number;
  slide?: number;
  timestamp?: string;
  text: string;
}

export interface ChatResponse {
  answer: string;
  citations: Citation[];
  sufficientEvidence: boolean;
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  concept: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface QuizResult {
  score: number;
  total: number;
  feedback: { questionId: string; correct: boolean; explanation: string }[];
}

export type Recommendation = "reteach" | "practice" | "revise" | "advance";

export interface Progress {
  topics: { name: string; mastery: number }[]; // 0-100
  recommendation: { action: Recommendation; topic: string };
}