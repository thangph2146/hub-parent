"use client";

import Image from "next/image";
import { ReactNode, useRef } from "react";
import type { ContentCardButton } from "./content-card";
import { Flex } from "@/components/ui/flex";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { TypographySpanSmall } from "@/components/ui/typography";
import { ArrowRight } from "lucide-react";
import { FlipWords } from "@/components/ui/flip-words";
import { useSectionHeight } from "@/hooks/use-section-height";
import { ScrollIndicator } from "./scroll-indicator";

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
  const { sectionHeightClassName, sectionHeightStyle, scrollToNextSection } = useSectionHeight({
    minHeight: 0, // Không dùng minHeight để đảm bảo height chính xác là 100dvh - header
    fullHeight: true,
  });

  return (
    <Flex
      as="section"
      ref={sectionRef}
      data-hero-section="true"
      fullWidth
      position="relative"
      overflow="hidden"
      className={cn(sectionHeightClassName, className)}
      style={sectionHeightStyle}
    >
      {/* Background Image with Zoom Effect */}
      <Flex position="absolute" className="inset-0 z-0">
        <Image
          src={backgroundImage.src}
          alt={backgroundImage.alt}
          width={backgroundImage.width || 1920}
          height={backgroundImage.height || 1080}
          className="w-full h-full object-cover object-[center_bottom] animate-in fade-in zoom-in-105 duration-[2s]"
          priority
          fetchPriority="high"
          sizes="100vw"
          quality={100}
        />
      </Flex>

      {/* Content Overlay */}
      <Flex
        align="center"
        justify="start"
        position="absolute"
        container
        padding="responsive"
        className="inset-0 z-20 h-full overflow-hidden"
      >
          <Flex direction="col" gap={4} className={cn("relative px-4 py-5 sm:px-5 sm:py-6 md:px-8 md:py-10 lg:px-10 lg:py-12 rounded-2xl backdrop-blur-xl bg-gradient-to-br from-black/60 via-black/50 to-black/40 border border-white/30 shadow-[0_20px_60px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.1)_inset] hover:shadow-[0_20px_80px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.15)_inset] transition-all duration-500 [text-shadow:_0_2px_8px_rgba(0,0,0,0.8),_0_0_20px_rgba(0,0,0,0.5)] before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/10 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500", overlayClassName)}>
            {/* Title with enhanced glow and depth */}
            <h1
              className={cn(
                "text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-white leading-[1.15] tracking-tight drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] animate-in fade-in slide-in-from-bottom-4 duration-[600ms] delay-[300ms]",
                titleClassName
              )}
            >
              <span >
                {title}
              </span>
              <br />
              <span className="relative inline-block">
                <span>
                  <FlipWords
                    words={["Kết nối", "Đồng hành", "Phát triển", "Vươn xa"]}
                    className="p-0 text-inherit"
                  />
                </span>
              </span>
            </h1>

            {/* Description with premium backdrop */}
            <div className="relative max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-[600ms] delay-[400ms]">
              <p
                className={cn(
                  "relative text-sm md:text-base lg:text-lg text-white/95 leading-relaxed tracking-normal font-normal drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]",
                  descriptionClassName
                )}
              >
                {description}
              </p>
            </div>

            {/* Buttons with animated gradient border */}
            {buttons && buttons.length > 0 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-[600ms] delay-[500ms]">
                <Flex gap={4} wrap={true} className="mt-2">
                  {buttons.map((btn, index) => (
                    <div 
                      key={index} 
                      className="relative group animate-in fade-in slide-in-from-bottom-2 duration-[400ms]"
                      style={{
                        animationDelay: `${600 + index * 100}ms`
                      }}
                    >
                      {/* Animated gradient border for primary button */}
                      {btn.variant === "default" && (
                        <div className="absolute -inset-[2px] bg-gradient-to-r from-primary via-blue-500 to-primary rounded-xl opacity-75 blur-md group-hover:opacity-100 group-hover:blur-lg transition-all duration-300" />
                      )}
                      <Button
                        variant={btn.variant || "default"}
                        size={btn.size || "lg"}
                        className={cn(
                          "relative min-w-[140px] h-12 text-base font-semibold transition-all duration-300 rounded-xl",
                          btn.variant === "default" &&
                          "bg-primary hover:bg-primary/95 text-primary-foreground border-none shadow-2xl shadow-primary/40 hover:shadow-primary/60",
                          btn.variant === "outline" &&
                          "bg-white/10 backdrop-blur-lg border-2 border-white/40 text-white hover:bg-white/20 hover:border-white/60 shadow-lg hover:shadow-xl"
                        )}
                        asChild
                      >
                        <Link href={btn.href}>
                          <Flex align="center" gap={2}>
                            {btn.leftIcon}
                            {btn.responsiveText ? (
                              <>
                                <TypographySpanSmall className="hidden xs:inline">
                                  {btn.responsiveText.desktop}
                                </TypographySpanSmall>
                                <TypographySpanSmall className="xs:hidden">
                                  {btn.responsiveText.mobile}
                                </TypographySpanSmall>
                              </>
                            ) : (
                              <TypographySpanSmall>{btn.text}</TypographySpanSmall>
                            )}
                            {btn.rightIcon}
                            {btn.showArrowRight && !btn.rightIcon && (
                              <ArrowRight className="transition-transform duration-200 group-hover:translate-x-0.5" />
                            )}
                          </Flex>
                        </Link>
                      </Button>
                    </div>
                  ))}
                </Flex>
              </div>
            )}

            {children}
          </Flex>
      </Flex>

      <ScrollIndicator variant="light" onScroll={() => scrollToNextSection(sectionRef.current)} />
    </Flex>
  );
}


