"use client";

import { motion } from "framer-motion";
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
    <motion.div
      className={cn("absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 z-[60] hidden sm:block", className)}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1, duration: 0.5 }}
    >
      <motion.div
        animate={{ y: [0, 6, 0] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
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
              "text-[10px] tracking-[0.15em] uppercase font-semibold whitespace-nowrap",
              isLight ? "drop-shadow-md" : ""
            )}
          >
            Cuộn xuống
          </span>
        </div>
        <div className="relative">
          <motion.div
            className={cn(
              "absolute inset-0 rounded-full blur-md",
              isLight ? "bg-primary/30" : "bg-primary/20"
            )}
            animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
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
      </motion.div>
    </motion.div>
  );
};

