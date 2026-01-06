import { cn } from "@/lib/utils";
import Image from "next/image";
import { ReactNode } from "react";
import { ContentCard } from "./content-card";
import { Flex } from "@/components/ui/flex";

const DEFAULT_IMAGE_HEIGHT = "h-[200px] sm:h-[250px] lg:h-[350px] xl:h-[400px]";

export interface SectionWithImageProps {
  title: string;
  description: string;
  image: {
    src: string;
    alt: string;
  };
  button?: {
    href: string;
    text: string;
    variant?: "default" | "outline" | "destructive" | "secondary" | "ghost" | "link";
    size?: "default" | "sm" | "lg" | "icon";
  };
  reverse?: boolean;
  titleClassName?: string;
  descriptionClassName?: string;
  imageHeight?: string;
  className?: string;
  children?: ReactNode;
}

export const SectionWithImage = ({
  title,
  description,
  image,
  button,
  reverse = false,
  titleClassName,
  descriptionClassName,
  imageHeight = DEFAULT_IMAGE_HEIGHT,
  className,
  children,
}: SectionWithImageProps) => {
  return (
    <Flex
      direction="col"
      align="center"
      fullWidth
      gap={6}
      className={cn(
        "lg:flex-row lg:gap-8",
        reverse && "lg:flex-row-reverse",
        className
      )}
    >
      {/* Content */}
      <Flex direction="col" fullWidth className="flex-1 lg:max-w-lg xl:max-w-xl">
        <ContentCard
          title={title}
          description={description}
          button={button ? {
            ...button,
            showArrowRight: true,
          } : undefined}
          titleClassName={titleClassName}
          descriptionClassName={descriptionClassName}
        >
          {children}
        </ContentCard>
      </Flex>

      {/* Image */}
      <div
        className={cn(
          "relative overflow-hidden w-full lg:flex-1 rounded-lg",
          imageHeight
        )}
      >
        <Image
          src={image.src}
          alt={image.alt}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
          fetchPriority="high"
          quality={75}
        />
      </div>
    </Flex>
  );
}

