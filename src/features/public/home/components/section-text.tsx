import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { typography } from "@/lib/typography";

// Cấu hình mặc định cho text - sử dụng shared typography
const DEFAULT_TITLE_CLASSES = `${typography.title.default} text-card-foreground`;
const DEFAULT_CONTENT_CLASSES = `${typography.body.medium} leading-relaxed`;
const DEFAULT_PARAGRAPH_CLASSES = "mb-2";

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
}

export const SectionText = ({
  title,
  children,
  paragraphs,
  titleClassName,
  contentClassName,
  className,
}: SectionTextProps) => {
  return (
    <div className={className}>
      <h2 className={cn("mb-2 sm:text-left", titleClassName || DEFAULT_TITLE_CLASSES)}>
        {title}
      </h2>
      <div className={cn(contentClassName || DEFAULT_CONTENT_CLASSES)}>
        {paragraphs && paragraphs.length > 0 && (
          <>
            {paragraphs.map((item, index) => {
              if (typeof item === "string") {
                return (
                  <p key={index} className={DEFAULT_PARAGRAPH_CLASSES}>
                    {item}
                  </p>
                );
              }
              return (
                <p
                  key={index}
                  className={cn(DEFAULT_PARAGRAPH_CLASSES, item.className)}
                >
                  {item.text}
                </p>
              );
            })}
          </>
        )}
        {children}
      </div>
    </div>
  );
}

