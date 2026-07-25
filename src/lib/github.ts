export interface GitTreeItem {
  path: string;
  mode: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
  url?: string;
}

export interface ProcessedRepo {
  owner: string;
  repo: string;
  branch: string;
  fileTree: string[];
  aggregatedCode: string;
  stats: {
    totalFiles: number;
    analyzedFiles: number;
    estimatedTokens: number;
  };
}

const IGNORED_EXTENSIONS = new Set([
  "png", "jpg", "jpeg", "gif", "svg", "ico", "webp", "avif",
  "woff", "woff2", "ttf", "eot", "otf",
  "mp4", "webm", "mp3", "wav", "ogg",
  "zip", "tar", "gz", "7z", "rar",
  "pdf", "exe", "dll", "so", "dylib", "bin",
  "lock", "lockb", "ds_store", "map"
]);

const IGNORED_PATHS = [
  "node_modules/",
  ".git/",
  "dist/",
  "build/",
  ".next/",
  ".output/",
  "coverage/",
  ".venv/",
  "venv/",
  "vendor/",
  "__pycache__/",
  "target/",
  ".turbo/",
  ".cache/"
];

export function parseGitHubUrl(inputUrl: string): { owner: string; repo: string } {
  let cleaned = inputUrl.trim();
  cleaned = cleaned.replace(/^https?:\/\/(www\.)?github\.com\//, "");
  cleaned = cleaned.replace(/\.git$/, "");
  cleaned = cleaned.replace(/\/$/, "");

  const parts = cleaned.split("/").filter(Boolean);
  if (parts.length < 2) {
    throw new Error("Invalid GitHub repository URL. Expected format: https://github.com/owner/repo");
  }

  return { owner: parts[0], repo: parts[1] };
}

export async function fetchRepoData(inputUrl: string): Promise<ProcessedRepo> {
  const { owner, repo } = parseGitHubUrl(inputUrl);

  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "CodeSight-Analyzer",
  };

  const metaEnv = typeof import.meta !== "undefined" ? (import.meta as any).env : {};
  const githubToken =
    metaEnv?.VITE_GITHUB_TOKEN ||
    metaEnv?.GITHUB_TOKEN ||
    process.env.GITHUB_TOKEN ||
    process.env.VITE_GITHUB_TOKEN;
  if (githubToken) {
    headers.Authorization = `token ${githubToken}`;
  }

  // 1. Get repo default branch
  const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
  if (!repoRes.ok) {
    if (repoRes.status === 404) {
      throw new Error(`Repository "${owner}/${repo}" not found or is private.`);
    }
    if (repoRes.status === 403) {
      throw new Error("GitHub API rate limit exceeded. Please add a GITHUB_TOKEN or try again later.");
    }
    throw new Error(`GitHub API error (${repoRes.status}): ${repoRes.statusText}`);
  }

  const repoData = await repoRes.json();
  const branch = repoData.default_branch || "main";

  // 2. Fetch recursive git tree
  const treeRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    { headers }
  );

  if (!treeRes.ok) {
    throw new Error(`Failed to fetch file tree for ${owner}/${repo} (${treeRes.status}).`);
  }

  const treeData = await treeRes.json();
  const treeItems: GitTreeItem[] = treeData.tree || [];

  // Filter tree items
  const validFiles = treeItems.filter((item) => {
    if (item.type !== "blob") return false;
    const lowerPath = item.path.toLowerCase();

    // Check path exclusions
    if (IGNORED_PATHS.some((p) => lowerPath.includes(p))) return false;

    // Check extension exclusions
    const ext = lowerPath.split(".").pop();
    if (ext && IGNORED_EXTENSIONS.has(ext)) return false;

    // Check file size (skip files > 500KB)
    if (item.size && item.size > 500 * 1024) return false;

    return true;
  });

  // Prioritize files
  const prioritizedFiles = validFiles.sort((a, b) => {
    const priority = (p: string) => {
      const l = p.toLowerCase();
      if (l === "readme.md" || l === "package.json" || l === "cargo.toml" || l === "go.mod" || l === "pyproject.toml") return 0;
      if (l.startsWith("src/") || l.startsWith("app/") || l.startsWith("lib/")) return 1;
      if (l.startsWith("components/") || l.startsWith("routes/") || l.startsWith("api/")) return 2;
      return 3;
    };
    return priority(a.path) - priority(b.path);
  });

  // Select up to 250 key files to cover complete project tree
  const selectedFiles = prioritizedFiles.slice(0, 250);

  // Fetch raw contents concurrently in chunks
  const fileContents: { path: string; content: string }[] = [];
  const chunkSize = 10;

  for (let i = 0; i < selectedFiles.length; i += chunkSize) {
    const chunk = selectedFiles.slice(i, i + chunkSize);
    const results = await Promise.allSettled(
      chunk.map(async (file) => {
        const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${file.path}`;
        const res = await fetch(rawUrl);
        if (!res.ok) return null;
        const text = await res.text();
        return { path: file.path, content: text };
      })
    );

    for (const res of results) {
      if (res.status === "fulfilled" && res.value) {
        fileContents.push(res.value);
      }
    }
  }

  // Build aggregated text string
  const aggregatedParts = fileContents.map(
    (f) => `========================================\nFILE: ${f.path}\n========================================\n${f.content}\n`
  );

  const aggregatedCode = aggregatedParts.join("\n");
  const estimatedTokens = Math.round(aggregatedCode.length / 4);

  return {
    owner,
    repo,
    branch,
    fileTree: treeItems.map((t) => t.path),
    aggregatedCode,
    stats: {
      totalFiles: treeItems.length,
      analyzedFiles: fileContents.length,
      estimatedTokens,
    },
  };
}
