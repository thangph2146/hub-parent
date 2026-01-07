"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { ReactNode, useRef } from "react";
import { ContentCard } from "./content-card";
import { Flex } from "@/components/ui/flex";
import { motion, useInView } from "framer-motion";

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
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
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
        {/* Content with glassmorphism effect and gradient border */}
        <motion.div
          className="flex-1 lg:max-w-lg xl:max-w-xl w-full group/card"
          initial={{ opacity: 0, x: reverse ? 30 : -30 }}
          animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: reverse ? 30 : -30 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
        >
          <div className="relative p-[1px] rounded-xl bg-gradient-to-br from-primary/20 via-border to-primary/10 group-hover/card:from-primary/40 group-hover/card:to-primary/20 transition-all duration-300">
            <div className="backdrop-blur-sm bg-background/95 dark:bg-background/90 rounded-xl shadow-lg group-hover/card:shadow-xl transition-shadow duration-300">
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
            </div>
          </div>
        </motion.div>

        {/* Image with hover zoom effect */}
        <motion.div
          className={cn(
            "relative overflow-hidden w-full lg:flex-1 rounded-xl shadow-xl group cursor-pointer",
            imageHeight
          )}
          initial={{ opacity: 0, x: reverse ? -30 : 30 }}
          animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: reverse ? -30 : 30 }}
          transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
          whileHover={{ scale: 1.02 }}
        >
          <Image
            src={image.src}
            alt={image.alt}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
            fetchPriority="high"
            quality={75}
          />
          {/* Subtle gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </motion.div>
      </Flex>
    </motion.div>
  );
}

