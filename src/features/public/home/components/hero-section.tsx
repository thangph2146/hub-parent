"use client";

import Image from "next/image";
import { ReactNode, useRef } from "react";
import type { ContentCardButton } from "./content-card";
import { Flex } from "@/components/ui/flex";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FlipWords } from "@/components/ui/flip-words";
import { useSectionHeight } from "@/hooks/use-section-height";
import { useClientOnly } from "@/hooks/use-client-only";
import { ScrollIndicator } from "./scroll-indicator";
import { HOME_RESPONSIVE_CONDITIONS } from "../constants";

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
  const sectionRef = useRef<HTMLDivElement>(null);
  const isMounted = useClientOnly();
  const { sectionHeightClassName, sectionHeightStyle, scrollToNextSection } = useSectionHeight({
    minHeight: 0,
    fullHeight: true,
  });

  return (
    <Flex
      as="section"
      ref={sectionRef}
      fullWidth
      position="relative"
      overflow="hidden"
      className={cn(sectionHeightClassName, className)}
      style={sectionHeightStyle}
    >
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src={backgroundImage.src}
          alt={backgroundImage.alt}
          fill
          className="object-cover object-[center_bottom] animate-in fade-in zoom-in-105 duration-[2s]"
          priority
          quality={100}
        />
      </div>

      {/* Content Overlay */}
      <Flex align="center" justify="start" position="absolute" container padding="responsive" className="inset-0 z-20 h-full">
        <Flex 
          direction="col" 
          gap={6} 
          className={cn(
            "relative max-w-2xl p-6 sm:p-10 rounded-2xl backdrop-blur-xl bg-black/50 border border-white/20 shadow-2xl transition-all duration-500",
            overlayClassName
          )}
        >
          <h1 className={cn("text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white leading-tight tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-700", titleClassName)}>
            {title}<br />
            <FlipWords words={["Kết nối", "Đồng hành", "Phát triển", "Vươn xa"]} className="p-0 text-inherit" />
          </h1>

          <p className={cn("text-sm sm:text-base lg:text-lg text-white/90 leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100", descriptionClassName)}>
            {description}
          </p>

          {buttons && buttons.length > 0 && (
            <Flex gap={4} wrap className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
              {buttons.map((btn, index) => (
                <Button
                  key={index}
                  variant={btn.variant || "default"}
                  size="lg"
                  className={cn(
                    "min-w-[140px] rounded-xl font-semibold transition-all hover:scale-105",
                    btn.variant === "default" ? "bg-primary shadow-lg shadow-primary/30" : "bg-white/10 border-white/30 text-white hover:bg-white/20"
                  )}
                  asChild
                >
                  <Link href={btn.href}>
                    <Flex align="center" gap={2}>
                      {btn.leftIcon}
                      {btn.responsiveText ? (
                        <>
                          <span className="hidden xs:inline">{btn.responsiveText.desktop}</span>
                          <span className="xs:hidden">{btn.responsiveText.mobile}</span>
                        </>
                      ) : (
                        <span>{btn.text}</span>
                      )}
                      {btn.rightIcon || (btn.showArrowRight && <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />)}
                    </Flex>
                  </Link>
                </Button>
              ))}
            </Flex>
          )}

          {children}
        </Flex>
      </Flex>

      {typeof window !== "undefined" && HOME_RESPONSIVE_CONDITIONS.showScrollIndicator(window.innerWidth, window.innerHeight) && (
        <ScrollIndicator variant="light" onScroll={() => scrollToNextSection(sectionRef.current)} />
      )}
    </Flex>
  );
}
