import React, { Component, ErrorInfo, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class WebGLErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("WebGL Error caught by boundary:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="relative flex min-h-screen w-full items-center justify-center bg-[#13061b] text-purple-200">
            <p>WebGL rendering unavailable.</p>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

export function WebGLFallback({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-gradient-to-br from-[#13061b] via-[#210b2c] to-[#180722] opacity-90",
        className
      )}
    />
  );
}
