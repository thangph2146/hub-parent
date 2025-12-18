import { cn } from "@/lib/utils";
import Image from "next/image";
import { ReactNode } from "react";
import { ContentCard } from "./content-card";
import { typography } from "@/lib/typography";

// Cấu hình mặc định cho text - sử dụng shared typography
const DEFAULT_TITLE_CLASSES = `${typography.title.default} text-primary`;
const DEFAULT_DESCRIPTION_CLASSES = `${typography.body.small} text-card-foreground`;
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
    <div
      className={cn(
        "flex flex-col lg:flex-row gap-8 lg:gap-16 items-center",
        reverse && "lg:flex-row-reverse",
        className
      )}
    >
      {/* Content */}
      <div className="flex-1 w-full lg:max-w-lg xl:max-w-xl">
        <ContentCard
          title={title}
          description={description}
          button={button ? {
            ...button,
            showArrowRight: true,
          } : undefined}
          titleClassName={titleClassName || DEFAULT_TITLE_CLASSES}
          descriptionClassName={descriptionClassName || DEFAULT_DESCRIPTION_CLASSES}
          titleDefaultClasses={DEFAULT_TITLE_CLASSES}
          descriptionDefaultClasses={DEFAULT_DESCRIPTION_CLASSES}
        >
          {children}
        </ContentCard>
      </div>

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
        />
      </div>
    </div>
  );
}

