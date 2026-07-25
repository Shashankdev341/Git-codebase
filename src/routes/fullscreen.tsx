import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Network,
  ZoomIn,
  ZoomOut,
  Target,
  Download,
  FileImage,
  FileCode2,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { getMermaid } from "../lib/mermaidLoader";

export const Route = createFileRoute("/fullscreen")({
  head: () => ({
    meta: [
      { title: "CodeSight — Fullscreen Architecture Canvas" },
      { name: "description", content: "Interactive Fullscreen System Architecture Diagram Viewer" },
    ],
  }),
  component: FullscreenViewerPage,
});

function FullscreenViewerPage() {
  const [chart, setChart] = useState<string>("");
  const [repoInfo, setRepoInfo] = useState<{ owner: string; repo: string }>({
    owner: "Repository",
    repo: "Architecture",
  });
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [exportOpen, setExportOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgWrapperRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const id = useMemo(() => `mmd-full-${Math.random().toString(36).slice(2)}`, []);

  useEffect(() => {
    try {
      const storedChart = localStorage.getItem("codesight:fullscreen_chart");
      const storedRepo = localStorage.getItem("codesight:fullscreen_repo");
      if (storedChart) setChart(storedChart);
      if (storedRepo) {
        const parsed = JSON.parse(storedRepo);
        if (parsed.owner && parsed.repo) setRepoInfo(parsed);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!chart) return;
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

    let svgW = 1200;
    let svgH = 700;
    const viewBox = svgEl.getAttribute("viewBox");
    if (viewBox) {
      const [, , vw, vh] = viewBox.split(/\s+/).map(Number);
      if (vw && vh) {
        svgW = vw;
        svgH = vh;
      }
    }

    const containerW = containerRef.current.clientWidth - 60;
    const containerH = containerRef.current.clientHeight - 60;

    if (svgW > 0 && svgH > 0 && containerW > 0 && containerH > 0) {
      const scaleX = containerW / svgW;
      const scaleY = containerH / svgH;
      const optimalZoom = Math.min(scaleX, scaleY, 1.25);
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

  const endDrag = useCallback(() => {
    dragRef.current = null;
  }, []);

  const reset = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const buildExportSvg = useCallback((): string | null => {
    if (!svg) return null;
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, "image/svg+xml");
    const svgEl = doc.documentElement as unknown as SVGSVGElement;
    svgEl.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const viewBox = svgEl.getAttribute("viewBox");
    if (viewBox) {
      const [, , vw, vh] = viewBox.split(/\s+/).map(Number);
      svgEl.setAttribute("width", String(vw));
      svgEl.setAttribute("height", String(vh));
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
    const out = buildExportSvg();
    if (!out) return;
    triggerDownload(new Blob([out], { type: "image/svg+xml" }), `${repoInfo.repo}-architecture.svg`);
    setExportOpen(false);
  }, [buildExportSvg, triggerDownload, repoInfo.repo]);

  const exportPng = useCallback(async () => {
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
      ctx.fillStyle = "#09090B";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => {
        if (blob) triggerDownload(blob, `${repoInfo.repo}-architecture.png`);
      }, "image/png");
    } finally {
      URL.revokeObjectURL(url);
      setExportOpen(false);
    }
  }, [buildExportSvg, triggerDownload, repoInfo.repo]);

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

  return (
    <div className="flex h-screen w-screen max-w-full flex-col overflow-hidden bg-[#09090B] text-[#FAFAFA] font-sans select-none">
      {/* Header Bar */}
      <header className="sticky top-0 z-30 flex h-auto min-h-[48px] w-full max-w-full flex-wrap items-center justify-between border-b border-[#27272A] bg-[#09090B] px-3 sm:px-4 py-2 gap-2 min-w-0 overflow-x-hidden">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={() => window.close()}
            className="inline-flex items-center gap-1.5 rounded border border-[#27272A] bg-[#18181B] hover:border-[#3F3F46] px-2 sm:px-2.5 py-1 text-xs font-medium text-[#FAFAFA] transition flex-shrink-0"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </button>

          <div className="h-4 w-[1px] bg-[#27272A] hidden sm:block" />

          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <Network className="h-4 w-4 text-[#A1A1AA] flex-shrink-0" />
            <span className="font-mono text-xs font-semibold text-[#FAFAFA] truncate max-w-[140px] sm:max-w-none">
              {repoInfo.owner} / {repoInfo.repo}
            </span>
            <span className="hidden md:inline-block rounded border border-[#27272A] bg-[#111113] px-2 py-0.5 font-mono text-[10px] text-[#A1A1AA]">
              Canvas
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={fitToView}
            className="inline-flex items-center gap-1 rounded border border-[#27272A] bg-[#18181B] hover:border-[#3F3F46] px-2 sm:px-2.5 py-1 text-xs font-medium text-[#FAFAFA] transition"
          >
            <Target className="h-3.5 w-3.5 text-[#A1A1AA]" />
            <span className="hidden sm:inline">Fit Screen</span>
            <span className="sm:hidden">Fit</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setExportOpen((v) => !v)}
              disabled={!svg}
              className="inline-flex items-center gap-1 rounded border border-[#27272A] bg-[#111113] hover:border-[#3F3F46] px-2 sm:px-2.5 py-1 text-xs font-medium text-[#FAFAFA] transition disabled:opacity-40"
            >
              <Download className="h-3.5 w-3.5 text-[#A1A1AA]" />
              Export
            </button>
            {exportOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 overflow-hidden rounded border border-[#27272A] bg-[#111113] py-1 text-xs shadow-xl z-40 font-mono">
                <button
                  onClick={exportSvg}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[#A1A1AA] hover:bg-[#18181B] hover:text-[#FAFAFA]"
                >
                  <FileCode2 className="h-3.5 w-3.5" />
                  Download SVG
                </button>
                <button
                  onClick={exportPng}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[#A1A1AA] hover:bg-[#18181B] hover:text-[#FAFAFA]"
                >
                  <FileImage className="h-3.5 w-3.5" />
                  Download PNG (2x)
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Full-Page Canvas Area */}
      <main
        ref={containerRef}
        className="relative flex-1 w-full h-full overflow-hidden bg-[#09090B] cursor-grab active:cursor-grabbing select-none mermaid-enterprise touch-pan-canvas"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onWheel={handleWheel}
      >
        <div
          ref={svgWrapperRef}
          className="flex items-center justify-center p-6 sm:p-12 transition-transform duration-75 origin-center overflow-visible"
          style={{
            minWidth: "100%",
            minHeight: "100%",
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />

        {error && (
          <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-xs text-[#DC2626] font-mono bg-[#09090B]">
            Failed to render diagram: {error}
          </div>
        )}

        {!svg && !error && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 text-xs text-[#71717A] font-mono bg-[#09090B]">
            <Loader2 className="h-4 w-4 animate-spin text-[#2563EB]" /> Loading Architecture Canvas...
          </div>
        )}

        {/* Floating Control Bar */}
        <div className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-30 flex items-center gap-1 rounded border border-[#27272A] bg-[#111113] p-1 shadow-md max-w-[calc(100vw-24px)] overflow-x-auto no-scrollbar">
          <button
            onClick={() => setZoom((z) => Math.max(0.2, Number((z - 0.15).toFixed(2))))}
            className="flex h-7 w-7 items-center justify-center rounded text-[#A1A1AA] hover:bg-[#18181B] hover:text-[#FAFAFA] transition"
            title="Zoom out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <span className="w-9 text-center text-[10px] font-mono text-[#FAFAFA]">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(4, Number((z + 0.15).toFixed(2))))}
            className="flex h-7 w-7 items-center justify-center rounded text-[#A1A1AA] hover:bg-[#18181B] hover:text-[#FAFAFA] transition"
            title="Zoom in"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <div className="h-3 w-[1px] bg-[#27272A] mx-0.5" />
          <button
            onClick={fitToView}
            className="flex h-7 px-1.5 items-center justify-center rounded text-[10px] font-mono text-[#A1A1AA] hover:bg-[#18181B] hover:text-[#FAFAFA] transition"
            title="Fit view"
          >
            Fit
          </button>
          <button
            onClick={reset}
            className="flex h-7 px-1.5 items-center justify-center rounded text-[10px] font-mono text-[#A1A1AA] hover:bg-[#18181B] hover:text-[#FAFAFA] transition"
            title="Reset to 100%"
          >
            100%
          </button>
        </div>
      </main>
    </div>
  );
}
