"use client";
import React, { startTransition, useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { cn } from "@/utils";

type EncryptedTextProps = {
  text: string;
  className?: string;
  /**
   * Time in milliseconds between revealing each subsequent real character.
   * Lower is faster. Defaults to 50ms per character.
   */
  revealDelayMs?: number;
  /** Optional custom character set to use for the gibberish effect. */
  charset?: string;
  /**
   * Time in milliseconds between gibberish flips for unrevealed characters.
   * Lower is more jittery. Defaults to 50ms.
   */
  flipDelayMs?: number;
  /** CSS class for styling the encrypted/scrambled characters */
  encryptedClassName?: string;
  /** CSS class for styling the revealed characters */
  revealedClassName?: string;
};

const DEFAULT_CHARSET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-={}[];:,.<>/?";

function generateRandomCharacter(charset: string): string {
  const index = Math.floor(Math.random() * charset.length);
  return charset.charAt(index);
}

function generateGibberishPreservingSpaces(
  original: string,
  charset: string,
): string {
  if (!original) return "";
  let result = "";
  for (let i = 0; i < original.length; i += 1) {
    const ch = original[i];
    result += ch === " " ? " " : generateRandomCharacter(charset);
  }
  return result;
}

const EncryptedTextInner: React.FC<{
  text: string;
  className?: string;
  revealDelayMs: number;
  charset: string;
  flipDelayMs: number;
  encryptedClassName?: string;
  revealedClassName?: string;
  initialScrambleChars: string[];
}> = ({
  text,
  className,
  revealDelayMs,
  charset,
  flipDelayMs,
  encryptedClassName,
  revealedClassName,
  initialScrambleChars,
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  const [revealCount, setRevealCount] = useState<number>(0);
  const [scrambleChars, setScrambleChars] =
    useState<string[]>(initialScrambleChars);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastFlipTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!isInView) return;

    startTimeRef.current = performance.now();
    lastFlipTimeRef.current = startTimeRef.current;
    
    // Use setTimeout to avoid synchronous setState in effect
    const timeoutId = setTimeout(() => {
      setScrambleChars(initialScrambleChars);
      setRevealCount(0);
    }, 0);

    let isCancelled = false;

    const update = (now: number) => {
      if (isCancelled) return;

      const elapsedMs = now - startTimeRef.current;
      const totalLength = text.length;
      const currentRevealCount = Math.min(
        totalLength,
        Math.floor(elapsedMs / Math.max(1, revealDelayMs)),
      );

      setRevealCount(currentRevealCount);

      if (currentRevealCount >= totalLength) {
        return;
      }

      // Re-randomize unrevealed scramble characters on an interval
      const timeSinceLastFlip = now - lastFlipTimeRef.current;
      if (timeSinceLastFlip >= Math.max(0, flipDelayMs)) {
        setScrambleChars((prev) => {
          const newChars = [...prev];
          for (let index = 0; index < totalLength; index += 1) {
            if (index >= currentRevealCount) {
              if (text[index] !== " ") {
                newChars[index] = generateRandomCharacter(charset);
              } else {
                newChars[index] = " ";
              }
            }
          }
          return newChars;
        });
        lastFlipTimeRef.current = now;
      }

      animationFrameRef.current = requestAnimationFrame(update);
    };

    animationFrameRef.current = requestAnimationFrame(update);

    return () => {
      isCancelled = true;
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      clearTimeout(timeoutId);
    };
  }, [isInView, text, revealDelayMs, charset, flipDelayMs, initialScrambleChars]);

  if (!text) return null;

  return (
    <motion.span
      ref={ref}
      className={cn(className)}
      aria-label={text}
      role="text"
    >
      {text.split("").map((char, index) => {
        const isRevealed = index < revealCount;
        const displayChar = isRevealed
          ? char
          : char === " "
            ? " "
            : (scrambleChars[index] ?? generateRandomCharacter(charset));

        return (
          <span
            key={index}
            className={cn(isRevealed ? revealedClassName : encryptedClassName)}
          >
            {displayChar}
          </span>
        );
      })}
    </motion.span>
  );
};

export const EncryptedText: React.FC<EncryptedTextProps> = ({
  text,
  className,
  revealDelayMs = 50,
  charset = DEFAULT_CHARSET,
  flipDelayMs = 50,
  encryptedClassName,
  revealedClassName,
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [initialScrambleChars, setInitialScrambleChars] = useState<string[]>([]);

  // Set mounted flag only once on client
  // This is necessary to avoid hydration mismatch - server renders plain text,
  // client renders encrypted animation after mount
  useEffect(() => {
    // This setState in effect is intentional to prevent hydration mismatch
    startTransition(() => {
      setIsMounted(true);
    });
  }, []);

  // Generate scramble chars only on client after mount
  // This setState in effect is intentional to prevent hydration mismatch
  useEffect(() => {
    if (isMounted && text) {
      // This setState in effect is intentional to prevent hydration mismatch
      startTransition(() => {
        setInitialScrambleChars(generateGibberishPreservingSpaces(text, charset).split(""));
      });
    }
  }, [isMounted, text, charset]);

  if (!text) return null;

  // On server, render plain text to avoid hydration mismatch
  if (!isMounted || initialScrambleChars.length === 0) {
    return <span className={className}>{text}</span>;
  }

  return (
    <EncryptedTextInner
      key={`${text}-${charset}`}
      text={text}
      className={className}
      revealDelayMs={revealDelayMs}
      charset={charset}
      flipDelayMs={flipDelayMs}
      encryptedClassName={encryptedClassName}
      revealedClassName={revealedClassName}
      initialScrambleChars={initialScrambleChars}
    />
  );
};

