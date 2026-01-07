"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import { Flex } from "@/components/ui/flex";
import { Grid } from "@/components/ui/grid";
import { Button } from "@/components/ui/button";
import { TypographyDescriptionSmall, TypographyH2, TypographySpan, IconSize } from "@/components/ui/typography";
import { PostCard } from "@/components/public/post/post-card";
import type { Post } from "@/features/public/post/types";
import { useSectionHeight } from "@/hooks/use-section-height";
import { cn } from "@/lib/utils";

export interface FeaturedPostsSectionProps {
  featuredPosts?: Post[];
  className?: string;
}

const ViewAllButton = ({ mobile = false }: { mobile?: boolean }) => (
  <Button asChild variant={mobile ? "outline" : "ghost"} size="default" className={mobile ? "w-full" : ""}>
    <Link href="/bai-viet">
      <Flex align="center" gap={2}>
        <TypographySpan>{mobile ? "Xem tất cả tin tức" : "Xem tất cả"}</TypographySpan>
        <IconSize size="sm" className={!mobile ? "transition-transform group-hover:translate-x-1" : ""}>
          <ArrowRight />
        </IconSize>
      </Flex>
    </Link>
  </Button>
);

export const FeaturedPostsSection = ({ featuredPosts = [], className }: FeaturedPostsSectionProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { sectionHeightClassName, sectionHeightStyle, scrollToNextSection } = useSectionHeight({
    minHeight: 600,
    fullHeight: true,
  });

  if (featuredPosts.length === 0) return null;

  return (
    <Flex
      as="section"
      ref={sectionRef}
      fullWidth
      position="relative"
      className={cn("bg-muted/30", sectionHeightClassName, className)}
      style={sectionHeightStyle}
    >
      <Flex container padding="responsive-lg" className="h-full items-center justify-center py-8 sm:py-12 md:py-16 lg:py-20">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
          <Flex direction="col" gap={8}>
            <Flex align="center" justify="between" gap={4} fullWidth className="border-b pb-4 mb-4">
              <Flex direction="col" gap={1}>
                <TypographyH2 className="text-3xl font-bold tracking-tight text-primary">
                  Tin tức & Sự kiện
                </TypographyH2>
                <TypographyDescriptionSmall className="text-base text-muted-foreground">
                  Cập nhật những thông tin mới nhất từ nhà trường
                </TypographyDescriptionSmall>
              </Flex>
              <Flex className="hidden md:flex group">
                <ViewAllButton />
              </Flex>
            </Flex>

            <Grid cols={3} gap={8} className="md:grid-cols-3 sm:grid-cols-2 grid-cols-1">
              {featuredPosts.slice(0, 3).map((post, index) => (
                <PostCard
                  key={post.id}
                  post={post}
                  priority={index < 3}
                  className="h-full hover:-translate-y-1 transition-transform duration-300"
                />
              ))}
            </Grid>

            <Flex justify="center" className="md:hidden mt-4">
              <ViewAllButton mobile />
            </Flex>
          </Flex>
        </div>
      </Flex>

      <motion.div
        className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 z-[60] hidden sm:block"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2 text-foreground/70 hover:text-foreground transition-colors cursor-pointer group"
          onClick={() => scrollToNextSection(sectionRef.current)}
        >
          <div className="relative px-4 sm:px-5 py-2 sm:py-2.5 rounded-full backdrop-blur-xl bg-background/80 border border-border/50 group-hover:bg-background group-hover:border-border transition-all duration-300 shadow-lg group-hover:shadow-xl">
            <span className="text-[10px] sm:text-xs tracking-[0.15em] sm:tracking-[0.2em] uppercase font-semibold whitespace-nowrap">Cuộn xuống</span>
          </div>
          <div className="relative">
            <motion.div
              className="absolute inset-0 bg-primary/20 rounded-full blur-lg"
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.9, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <ChevronDown className="relative w-6 h-6 sm:w-7 sm:h-7 drop-shadow-lg group-hover:drop-shadow-[0_0_12px_rgba(0,0,0,0.3)] transition-all" />
          </div>
        </motion.div>
      </motion.div>
    </Flex>
  );
};

