import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { TypographyH2, TypographyP } from "@/components/ui/typography";

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
      <TypographyH2 className={cn("mb-2 sm:text-left text-card-foreground", titleClassName)}>
        {title}
      </TypographyH2>
      <div className={cn("leading-relaxed", contentClassName)}>
        {paragraphs && paragraphs.length > 0 && (
          <>
            {paragraphs.map((item, index) => {
              if (typeof item === "string") {
                return (
                  <TypographyP key={index} className="mb-2">
                    {item}
                  </TypographyP>
                );
              }
              return (
                <TypographyP
                  key={index}
                  className={cn("mb-2", item.className)}
                >
                  {item.text}
                </TypographyP>
              );
            })}
          </>
        )}
        {children}
      </div>
    </div>
  );
}

