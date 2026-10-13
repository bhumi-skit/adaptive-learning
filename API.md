# API Contract (frontend <-> backend)

Base URL: http://localhost:8000
CORS: allow http://localhost:5173 (dev) and http://localhost:3000 (Docker)
All responses are JSON. Field names are camelCase exactly as written below.
Errors: any non-2xx status, with body { "error": "message" }

## GET /documents
Response: [{ "id": "1", "name": "OS Unit 3.pdf", "status": "ready" }]
status is one of: "uploading" | "processing" | "ready" | "failed"
The UI polls this every 4 seconds while any file is processing.

## POST /documents
Request: multipart/form-data, field name "file"
Allowed: .pdf .pptx .docx .mp4 .mp3, max 50 MB
Response: { "id": "abc", "name": "OS Unit 3.pdf", "status": "processing" }

## POST /chat
Request: { "question": "What are the four conditions for deadlock?" }
Response:
{
  "answer": "Deadlock needs four conditions...",
  "citations": [
    { "source": "OS Unit 3.pdf", "page": 12, "text": "exact chunk text" }
  ],
  "sufficientEvidence": true
}
- Citation has page OR slide OR timestamp (e.g. "03:42"), plus source and text.
- Citations must come from retrieved chunk metadata, never from the LLM.
- If evidence is weak: { "answer": "", "citations": [], "sufficientEvidence": false }

## POST /quiz/generate
Request: { "topic": "Deadlock conditions" }
Response:
[
  {
    "id": "q1",
    "text": "Which is NOT a necessary condition for deadlock?",
    "options": ["Mutual exclusion", "Hold and wait", "Preemption", "Circular wait"],
    "concept": "Deadlock conditions",
    "difficulty": "easy"
  }
]
difficulty is one of: "easy" | "medium" | "hard"
Do NOT include the correct answer in this response.

## POST /quiz/submit
Request: { "answers": { "q1": "Preemption", "q2": "Circular wait" } }
(keys are question ids, values are the selected option text)
Response:
{
  "score": 2,
  "total": 3,
  "feedback": [
    { "questionId": "q1", "correct": true, "explanation": "..." }
  ]
}
Backend updates the learner's mastery per concept when this is called.

## GET /progress
Response:
{
  "topics": [{ "name": "Deadlock conditions", "mastery": 40 }],
  "recommendation": { "action": "reteach", "topic": "Memory management" }
}
mastery is 0-100.
action is one of: "reteach" | "practice" | "revise" | "advance"