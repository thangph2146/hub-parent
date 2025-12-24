import { cn } from "@/lib/utils";
import Image from "next/image";
import { ReactNode } from "react";
import { ContentCard } from "./content-card";
import type { ContentCardButton } from "./content-card";
import { Flex } from "@/components/ui/flex";
// Cấu hình mặc định
const DEFAULT_MIN_HEIGHT = "min-h-[300px] sm:min-h-[350px] lg:min-h-[400px] xxl:min-h-[500px]";

export type HeroButton = ContentCardButton;

export interface HeroSectionProps {
  title: string;
  description: string;
  backgroundImage: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
  };
  buttons?: HeroButton[];
  minHeight?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  overlayClassName?: string;
  className?: string;
  children?: ReactNode;
}

export const HeroSection = ({
  title,
  description,
  backgroundImage,
  buttons,
  minHeight = DEFAULT_MIN_HEIGHT,
  titleClassName,
  descriptionClassName,
  overlayClassName,
  className,
  children,
}: HeroSectionProps) => {
  return (
    <section
      className={cn(
        "w-full relative overflow-hidden",
        minHeight,
        className
      )}
    >
      {/* Background Image */}
      <Flex className="absolute inset-0 z-0">
        <Image
          src={backgroundImage.src}
          alt={backgroundImage.alt}
          width={backgroundImage.width || 1920}
          height={backgroundImage.height || 1080}
          className="w-full h-full object-cover"
          priority
          fetchPriority="high"
          sizes="100vw"
          quality={75}
        />
      </Flex>

      {/* Text Overlay Box */}
      <Flex align="center" justify="start" className="absolute inset-0 container mx-auto z-30 px-4 sm:px-6 lg:px-8">
        <ContentCard
          title={title}
          description={description}
          buttons={buttons}
          cardClassName={cn(
            "w-full bg-white/90 backdrop-blur-md rounded-xl p-4 sm:p-6 lg:p-8 gap-0 max-w-sm md:max-w-md lg:max-w-lg shadow-xl border border-white/20",
            overlayClassName
          )}
          headerClassName="px-0"
          titleClassName={cn("mb-3 sm:mb-4 text-slate-900", titleClassName)}
          descriptionClassName={cn("mb-4 sm:mb-6 text-slate-700", descriptionClassName)}
          contentClassName="px-0"
        >
          {children}
        </ContentCard>
      </Flex>
    </section>
  );
}
