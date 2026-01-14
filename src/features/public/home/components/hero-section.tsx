import Image from "next/image";
import { ReactNode } from "react";
import type { ContentCardButton } from "./content-card";
import { Flex } from "@/components/ui/flex";
import { cn } from "@/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FlipWords } from "@/components/ui/flip-words";
import { TypographyH1, TypographyP } from "@/components/ui/typography";
import { ScrollIndicator } from "./scroll-indicator";

export type HeroButton = ContentCardButton;

export interface HeroSectionProps {
  title: string;
  description: string;
  flipWords?: string[];
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
  flipWords,
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
      className={cn(
        "min-h-[100svh] lg:h-[calc(100vh-56px)]", // CSS-only height to avoid JS execution delay
        "w-full relative overflow-hidden",
        className
      )}
    >
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src={backgroundImage.src}
          alt={backgroundImage.alt}
          fill
          className="object-cover object-[center_bottom]"
          priority
          fetchPriority="high"
          quality={75}
          sizes="100vw"
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
            "relative max-w-2xl p-8 sm:p-12 rounded-3xl bg-black/60 border border-white/20 shadow-2xl",
            overlayClassName
          )}
        >
          <TypographyH1
            className={cn(
              "text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight tracking-tight text-balance uppercase",
              titleClassName
            )}
          >
            {title}
          </TypographyH1>
          
          {flipWords && flipWords.length > 0 && (
            <div className="text-2xl sm:text-3xl lg:text-5xl font-extrabold text-primary flex items-center gap-3">
              <FlipWords words={flipWords} className="text-primary" />
            </div>
          )}

          <TypographyP
            className={cn(
              "text-sm sm:text-base lg:text-lg text-white/90 leading-relaxed text-balance",
              descriptionClassName
            )}
          >
            {description}
          </TypographyP>

          {buttons && buttons.length > 0 && (
            <Flex gap={4} wrap>
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

      <ScrollIndicator variant="light" />
    </Flex>
  );
};
