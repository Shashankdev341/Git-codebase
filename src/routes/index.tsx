import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Waves,
  Sparkles,
  Github,
  ArrowRight,
  Send,
  Bot,
  User,
  Network,
  Loader2,
  CheckCircle2,
  Database,
  Shield,
  Layers,
  Code2,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CodeSight — Simplifying the Unknown" },
      {
        name: "description",
        content:
          "Paste a GitHub URL and get an interactive architecture diagram plus an AI chat about the codebase.",
      },
      { property: "og:title", content: "CodeSight — AI Codebase Analyzer" },
      {
        property: "og:description",
        content: "Simplifying the Unknown. Explore any repo through diagrams and AI chat.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Stage = "landing" | "loading" | "dashboard";

type ChatMessage = {
  id: string;
  role: "user" | "ai";
  content: string;
};

const LOADING_STEPS = [
  { label: "Cloning repository...", icon: Github },
  { label: "Mapping file structures...", icon: Layers },
  { label: "Analyzing dependencies...", icon: Code2 },
  { label: "Generating architectural insights...", icon: Sparkles },
];

function Index() {
  const [stage, setStage] = useState<Stage>("landing");
  const [url, setUrl] = useState("");
  const [analyzedUrl, setAnalyzedUrl] = useState("");

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setAnalyzedUrl(url.trim());
    setStage("loading");
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      <AmbientBubbles />
      <Header />
      <main className="relative z-10">
        {stage === "landing" && (
          <Landing url={url} setUrl={setUrl} onSubmit={handleAnalyze} />
        )}
        {stage === "loading" && (
          <Loading url={analyzedUrl} onDone={() => setStage("dashboard")} />
        )}
        {stage === "dashboard" && <Dashboard url={analyzedUrl} />}
      </main>
    </div>
  );
}

function Header() {
  return (
    <header className="relative z-20 flex items-center justify-between px-6 py-5 md:px-10">
      <div className="flex items-center gap-2">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl glass">
          <Waves className="h-5 w-5 text-cyan-300" />
        </div>
        <span className="text-lg font-semibold tracking-tight text-white">
          Code<span className="text-cyan-300">Sight</span>
        </span>
      </div>
      <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
        <a className="transition hover:text-cyan-300" href="#">Docs</a>
        <a className="transition hover:text-cyan-300" href="#">Examples</a>
        <a className="transition hover:text-cyan-300" href="#">GitHub</a>
      </nav>
      <a
        href="#"
        className="glass hidden rounded-full px-4 py-2 text-sm text-white/90 transition hover:text-cyan-300 md:inline-flex"
      >
        100% Free
      </a>
    </header>
  );
}

function AmbientBubbles() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl animate-float" />
      <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-sky-400/10 blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
      <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-teal-400/10 blur-3xl animate-float" style={{ animationDelay: "3s" }} />
    </div>
  );
}

function Landing({
  url,
  setUrl,
  onSubmit,
}: {
  url: string;
  setUrl: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <section className="relative mx-auto flex min-h-[calc(100vh-88px)] max-w-5xl flex-col items-center justify-center px-6 py-16 text-center">
      <div className="glass mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-cyan-200">
        <Sparkles className="h-3.5 w-3.5" />
        AI-powered codebase analyzer · 100% free
      </div>

      <h1 className="text-crystal max-w-3xl text-5xl font-semibold tracking-tight md:text-7xl">
        Understand any codebase in seconds.
      </h1>
      <p className="mt-5 max-w-xl text-lg text-slate-300/90">
        Simplifying the Unknown. Paste a public GitHub URL and get an interactive
        architecture map with an AI that knows the whole repo.
      </p>

      <form onSubmit={onSubmit} className="mt-12 w-full max-w-2xl">
        <div className="glass group flex items-center gap-2 rounded-2xl p-2 transition focus-within:glow-cyan">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
            <Github className="h-5 w-5" />
          </div>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/vercel/next.js"
            className="flex-1 bg-transparent px-2 py-2 text-base text-white placeholder-slate-400 outline-none"
          />
          <button
            type="submit"
            className="group/btn relative inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-cyan-300 to-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.45)] transition hover:shadow-[0_0_40px_rgba(34,211,238,0.7)]"
          >
            Analyze
            <ArrowRight className="h-4 w-4 transition group-hover/btn:translate-x-0.5" />
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Try:{" "}
          <button
            type="button"
            onClick={() => setUrl("https://github.com/shadcn-ui/ui")}
            className="text-cyan-300 hover:underline"
          >
            shadcn-ui/ui
          </button>{" "}
          ·{" "}
          <button
            type="button"
            onClick={() => setUrl("https://github.com/vercel/next.js")}
            className="text-cyan-300 hover:underline"
          >
            vercel/next.js
          </button>
        </p>
      </form>

      <div className="mt-20 grid w-full max-w-4xl grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { icon: Network, title: "Architecture Diagrams", body: "Auto-generated Mermaid maps of your services." },
          { icon: Bot, title: "Repo-aware Chat", body: "Ask questions grounded in the whole codebase." },
          { icon: Shield, title: "Read-only & Private", body: "No writes, no storage. Just insights." },
        ].map((f) => (
          <div key={f.title} className="glass rounded-2xl p-5 text-left">
            <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300">
              <f.icon className="h-4.5 w-4.5" />
            </div>
            <h3 className="text-sm font-semibold text-white">{f.title}</h3>
            <p className="mt-1 text-sm text-slate-400">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Loading({ url, onDone }: { url: string; onDone: () => void }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const perStep = 3000 / LOADING_STEPS.length;
    const iv = setInterval(() => {
      setStep((s) => {
        if (s + 1 >= LOADING_STEPS.length) {
          clearInterval(iv);
          setTimeout(onDone, perStep);
          return s + 1;
        }
        return s + 1;
      });
    }, perStep);
    return () => clearInterval(iv);
  }, [onDone]);

  return (
    <section className="relative mx-auto flex min-h-[calc(100vh-88px)] max-w-2xl flex-col items-center justify-center px-6">
      <div className="glass w-full rounded-3xl p-8 md:p-10">
        <div className="flex items-center gap-3">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-cyan-400/10 animate-pulse-ring">
            <Loader2 className="h-5 w-5 animate-spin text-cyan-300" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-widest text-cyan-300/80">Analyzing</p>
            <p className="truncate text-sm text-slate-200">{url}</p>
          </div>
        </div>

        <div className="mt-8 space-y-3">
          {LOADING_STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            const pending = i > step;
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition duration-500 ${
                  active
                    ? "border-cyan-300/40 bg-cyan-400/5 opacity-100"
                    : done
                      ? "border-white/5 bg-white/[0.02] opacity-60"
                      : "border-white/5 bg-transparent opacity-30"
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                    done ? "bg-cyan-400/20 text-cyan-300" : active ? "bg-cyan-400/10 text-cyan-300" : "bg-white/5 text-slate-500"
                  }`}
                >
                  {done ? <CheckCircle2 className="h-4 w-4" /> : active ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
                </div>
                <span className={`text-sm ${active ? "text-white" : "text-slate-400"}`}>{s.label}</span>
              </div>
            );
          })}
        </div>

        <div className="relative mt-8 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-sky-500 transition-all duration-500"
            style={{ width: `${Math.min(100, ((step + (step >= LOADING_STEPS.length ? 0 : 0.5)) / LOADING_STEPS.length) * 100)}%` }}
          />
          <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        </div>
      </div>
    </section>
  );
}

function Dashboard({ url }: { url: string }) {
  return (
    <section className="relative mx-auto grid max-w-[1400px] gap-4 px-4 pb-10 md:grid-cols-[1.15fr_1fr] md:px-6">
      <div className="glass mb-2 flex items-center justify-between rounded-2xl px-5 py-3 md:col-span-2">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300">
            <Github className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-cyan-300/80">Analyzed repository</p>
            <p className="truncate text-sm text-white">{url}</p>
          </div>
        </div>
        <span className="hidden items-center gap-1.5 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200 md:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.9)]" />
          Live analysis
        </span>
      </div>

      <ArchitecturePanel />
      <ChatPanel />
    </section>
  );
}

function ArchitecturePanel() {
  return (
    <div className="glass flex h-[70vh] min-h-[520px] flex-col rounded-3xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4 text-cyan-300" />
          <h2 className="text-sm font-semibold text-white">Architecture Map</h2>
        </div>
        <span className="text-xs text-slate-400">Mermaid.js placeholder</span>
      </div>

      <div className="relative flex-1 overflow-hidden rounded-2xl border border-white/5 bg-slate-950/40">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(34,211,238,0.25) 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
        <ArchitectureGraph />
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {[
          { label: "Files", value: "1,284" },
          { label: "Modules", value: "48" },
          { label: "Services", value: "6" },
          { label: "Depth", value: "5" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2">
            <p className="text-[10px] uppercase tracking-wider text-slate-400">{s.label}</p>
            <p className="text-sm font-semibold text-white">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ArchitectureGraph() {
  const nodes = [
    { id: "fe", label: "Frontend", icon: Layers, x: 12, y: 18, color: "cyan" },
    { id: "api", label: "API Gateway", icon: Code2, x: 50, y: 12, color: "sky" },
    { id: "auth", label: "Auth", icon: Shield, x: 84, y: 30, color: "teal" },
    { id: "svc", label: "Services", icon: Sparkles, x: 30, y: 58, color: "cyan" },
    { id: "db", label: "Database", icon: Database, x: 70, y: 72, color: "sky" },
  ] as const;

  const edges: [string, string][] = [
    ["fe", "api"],
    ["api", "auth"],
    ["api", "svc"],
    ["svc", "db"],
    ["auth", "db"],
  ];

  const pos = Object.fromEntries(nodes.map((n) => [n.id, n])) as Record<string, (typeof nodes)[number]>;

  return (
    <div className="relative h-full w-full">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="edge" x1="0" x2="1">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.4" />
          </linearGradient>
        </defs>
        {edges.map(([a, b], i) => {
          const p1 = pos[a];
          const p2 = pos[b];
          return (
            <line
              key={i}
              x1={p1.x + 6}
              y1={p1.y + 4}
              x2={p2.x + 6}
              y2={p2.y + 4}
              stroke="url(#edge)"
              strokeWidth={0.3}
              strokeDasharray="1 1"
            />
          );
        })}
      </svg>

      {nodes.map((n) => (
        <div
          key={n.id}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${n.x + 6}%`, top: `${n.y + 4}%` }}
        >
          <div className="glass flex items-center gap-2 rounded-xl px-3 py-2 shadow-[0_0_24px_rgba(34,211,238,0.15)]">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-400/15 text-cyan-300">
              <n.icon className="h-3.5 w-3.5" />
            </div>
            <span className="text-xs font-medium text-white">{n.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "ai",
      content:
        "Analysis complete. I've mapped the architecture. What would you like to know about this codebase?",
    },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setInput("");

    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "ai",
          content:
            "Based on the mapped architecture, this repo follows a layered service pattern — the API gateway routes traffic to auth and the core services, which persist state in the database. Ask about a specific module for deeper detail.",
        },
      ]);
    }, 900);
  };

  const suggestions = [
    "Explain the auth flow",
    "What does the API layer do?",
    "Show hotspots for refactoring",
  ];

  return (
    <div className="glass flex h-[70vh] min-h-[520px] flex-col rounded-3xl">
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-cyan-300" />
          <h2 className="text-sm font-semibold text-white">Codebase Chat</h2>
        </div>
        <span className="text-xs text-slate-400">Grounded in repo context</span>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {messages.map((m) => (
          <Message key={m.id} message={m} />
        ))}
      </div>

      <div className="border-t border-white/5 p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => setInput(s)}
              className="glass rounded-full px-3 py-1 text-xs text-slate-300 transition hover:text-cyan-300"
            >
              {s}
            </button>
          ))}
        </div>
        <form onSubmit={send} className="glass flex items-center gap-2 rounded-2xl p-2 focus-within:glow-cyan">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about this codebase..."
            className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder-slate-400 outline-none"
          />
          <button
            type="submit"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-300 to-sky-500 text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.5)] transition hover:shadow-[0_0_30px_rgba(34,211,238,0.8)]"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

function Message({ message }: { message: ChatMessage }) {
  const isAI = message.role === "ai";
  return (
    <div className={`flex gap-3 ${isAI ? "" : "flex-row-reverse"}`}>
      <div
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
          isAI ? "bg-cyan-400/15 text-cyan-300" : "bg-white/10 text-white"
        }`}
      >
        {isAI ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
      </div>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isAI
            ? "border border-cyan-300/20 bg-cyan-500/10 text-slate-100"
            : "glass text-white"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
}
