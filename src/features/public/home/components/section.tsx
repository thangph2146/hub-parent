import { ReactNode } from "react";
import { Flex } from "@/components/ui/flex";

export interface SectionProps {
  children: ReactNode;
  className?: string;
  padding?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "responsive" | "responsive-y" | "responsive-full" | "responsive-lg";
  background?: "card" | "background" | "muted" | "none";
  containerClassName?: string;
}

export const Section = ({
  children,
  className,
  padding = "responsive-y",
  background = "card",
  containerClassName,
}: SectionProps) => {
  return (
    <Flex
      as="section"
      fullWidth
      bg={background}
      className={className}
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
}

