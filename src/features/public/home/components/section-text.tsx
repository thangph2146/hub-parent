"use client";

import { ReactNode } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { TypographyH2, TypographyP } from "@/components/ui/typography";
import { Flex } from "@/components/ui/flex";
import { PointerHighlight } from "@/components/ui/pointer-highlight";
import { FlipWords } from "@/components/ui/flip-words";
import { ContainerTextFlip } from "@/components/ui/container-text-flip";
import { EncryptedText } from "@/components/ui/encrypted-text";
import { cn } from "@/lib/utils";
import { Quote } from "lucide-react";

export interface ParagraphItem {
  text: string;
  className?: string;
}

export interface SectionTextProps {
  title: ReactNode | string;
  children?: ReactNode;
  paragraphs?: (string | ParagraphItem)[];
  titleClassName?: string;
  contentClassName?: string;
  className?: string;
  /** Từ để flip trong title (sử dụng FlipWords) */
  titleFlipWords?: string[];
  /** Sử dụng ContainerTextFlip cho một phần của title */
  titleContainerFlipWords?: string[];
  /** Có sử dụng PointerHighlight cho title không */
  usePointerHighlight?: boolean;
  /** Có sử dụng FlipWords cho title không */
  useFlipWords?: boolean;
  /** Có sử dụng ContainerTextFlip cho title không */
  useContainerTextFlip?: boolean;
  /** Có bật animation cho content không */
  animateContent?: boolean;
  /** Có sử dụng EncryptedText cho paragraphs không */
  useEncryptedText?: boolean;
  /** Thời gian delay giữa các ký tự khi reveal (ms) */
  encryptedRevealDelayMs?: number;
  /** Thời gian delay giữa các lần flip gibberish (ms) */
  encryptedFlipDelayMs?: number;
}

export const SectionText = ({
  title,
  children,
  paragraphs,
  titleClassName,
  contentClassName,
  className,
  titleFlipWords,
  titleContainerFlipWords,
  usePointerHighlight = true,
  useFlipWords = false,
  useContainerTextFlip = false,
  animateContent = true,
  useEncryptedText = false,
  encryptedRevealDelayMs = 30,
  encryptedFlipDelayMs = 50,
}: SectionTextProps) => {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  // Tách title thành phần tĩnh và phần động nếu có FlipWords
  const renderTitle = () => {
    let titleContent: ReactNode = title;

    // Check if title is string before applying string manipulations
    if (typeof title === "string") {
      // Nếu sử dụng ContainerTextFlip
      if (useContainerTextFlip && titleContainerFlipWords && titleContainerFlipWords.length > 0) {
        // Tìm vị trí của từ đầu tiên trong titleContainerFlipWords trong title
        const firstWord = titleContainerFlipWords[0];
        const wordIndex = title.indexOf(firstWord);

        if (wordIndex !== -1) {
          const beforeWord = title.substring(0, wordIndex);
          const afterWord = title.substring(wordIndex + firstWord.length);

          titleContent = (
            <>
              {beforeWord}
              <ContainerTextFlip
                words={titleContainerFlipWords}
                interval={3000}
                className="mx-1 text-2xl md:text-3xl pt-1 pb-1.5 rounded-md"
                textClassName="text-inherit font-semibold"
              />
              {afterWord}
            </>
          );
        }
      }
      // Nếu sử dụng FlipWords
      else if (useFlipWords && titleFlipWords && titleFlipWords.length > 0) {
        // Tách title thành phần tĩnh và phần động
        const words = title.split(" ");
        const staticPart = words.slice(0, -1).join(" ");

        titleContent = (
          <>
            {staticPart && <span>{staticPart} </span>}
            <FlipWords
              words={titleFlipWords}
              duration={3000}
              className="text-primary"
            />
          </>
        );
      }
    }

    const titleElement = (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <TypographyH2 className={titleClassName}>
          {titleContent}
        </TypographyH2>
      </motion.div>
    );

    // Wrap với PointerHighlight nếu được bật
    if (usePointerHighlight) {
      return (
        <PointerHighlight
          containerClassName="w-fit"
          rectangleClassName="border-primary/50"
          pointerClassName="text-primary"
        >
          {titleElement}
        </PointerHighlight>
      );
    }

    return titleElement;
  };

  return (
    <Flex direction="col" gap={2} className={cn("relative", className)} ref={containerRef}>
      {/* Background decorative orb */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      {/* Title with decorative accent */}
      <div className="relative">
        {/* Accent line */}
        <motion.div
          className="absolute -left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-primary/50 to-transparent rounded-full"
          initial={{ height: 0 }}
          animate={isInView ? { height: "100%" } : { height: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        />
        {renderTitle()}
      </div>
      <Flex direction="col" gap={2} className={contentClassName}>
        {paragraphs && paragraphs.length > 0 && (
          <>
            {paragraphs.map((item, index) => {
              const paragraphContent = typeof item === "string" ? item : item.text;
              const paragraphClassName = typeof item === "string" ? undefined : item.className;
              const isHighlighted = typeof item === "object" && item.className?.includes("text-secondary");

              // Premium typography configuration
              const baseParagraphStyles = "leading-relaxed tracking-wide text-muted-foreground transition-colors duration-300";
              const textSizeClass = "text-base sm:text-lg"; // Consistent readable size

              const combinedClassName = cn(
                textSizeClass,
                baseParagraphStyles,
                paragraphClassName
              );

              const paragraphContentElement = useEncryptedText ? (
                <EncryptedText
                  text={paragraphContent}
                  revealDelayMs={encryptedRevealDelayMs}
                  flipDelayMs={encryptedFlipDelayMs}
                  className="inline"
                />
              ) : (
                paragraphContent
              );

              /* 
                 HIGHLIGHTED PARAGRAPH DESIGN:
                 - Glassmorphic card
                 - Gradient border effect
                 - Icon for visual anchor
                 - Hover lift interaction
              */
              const paragraphWrapper = isHighlighted ? (
                <div className="group relative p-5 sm:p-6 rounded-xl bg-gradient-to-br from-white/5 to-transparent border border-primary/10 hover:border-primary/30 shadow-sm hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1">
                  <Flex gap={4} align="start">
                    <div className="shrink-0 mt-1">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                        <Quote className="w-4 h-4 fill-primary/20" />
                      </div>
                    </div>
                    <div>
                      <TypographyP className={cn(combinedClassName, "font-medium text-foreground/90")}>
                        {paragraphContentElement}
                      </TypographyP>
                    </div>
                  </Flex>

                  {/* Bottom gradient line */}
                  <div className="absolute bottom-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                </div>
              ) : (
                /* 
                   NORMAL PARAGRAPH DESIGN:
                   - Clean and elegant looks
                   - Subtle left border indicator on hover
                   - Text color brightens on hover
                */
                <div className="group relative pl-4 border-l-2 border-transparent hover:border-primary/30 transition-all duration-300">
                  <TypographyP className={cn(combinedClassName, "group-hover:text-foreground/80")}>
                    {paragraphContentElement}
                  </TypographyP>
                </div>
              );

              if (animateContent) {
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{
                      duration: 0.5,
                      delay: index * 0.1,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    {paragraphWrapper}
                  </motion.div>
                );
              }

              return (
                <div key={index}>
                  {paragraphWrapper}
                </div>
              );
            })}
          </>
        )}
        {children && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{
              duration: 0.5,
              delay: paragraphs ? paragraphs.length * 0.1 : 0,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {children}
          </motion.div>
        )}
      </Flex>
    </Flex>
  );
}

