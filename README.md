# CodeSight — Enterprise Codebase Intelligence

CodeSight is an instant architecture mapping, dependency graph visualization, and repository-grounded AI companion for engineering teams.

## Key Features

- **Automated Architecture Visualizer**: Generates interactive 2D landscape Mermaid dependency graphs of core components, modules, and service layers.
- **Repo-Aware AI Companion**: Contextual semantic Q&A powered by Google Gemini 2.5 Flash Engine and AST parsing.
- **Structural Health Audits**: Automated vulnerability checks, secret scans, and complexity metrics.
- **Full Responsiveness**: Optimized for every device screen size from 320px mobile viewports to ultra-wide displays.
- **Performance Optimized**: Zero redundant re-renders via `React.memo`, `useCallback`, and `useMemo`.

## Development Setup

To run the application locally:

```sh
# Clone the repository
git clone https://github.com/Shashankdev341/CodeSight-codebase.git

# Navigate into project directory
cd CodeSight-codebase

# Install dependencies
npm install

# Start local dev server
npm run dev
```

## Built With

- **Framework**: TanStack Start & React 19
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4 & Vanilla CSS
- **AI Engine**: Google Gemini 2.5 Flash API
- **Diagrams**: Mermaid.js & SVG Rendering
