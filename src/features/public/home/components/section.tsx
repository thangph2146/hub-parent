import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { Flex } from "@/components/ui/flex";

export interface SectionProps {
  children: ReactNode;
  className?: string;
  padding?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "responsive" | "responsive-y" | "responsive-full" | "responsive-lg";
  background?: string;
  containerClassName?: string;
}

export const Section = ({
  children,
  className,
  padding: _padding = "responsive-y",
  background = "bg-card",
  containerClassName,
}: SectionProps) => {
  return (
    <section className={cn("w-full", background, className)}>
      <Flex
        direction="col"
        gap={12}
        container
        padding="responsive"
        className={containerClassName}
      >
        {children}
      </Flex>
    </section>
  );
}

