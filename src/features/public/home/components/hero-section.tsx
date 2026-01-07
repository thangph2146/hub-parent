"use client";

import Image from "next/image";
import { ReactNode, useState, useEffect } from "react";
import type { ContentCardButton } from "./content-card";
import { Flex } from "@/components/ui/flex";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { IconSize, TypographySpanSmall } from "@/components/ui/typography";
import { ArrowRight, ChevronDown } from "lucide-react";
import { FlipWords } from "@/components/ui/flip-words";
import { motion } from "framer-motion";

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

// Floating particles component
const FloatingParticles = () => {
  const [particles, setParticles] = useState<Array<{
    id: number;
    size: number;
    x: number;
    y: number;
    duration: number;
    delay: number;
  }>>([]);

  useEffect(() => {
    // Generate particles only on the client side to avoid hydration mismatch
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setParticles(
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        size: Math.random() * 4 + 2,
        x: Math.random() * 100,
        y: Math.random() * 100,
        duration: Math.random() * 20 + 10,
        delay: Math.random() * 5,
      }))
    );
  }, []);

  return (
    <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-white/20"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

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
      className={cn("h-[calc(100dvh-55px)] min-h-[600px] w-full", className)}
    >
      {/* Background Image with Zoom Effect */}
      <Flex position="absolute" className="inset-0 z-0">
        <Image
          src={backgroundImage.src}
          alt={backgroundImage.alt}
          width={backgroundImage.width || 1920}
          height={backgroundImage.height || 1080}
          className="w-full h-full object-cover animate-in fade-in zoom-in-105 duration-[2s]"
          priority
          fetchPriority="high"
          sizes="100vw"
          quality={75}
        />
        {/* Multi-layer Gradient Overlay for depth and text contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/20 z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 z-10" />
        {/* Vignette overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] z-10" />
      </Flex>

      {/* Floating Particles */}
      <FloatingParticles />

      {/* Animated gradient orbs */}
      <motion.div
        className="absolute -top-40 -left-40 w-96 h-96 bg-primary/30 rounded-full blur-[100px] z-10"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-20 right-10 w-80 h-80 bg-blue-500/20 rounded-full blur-[80px] z-10"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      <motion.div
        className="absolute top-1/2 right-1/4 w-60 h-60 bg-purple-500/15 rounded-full blur-[60px] z-10"
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 20, 0],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
      />

      {/* Content Overlay */}
      <Flex
        align="center"
        justify="start"
        position="absolute"
        container
        padding="responsive"
        className="inset-0 z-20 h-full"
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <Flex direction="col" gap={6} className={cn("max-w-xl", overlayClassName)}>
            {/* Title with enhanced glow and depth */}
            <motion.h1
              className={cn(
                "text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.1] tracking-tight",
                titleClassName
              )}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <span className="relative inline-block drop-shadow-[0_0_25px_rgba(255,255,255,0.3)] [text-shadow:_2px_2px_8px_rgb(0_0_0_/_80%)]">
                {title}
              </span>
              <br />
              <span className="relative inline-block">
                <motion.span
                  className="absolute inset-0 bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent blur-md opacity-60"
                  animate={{
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                  }}
                  transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                  style={{ backgroundSize: "200% 200%" }}
                >
                  <FlipWords
                    words={["Kết nối", "Đồng hành", "Phát triển", "Vươn xa"]}
                    className="p-0 text-inherit"
                  />
                </motion.span>
                <span className="relative bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(var(--primary),0.5)]">
                  <FlipWords
                    words={["Kết nối", "Đồng hành", "Phát triển", "Vươn xa"]}
                    className="p-0 text-inherit"
                  />
                </span>
              </span>
            </motion.h1>

            {/* Description with premium backdrop */}
            <motion.div
              className="relative max-w-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent rounded-lg blur-xl" />
              <p
                className={cn(
                  "relative text-base md:text-lg lg:text-xl text-gray-100 leading-relaxed tracking-wide",
                  "px-6 py-4 rounded-lg backdrop-blur-sm bg-white/5 border border-white/10",
                  "shadow-[0_8px_32px_rgba(0,0,0,0.3)]",
                  descriptionClassName
                )}
              >
                {description}
              </p>
            </motion.div>

            {/* Buttons with animated gradient border */}
            {buttons && buttons.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                <Flex gap={4} wrap={true} className="mt-2">
                  {buttons.map((btn, index) => (
                    <div key={index} className="relative group">
                      {/* Animated gradient border for primary button */}
                      {btn.variant === "default" && (
                        <motion.div
                          className="absolute -inset-0.5 bg-gradient-to-r from-primary via-blue-500 to-primary rounded-lg opacity-70 blur-sm group-hover:opacity-100 transition-opacity"
                          animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                          transition={{ duration: 3, repeat: Infinity }}
                          style={{ backgroundSize: "200% 200%" }}
                        />
                      )}
                      <Button
                        variant={btn.variant || "default"}
                        size={btn.size || "lg"}
                        className={cn(
                          "relative min-w-[140px] h-12 text-base font-medium transition-all duration-300 hover:scale-[1.02] group",
                          btn.variant === "default" &&
                          "bg-primary hover:bg-primary/90 text-primary-foreground border-none shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/50",
                          btn.variant === "outline" &&
                          "bg-white/5 backdrop-blur-md border-white/30 text-white hover:bg-white/15 hover:border-white/50"
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
                              <IconSize size="sm" className="transition-transform duration-200 group-hover:translate-x-0.5">
                                <ArrowRight />
                              </IconSize>
                            )}
                          </Flex>
                        </Link>
                      </Button>
                    </div>
                  ))}
                </Flex>
              </motion.div>
            )}

            {children}
          </Flex>
        </motion.div>
      </Flex>

      {/* Premium Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2 text-white/70 hover:text-white transition-colors cursor-pointer group"
          onClick={() => {
            window.scrollTo({
              top: window.innerHeight - 55,
              behavior: "smooth"
            });
          }}
        >
          <div className="relative px-4 py-2 rounded-full backdrop-blur-md bg-white/5 border border-white/20 group-hover:bg-white/10 group-hover:border-white/30 transition-all duration-300">
            <span className="text-xs tracking-widest uppercase font-medium">Cuộn xuống</span>
          </div>
          <div className="relative">
            <motion.div
              className="absolute inset-0 bg-primary/30 rounded-full blur-md"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <ChevronDown className="relative w-6 h-6 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all" />
          </div>
        </motion.div>
      </motion.div>
    </Flex>
  );
}


