"use client";
import React, { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/utils";

export const FlipWords = ({
  words,
  duration = 3000,
  className,
}: {
  words: string[];
  duration?: number;
  className?: string;
}) => {
  const [currentWord, setCurrentWord] = useState(words[0]);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  // Memoize longest word to avoid recalculation on every render
  const longestWord = React.useMemo(() => 
    [...words].sort((a, b) => b.length - a.length)[0],
    [words]
  );

  const startAnimation = useCallback(() => {
    const word = words[words.indexOf(currentWord) + 1] || words[0];
    setCurrentWord(word);
    setIsAnimating(true);
  }, [currentWord, words]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (!isAnimating) {
      timeoutId = setTimeout(() => {
        startAnimation();
      }, duration);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isAnimating, duration, startAnimation]);

  return (
    <span className={cn("relative inline-flex flex-col", className)}>
      {/* Ghost text for stable width */}
      <span className="invisible h-0 pointer-events-none select-none px-2 whitespace-nowrap" aria-hidden="true">
        {longestWord}
      </span>
      
      <AnimatePresence
        onExitComplete={() => {
          setIsAnimating(false);
        }}
      >
        <motion.div
          initial={false} // Bỏ animation ban đầu để hiện text ngay lập tức (tốt cho LCP)
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.3,
          }}
          exit={{
            opacity: 0,
            y: -10,
            position: "absolute",
          }}
          className={cn(
            "z-10 inline-block text-left px-2",
            "whitespace-nowrap"
          )}
          key={currentWord}
        >
          {currentWord}
        </motion.div>
      </AnimatePresence>
    </span>
  );
};

