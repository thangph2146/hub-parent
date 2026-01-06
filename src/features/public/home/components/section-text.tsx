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

export interface ParagraphItem {
  text: string;
  className?: string;
}

export interface SectionTextProps {
  title: string;
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
    <Flex direction="col" gap={2} className={className} ref={containerRef}>
      {renderTitle()}
      <Flex direction="col" gap={2} className={contentClassName}>
        {paragraphs && paragraphs.length > 0 && (
          <>
            {paragraphs.map((item, index) => {
              const paragraphContent = typeof item === "string" ? item : item.text;
              const paragraphClassName = typeof item === "string" ? undefined : item.className;
              const isHighlighted = typeof item === "object" && item.className?.includes("text-secondary");
              
              // Override text size to make it slightly larger
              const textSizeClass = "text-sm sm:text-base md:text-lg";
              const combinedClassName = paragraphClassName 
                ? `${textSizeClass} ${paragraphClassName}` 
                : textSizeClass;

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

              const paragraphWrapper = isHighlighted ? (
                <PointerHighlight
                  containerClassName="w-full"
                  rectangleClassName="border-primary/40 dark:border-primary/30"
                  pointerClassName="text-primary/60 dark:text-primary/40"
                >
                  <TypographyP className={combinedClassName}>
                    {paragraphContentElement}
                  </TypographyP>
                </PointerHighlight>
              ) : (
                <TypographyP className={combinedClassName}>
                  {paragraphContentElement}
                </TypographyP>
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

