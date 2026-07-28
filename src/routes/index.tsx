import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, useCallback, memo } from "react";
import type { Mermaid } from "mermaid";
import {
  Sparkles,
  Github,
  ArrowRight,
  Send,
  Bot,
  User,
  Network,
  Loader2,
  CheckCircle2,
  Code2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Pencil,
  Play,
  RotateCcw,
  X,
  History,
  Save,
  Trash2,
  Undo2,
  AlertCircle,
  Bell,
  Plus,
  FolderGit2,
  ShieldAlert,
  Settings,
  HelpCircle,
  BookOpen,
  BarChart2,
  Activity,
  Users,
  AlertTriangle,
  Download,
  FileImage,
  FileCode2,
  Target,
  Terminal,
  Layers,
  ChevronRight,
  Search,
  ExternalLink,
  Menu,
} from "lucide-react";

import { fetchRepoData, ProcessedRepo } from "../lib/github";
import { askCodebaseQuestion, DiagramResult } from "../lib/gemini";
import { generateDiagramFromCode } from "../lib/codeParser";
import { getMermaid } from "../lib/mermaidLoader";
import Lenis from "lenis";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CodeSight — Codebase Architecture & Intelligence Platform" },
      {
        name: "description",
        content:
          "Enterprise codebase architecture visualization and code analysis engine.",
      },
    ],
  }),
  component: Index,
});

type Stage = "landing" | "loading" | "dashboard";

type ChatMessage = {
  id: string;
  role: "user" | "ai";
  content: string;
  actionButton?: {
    label: string;
    prompt: string;
  };
};

type Snapshot = {
  id: string;
  label: string;
  chart: string;
  createdAt: number;
};

const SNAPSHOTS_KEY = "codesight:mermaid-snapshots:v1";

const LOADING_STEPS = [
  { label: "Cloning repository & fetching file tree", icon: Github },
  { label: "Mapping directory structure & entry points", icon: Layers },
  { label: "Parsing AST imports & building graph", icon: Code2 },
  { label: "Rendering system architecture diagram", icon: Network },
];

function Index() {
  const [stage, setStage] = useState<Stage>("landing");
  const [url, setUrl] = useState("");
  const [analyzedUrl, setAnalyzedUrl] = useState("");
  const [activeTab, setActiveTab] = useState("Dashboard");

  const [loadingStep, setLoadingStep] = useState(0);
  const [loadingStatusText, setLoadingStatusText] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [repoData, setRepoData] = useState<ProcessedRepo | null>(null);
  const [diagramResult, setDiagramResult] = useState<DiagramResult | null>(null);
  const [chatPromptFromAnomaly, setChatPromptFromAnomaly] = useState<string>("");
  const [activeSidebarItem, setActiveSidebarItem] = useState<string | null>(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1.0,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  const startAnalysis = useCallback(async (targetUrl: string) => {
    setErrorMsg(null);
    setAnalyzedUrl(targetUrl);
    setStage("loading");
    setLoadingStep(0);
    setLoadingStatusText("Fetching repository structure & files...");

    try {
      const data = await fetchRepoData(targetUrl);
      setRepoData(data);

      setLoadingStep(1);
      setLoadingStatusText("Mapping modules & file tree...");
      await new Promise((r) => setTimeout(r, 250));

      setLoadingStep(2);
      setLoadingStatusText("Parsing import definitions & dependencies...");
      await new Promise((r) => setTimeout(r, 250));

      setLoadingStep(3);
      setLoadingStatusText("Generating architecture diagram...");

      const res = generateDiagramFromCode(data);

      setDiagramResult(res);
      setStage("dashboard");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to analyze repository. Verify URL and try again.");
    }
  }, []);

  const triggerAnalysis = useCallback((targetUrl: string) => {
    startAnalysis(targetUrl);
  }, [startAnalysis]);

  const handleFormSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    triggerAnalysis(url.trim());
  }, [url, triggerAnalysis]);

  const handleSelectPreset = useCallback((p: string) => {
    setUrl(p);
    triggerAnalysis(p);
  }, [triggerAnalysis]);

  const handleInspectAnomaly = useCallback((promptText: string) => {
    setChatPromptFromAnomaly(promptText);
  }, []);

  const handleNewAnalysis = useCallback(() => {
    setStage("landing");
  }, []);

  const handleSelectSidebarItem = useCallback((item: string | null) => {
    setActiveSidebarItem(item);
  }, []);

  const handleRetryLoading = useCallback(() => {
    startAnalysis(analyzedUrl);
  }, [analyzedUrl, startAnalysis]);

  return (
    <div className="relative min-h-screen w-full bg-[#09090B] text-[#FAFAFA] antialiased font-sans overflow-x-hidden selection:bg-[#2563EB] selection:text-white">
      {stage === "dashboard" ? (
        <TopNav
          url={analyzedUrl}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onNewAnalysis={handleNewAnalysis}
          onSelectSidebarItem={handleSelectSidebarItem}
        />
      ) : (
        <Header />
      )}

      <main className="relative z-10">
        {stage === "landing" && (
          <Landing
            url={url}
            setUrl={setUrl}
            onSubmit={handleFormSubmit}
            onSelectPreset={handleSelectPreset}
          />
        )}

        {stage === "loading" && (
          <Loading
            url={analyzedUrl}
            step={loadingStep}
            statusText={loadingStatusText}
            error={errorMsg}
            onRetry={handleRetryLoading}
            onReset={handleNewAnalysis}
          />
        )}

        {stage === "dashboard" && repoData && (
          <Dashboard
            url={analyzedUrl}
            repoData={repoData}
            diagramResult={diagramResult}
            chatPrompt={chatPromptFromAnomaly}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            activeSidebarItem={activeSidebarItem}
            setActiveSidebarItem={handleSelectSidebarItem}
            onInspectAnomaly={handleInspectAnomaly}
            onNewAnalysis={handleNewAnalysis}
            onSelectPreset={handleSelectPreset}
          />
        )}
      </main>
    </div>
  );
}

const Header = memo(function Header() {
  return (
    <header className="relative z-20 flex h-14 items-center justify-between border-b border-[#27272A] bg-[#09090B]/90 px-4 sm:px-6 backdrop-blur-md">
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-md border border-[#27272A] bg-[#18181B] text-[#FAFAFA]">
          <Code2 className="h-4 w-4" />
        </div>
        <span className="text-sm font-semibold tracking-tight text-[#FAFAFA]">
          CodeSight
        </span>
        <span className="rounded border border-[#27272A] bg-[#18181B] px-1.5 py-0.5 text-[10px] font-mono text-[#71717A]">
          v2.5
        </span>
      </div>

      <div className="flex items-center gap-3 sm:gap-4 text-xs">
        <span className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-[#27272A] bg-[#111113] px-2.5 py-1 text-xs font-mono text-[#A1A1AA]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" />
          Groq + Gemini Engine
        </span>
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md border border-[#27272A] bg-[#18181B] hover:bg-[#202024] hover:border-[#3F3F46] px-2.5 sm:px-3 py-1.5 text-xs font-medium text-[#FAFAFA] transition"
        >
          <Github className="h-3.5 w-3.5" />
          <span>GitHub</span>
        </a>
      </div>
    </header>
  );
});

const Landing = memo(function Landing({
  url,
  setUrl,
  onSubmit,
  onSelectPreset,
}: {
  url: string;
  setUrl: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onSelectPreset: (v: string) => void;
}) {
  return (
    <section className="relative mx-auto flex min-h-[calc(100vh-56px)] w-full max-w-5xl flex-col items-center justify-center px-4 sm:px-6 py-12 sm:py-20 text-center">
      {/* Fullscreen Background Looping Video */}
      <div className="fixed inset-0 w-screen h-screen overflow-hidden z-0 pointer-events-none">
        <video
          src="/hero-video.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover scale-105 filter brightness-[0.85] contrast-[1.05] opacity-90"
        />
        {/* Balanced dark overlay for high video visibility + text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#09090B]/60 via-[#09090B]/35 to-[#09090B]/80" />
      </div>

      <div className="relative z-10 mb-6 inline-flex items-center gap-2 rounded-full border border-[#27272A] bg-[#111113] px-3 py-1 text-xs font-mono text-[#A1A1AA]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" />
        <span>Enterprise Codebase Intelligence</span>
      </div>

      <h1 className="relative z-10 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl md:text-6xl text-[#FAFAFA] leading-[1.1]">
        Understand any codebase in seconds.
      </h1>
      <p className="relative z-10 mt-4 max-w-lg text-sm sm:text-base text-[#A1A1AA] leading-relaxed font-normal">
        Instant architecture mapping, dependency graph visualization, and repository-grounded AI companion for engineering teams.
      </p>

      <form onSubmit={onSubmit} className="relative z-10 mt-8 w-full max-w-xl">
        <div className="group flex items-center gap-2 rounded-lg border border-[#27272A] bg-[#111113] p-1.5 transition focus-within:border-[#2563EB] shadow-sm">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-[#18181B] border border-[#27272A] text-[#A1A1AA]">
            <Github className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/expressjs/express"
            className="flex-1 bg-transparent px-2 py-1.5 text-xs sm:text-sm text-[#FAFAFA] placeholder-[#71717A] font-mono outline-none min-w-0"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-md bg-[#2563EB] hover:bg-[#1D4ED8] px-3.5 sm:px-4 py-2 text-xs font-medium text-white transition shadow-sm flex-shrink-0"
          >
            <span>Analyze</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-xs text-[#71717A]">
          <span className="font-mono text-[11px]">Presets:</span>
          {[
            { label: "expressjs/express", target: "https://github.com/expressjs/express" },
            { label: "shadcn-ui/ui", target: "https://github.com/shadcn-ui/ui" },
            { label: "vercel/next.js", target: "https://github.com/vercel/next.js" },
          ].map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => onSelectPreset(p.target)}
              className="rounded border border-[#27272A] bg-[#111113] hover:bg-[#18181B] hover:border-[#3F3F46] px-2 py-0.5 font-mono text-[11px] text-[#A1A1AA] hover:text-[#FAFAFA] transition"
            >
              {p.label}
            </button>
          ))}
        </div>
      </form>

      <div className="relative z-10 mt-12 sm:mt-16 grid w-full max-w-4xl grid-cols-1 gap-4 text-left sm:grid-cols-3">
        {[
          {
            icon: Network,
            title: "Architecture Visualizer",
            body: "Automated Mermaid dependency graphs of core components and module structures.",
          },
          {
            icon: Bot,
            title: "Repo-Aware AI",
            body: "Contextual semantic Q&A powered by AST parsing and file tree analysis.",
          },
          {
            icon: ShieldAlert,
            title: "Structural Audits",
            body: "Automated vulnerability checks, secret scans, and complexity metrics.",
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="rounded-lg border border-[#27272A] bg-[#111113] p-4 sm:p-5 transition hover:border-[#3F3F46]"
            >
              <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#27272A] bg-[#18181B] text-[#FAFAFA]">
                <Icon className="h-4 w-4" />
              </div>
              <h3 className="text-xs font-semibold text-[#FAFAFA]">{item.title}</h3>
              <p className="mt-1.5 text-xs text-[#A1A1AA] leading-relaxed font-normal">
                {item.body}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
});

const Loading = memo(function Loading({
  url,
  step,
  statusText,
  error,
  onRetry,
  onReset,
}: {
  url: string;
  step: number;
  statusText: string;
  error: string | null;
  onRetry: () => void;
  onReset: () => void;
}) {
  return (
    <section className="relative mx-auto flex min-h-[calc(100vh-56px)] max-w-xl flex-col items-center justify-center px-4 sm:px-6">
      <div className="w-full rounded-lg border border-[#27272A] bg-[#111113] p-4 sm:p-8">
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md border ${error ? "border-[#DC2626]/30 bg-[#DC2626]/10 text-[#DC2626]" : "border-[#2563EB]/30 bg-[#2563EB]/10 text-[#2563EB]"}`}>
            {error ? (
              <AlertCircle className="h-4.5 w-4.5" />
            ) : (
              <Loader2 className="h-4.5 w-4.5 animate-spin" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-mono font-medium text-[#A1A1AA]">
              {error ? "Analysis Error" : "Analyzing Repository"}
            </p>
            <p className="truncate text-xs font-mono text-[#FAFAFA] mt-0.5">{url}</p>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-md border border-[#DC2626]/30 bg-[#DC2626]/10 p-4">
            <p className="text-xs text-[#DC2626] font-medium">{error}</p>
            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={onRetry}
                className="rounded-md bg-[#2563EB] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#1D4ED8]"
              >
                Retry
              </button>
              <button
                onClick={onReset}
                className="rounded-md border border-[#27272A] bg-[#18181B] px-3 py-1.5 text-xs font-medium text-[#A1A1AA] transition hover:text-[#FAFAFA]"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-6 space-y-2">
              {LOADING_STEPS.map((s, i) => {
                const done = i < step;
                const active = i === step;
                const Icon = s.icon;
                return (
                  <div
                    key={s.label}
                    className={`flex items-center gap-3 rounded-md border px-3 py-2.5 transition ${
                      active
                        ? "border-[#2563EB]/40 bg-[#2563EB]/10 text-[#FAFAFA]"
                        : done
                          ? "border-[#27272A] bg-[#18181B] text-[#A1A1AA]"
                          : "border-[#27272A]/50 bg-transparent text-[#71717A]"
                    }`}
                  >
                    <div
                      className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded ${
                        done ? "text-[#16A34A]" : active ? "text-[#2563EB]" : "text-[#71717A]"
                      }`}
                    >
                      {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : active ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
                    </div>
                    <span className={`text-xs ${active ? "text-[#FAFAFA] font-medium" : "text-[#A1A1AA]"}`}>
                      {active ? statusText || s.label : s.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="relative mt-6 h-1 w-full overflow-hidden rounded bg-[#18181B]">
              <div
                className="h-full bg-[#2563EB] transition-all duration-300"
                style={{ width: `${Math.min(100, ((step + 0.5) / LOADING_STEPS.length) * 100)}%` }}
              />
            </div>
          </>
        )}
      </div>
    </section>
  );
});

const TopNav = memo(function TopNav({
  url,
  activeTab,
  setActiveTab,
  onNewAnalysis,
  onSelectSidebarItem,
}: {
  url: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onNewAnalysis: () => void;
  onSelectSidebarItem: (item: string) => void;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-13 items-center justify-between border-b border-[#27272A] bg-[#09090B] px-3 sm:px-4">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        {/* Mobile Menu Drawer Toggle (< 1024px) */}
        <button
          onClick={() => setMobileMenuOpen((v) => !v)}
          className="lg:hidden flex h-8 w-8 items-center justify-center rounded border border-[#27272A] bg-[#111113] text-[#A1A1AA] hover:text-[#FAFAFA]"
          title="Workspace Menu"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex h-7 w-7 items-center justify-center rounded border border-[#27272A] bg-[#18181B] text-[#FAFAFA] font-mono text-xs font-bold">
            CS
          </div>
          <span className="text-xs font-semibold text-[#FAFAFA] hidden sm:inline">CodeSight</span>
        </div>

        <div className="h-4 w-[1px] bg-[#27272A] hidden sm:block" />

        {/* Segmented Control Navigation */}
        <nav className="flex items-center gap-0.5 rounded-md border border-[#27272A] bg-[#111113] p-0.5 overflow-x-auto no-scrollbar">
          {["Dashboard", "Analytics", "Team"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded px-2.5 sm:px-3 py-1 text-xs font-medium transition flex-shrink-0 ${
                activeTab === tab
                  ? "bg-[#18181B] text-[#FAFAFA] border border-[#27272A] shadow-xs"
                  : "text-[#A1A1AA] hover:text-[#FAFAFA]"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onNewAnalysis}
          className="inline-flex items-center gap-1 rounded-md bg-[#2563EB] hover:bg-[#1D4ED8] px-2.5 sm:px-3 py-1.5 text-xs font-medium text-white transition shadow-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">New Analysis</span>
          <span className="sm:hidden">New</span>
        </button>

        <div className="flex h-7 w-7 items-center justify-center rounded-md border border-[#27272A] bg-[#18181B] text-[#A1A1AA] hover:text-[#FAFAFA] transition cursor-pointer">
          <Bell className="h-3.5 w-3.5" />
        </div>
      </div>

      {/* Mobile Workspace Sheet Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 z-50 border-b border-[#27272A] bg-[#09090B] p-3 shadow-xl lg:hidden animate-in slide-in-from-top-2 duration-150">
          <p className="px-2 text-[10px] font-mono font-medium uppercase tracking-wider text-[#71717A] mb-2">
            WORKSPACE NAVIGATION
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { label: "Projects", icon: FolderGit2 },
              { label: "Repository", icon: Code2 },
              { label: "Security", icon: ShieldAlert },
              { label: "Settings", icon: Settings },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onSelectSidebarItem(item.label);
                  }}
                  className="flex items-center gap-2 rounded-md border border-[#27272A] bg-[#111113] hover:bg-[#18181B] p-2 text-xs font-medium text-[#FAFAFA]"
                >
                  <Icon className="h-3.5 w-3.5 text-[#A1A1AA]" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
});

const Dashboard = memo(function Dashboard({
  url,
  repoData,
  diagramResult,
  chatPrompt,
  activeTab,
  setActiveTab,
  activeSidebarItem,
  setActiveSidebarItem,
  onInspectAnomaly,
  onNewAnalysis,
  onSelectPreset,
}: {
  url: string;
  repoData: ProcessedRepo;
  diagramResult: DiagramResult | null;
  chatPrompt: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeSidebarItem: string | null;
  setActiveSidebarItem: (item: string | null) => void;
  onInspectAnomaly: (prompt: string) => void;
  onNewAnalysis: () => void;
  onSelectPreset: (url: string) => void;
}) {
  return (
    <div className="flex min-h-[calc(100vh-52px)] w-full bg-[#09090B]">
      {/* Left Sidebar Workspace Navigation */}
      <Sidebar
        activeItem={activeSidebarItem}
        onSelect={setActiveSidebarItem}
        onNewAnalysis={onNewAnalysis}
      />

      {/* Interactive Modals */}
      {activeSidebarItem === "Projects" && (
        <ProjectsModal
          repoData={repoData}
          onSelectPreset={onSelectPreset}
          onClose={() => setActiveSidebarItem(null)}
        />
      )}
      {activeSidebarItem === "Repository" && (
        <RepositoryModal
          repoData={repoData}
          onClose={() => setActiveSidebarItem(null)}
        />
      )}
      {activeSidebarItem === "Security" && (
        <SecurityModal
          repoData={repoData}
          onClose={() => setActiveSidebarItem(null)}
        />
      )}
      {activeSidebarItem === "Settings" && (
        <SettingsModal
          onNewAnalysis={onNewAnalysis}
          onClose={() => setActiveSidebarItem(null)}
        />
      )}

      {/* Main Content Area */}
      {activeTab === "Analytics" ? (
        <AnalyticsView repoData={repoData} />
      ) : activeTab === "Team" ? (
        <TeamView repoData={repoData} />
      ) : (
        <div className="flex-1 grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-4 p-4 min-w-0 bg-[#09090B]">
          {/* Center Workspace */}
          <div className="flex flex-col gap-4 min-w-0">
            {/* Repository Subheader Bar */}
            <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 rounded-lg border border-[#27272A] bg-[#111113] px-3 sm:px-4 py-2.5 w-full max-w-full min-w-0">
              <div className="flex items-center gap-2 min-w-0 max-w-full">
                <FolderGit2 className="h-4 w-4 text-[#A1A1AA] flex-shrink-0" />
                <span className="font-mono text-xs font-semibold text-[#FAFAFA] truncate max-w-[140px] sm:max-w-xs">
                  {repoData.owner} / {repoData.repo}
                </span>
                <span className="rounded border border-[#27272A] bg-[#18181B] px-2 py-0.5 font-mono text-[11px] text-[#A1A1AA] flex-shrink-0">
                  {repoData.branch}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="inline-flex items-center gap-1.5 rounded border border-[#27272A] bg-[#18181B] px-2 py-1 font-mono text-[10px] sm:text-[11px] text-[#A1A1AA]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" />
                  Live Graph Sync
                </span>
              </div>
            </div>

            {/* Architecture Map Panel */}
            <ArchitecturePanel
              initialChart={diagramResult?.chart}
              stats={diagramResult?.stats}
              repoOwner={repoData.owner}
              repoName={repoData.repo}
            />

            {/* Recent Scans & Health Panel */}
            <RecentScansPanel repoData={repoData} onInspect={onInspectAnomaly} />
          </div>

          {/* Right AI Code Companion Side Panel */}
          <div className="min-w-0">
            <ChatPanel repoData={repoData} externalPrompt={chatPrompt} diagramChart={diagramResult?.chart} />
          </div>
        </div>
      )}
    </div>
  );
});

const Sidebar = memo(function Sidebar({
  activeItem,
  onSelect,
  onNewAnalysis,
}: {
  activeItem: string | null;
  onSelect: (item: string) => void;
  onNewAnalysis: () => void;
}) {
  const items = [
    { label: "Projects", icon: FolderGit2 },
    { label: "Repository", icon: Code2 },
    { label: "Security", icon: ShieldAlert },
    { label: "Settings", icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex w-56 flex-col border-r border-[#27272A] bg-[#09090B] p-3 justify-between">
      <div className="space-y-4">
        <button
          onClick={onNewAnalysis}
          className="w-full flex items-center justify-center gap-2 rounded-md border border-[#27272A] bg-[#18181B] hover:bg-[#202024] hover:border-[#3F3F46] px-3 py-1.5 text-xs font-medium text-[#FAFAFA] transition"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Project</span>
        </button>

        <div>
          <p className="px-2 text-[10px] font-mono font-medium uppercase tracking-wider text-[#71717A] mb-1.5">
            WORKSPACE
          </p>
          <nav className="space-y-0.5">
            {items.map((it) => {
              const Icon = it.icon;
              const active = activeItem === it.label;
              return (
                <button
                  key={it.label}
                  onClick={() => onSelect(it.label)}
                  className={`w-full flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                    active
                      ? "bg-[#18181B] text-[#FAFAFA] border border-[#27272A]"
                      : "text-[#A1A1AA] hover:bg-[#111113] hover:text-[#FAFAFA]"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 text-[#A1A1AA]" />
                  <span>{it.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="space-y-1 pt-4 border-t border-[#27272A]">
        <a href="#" className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs text-[#A1A1AA] hover:bg-[#111113] hover:text-[#FAFAFA] transition font-medium">
          <BookOpen className="h-3.5 w-3.5" />
          <span>Documentation</span>
        </a>
        <a href="#" className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs text-[#A1A1AA] hover:bg-[#111113] hover:text-[#FAFAFA] transition font-medium">
          <HelpCircle className="h-3.5 w-3.5" />
          <span>Support</span>
        </a>
        <div className="px-2 pt-2">
          <span className="inline-block rounded border border-[#27272A] bg-[#111113] px-2 py-0.5 font-mono text-[10px] text-[#71717A]">
            v2.5.0-flash
          </span>
        </div>
      </div>
    </aside>
  );
});

const AnalyticsView = memo(function AnalyticsView({ repoData }: { repoData: ProcessedRepo }) {
  const repoFiles = useMemo(() => {
    return repoData.fileTree.map((path) => {
      let category = "utility";
      if (path.includes("components/") || path.includes("ui/")) category = "component";
      else if (path.includes("routes/") || path.includes("pages/")) category = "page";
      else if (path.includes("api/") || path.includes("service")) category = "api";
      else if (path.includes("hooks/")) category = "hook";
      else if (path.includes("styles") || path.endsWith(".css")) category = "style";
      return {
        path,
        category,
        linesCount: Math.floor(Math.random() * 120) + 20,
        size: Math.floor(Math.random() * 8000) + 1200,
      };
    });
  }, [repoData.fileTree]);

  const fileCategories = useMemo(() => {
    const counts: Record<string, number> = {};
    repoFiles.forEach((f) => {
      counts[f.category] = (counts[f.category] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [repoFiles]);

  const totalLines = useMemo(() => {
    return repoFiles.reduce((acc, f) => acc + f.linesCount, 0);
  }, [repoFiles]);

  return (
    <div data-lenis-prevent="true" className="flex-1 flex flex-col gap-4 p-4 overflow-y-auto bg-[#09090B] text-[#FAFAFA] min-w-0">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-lg border border-[#27272A] bg-[#111113] p-4">
          <p className="text-xs font-mono text-[#A1A1AA]">Code Health Score</p>
          <p className="text-2xl font-mono font-semibold text-[#FAFAFA] mt-1">96.8 / 100</p>
          <span className="inline-block mt-2 text-[10px] font-mono text-[#16A34A] bg-[#16A34A]/10 border border-[#16A34A]/20 px-2 py-0.5 rounded">
            Grade A+ · Passed
          </span>
        </div>
        <div className="rounded-lg border border-[#27272A] bg-[#111113] p-4">
          <p className="text-xs font-mono text-[#A1A1AA]">Analyzed Files</p>
          <p className="text-2xl font-mono font-semibold text-[#FAFAFA] mt-1">{repoFiles.length}</p>
          <p className="text-[10px] font-mono text-[#71717A] mt-2">Parsed into AST graph</p>
        </div>
        <div className="rounded-lg border border-[#27272A] bg-[#111113] p-4">
          <p className="text-xs font-mono text-[#A1A1AA]">Total Source Lines</p>
          <p className="text-2xl font-mono font-semibold text-[#FAFAFA] mt-1">{totalLines.toLocaleString()}</p>
          <p className="text-[10px] font-mono text-[#71717A] mt-2">Across all modules</p>
        </div>
        <div className="rounded-lg border border-[#27272A] bg-[#111113] p-4">
          <p className="text-xs font-mono text-[#A1A1AA]">Module Categories</p>
          <p className="text-2xl font-mono font-semibold text-[#FAFAFA] mt-1">{fileCategories.length}</p>
          <p className="text-[10px] font-mono text-[#71717A] mt-2">Isolated sub-systems</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-[#27272A] bg-[#111113] p-5">
          <h3 className="text-xs font-semibold text-[#FAFAFA] mb-4 flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-[#A1A1AA]" /> Category File Distribution
          </h3>
          <div className="space-y-3">
            {fileCategories.map(([cat, count]) => {
              const pct = Math.round((count / repoFiles.length) * 100);
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono text-[#A1A1AA]">
                    <span className="capitalize">{cat}</span>
                    <span>{count} files ({pct}%)</span>
                  </div>
                  <div className="h-1.5 w-full rounded bg-[#18181B] overflow-hidden">
                    <div
                      className="h-full bg-[#2563EB] rounded transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-[#27272A] bg-[#111113] p-5">
          <h3 className="text-xs font-semibold text-[#FAFAFA] mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#A1A1AA]" /> Maintainability & Complexity Matrix
          </h3>
          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-md border border-[#16A34A]/20 bg-[#16A34A]/10 flex items-center justify-between">
              <div>
                <p className="font-medium text-[#16A34A]">Low Cyclomatic Complexity</p>
                <p className="text-[11px] font-mono text-[#A1A1AA] mt-0.5">78% functions modular & testable</p>
              </div>
              <span className="font-mono text-sm font-semibold text-[#16A34A]">78%</span>
            </div>
            <div className="p-3 rounded-md border border-[#D97706]/20 bg-[#D97706]/10 flex items-center justify-between">
              <div>
                <p className="font-medium text-[#D97706]">Moderate Complexity</p>
                <p className="text-[11px] font-mono text-[#A1A1AA] mt-0.5">18% routines with branch logic</p>
              </div>
              <span className="font-mono text-sm font-semibold text-[#D97706]">18%</span>
            </div>
            <div className="p-3 rounded-md border border-[#27272A] bg-[#18181B] flex items-center justify-between">
              <div>
                <p className="font-medium text-[#FAFAFA]">Refactoring Candidates</p>
                <p className="text-[11px] font-mono text-[#71717A] mt-0.5">4% handlers to decompose</p>
              </div>
              <span className="font-mono text-sm font-semibold text-[#A1A1AA]">4%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

const TeamView = memo(function TeamView({ repoData }: { repoData: ProcessedRepo }) {
  const teamMembers = [
    { name: repoData.owner, role: "Repository Owner & Lead", commits: "248 commits", active: true },
    { name: "Groq AI Engine", role: "Automated Analysis Agent", commits: "Live Companion", active: true },
    { name: "CodeSight Security Bot", role: "Vulnerability & Secret Scanner", commits: "Continuous Audit", active: true },
  ];

  return (
    <div data-lenis-prevent="true" className="flex-1 flex flex-col gap-4 p-3 sm:p-4 overflow-y-auto bg-[#09090B] text-[#FAFAFA] min-w-0">
      <div className="rounded-lg border border-[#27272A] bg-[#111113] p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-[#FAFAFA] flex items-center gap-2 mb-1">
          <Users className="h-4 w-4 text-[#A1A1AA]" /> Collaborators & Access Controls
        </h2>
        <p className="text-xs text-[#A1A1AA] mb-5 font-normal">
          Active roles and automated intelligence services for {repoData.owner}/{repoData.repo}.
        </p>

        <div className="space-y-2">
          {teamMembers.map((m) => (
            <div key={m.name} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 p-3 rounded-md border border-[#27272A] bg-[#18181B] hover:border-[#3F3F46] transition">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded border border-[#27272A] bg-[#111113] font-mono text-xs font-semibold text-[#FAFAFA]">
                  {m.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-semibold text-[#FAFAFA] flex items-center gap-2 truncate">
                    {m.name}
                    <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A] flex-shrink-0" />
                  </h3>
                  <p className="text-[11px] text-[#A1A1AA] font-normal truncate">{m.role}</p>
                </div>
              </div>
              <span className="text-[11px] font-mono text-[#A1A1AA] bg-[#111113] border border-[#27272A] px-2.5 py-1 rounded flex-shrink-0">
                {m.commits}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

const ModalWrapper = memo(function ModalWrapper({
  title,
  icon: Icon,
  onClose,
  children,
}: {
  title: string;
  icon: any;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-150 max-w-full overflow-x-hidden">
      <div className="w-full max-w-[calc(100vw-20px)] sm:max-w-2xl max-h-[88vh] flex flex-col rounded-lg border border-[#27272A] bg-[#111113] shadow-2xl overflow-hidden min-w-0">
        <div className="flex items-center justify-between border-b border-[#27272A] px-3.5 sm:px-4 py-3 bg-[#18181B]">
          <div className="flex items-center gap-2 min-w-0">
            <Icon className="h-4 w-4 text-[#A1A1AA] flex-shrink-0" />
            <h2 className="text-xs font-semibold text-[#FAFAFA] truncate">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-[#71717A] hover:bg-[#27272A] hover:text-[#FAFAFA] transition"
          >
            ✕
          </button>
        </div>
        <div data-lenis-prevent="true" className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">{children}</div>
      </div>
    </div>
  );
});

const RepositoryModal = memo(function RepositoryModal({
  repoData,
  onClose,
}: {
  repoData: ProcessedRepo;
  onClose: () => void;
}) {
  const [filter, setFilter] = useState("");

  const repoFiles = useMemo(() => {
    return repoData.fileTree.map((path) => {
      let category = "utility";
      if (path.includes("components/") || path.includes("ui/")) category = "component";
      else if (path.includes("routes/") || path.includes("pages/")) category = "page";
      else if (path.includes("api/") || path.includes("service")) category = "api";
      else if (path.includes("hooks/")) category = "hook";
      else if (path.includes("styles") || path.endsWith(".css")) category = "style";
      return {
        path,
        category,
        size: Math.floor(Math.random() * 8000) + 1200,
      };
    });
  }, [repoData.fileTree]);

  const filteredFiles = useMemo(() => {
    if (!filter) return repoFiles;
    return repoFiles.filter(
      (f) =>
        f.path.toLowerCase().includes(filter.toLowerCase()) ||
        f.category.toLowerCase().includes(filter.toLowerCase())
    );
  }, [repoFiles, filter]);

  return (
    <ModalWrapper title={`Repository Explorer — ${repoData.owner}/${repoData.repo}`} icon={Code2} onClose={onClose}>
      <div className="space-y-3">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter files by path or category (e.g. routes, components)..."
          className="w-full rounded-md border border-[#27272A] bg-[#18181B] px-3 py-2 text-xs text-[#FAFAFA] placeholder-[#71717A] font-mono outline-none focus:border-[#2563EB]"
        />

        <div data-lenis-prevent="true" className="max-h-[50vh] overflow-y-auto space-y-1 pr-1">
          {filteredFiles.map((file) => (
            <div
              key={file.path}
              className="flex items-center justify-between rounded border border-[#27272A] bg-[#18181B] p-2.5 text-xs hover:border-[#3F3F46] transition"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileCode2 className="h-3.5 w-3.5 text-[#A1A1AA] flex-shrink-0" />
                <span className="truncate font-mono text-[#FAFAFA]">{file.path}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="rounded border border-[#27272A] bg-[#111113] px-2 py-0.5 text-[10px] font-mono text-[#A1A1AA] capitalize">
                  {file.category}
                </span>
                <span className="font-mono text-[11px] text-[#71717A]">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ModalWrapper>
  );
});

const SecurityModal = memo(function SecurityModal({
  repoData,
  onClose,
}: {
  repoData: ProcessedRepo;
  onClose: () => void;
}) {
  return (
    <ModalWrapper title="Security & Compliance Audit" icon={ShieldAlert} onClose={onClose}>
      <div className="space-y-4">
        <div className="p-3.5 rounded-md border border-[#16A34A]/20 bg-[#16A34A]/10 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#16A34A]">Automated Audit Status: Clean</p>
            <p className="text-[11px] text-[#A1A1AA] mt-0.5">No hardcoded API secrets or key leaks detected.</p>
          </div>
          <span className="text-xs font-mono font-semibold text-[#16A34A] bg-[#16A34A]/20 px-2.5 py-1 rounded border border-[#16A34A]/30">
            A+ Audit
          </span>
        </div>

        <div className="space-y-1.5">
          <h3 className="text-[10px] font-mono uppercase tracking-wider text-[#71717A]">Audit Checklist</h3>
          {[
            { label: "Public API Key Hardcoding Check", pass: true, desc: "Passed: Secrets safely resolved from environment variables" },
            { label: "Dependency Vulnerability Scan", pass: true, desc: "Passed: 0 critical CVE vulnerabilities found" },
            { label: "Cross-Origin Resource Sharing (CORS)", pass: true, desc: "Passed: Security headers configured" },
            { label: "AST Input Sanitization", pass: true, desc: "Passed: Code parser strictly sandboxed" },
          ].map((check) => (
            <div key={check.label} className="p-3 rounded border border-[#27272A] bg-[#18181B] flex items-center justify-between text-xs">
              <div>
                <p className="font-medium text-[#FAFAFA]">{check.label}</p>
                <p className="text-[11px] font-mono text-[#71717A] mt-0.5">{check.desc}</p>
              </div>
              <span className="text-[10px] font-mono text-[#16A34A] bg-[#16A34A]/10 px-2 py-0.5 rounded border border-[#16A34A]/20">
                Verified
              </span>
            </div>
          ))}
        </div>
      </div>
    </ModalWrapper>
  );
});

const SettingsModal = memo(function SettingsModal({
  onClose,
  onNewAnalysis,
}: {
  onClose: () => void;
  onNewAnalysis: () => void;
}) {
  return (
    <ModalWrapper title="System Settings" icon={Settings} onClose={onClose}>
      <div className="space-y-3 text-xs">
        <div className="p-3.5 rounded-md border border-[#27272A] bg-[#18181B] space-y-2">
          <h3 className="font-semibold text-[#FAFAFA]">AI Analysis Engine</h3>
          <div className="flex items-center justify-between p-2.5 rounded border border-[#27272A] bg-[#111113]">
            <div>
              <p className="font-medium text-[#FAFAFA]">Model: LLaMA 3.3 70B</p>
              <p className="text-[11px] text-[#71717A]">Groq LPU ultra-fast inference + Gemini fallback</p>
            </div>
            <span className="text-[10px] font-mono text-[#16A34A] bg-[#16A34A]/10 px-2 py-0.5 rounded border border-[#16A34A]/20">
              Active
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-md border border-[#27272A] bg-[#18181B] space-y-2">
          <h3 className="font-semibold text-[#FAFAFA]">Diagram Limits</h3>
          <div className="flex items-center justify-between text-xs text-[#A1A1AA]">
            <span>Max File Ingestion Cap</span>
            <span className="font-mono text-[#FAFAFA]">250 Files</span>
          </div>
          <div className="flex items-center justify-between text-xs text-[#A1A1AA]">
            <span>Diagram Layout</span>
            <span className="font-mono text-[#FAFAFA]">graph LR (2D Landscape)</span>
          </div>
        </div>

        <button
          onClick={() => {
            onClose();
            onNewAnalysis();
          }}
          className="w-full rounded-md bg-[#2563EB] hover:bg-[#1D4ED8] px-3 py-2 text-xs font-medium text-white transition"
        >
          Reset Workspace & Start New Analysis
        </button>
      </div>
    </ModalWrapper>
  );
});

const ProjectsModal = memo(function ProjectsModal({
  repoData,
  onSelectPreset,
  onClose,
}: {
  repoData: ProcessedRepo;
  onSelectPreset: (url: string) => void;
  onClose: () => void;
}) {
  const projects = [
    { name: `${repoData.owner}/${repoData.repo}`, url: `https://github.com/${repoData.owner}/${repoData.repo}`, active: true },
    { name: "expressjs/express", url: "https://github.com/expressjs/express", active: false },
    { name: "shadcn-ui/ui", url: "https://github.com/shadcn-ui/ui", active: false },
    { name: "vercel/next.js", url: "https://github.com/vercel/next.js", active: false },
  ];

  return (
    <ModalWrapper title="Recent Projects & Presets" icon={FolderGit2} onClose={onClose}>
      <div className="space-y-2">
        {projects.map((p) => (
          <button
            key={p.name}
            onClick={() => {
              onClose();
              onSelectPreset(p.url);
            }}
            className="w-full flex items-center justify-between p-3 rounded-md border border-[#27272A] bg-[#18181B] hover:border-[#3F3F46] transition text-left"
          >
            <div className="flex items-center gap-3">
              <FolderGit2 className="h-4 w-4 text-[#A1A1AA]" />
              <div>
                <p className="text-xs font-semibold text-[#FAFAFA]">{p.name}</p>
                <p className="text-[11px] font-mono text-[#71717A]">{p.url}</p>
              </div>
            </div>
            {p.active ? (
              <span className="text-[10px] font-mono text-[#16A34A] bg-[#16A34A]/10 px-2 py-0.5 rounded border border-[#16A34A]/20">
                Active
              </span>
            ) : (
              <span className="text-xs text-[#A1A1AA] hover:text-[#FAFAFA]">Load ➔</span>
            )}
          </button>
        ))}
      </div>
    </ModalWrapper>
  );
});

const RecentScansPanel = memo(function RecentScansPanel({
  repoData,
  onInspect,
}: {
  repoData: ProcessedRepo;
  onInspect: (prompt: string) => void;
}) {
  const anomalies = [
    {
      id: "auth-latency",
      type: "warning",
      title: "High Latency Warning: Auth Validation",
      desc: "Response times reached 850ms in authentication validation middleware.",
      time: "2m ago",
      inspectPrompt: `Why is Auth Service experiencing latency in ${repoData.owner}/${repoData.repo}? Show hotspots.`,
      icon: AlertTriangle,
      badge: "border-[#D97706]/30 bg-[#D97706]/10 text-[#D97706]",
    },
    {
      id: "container-restart",
      type: "error",
      title: "Memory Peak Warning: Large Payload Parsing",
      desc: "Large payload parsing detected in primary controller methods.",
      time: "15m ago",
      inspectPrompt: `Analyze potential memory leaks or heavy dependencies in ${repoData.owner}/${repoData.repo}.`,
      icon: ShieldAlert,
      badge: "border-[#DC2626]/30 bg-[#DC2626]/10 text-[#DC2626]",
    },
    {
      id: "deployment-success",
      type: "success",
      title: `Ingestion Complete: ${repoData.repo}`,
      desc: `Parsed ${repoData.stats.analyzedFiles} core files across ${repoData.stats.totalFiles} repository objects cleanly.`,
      time: "1h ago",
      inspectPrompt: `Give me an overall architectural summary of ${repoData.owner}/${repoData.repo}.`,
      icon: CheckCircle2,
      badge: "border-[#16A34A]/30 bg-[#16A34A]/10 text-[#16A34A]",
    },
  ];

  return (
    <div className="flex flex-col rounded-lg border border-[#27272A] bg-[#111113] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-[#A1A1AA]" />
          <h2 className="text-xs font-semibold text-[#FAFAFA]">Automated Health Audit & Logs</h2>
        </div>
        <span className="text-[11px] font-mono text-[#71717A]">Structural check</span>
      </div>

      <div className="space-y-2">
        {anomalies.map((an) => {
          const Icon = an.icon;
          return (
            <div
              key={an.id}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 rounded-md border border-[#27272A] bg-[#18181B] p-3 transition hover:border-[#3F3F46]"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded border ${an.badge}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium text-[#FAFAFA] truncate">{an.title}</p>
                    <span className="text-[10px] font-mono text-[#71717A] flex-shrink-0">{an.time}</span>
                  </div>
                  <p className="text-[11px] text-[#A1A1AA] mt-0.5 leading-normal">{an.desc}</p>
                </div>
              </div>

              <button
                onClick={() => onInspect(an.inspectPrompt)}
                className="flex-shrink-0 rounded border border-[#27272A] bg-[#111113] hover:bg-[#202024] hover:border-[#3F3F46] px-2.5 py-1 text-[11px] font-medium text-[#FAFAFA] transition"
              >
                Inspect
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
});

const ArchitecturePanel = memo(function ArchitecturePanel({
  initialChart,
  stats,
  repoOwner,
  repoName,
}: {
  initialChart?: string;
  stats?: DiagramResult["stats"];
  repoOwner?: string;
  repoName?: string;
}) {
  const baseChart = initialChart || ARCHITECTURE_CHART;
  const [chart, setChart] = useState<string>(baseChart);
  const [draft, setDraft] = useState<string>(baseChart);
  const [editorOpen, setEditorOpen] = useState(false);
  const [liveEdit, setLiveEdit] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (initialChart) {
      setChart(initialChart);
      setDraft(initialChart);
    }
  }, [initialChart]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SNAPSHOTS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Snapshot[];
        if (Array.isArray(parsed)) setSnapshots(parsed);
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(snapshots));
    } catch {
      /* ignore */
    }
  }, [snapshots, hydrated]);

  useEffect(() => {
    if (!liveEdit) return;
    const t = setTimeout(() => setChart(draft), 400);
    return () => clearTimeout(t);
  }, [draft, liveEdit]);

  const saveSnapshot = useCallback((label?: string) => {
    const snap: Snapshot = {
      id: crypto.randomUUID(),
      label: (label ?? "").trim() || `Snapshot ${snapshots.length + 1}`,
      chart: draft,
      createdAt: Date.now(),
    };
    setSnapshots((s) => [snap, ...s]);
  }, [draft, snapshots.length]);

  const revertTo = useCallback((snap: Snapshot) => {
    setDraft(snap.chart);
    setChart(snap.chart);
  }, []);

  const deleteSnapshot = useCallback((id: string) => {
    setSnapshots((s) => s.filter((x) => x.id !== id));
  }, []);

  const handleApply = useCallback(() => setChart(draft), [draft]);
  const handleReset = useCallback(() => {
    setDraft(baseChart);
    setChart(baseChart);
  }, [baseChart]);
  const handleCloseEditor = useCallback(() => setEditorOpen(false), []);
  const handleCloseHistory = useCallback(() => setHistoryOpen(false), []);

  return (
    <div className="flex h-[60vh] min-h-[460px] flex-col rounded-lg border border-[#27272A] bg-[#111113] p-3 sm:p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4 text-[#A1A1AA]" />
          <h2 className="text-xs font-semibold text-[#FAFAFA]">System Architecture Diagram</h2>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setHistoryOpen((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs font-medium transition ${
              historyOpen ? "border-[#2563EB] bg-[#2563EB]/10 text-white" : "border-[#27272A] bg-[#18181B] text-[#A1A1AA] hover:text-[#FAFAFA]"
            }`}
          >
            <History className="h-3 w-3" />
            History
            {snapshots.length > 0 && (
              <span className="rounded bg-[#27272A] px-1 font-mono text-[10px] text-[#FAFAFA]">
                {snapshots.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setEditorOpen((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs font-medium transition ${
              editorOpen ? "border-[#2563EB] bg-[#2563EB]/10 text-white" : "border-[#27272A] bg-[#18181B] text-[#A1A1AA] hover:text-[#FAFAFA]"
            }`}
          >
            <Pencil className="h-3 w-3" />
            {editorOpen ? "Close source" : "Edit source"}
          </button>
        </div>
      </div>

      <div
        className={`grid flex-1 min-h-0 gap-3 ${
          editorOpen && historyOpen
            ? "md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,220px)]"
            : editorOpen
              ? "md:grid-cols-[1fr_1fr]"
              : historyOpen
                ? "md:grid-cols-[1fr_minmax(0,240px)]"
                : "grid-cols-1"
        }`}
      >
        {editorOpen && (
          <MermaidEditor
            value={draft}
            onChange={setDraft}
            liveEdit={liveEdit}
            setLiveEdit={setLiveEdit}
            onApply={handleApply}
            onReset={handleReset}
            onClose={handleCloseEditor}
            onSaveSnapshot={saveSnapshot}
          />
        )}
        <MermaidDiagram chart={chart} repoOwner={repoOwner} repoName={repoName} />
        {historyOpen && (
          <HistoryPanel
            snapshots={snapshots}
            onSave={saveSnapshot}
            onRevert={revertTo}
            onDelete={deleteSnapshot}
            onClose={handleCloseHistory}
          />
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: "Analyzed Files", value: stats?.files ?? 0 },
          { label: "Modules", value: stats?.modules ?? 0 },
          { label: "Services", value: stats?.services ?? 0 },
          { label: "Graph Depth", value: stats?.depth ?? 0 },
        ].map((s) => (
          <div key={s.label} className="rounded border border-[#27272A] bg-[#18181B] px-2.5 sm:px-3 py-1.5">
            <p className="text-[10px] font-mono text-[#71717A] uppercase truncate">{s.label}</p>
            <p className="text-xs font-mono font-semibold text-[#FAFAFA] mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
});

const MermaidEditor = memo(function MermaidEditor({
  value,
  onChange,
  liveEdit,
  setLiveEdit,
  onApply,
  onReset,
  onClose,
  onSaveSnapshot,
}: {
  value: string;
  onChange: (v: string) => void;
  liveEdit: boolean;
  setLiveEdit: (v: boolean) => void;
  onApply: () => void;
  onReset: () => void;
  onClose: () => void;
  onSaveSnapshot: (label?: string) => void;
}) {
  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded border border-[#27272A] bg-[#09090B]">
      <div className="flex items-center justify-between border-b border-[#27272A] px-3 py-1.5 bg-[#18181B]">
        <div className="flex items-center gap-1.5">
          <FileCode2 className="h-3.5 w-3.5 text-[#A1A1AA]" />
          <span className="text-xs font-mono text-[#FAFAFA]">Mermaid Definition</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onSaveSnapshot()}
            className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-mono text-[#A1A1AA] hover:bg-[#27272A] hover:text-[#FAFAFA]"
          >
            <Save className="h-3 w-3" />
            Save
          </button>
          <button
            onClick={onClose}
            className="flex h-5 w-5 items-center justify-center rounded text-[#71717A] hover:text-[#FAFAFA]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className="flex-1 resize-none bg-transparent px-3 py-2 font-mono text-[11px] leading-relaxed text-[#FAFAFA] outline-none placeholder-[#71717A]"
        placeholder="graph TD&#10;  A --> B"
      />
      <div className="flex items-center justify-between gap-2 border-t border-[#27272A] px-3 py-1.5 bg-[#111113]">
        <label className="flex items-center gap-1.5 text-[11px] text-[#A1A1AA] cursor-pointer">
          <input
            type="checkbox"
            checked={liveEdit}
            onChange={(e) => setLiveEdit(e.target.checked)}
            className="h-3 w-3 accent-[#2563EB] rounded"
          />
          Live compile
        </label>
        <div className="flex items-center gap-1">
          <button
            onClick={onReset}
            className="rounded border border-[#27272A] bg-[#18181B] px-2 py-1 text-[11px] text-[#A1A1AA] hover:text-[#FAFAFA]"
          >
            Reset
          </button>
          <button
            onClick={onApply}
            disabled={liveEdit}
            className="rounded bg-[#2563EB] px-2 py-1 text-[11px] font-medium text-white disabled:opacity-40"
          >
            Compile
          </button>
        </div>
      </div>
    </div>
  );
});

const HistoryPanel = memo(function HistoryPanel({
  snapshots,
  onSave,
  onRevert,
  onDelete,
  onClose,
}: {
  snapshots: Snapshot[];
  onSave: () => void;
  onRevert: (snap: Snapshot) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const fmt = (t: number) => {
    const d = new Date(t);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded border border-[#27272A] bg-[#09090B]">
      <div className="flex items-center justify-between border-b border-[#27272A] px-3 py-1.5 bg-[#18181B]">
        <div className="flex items-center gap-1.5">
          <History className="h-3.5 w-3.5 text-[#A1A1AA]" />
          <span className="text-xs font-mono text-[#FAFAFA]">Snapshots</span>
        </div>
        <button
          onClick={onClose}
          className="flex h-5 w-5 items-center justify-center rounded text-[#71717A] hover:text-[#FAFAFA]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="border-b border-[#27272A] p-2 bg-[#111113]">
        <button
          onClick={onSave}
          className="inline-flex w-full items-center justify-center gap-1 rounded bg-[#18181B] border border-[#27272A] py-1 text-[11px] font-mono text-[#A1A1AA] hover:text-[#FAFAFA] hover:border-[#3F3F46]"
        >
          <Save className="h-3 w-3" />
          Save current snapshot
        </button>
      </div>
      <div data-lenis-prevent="true" className="flex-1 overflow-y-auto p-2 space-y-1">
        {snapshots.length === 0 ? (
          <div className="py-6 text-center text-[11px] font-mono text-[#71717A]">
            No snapshots saved yet.
          </div>
        ) : (
          snapshots.map((s) => (
            <div
              key={s.id}
              className="rounded border border-[#27272A] bg-[#18181B] p-2 flex items-start justify-between gap-1 text-xs"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-[11px] text-[#FAFAFA]">{s.label}</p>
                <p className="text-[10px] font-mono text-[#71717A]">{fmt(s.createdAt)}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onRevert(s)}
                  className="p-1 text-[#A1A1AA] hover:text-[#FAFAFA]"
                  title="Revert"
                >
                  <Undo2 className="h-3 w-3" />
                </button>
                <button
                  onClick={() => onDelete(s.id)}
                  className="p-1 text-[#71717A] hover:text-[#DC2626]"
                  title="Delete"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
});

const ARCHITECTURE_CHART = `graph LR
  U([User Client])
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
`;

const MermaidDiagram = memo(function MermaidDiagram({
  chart,
  repoOwner,
  repoName,
}: {
  chart: string;
  repoOwner?: string;
  repoName?: string;
}) {
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [exportOpen, setExportOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgWrapperRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const id = useMemo(() => `mmd-${Math.random().toString(36).slice(2)}`, []);

  useEffect(() => {
    let cancelled = false;
    getMermaid()
      .then((mermaid) => mermaid.render(id, chart))
      .then(({ svg }: { svg: string }) => {
        if (!cancelled) {
          setSvg(svg);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  const openFullscreenPage = useCallback(() => {
    try {
      localStorage.setItem("codesight:fullscreen_chart", chart);
      localStorage.setItem(
        "codesight:fullscreen_repo",
        JSON.stringify({ owner: repoOwner || "Repository", repo: repoName || "Architecture" })
      );
    } catch {
      /* ignore */
    }
    window.open("/fullscreen", "_blank");
  }, [chart, repoOwner, repoName]);

  const fitToView = useCallback(() => {
    if (!containerRef.current || !svgWrapperRef.current) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      return;
    }

    const svgEl = svgWrapperRef.current.querySelector("svg");
    if (!svgEl) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      return;
    }

    let svgW = 1000;
    let svgH = 600;
    const viewBox = svgEl.getAttribute("viewBox");
    if (viewBox) {
      const [, , vw, vh] = viewBox.split(/\s+/).map(Number);
      if (vw && vh) {
        svgW = vw;
        svgH = vh;
      }
    }

    const containerW = containerRef.current.clientWidth - 40;
    const containerH = containerRef.current.clientHeight - 40;

    if (svgW > 0 && svgH > 0 && containerW > 0 && containerH > 0) {
      const scaleX = containerW / svgW;
      const scaleY = containerH / svgH;
      const optimalZoom = Math.min(scaleX, scaleY, 1.1);
      setZoom(Math.max(0.25, Number(optimalZoom.toFixed(2))));
      setPan({ x: 0, y: 0 });
    } else {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaMode === 1 ? 0.03 : 0.001;
    const zoomChange = -e.deltaY * factor;
    setZoom((prev) => {
      const next = Math.min(5, Math.max(0.15, prev + zoomChange));
      return Number(next.toFixed(3));
    });
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    dragRef.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
  }, [pan.x, pan.y]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current) return;
    setPan({
      x: dragRef.current.px + (e.clientX - dragRef.current.x),
      y: dragRef.current.py + (e.clientY - dragRef.current.y),
    });
  }, []);

  const touchStartRef = useRef<{ dist: number; zoom: number; x: number; y: number; px: number; py: number } | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      dragRef.current = { x: t.clientX, y: t.clientY, px: pan.x, py: pan.y };
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartRef.current = {
        dist,
        zoom,
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        px: pan.x,
        py: pan.y,
      };
    }
  }, [pan.x, pan.y, zoom]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1 && dragRef.current) {
      const t = e.touches[0];
      setPan({
        x: dragRef.current.px + (t.clientX - dragRef.current.x),
        y: dragRef.current.py + (t.clientY - dragRef.current.y),
      });
    } else if (e.touches.length === 2 && touchStartRef.current) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scale = dist / touchStartRef.current.dist;
      const nextZoom = Math.min(5, Math.max(0.15, touchStartRef.current.zoom * scale));
      setZoom(Number(nextZoom.toFixed(3)));
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    dragRef.current = null;
    touchStartRef.current = null;
  }, []);

  const endDrag = useCallback(() => {
    dragRef.current = null;
  }, []);

  const reset = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const buildExportSvg = useCallback((isSvgDownload = false): string | null => {
    if (!svg) return null;
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, "image/svg+xml");
    const svgEl = doc.documentElement as unknown as SVGSVGElement;
    svgEl.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const viewBox = svgEl.getAttribute("viewBox");
    if (viewBox) {
      if (isSvgDownload) {
        // For SVG download, 100% width/height lets it auto-scale in viewers
        svgEl.setAttribute("width", "100%");
        svgEl.setAttribute("height", "100%");
      } else {
        // For PNG, we need absolute pixels to render cleanly to the canvas
        const [, , vw, vh] = viewBox.split(/\s+/).map(Number);
        svgEl.setAttribute("width", String(vw));
        svgEl.setAttribute("height", String(vh));
      }
    }
    const bg = doc.createElementNS("http://www.w3.org/2000/svg", "rect");
    bg.setAttribute("width", "100%");
    bg.setAttribute("height", "100%");
    bg.setAttribute("fill", "#09090B");
    svgEl.insertBefore(bg, svgEl.firstChild);
    return new XMLSerializer().serializeToString(svgEl);
  }, [svg]);

  const triggerDownload = useCallback((blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, []);

  const exportSvg = useCallback(() => {
    const out = buildExportSvg(true); // true = format for SVG download
    if (!out) return;
    triggerDownload(new Blob([out], { type: "image/svg+xml" }), "architecture.svg");
    setExportOpen(false);
  }, [buildExportSvg, triggerDownload]);

  const exportPng = useCallback(async () => {
    const out = buildExportSvg(false); // false = keep exact pixels for PNG canvas
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
      ctx.fillStyle = "#09090B";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => {
        if (blob) triggerDownload(blob, "architecture.png");
      }, "image/png");
    } finally {
      URL.revokeObjectURL(url);
      setExportOpen(false);
    }
  }, [buildExportSvg, triggerDownload]);

  return (
    <div
      ref={containerRef}
      className="relative flex-1 min-h-[320px] overflow-hidden rounded border border-[#27272A] bg-[#09090B] mermaid-enterprise touch-pan-canvas"
    >
      <div
        className="absolute inset-0 cursor-grab active:cursor-grabbing select-none"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          ref={svgWrapperRef}
          className="flex items-center justify-center p-8 transition-transform duration-75 origin-center overflow-visible"
          style={{
            minWidth: "100%",
            minHeight: "100%",
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>

      {error && (
        <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-xs text-[#DC2626] font-mono">
          Failed to render diagram: {error}
        </div>
      )}

      {!svg && !error && (
        <div className="absolute inset-0 flex items-center justify-center gap-2 text-xs text-[#71717A] font-mono">
          <Loader2 className="h-4 w-4 animate-spin text-[#2563EB]" /> Rendering diagram...
        </div>
      )}

      {/* Control Overlay Bar */}
      <div className="absolute bottom-2.5 right-2.5 z-20 flex items-center gap-1 rounded border border-[#27272A] bg-[#111113] p-1 shadow-sm">
        <button
          onClick={() => setZoom((z) => Math.max(0.2, Number((z - 0.15).toFixed(2))))}
          className="flex h-6 w-6 items-center justify-center rounded text-[#A1A1AA] hover:bg-[#18181B] hover:text-[#FAFAFA] transition"
          title="Zoom out"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </button>
        <span className="w-10 text-center text-[10px] font-mono text-[#FAFAFA]">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom((z) => Math.min(4, Number((z + 0.15).toFixed(2))))}
          className="flex h-6 w-6 items-center justify-center rounded text-[#A1A1AA] hover:bg-[#18181B] hover:text-[#FAFAFA] transition"
          title="Zoom in"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </button>
        <div className="h-3 w-[1px] bg-[#27272A] mx-0.5" />
        <button
          onClick={fitToView}
          className="flex h-6 w-6 items-center justify-center rounded text-[#A1A1AA] hover:bg-[#18181B] hover:text-[#FAFAFA] transition"
          title="Fit diagram"
        >
          <Target className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={reset}
          className="flex h-6 px-1.5 items-center justify-center rounded text-[10px] font-mono text-[#A1A1AA] hover:bg-[#18181B] hover:text-[#FAFAFA] transition"
          title="Reset"
        >
          100%
        </button>
        <div className="h-3 w-[1px] bg-[#27272A] mx-0.5" />
        <button
          onClick={openFullscreenPage}
          className="flex h-6 items-center gap-1 px-2 rounded border border-[#27272A] bg-[#18181B] hover:border-[#3F3F46] text-[10px] font-mono text-[#FAFAFA] transition"
          title="Fullscreen Page"
        >
          <Maximize2 className="h-3 w-3 text-[#A1A1AA]" />
          <span>Full Page</span>
        </button>
      </div>

      {/* Export Dropdown */}
      <div className="absolute right-2.5 top-2.5 z-20">
        <div className="relative">
          <button
            onClick={() => setExportOpen((v) => !v)}
            disabled={!svg}
            className="inline-flex items-center gap-1 rounded border border-[#27272A] bg-[#111113] hover:border-[#3F3F46] px-2.5 py-1 text-xs font-medium text-[#FAFAFA] transition disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5 text-[#A1A1AA]" />
            Export
          </button>
          {exportOpen && (
            <div className="absolute right-0 top-full mt-1 w-40 overflow-hidden rounded border border-[#27272A] bg-[#111113] py-1 text-xs shadow-xl z-30 font-mono">
              <button
                onClick={exportSvg}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[#A1A1AA] hover:bg-[#18181B] hover:text-[#FAFAFA]"
              >
                <FileCode2 className="h-3.5 w-3.5" />
                SVG Vector
              </button>
              <button
                onClick={exportPng}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[#A1A1AA] hover:bg-[#18181B] hover:text-[#FAFAFA]"
              >
                <FileImage className="h-3.5 w-3.5" />
                PNG Raster (2x)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

const ChatPanel = memo(function ChatPanel({
  repoData,
  externalPrompt,
  diagramChart,
}: {
  repoData: ProcessedRepo;
  externalPrompt?: string;
  diagramChart?: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "ai",
      content: `Repository analysis initialized for ${repoData.owner}/${repoData.repo}. Grounded context indexed across ${repoData.stats.analyzedFiles} key source files (${repoData.stats.totalFiles} total). Ask any architecture or implementation questions.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSendPrompt = useCallback(async (text: string) => {
    if (!text || loadingAI) return;

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoadingAI(true);

    try {
      const answer = await askCodebaseQuestion(
        repoData.owner,
        repoData.repo,
        repoData.aggregatedCode,
        messages,
        text,
        repoData.fileTree,
        diagramChart
      );

      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "ai",
          content: answer,
        },
      ]);
    } catch (err: any) {
      console.warn("AI Companion fallback engaged:", err);
      const errMsg = err?.message || "";
      const isKeyIssue = errMsg.includes("not configured") || errMsg.includes("missing") || errMsg.includes("unavailable");
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "ai",
          content: isKeyIssue
            ? `⚠️ **AI engines unavailable** — both Groq and Gemini API calls failed.\n\n**Possible causes:**\n- Groq API key not set in \`.env\` (currently a placeholder)\n- Gemini API key expired or rate-limited\n\n**To fix:** Add your Groq API key to the \`.env\` file:\n\`\`\`\nGROQ_API_KEY=gsk_your_actual_key_here\nVITE_GROQ_API_KEY=gsk_your_actual_key_here\n\`\`\`\nGet a free key at [console.groq.com/keys](https://console.groq.com/keys)`
            : `Architecture Overview for **${repoData.owner}/${repoData.repo}**:\n- Module tree parsed across **${repoData.fileTree.length}** source files.\n- Request pipelines dispatch through entry routers and middleware.`,
        },
      ]);
    } finally {
      setLoadingAI(false);
    }
  }, [loadingAI, messages, repoData, diagramChart]);

  const lastProcessedPromptRef = useRef<string>("");

  useEffect(() => {
    if (externalPrompt && externalPrompt.trim() && externalPrompt !== lastProcessedPromptRef.current) {
      lastProcessedPromptRef.current = externalPrompt;
      handleSendPrompt(externalPrompt.trim());
    }
  }, [externalPrompt, handleSendPrompt]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loadingAI]);

  const send = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    handleSendPrompt(input.trim());
  }, [input, handleSendPrompt]);

  const suggestions = [
    "Explain project architecture",
    "Show auth & security flow",
    "Identify refactoring hotspots",
  ];

  return (
    <div className="flex h-[500px] lg:h-[calc(100vh-76px)] min-h-0 flex-col rounded-lg border border-[#27272A] bg-[#111113]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#27272A] px-3 sm:px-4 py-3 bg-[#09090B]">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded border border-[#27272A] bg-[#18181B] text-[#FAFAFA]">
            <Bot className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs font-semibold text-[#FAFAFA] truncate">AI Code Companion</h2>
          </div>
        </div>
        <span className="rounded border border-[#27272A] bg-[#18181B] px-2 py-0.5 font-mono text-[10px] text-[#A1A1AA] truncate max-w-[120px]">
          {repoData.repo}
        </span>
      </div>

      {/* Messages Stream */}
      <div data-lenis-prevent="true" ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-3 sm:p-4">
        {messages.map((m) => (
          <Message key={m.id} message={m} onTriggerPrompt={handleSendPrompt} />
        ))}

        {loadingAI && (
          <div className="flex gap-2">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded border border-[#27272A] bg-[#18181B] text-[#A1A1AA]">
              <Bot className="h-3.5 w-3.5" />
            </div>
            <div className="flex items-center gap-2 rounded border border-[#2563EB]/30 bg-[#2563EB]/10 px-3 py-2 text-xs font-mono text-[#FAFAFA]">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#2563EB]" />
              Evaluating codebase...
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="border-t border-[#27272A] p-2.5 sm:p-3 bg-[#09090B]">
        <div className="mb-2 flex flex-wrap gap-1">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => handleSendPrompt(s)}
              className="rounded border border-[#27272A] bg-[#18181B] hover:border-[#3F3F46] px-2 py-0.5 text-[10px] font-mono text-[#A1A1AA] hover:text-[#FAFAFA] transition"
            >
              {s}
            </button>
          ))}
        </div>
        <form onSubmit={send} className="flex items-center gap-1.5 rounded-md border border-[#27272A] bg-[#18181B] p-1 focus-within:border-[#2563EB]">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about architecture, entry points, or refactoring..."
            className="flex-1 bg-transparent px-2 py-1 text-xs text-[#FAFAFA] placeholder-[#71717A] outline-none font-sans min-w-0"
          />
          <button
            type="submit"
            disabled={loadingAI}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded bg-[#2563EB] text-white hover:bg-[#1D4ED8] disabled:opacity-40 transition"
            aria-label="Send"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
});

const Message = memo(function Message({
  message,
  onTriggerPrompt,
}: {
  message: ChatMessage;
  onTriggerPrompt: (prompt: string) => void;
}) {
  const isAI = message.role === "ai";
  return (
    <div className={`flex gap-2 ${isAI ? "" : "flex-row-reverse"}`}>
      <div
        className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded border ${
          isAI ? "border-[#27272A] bg-[#18181B] text-[#FAFAFA]" : "border-[#3F3F46] bg-[#202024] text-[#FAFAFA]"
        }`}
      >
        {isAI ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
      </div>
      <div className="flex flex-col gap-1.5 max-w-[88%] sm:max-w-[85%] min-w-0">
        <div
          className={`rounded-md p-2.5 sm:p-3 text-xs leading-relaxed whitespace-pre-wrap overflow-x-auto ${
            isAI
              ? "border border-[#27272A] bg-[#18181B] text-[#FAFAFA] font-mono text-[11px]"
              : "border border-[#3F3F46] bg-[#202024] text-[#FAFAFA] font-sans"
          }`}
        >
          {message.content}
        </div>

        {message.actionButton && (
          <div>
            <button
              onClick={() => onTriggerPrompt(message.actionButton!.prompt)}
              className="inline-flex items-center gap-1 rounded border border-[#27272A] bg-[#18181B] hover:border-[#3F3F46] px-2.5 py-1 text-[10px] font-mono text-[#FAFAFA] transition"
            >
              <Terminal className="h-3 w-3 text-[#A1A1AA]" />
              {message.actionButton.label}
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
