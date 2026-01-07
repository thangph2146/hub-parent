"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ScrollIndicatorProps {
  /** Function để scroll đến section tiếp theo */
  onScroll: () => void;
  /** Variant của button (light cho hero section, dark cho các section khác) */
  variant?: "light" | "dark";
  /** Custom className */
  className?: string;
}

export const ScrollIndicator = ({ onScroll, variant = "dark", className }: ScrollIndicatorProps) => {
  const isLight = variant === "light";

  return (
    <div
      className={cn(
        "absolute bottom-0 sm:bottom-4 left-1/2 -translate-x-1/2 z-[60] hidden sm:block animate-in fade-in slide-in-from-top-2 duration-[500ms] delay-[1000ms]",
        className
      )}
    >
      <div
        className={cn(
          "flex flex-col items-center gap-1.5 transition-colors cursor-pointer group",
          isLight ? "text-white/70 hover:text-white" : "text-foreground/70 hover:text-foreground"
        )}
        onClick={onScroll}
      >
        <div
          className={cn(
            "relative px-3 py-1.5 rounded-full backdrop-blur-xl transition-all duration-300 shadow-md group-hover:shadow-lg",
            isLight
              ? "bg-white/10 border border-white/30 group-hover:bg-white/20 group-hover:border-white/40"
              : "bg-background/80 border border-border/50 group-hover:bg-background group-hover:border-border"
          )}
        >
          <span
            className={cn(
              "text-xs lg:text-base tracking-[0.15em] uppercase font-semibold whitespace-nowrap",
              isLight ? "drop-shadow-md" : ""
            )}
          >
            Cuộn xuống
          </span>
        </div>
        <div className="relative">
          <div
            className={cn(
              "absolute inset-0 rounded-full blur-md animate-pulse",
              isLight ? "bg-primary/30" : "bg-primary/20"
            )}
            style={{
              animationDuration: "2s",
              animationTimingFunction: "ease-in-out",
            }}
          />
          <ChevronDown
            className={cn(
              "relative w-5 h-5 transition-all",
              isLight
                ? "drop-shadow-md group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]"
                : "drop-shadow-lg group-hover:drop-shadow-[0_0_12px_rgba(0,0,0,0.3)]"
            )}
          />
        </div>
      </div>
    </div>
  );
};

