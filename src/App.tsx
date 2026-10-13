import { NavLink, Route, Routes, Navigate } from "react-router-dom";
import Library from "./pages/Library";
import Chat from "./pages/Chat";
import Quiz from "./pages/Quiz";
import Dashboard from "./pages/Dashboard";

const links = [
  { to: "/library", label: "Library" },
  { to: "/chat", label: "Tutor" },
  { to: "/quiz", label: "Quiz" },
  { to: "/dashboard", label: "Progress" },
];

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <nav className="flex items-center gap-6 border-b bg-white px-6 py-3">
        <span className="font-bold text-indigo-600">AdaptiveLearn</span>
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              isActive ? "font-medium text-indigo-600" : "text-slate-500 hover:text-slate-900"
            }
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
      <main className="mx-auto max-w-4xl p-6">
        <Routes>
          <Route path="/" element={<Navigate to="/chat" replace />} />
          <Route path="/library" element={<Library />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </main>
    </div>
  );
}