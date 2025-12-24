import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { Flex } from "@/components/ui/flex";

export interface SectionProps {
  children: ReactNode;
  className?: string;
  padding?: string;
  background?: string;
  containerClassName?: string;
}

export const Section = ({
  children,
  className,
  padding = "py-6",
  background = "bg-card",
  containerClassName,
}: SectionProps) => {
  return (
    <section className={cn("w-full", padding, background, className)}>
      <Flex
        direction="col"
        gap={12}
        className={cn(
          "container mx-auto px-4 sm:px-6 lg:px-8",
          containerClassName
        )}
      >
        {children}
      </Flex>
    </section>
  );
}

