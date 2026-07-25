/**
 * CodeSight — Client-Side Code Parser & Landscape Architecture Engine
 *
 * Generates rich, wide, 2D landscape Mermaid architecture diagrams by analyzing
 * raw source code & folder structures client-side. Zero API calls. Zero cost.
 */

import type { ProcessedRepo } from "./github";
import type { DiagramResult } from "./gemini";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type FileCategory =
  | "component"
  | "page"
  | "route"
  | "api"
  | "service"
  | "hook"
  | "utility"
  | "config"
  | "style"
  | "test"
  | "type"
  | "model"
  | "middleware"
  | "store"
  | "context"
  | "entry"
  | "other";

interface FileInfo {
  path: string;
  dir: string;
  name: string;
  ext: string;
  category: FileCategory;
  imports: string[];
}

interface ModuleGroup {
  id: string;
  label: string;
  category: FileCategory;
  files: FileInfo[];
}

/* ------------------------------------------------------------------ */
/*  Framework detection                                                */
/* ------------------------------------------------------------------ */

function detectFramework(fileTree: string[], codeMap: Map<string, string>): string {
  const pkgRaw = codeMap.get("package.json") ?? "";

  if (pkgRaw.includes('"next"')) return "Next.js";
  if (pkgRaw.includes('"nuxt"')) return "Nuxt.js";
  if (pkgRaw.includes('"@angular/core"')) return "Angular";
  if (pkgRaw.includes('"svelte"')) return "Svelte";
  if (pkgRaw.includes('"vue"')) return "Vue.js";
  if (pkgRaw.includes('"@tanstack/start"') || pkgRaw.includes('"@tanstack/react-router"'))
    return "TanStack Start";
  if (pkgRaw.includes('"express"')) return "Express";
  if (pkgRaw.includes('"fastify"')) return "Fastify";
  if (pkgRaw.includes('"hono"')) return "Hono";
  if (pkgRaw.includes('"react"')) return "React";
  if (fileTree.some((f) => f.endsWith("Cargo.toml"))) return "Rust";
  if (fileTree.some((f) => f.endsWith("go.mod"))) return "Go";
  if (fileTree.some((f) => f === "manage.py")) return "Django";
  if (fileTree.some((f) => f.endsWith("pom.xml"))) return "Java/Maven";
  if (fileTree.some((f) => f.endsWith("build.gradle"))) return "Gradle";
  if (fileTree.some((f) => f.endsWith("requirements.txt") || f.endsWith("setup.py"))) return "Python";

  return "Unknown";
}

/* ------------------------------------------------------------------ */
/*  File categorisation                                                */
/* ------------------------------------------------------------------ */

function categorizeFile(path: string): FileCategory {
  const lower = path.toLowerCase();
  const name = (path.split("/").pop() || "").toLowerCase();

  // Entry points
  if (
    name.match(
      /^(index\.(ts|tsx|js|jsx)|main\.(ts|tsx|js|jsx|go|rs|py)|app\.(ts|tsx|js|jsx|py)|server\.(ts|tsx|js|jsx))$/
    ) &&
    !lower.includes("/components/")
  )
    return "entry";

  // Configs
  if (
    name.match(
      /^(package\.json|tsconfig.*|\.eslintrc.*|\.prettierrc.*|vite\.config.*|next\.config.*|tailwind\.config.*|webpack\.config.*|jest\.config.*|\.env.*|dockerfile|docker-compose.*|\.gitignore|readme\.md|license|bunfig\.toml|components\.json|eslint\.config.*|cargo\.toml|go\.mod|pyproject\.toml)$/
    )
  )
    return "config";

  // Tests
  if (lower.includes(".test.") || lower.includes(".spec.") || lower.includes("__tests__"))
    return "test";

  // Styles
  if (name.match(/\.(css|scss|sass|less|styl)$/)) return "style";

  // Types
  if (name.match(/\.d\.ts$/) || lower.includes("/types/") || lower.includes("/interfaces/"))
    return "type";

  // API routes
  if (lower.includes("/api/") || lower.includes("/controllers/") || lower.includes("/endpoints/"))
    return "api";

  // Pages
  if (
    lower.includes("/pages/") ||
    lower.includes("/views/") ||
    (lower.includes("/app/") && name.match(/^page\.(tsx?|jsx?)$/))
  )
    return "page";

  // Routes
  if (lower.includes("/routes/") || lower.includes("/router/")) return "route";

  // Components
  if (lower.includes("/components/") || lower.includes("/ui/") || lower.includes("/widgets/"))
    return "component";

  // Hooks
  if (lower.includes("/hooks/") || name.match(/^use[A-Z]/)) return "hook";

  // Services
  if (lower.includes("/services/") || lower.includes("/clients/")) return "service";

  // Store
  if (
    lower.includes("/store/") ||
    lower.includes("/stores/") ||
    lower.includes("/redux/") ||
    lower.includes("/slices/")
  )
    return "store";

  // Context
  if (lower.includes("/context/") || lower.includes("/providers/")) return "context";

  // Models
  if (lower.includes("/models/") || lower.includes("/entities/") || lower.includes("/schemas/"))
    return "model";

  // Middleware
  if (lower.includes("/middleware/") || lower.includes("/middlewares/")) return "middleware";

  // Utilities
  if (
    lower.includes("/utils/") ||
    lower.includes("/helpers/") ||
    lower.includes("/lib/") ||
    lower.includes("/common/") ||
    lower.includes("/shared/")
  )
    return "utility";

  return "other";
}

/* ------------------------------------------------------------------ */
/*  Import extraction                                                  */
/* ------------------------------------------------------------------ */

function extractImports(content: string): string[] {
  const imports: string[] = [];

  // ES imports  import ... from '...'
  const esRe = /import\s+(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = esRe.exec(content))) imports.push(m[1]);

  // require('...')
  const cjsRe = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((m = cjsRe.exec(content))) imports.push(m[1]);

  // Python   from x import y  /  import x
  const pyFromRe = /^from\s+(\S+)\s+import/gm;
  while ((m = pyFromRe.exec(content))) imports.push(m[1]);

  // Go   import "..."
  const goRe = /import\s+"([^"]+)"/g;
  while ((m = goRe.exec(content))) imports.push(m[1]);

  return imports;
}

/* ------------------------------------------------------------------ */
/*  Parse aggregated code blob                                         */
/* ------------------------------------------------------------------ */

function parseAggregatedCode(raw: string): Map<string, string> {
  const map = new Map<string, string>();
  const separator = "========================================";

  const parts = raw.split(separator);
  let currentPath = "";

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.startsWith("FILE: ")) {
      currentPath = trimmed.replace("FILE: ", "").trim();
    } else if (currentPath && trimmed) {
      map.set(currentPath, trimmed);
      currentPath = "";
    }
  }

  return map;
}

/* ------------------------------------------------------------------ */
/*  Resolve import to a known file path                                */
/* ------------------------------------------------------------------ */

function resolveImport(
  raw: string,
  importerDir: string,
  knownPaths: Set<string>
): string | null {
  if (
    !raw.startsWith(".") &&
    !raw.startsWith("/") &&
    !raw.startsWith("@/") &&
    !raw.startsWith("~/")
  )
    return null;

  let resolved = raw;

  if (raw.startsWith("@/") || raw.startsWith("~/")) {
    resolved = "src/" + raw.slice(2);
  } else if (raw.startsWith(".")) {
    const base = importerDir ? importerDir.split("/") : [];
    for (const seg of raw.split("/")) {
      if (seg === "..") base.pop();
      else if (seg !== ".") base.push(seg);
    }
    resolved = base.join("/");
  }

  const exts = ["", ".ts", ".tsx", ".js", ".jsx", "/index.ts", "/index.tsx", "/index.js", "/index.jsx"];
  for (const ext of exts) {
    if (knownPaths.has(resolved + ext)) return resolved + ext;
  }

  return null;
}

/* ------------------------------------------------------------------ */
/*  Group files into fine-grained module buckets                       */
/* ------------------------------------------------------------------ */

function buildModules(files: FileInfo[]): ModuleGroup[] {
  const buckets = new Map<string, FileInfo[]>();

  for (const f of files) {
    if (f.category === "config" || f.category === "test" || f.category === "style") continue;

    const parts = f.path.split("/");
    let key: string;

    if (parts.length <= 1) {
      key = "Root Entry Points";
    } else if (parts[0] === "src" || parts[0] === "app" || parts[0] === "lib") {
      if (parts.length > 2) {
        key = `${parts[0]}/${parts[1]}`;
      } else {
        key = parts[0];
      }
    } else {
      key = parts[0];
    }

    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(f);
  }

  // Define category priority for logical left-to-right flow
  const CATEGORY_ORDER: Record<FileCategory, number> = {
    entry: 0,
    page: 1,
    route: 2,
    api: 3,
    component: 4,
    service: 5,
    middleware: 6,
    store: 7,
    context: 8,
    hook: 9,
    utility: 10,
    model: 11,
    type: 12,
    config: 13,
    style: 14,
    test: 15,
    other: 16,
  };

  return Array.from(buckets.entries())
    .filter(([, files]) => files.length > 0)
    .map(([id, files]) => {
      const counts = new Map<FileCategory, number>();
      for (const f of files) counts.set(f.category, (counts.get(f.category) || 0) + 1);
      let topCat: FileCategory = "other";
      let topN = 0;
      counts.forEach((n, c) => {
        if (n > topN) {
          topN = n;
          topCat = c;
        }
      });

      const safeId = id.replace(/[^a-zA-Z0-9_]/g, "_");
      const label = id.split("/").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" / ");

      return { id: safeId, label, category: topCat, files };
    })
    .sort((a, b) => (CATEGORY_ORDER[a.category] ?? 20) - (CATEGORY_ORDER[b.category] ?? 20));
}

function findModuleOf(path: string, modules: ModuleGroup[]): string | null {
  for (const m of modules) {
    if (m.files.some((f) => f.path === path)) return m.id;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  Mermaid generation (Landscape LR Layout)                           */
/* ------------------------------------------------------------------ */

const CATEGORY_META: Record<FileCategory, { icon: string; fill: string; stroke: string }> = {
  entry:      { icon: "🚀", fill: "#361448", stroke: "#ffd166" },
  component:  { icon: "🧩", fill: "#210b2c", stroke: "#bc96e6" },
  page:       { icon: "📄", fill: "#290c37", stroke: "#bc96e6" },
  route:      { icon: "🛤️", fill: "#290c37", stroke: "#ffd166" },
  api:        { icon: "🔌", fill: "#441854", stroke: "#ffd166" },
  service:    { icon: "⚙️", fill: "#361448", stroke: "#bc96e6" },
  hook:       { icon: "🪝", fill: "#210b2c", stroke: "#e0bbf8" },
  utility:    { icon: "🔧", fill: "#1a0824", stroke: "#bc96e6" },
  config:     { icon: "⚙️", fill: "#1a0824", stroke: "#ffd166" },
  style:      { icon: "🎨", fill: "#441854", stroke: "#e0bbf8" },
  test:       { icon: "🧪", fill: "#290c37", stroke: "#bc96e6" },
  type:       { icon: "📝", fill: "#1a0824", stroke: "#bc96e6" },
  model:      { icon: "📦", fill: "#361448", stroke: "#ffd166" },
  middleware: { icon: "🔗", fill: "#441854", stroke: "#ffd166" },
  store:      { icon: "🗄️", fill: "#361448", stroke: "#e0bbf8" },
  context:    { icon: "🌐", fill: "#210b2c", stroke: "#bc96e6" },
  other:      { icon: "📁", fill: "#1a0824", stroke: "#bc96e6" },
};

function generateMermaidChart(
  modules: ModuleGroup[],
  edges: Set<string>,
  framework: string,
  repoName: string
): string {
  const lines: string[] = [];
  lines.push("graph LR");
  lines.push("");

  // Title node
  lines.push(`  TITLE["🏗️ ${repoName} Architecture Map — ${framework}"]`);
  lines.push(`  style TITLE fill:#210b2c,stroke:#ffd166,stroke-width:2px,color:#f3ecf9,font-weight:bold`);
  lines.push("");

  // Render subgraphs with wide capacity
  const maxNodesPerModule = 20;

  for (const mod of modules) {
    const meta = CATEGORY_META[mod.category] || CATEGORY_META.other;
    lines.push(`  subgraph ${mod.id}["${meta.icon} ${mod.label}"]`);
    lines.push(`    direction TB`);

    const shown = mod.files.slice(0, maxNodesPerModule);
    for (const file of shown) {
      const nodeId = file.path.replace(/[^a-zA-Z0-9]/g, "_");
      const short = file.name.length > 28 ? file.name.slice(0, 25) + "…" : file.name;

      if (file.category === "entry") {
        lines.push(`    ${nodeId}(["${short}"])`);
      } else if (file.category === "api" || file.category === "service") {
        lines.push(`    ${nodeId}[/"${short}"/]`);
      } else if (file.category === "model" || file.category === "store") {
        lines.push(`    ${nodeId}[("${short}")]`);
      } else {
        lines.push(`    ${nodeId}["${short}"]`);
      }
    }

    if (mod.files.length > maxNodesPerModule) {
      const moreId = `${mod.id}__more`;
      lines.push(`    ${moreId}["... +${mod.files.length - maxNodesPerModule} more files"]`);
      lines.push(
        `    style ${moreId} fill:#1a0824,stroke:#bc96e6,stroke-dasharray:5 5,color:#e0bbf8`
      );
    }

    lines.push("  end");
    lines.push("");
  }

  // Connect title to initial module
  if (modules.length > 0) {
    lines.push(`  TITLE --> ${modules[0].id}`);
  }

  // Connect consecutive architectural module layers for clean horizontal flow
  for (let i = 0; i < modules.length - 1; i++) {
    const curr = modules[i];
    const next = modules[i + 1];
    const directEdge = Array.from(edges).some((e) => e.startsWith(`${curr.id} -->`));
    if (!directEdge) {
      lines.push(`  ${curr.id} -.-> ${next.id}`);
    }
  }

  // Render specific file import edges
  for (const edge of edges) {
    lines.push(`  ${edge}`);
  }
  lines.push("");

  // Styling per subgraph
  for (const mod of modules) {
    const meta = CATEGORY_META[mod.category] || CATEGORY_META.other;
    lines.push(
      `  style ${mod.id} fill:${meta.fill},stroke:${meta.stroke},stroke-width:1.5px,color:#f3ecf9`
    );
  }

  // classDef rules
  lines.push("");
  lines.push("  classDef entry fill:#361448,stroke:#ffd166,stroke-width:2px,color:#fff;");
  lines.push("  classDef service fill:#210b2c,stroke:#bc96e6,stroke-width:1.5px,color:#f3ecf9;");
  lines.push("  classDef data fill:#441854,stroke:#ffd166,stroke-width:1.5px,color:#fff;");
  lines.push("  classDef util fill:#1a0824,stroke:#bc96e6,stroke-width:1px,color:#e0bbf8;");

  return lines.join("\n");
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

export function generateDiagramFromCode(repoData: ProcessedRepo): DiagramResult {
  const { fileTree, aggregatedCode, stats, repo } = repoData;

  const codeMap = parseAggregatedCode(aggregatedCode);
  const knownPaths = new Set(fileTree);

  const fileInfos: FileInfo[] = fileTree
    .filter((p) => {
      const ext = p.split(".").pop()?.toLowerCase() || "";
      return !["png", "jpg", "jpeg", "gif", "svg", "ico", "webp", "woff", "woff2", "ttf", "eot", "mp4", "mp3", "zip", "tar", "gz", "lock", "lockb"].includes(ext);
    })
    .map((path) => {
      const parts = path.split("/");
      const name = parts.pop() || "";
      const dir = parts.join("/");
      const ext = name.includes(".") ? "." + name.split(".").pop() : "";
      const category = categorizeFile(path);
      const content = codeMap.get(path) || "";
      const rawImports = content ? extractImports(content) : [];
      const resolvedImports = rawImports
        .map((imp) => resolveImport(imp, dir, knownPaths))
        .filter(Boolean) as string[];

      return { path, dir, name, ext, category, imports: resolvedImports };
    });

  const framework = detectFramework(fileTree, codeMap);
  const modules = buildModules(fileInfos);

  const edges = new Set<string>();
  for (const mod of modules) {
    for (const file of mod.files) {
      for (const imp of file.imports) {
        const target = findModuleOf(imp, modules);
        if (target && target !== mod.id) {
          edges.add(`${mod.id} --> ${target}`);
        }
      }
    }
  }

  const chart = generateMermaidChart(modules, edges, framework, repo);

  const numModules = modules.length;
  const serviceCategories = new Set([
    "api", "service", "middleware", "store", "context", "hook", "utility", "model"
  ]);
  let numServices = modules.filter((m) => serviceCategories.has(m.category)).length;
  if (numServices === 0) {
    numServices = fileInfos.filter((f) =>
      ["service", "hook", "utility", "model", "context", "store", "api", "middleware"].includes(f.category)
    ).length;
  }

  const maxDepth = Math.max(...fileTree.map((f) => f.split("/").length), 1);

  return {
    chart,
    stats: {
      files: stats.analyzedFiles || stats.totalFiles,
      modules: numModules,
      services: numServices,
      depth: maxDepth,
    },
  };
}
