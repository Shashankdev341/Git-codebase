import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Mermaid } from "mermaid";
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
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  FileImage,
  FileCode2,
  Pencil,
  Play,
  RotateCcw,
  X,
  History,
  Save,
  Trash2,
  Undo2,
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
  const [chart, setChart] = useState<string>(ARCHITECTURE_CHART);
  const [draft, setDraft] = useState<string>(ARCHITECTURE_CHART);
  const [editorOpen, setEditorOpen] = useState(false);
  const [liveEdit, setLiveEdit] = useState(true);

  // Debounced live rerender
  useEffect(() => {
    if (!liveEdit) return;
    const t = setTimeout(() => setChart(draft), 400);
    return () => clearTimeout(t);
  }, [draft, liveEdit]);

  return (
    <div className="glass flex h-[70vh] min-h-[520px] flex-col rounded-3xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4 text-cyan-300" />
          <h2 className="text-sm font-semibold text-white">Architecture Map</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-slate-400 sm:inline">Rendered with Mermaid.js</span>
          <button
            onClick={() => setEditorOpen((v) => !v)}
            className={`glass inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition ${
              editorOpen ? "text-cyan-300 glow-cyan" : "text-slate-200 hover:text-cyan-300"
            }`}
          >
            <Pencil className="h-3.5 w-3.5" />
            {editorOpen ? "Close editor" : "Edit code"}
          </button>
        </div>
      </div>

      <div className={`grid flex-1 min-h-0 gap-3 ${editorOpen ? "md:grid-cols-[1fr_1fr]" : "grid-cols-1"}`}>
        {editorOpen && (
          <MermaidEditor
            value={draft}
            onChange={setDraft}
            liveEdit={liveEdit}
            setLiveEdit={setLiveEdit}
            onApply={() => setChart(draft)}
            onReset={() => {
              setDraft(ARCHITECTURE_CHART);
              setChart(ARCHITECTURE_CHART);
            }}
            onClose={() => setEditorOpen(false)}
          />
        )}
        <MermaidDiagram chart={chart} />
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

function MermaidEditor({
  value,
  onChange,
  liveEdit,
  setLiveEdit,
  onApply,
  onReset,
  onClose,
}: {
  value: string;
  onChange: (v: string) => void;
  liveEdit: boolean;
  setLiveEdit: (v: boolean) => void;
  onApply: () => void;
  onReset: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-white/5 bg-slate-950/60">
      <div className="flex items-center justify-between border-b border-white/5 px-3 py-2">
        <div className="flex items-center gap-2">
          <FileCode2 className="h-3.5 w-3.5 text-cyan-300" />
          <span className="text-xs font-semibold text-white">Mermaid source</span>
        </div>
        <button
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-white/5 hover:text-cyan-300"
          aria-label="Close editor"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className="flex-1 resize-none bg-transparent px-3 py-3 font-mono text-[12px] leading-relaxed text-slate-100 outline-none placeholder-slate-500"
        placeholder="graph TD&#10;  A --> B"
      />
      <div className="flex items-center justify-between gap-2 border-t border-white/5 px-3 py-2">
        <label className="flex items-center gap-1.5 text-[11px] text-slate-300">
          <input
            type="checkbox"
            checked={liveEdit}
            onChange={(e) => setLiveEdit(e.target.checked)}
            className="h-3 w-3 accent-cyan-400"
          />
          Live rerender
        </label>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] text-slate-300 transition hover:border-cyan-300/30 hover:text-cyan-300"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
          <button
            onClick={onApply}
            disabled={liveEdit}
            className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-br from-cyan-300 to-sky-500 px-2.5 py-1.5 text-[11px] font-semibold text-slate-950 shadow-[0_0_16px_rgba(34,211,238,0.4)] transition hover:shadow-[0_0_24px_rgba(34,211,238,0.65)] disabled:opacity-40 disabled:shadow-none"
          >
            <Play className="h-3 w-3" />
            Rerender
          </button>
        </div>
      </div>
    </div>
  );
}

const ARCHITECTURE_CHART = `graph TD
  U([User])
  FE[Frontend<br/>Next.js + React]
  API{{API Gateway}}
  AUTH[Auth Service]
  SVC[Core Services]
  AI[AI Analyzer]
  CACHE[(Redis Cache)]
  DB[(PostgreSQL)]

  U --> FE
  FE --> API
  API --> AUTH
  API --> SVC
  API --> AI
  SVC --> CACHE
  SVC --> DB
  AUTH --> DB
  AI --> CACHE

  classDef entry fill:#0e7490,stroke:#22d3ee,stroke-width:2px,color:#ecfeff;
  classDef service fill:#0c4a6e,stroke:#38bdf8,stroke-width:1.5px,color:#e0f2fe;
  classDef data fill:#164e63,stroke:#67e8f9,stroke-width:1.5px,color:#ecfeff;
  classDef ai fill:#155e75,stroke:#22d3ee,stroke-width:2px,color:#cffafe;

  class U,FE entry;
  class API,AUTH,SVC service;
  class DB,CACHE data;
  class AI ai;
`;

let mermaidInitialized = false;
let mermaidPromise: Promise<Mermaid> | null = null;
async function getMermaid(): Promise<Mermaid> {
  if (!mermaidPromise) {
    mermaidPromise = import("mermaid").then((m) => m.default);
  }
  const mermaid = await mermaidPromise;
  if (mermaidInitialized) return mermaid;
  mermaid.initialize({
    startOnLoad: false,
    theme: "base",
    securityLevel: "loose",
    fontFamily: "inherit",
    themeVariables: {
      background: "transparent",
      primaryColor: "#0c4a6e",
      primaryTextColor: "#e0f2fe",
      primaryBorderColor: "#22d3ee",
      lineColor: "#22d3ee",
      secondaryColor: "#155e75",
      tertiaryColor: "#082f49",
      textColor: "#e2e8f0",
      mainBkg: "#0c4a6e",
      nodeBorder: "#22d3ee",
      clusterBkg: "rgba(15,23,42,0.4)",
      clusterBorder: "rgba(34,211,238,0.3)",
      edgeLabelBackground: "rgba(2,6,23,0.8)",
    },
    flowchart: {
      curve: "basis",
      padding: 20,
      htmlLabels: true,
    },
  });
  mermaidInitialized = true;
  return mermaid;
}

function MermaidDiagram({ chart }: { chart: string }) {
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const id = useMemo(() => `mmd-${Math.random().toString(36).slice(2)}`, []);

  useEffect(() => {
    let cancelled = false;
    getMermaid()
      .then((mermaid) => mermaid.render(id, chart))
      .then(({ svg }: { svg: string }) => {
        if (!cancelled) setSvg(svg);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  const onMouseDown = (e: React.MouseEvent) => {
    dragRef.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current) return;
    setPan({
      x: dragRef.current.px + (e.clientX - dragRef.current.x),
      y: dragRef.current.py + (e.clientY - dragRef.current.y),
    });
  };
  const endDrag = () => {
    dragRef.current = null;
  };
  const reset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const [exportOpen, setExportOpen] = useState(false);

  const buildExportSvg = (): string | null => {
    if (!svg) return null;
    // Ensure xmlns is present and background is set for downloaded file
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, "image/svg+xml");
    const svgEl = doc.documentElement as unknown as SVGSVGElement;
    svgEl.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    if (!svgEl.getAttribute("xmlns:xlink")) {
      svgEl.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
    }
    // Add a solid dark background rect so PNG exports aren't transparent
    const viewBox = svgEl.getAttribute("viewBox");
    let w = svgEl.getAttribute("width") ?? "";
    let h = svgEl.getAttribute("height") ?? "";
    if (viewBox) {
      const [, , vw, vh] = viewBox.split(/\s+/).map(Number);
      if (!w) w = String(vw);
      if (!h) h = String(vh);
      svgEl.setAttribute("width", String(vw));
      svgEl.setAttribute("height", String(vh));
    }
    const bg = doc.createElementNS("http://www.w3.org/2000/svg", "rect");
    bg.setAttribute("width", "100%");
    bg.setAttribute("height", "100%");
    bg.setAttribute("fill", "#020617");
    svgEl.insertBefore(bg, svgEl.firstChild);
    return new XMLSerializer().serializeToString(svgEl);
  };

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const exportSvg = () => {
    const out = buildExportSvg();
    if (!out) return;
    triggerDownload(new Blob([out], { type: "image/svg+xml" }), "architecture.svg");
    setExportOpen(false);
  };

  const exportPng = async () => {
    const out = buildExportSvg();
    if (!out) return;
    const svgBlob = new Blob([out], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("image load failed"));
        img.src = url;
      });
      const scale = 2;
      const w = (img.naturalWidth || 1200) * scale;
      const h = (img.naturalHeight || 800) * scale;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => {
        if (blob) triggerDownload(blob, "architecture.png");
      }, "image/png");
    } finally {
      URL.revokeObjectURL(url);
      setExportOpen(false);
    }
  };

  return (
    <div className="relative flex-1 overflow-hidden rounded-2xl border border-white/5 bg-slate-950/40">
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(34,211,238,0.25) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />

      <div
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
      >
        <div
          className="flex h-full w-full items-center justify-center transition-transform duration-75 [&_svg]:!max-w-none [&_svg]:h-auto [&_svg]:w-auto"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>

      {error && (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-xs text-red-300">
          Failed to render diagram: {error}
        </div>
      )}

      {!svg && !error && (
        <div className="absolute inset-0 flex items-center justify-center gap-2 text-xs text-slate-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Rendering diagram...
        </div>
      )}

      <div className="glass absolute bottom-3 right-3 flex items-center gap-1 rounded-xl p-1">
        <button
          onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 hover:bg-white/5 hover:text-cyan-300"
          aria-label="Zoom out"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </button>
        <span className="w-10 text-center text-[10px] tabular-nums text-slate-400">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom((z) => Math.min(3, z + 0.15))}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 hover:bg-white/5 hover:text-cyan-300"
          aria-label="Zoom in"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={reset}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 hover:bg-white/5 hover:text-cyan-300"
          aria-label="Reset view"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="absolute right-3 top-3">
        <div className="relative">
          <button
            onClick={() => setExportOpen((v) => !v)}
            disabled={!svg}
            className="glass inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 transition hover:text-cyan-300 disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
          {exportOpen && (
            <div className="glass-strong absolute right-0 top-full mt-2 w-44 overflow-hidden rounded-xl border border-white/10 py-1 text-xs shadow-xl">
              <button
                onClick={exportSvg}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-slate-200 transition hover:bg-cyan-400/10 hover:text-cyan-300"
              >
                <FileCode2 className="h-3.5 w-3.5" />
                Download SVG
              </button>
              <button
                onClick={exportPng}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-slate-200 transition hover:bg-cyan-400/10 hover:text-cyan-300"
              >
                <FileImage className="h-3.5 w-3.5" />
                Download PNG (2x)
              </button>
            </div>
          )}
        </div>
      </div>
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
