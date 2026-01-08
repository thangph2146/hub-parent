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
import { TypographyH1, TypographyP } from "@/components/ui/typography";
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
  const { sectionHeightClassName, sectionHeightStyle } = useSectionHeight({
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
      <Flex
        align="center"
        justify="start"
        position="absolute"
        container
        padding="responsive"
        className="inset-0 z-20 h-full"
      >
        <Flex
          direction="col"
          gap={4}
          className={cn(
            "relative max-w-2xl p-8 sm:p-12 rounded-3xl backdrop-blur-2xl bg-black/60 border border-white/20 shadow-2xl transition-all duration-500",
            overlayClassName
          )}
        >
          <Flex direction="col" gap={3}>
            <TypographyH1
              className={cn(
                "text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-700 text-balance uppercase",
                titleClassName
              )}
            >
              {title}
              <br />
              <FlipWords
                words={["Kết nối", "Đồng hành", "Phát triển", "Vươn xa"]}
                className="p-0 text-inherit"
              />
            </TypographyH1>
            <TypographyP className="text-white/80 text-sm sm:text-base font-medium italic animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
              &quot;Tâm an lòng, con vững bước – Đồng hành cùng tương lai con tại HUB&quot;
            </TypographyP>
          </Flex>

          <TypographyP
            className={cn(
              "text-base sm:text-lg lg:text-xl text-white/90 leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200",
              descriptionClassName
            )}
          >
            {description}
          </TypographyP>

          {buttons && buttons.length > 0 && (
            <Flex
              gap={4}
              wrap
              className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200"
            >
              {buttons.map((btn, index) => (
                <Button
                  key={index}
                  variant={btn.variant || "default"}
                  size="lg"
                  className={cn(
                    "min-w-[140px] rounded-xl font-semibold transition-all hover:scale-105",
                    btn.variant === "default"
                      ? "bg-primary shadow-lg shadow-primary/30"
                      : "bg-white/10 border-white/30 text-white hover:bg-white/20"
                  )}
                  asChild
                >
                  <Link href={btn.href} prefetch={false}>
                    <Flex align="center" gap={2}>
                      {btn.leftIcon}
                      {btn.responsiveText ? (
                        <>
                          <span className="hidden xs:inline">
                            {btn.responsiveText.desktop}
                          </span>
                          <span className="xs:hidden">
                            {btn.responsiveText.mobile}
                          </span>
                        </>
                      ) : (
                        <span>{btn.text}</span>
                      )}
                      {btn.rightIcon ||
                        (btn.showArrowRight && (
                          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        ))}
                    </Flex>
                  </Link>
                </Button>
              ))}
            </Flex>
          )}

          {children}
        </Flex>
      </Flex>

      <ScrollIndicator variant="light" containerRef={sectionRef} />
    </Flex>
  );
};
