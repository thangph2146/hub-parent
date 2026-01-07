import { ReactNode, forwardRef } from "react";
import { Flex } from "@/components/ui/flex";

export interface SectionProps {
  children: ReactNode;
  className?: string;
  padding?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "responsive" | "responsive-y" | "responsive-full" | "responsive-lg";
  background?: "card" | "background" | "muted" | "none";
  containerClassName?: string;
  style?: React.CSSProperties;
}

export const Section = forwardRef<HTMLDivElement, SectionProps>(({
  children,
  className,
  padding = "responsive-y",
  background = "card",
  containerClassName,
  style,
}, ref) => {
  return (
    <Flex
      as="section"
      ref={ref}
      fullWidth
      bg={background}
      className={className}
      style={style}
    >
      <Flex
        direction="col"
        gap={12}
        container
        padding={padding}
        className={containerClassName}
      >
        {children}
      </Flex>
    </Flex>
  );
});

Section.displayName = "Section";

