import type { Mermaid } from "mermaid";

let mermaidInitialized = false;
let mermaidPromise: Promise<Mermaid> | null = null;

export async function getMermaid(): Promise<Mermaid> {
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
      primaryColor: "#361448",
      primaryTextColor: "#f3ecf9",
      primaryBorderColor: "#bc96e6",
      lineColor: "#ffd166",
      secondaryColor: "#210b2c",
      tertiaryColor: "#180722",
      textColor: "#f3ecf9",
      mainBkg: "#210b2c",
      nodeBorder: "#bc96e6",
      clusterBkg: "rgba(33, 11, 44, 0.5)",
      clusterBorder: "rgba(188, 150, 230, 0.4)",
      edgeLabelBackground: "rgba(21, 6, 30, 0.9)",
    },
  });
  mermaidInitialized = true;
  return mermaid;
}
