import Image from "next/image";
import { ReactNode } from "react";
import { ContentCard } from "./content-card";
import type { ContentCardButton } from "./content-card";
import { Flex } from "@/components/ui/flex";

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
  titleClassName,
  descriptionClassName,
  overlayClassName,
  className,
  children,
}: HeroSectionProps) => {
  return (
    <Flex
      as="section"
      fullWidth
      position="relative"
      overflow="hidden"
      height="hero"
      className={className}
    >
      {/* Background Image */}
      <Flex position="absolute" className="inset-0 z-0">
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
      <Flex align="center" justify="start" position="absolute" container padding="responsive" className="inset-0 z-30">
        <ContentCard
          title={title}
          description={description}
          buttons={buttons}
          cardOverlay="white-90"
          cardMaxWidth="hero"
          cardPadding="hero"
          cardClassName={overlayClassName}
          headerClassName="px-0"
          titleClassName={titleClassName}
          descriptionClassName={descriptionClassName}
          contentClassName="px-0"
        >
          {children}
        </ContentCard>
      </Flex>
    </Flex>
  );
}
