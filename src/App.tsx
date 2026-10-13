import { useState } from "react";
import { NavLink, Route, Routes, Navigate } from "react-router-dom";
import { USE_MOCK } from "./api";
import Library from "./pages/Library";
import Chat from "./pages/Chat";
import Quiz from "./pages/Quiz";
import Dashboard from "./pages/Dashboard";
import {
  BrainIcon,
  BookOpenIcon,
  MessageSquareIcon,
  GraduationCapIcon,
  BarChartIcon,
  MenuIcon,
  XIcon,
} from "./components/Icons";

const links = [
  { to: "/chat", label: "AI Tutor", icon: MessageSquareIcon },
  { to: "/library", label: "Library", icon: BookOpenIcon },
  { to: "/quiz", label: "Quiz", icon: GraduationCapIcon },
  { to: "/dashboard", label: "Progress", icon: BarChartIcon },
];

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      {/* Demo Mode Banner */}
      {USE_MOCK && (
        <div className="bg-gradient-to-r from-amber-50 via-amber-100 to-amber-50 border-b border-amber-200/70 px-4 py-1.5 text-xs text-amber-900 text-center font-medium flex items-center justify-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span>Demo mode active · Simulated RAG retrieval & learner model (VITE_USE_MOCK=true)</span>
        </div>
      )}

      {/* Main Navigation Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            {/* Brand Logo */}
            <NavLink
              to="/chat"
              className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              aria-label="AdaptiveLearn Home"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-200">
                <BrainIcon className="h-5 w-5" />
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-slate-900">AdaptiveLearn</span>
                <span className="hidden sm:inline-block ml-2 text-xs font-medium text-slate-500">
                  RAG Tutor + Assessment
                </span>
              </div>
            </NavLink>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1.5" aria-label="Main Navigation">
              {links.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                      isActive
                        ? "bg-indigo-50 text-indigo-700 shadow-xs ring-1 ring-indigo-200/60"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>

            {/* Mobile Hamburger Button */}
            <div className="md:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                aria-expanded={mobileMenuOpen}
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <nav
            className="border-b border-slate-200 bg-white px-4 py-3 md:hidden space-y-1 shadow-md"
            aria-label="Mobile Navigation"
          >
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200/60"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 sm:px-6 py-6 sm:py-8">
        <Routes>
          <Route path="/" element={<Navigate to="/chat" replace />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/library" element={<Library />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </main>
    </div>
  );
}