"use client";

import React, { useState, useEffect, useMemo } from "react";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils";

export interface ContainerTextFlipProps {
  /** Array of words to cycle through in the animation */
  words?: string[];
  /** Time in milliseconds between word transitions */
  interval?: number;
  /** Additional CSS classes to apply to the container */
  className?: string;
  /** Additional CSS classes to apply to the text */
  textClassName?: string;
  /** Duration of the transition animation in milliseconds */
  animationDuration?: number;
}

export function ContainerTextFlip({
  words = ["better", "modern", "beautiful", "awesome"],
  interval = 3000,
  className,
  textClassName,
  animationDuration = 700,
}: ContainerTextFlipProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  // Memoize longest word to avoid recalculation on every render
  const longestWord = useMemo(() => 
    [...words].sort((a, b) => b.length - a.length)[0],
    [words]
  );

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentWordIndex((prevIndex) => (prevIndex + 1) % words.length);
    }, interval);

    return () => clearInterval(intervalId);
  }, [words, interval]);

  return (
    <motion.span
      className={cn(
        "relative inline-flex items-center justify-center rounded-lg px-4 py-1 text-center font-bold min-h-[1.5em]",
        className,
      )}
    >
      {/* Ghost text to maintain stable width based on longest word */}
      <span className="invisible h-0 pointer-events-none select-none px-2" aria-hidden="true">
        {longestWord}
      </span>
      
      <div className="absolute inset-0 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={words[currentWordIndex]}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{
              duration: animationDuration / 1000,
              ease: "easeInOut",
            }}
            className={cn("inline-block whitespace-nowrap", textClassName)}
          >
            {words[currentWordIndex]}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.span>
  );
}

