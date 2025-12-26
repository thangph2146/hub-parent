import { ReactNode } from "react";
import { TypographyH2, TypographyP } from "@/components/ui/typography";
import { Flex } from "@/components/ui/flex";

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
    <Flex direction="col" gap={2} className={className}>
      <TypographyH2 className={titleClassName}>
        {title}
      </TypographyH2>
      <Flex direction="col" gap={2} className={contentClassName}>
        {paragraphs && paragraphs.length > 0 && (
          <>
            {paragraphs.map((item, index) => {
              if (typeof item === "string") {
                return (
                  <TypographyP key={index}>
                    {item}
                  </TypographyP>
                );
              }
              return (
                <TypographyP
                  key={index}
                  className={item.className}
                >
                  {item.text}
                </TypographyP>
              );
            })}
          </>
        )}
        {children}
      </Flex>
    </Flex>
  );
}

