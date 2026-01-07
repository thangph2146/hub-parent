"use client";

import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Flex } from "@/components/ui/flex";
import { Grid } from "@/components/ui/grid";
import { Button } from "@/components/ui/button";
import { TypographyDescriptionSmall, TypographyH2, TypographySpan } from "@/components/ui/typography";
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
        <ArrowRight className={!mobile ? "transition-transform group-hover:translate-x-1" : ""} />
      </Flex>
    </Link>
  </Button>
);

export const FeaturedPostsSection = ({ featuredPosts = [], className }: FeaturedPostsSectionProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { sectionHeightClassName, sectionHeightStyle } = useSectionHeight({
    minHeight: "fit-content",
    fullHeight: true,
  });

  if (featuredPosts.length === 0) return null;

  return (
    <Flex
    as="section"
    ref={sectionRef}
    fullWidth
    container
    direction="col"
    position="relative"
    bg="background"
    className={cn(sectionHeightClassName, className)}
    style={sectionHeightStyle}
    >
      <Flex container padding="responsive-lg" className="h-full items-center justify-center px-0 sm:px-0 md:px-0 lg:px-0 py-0 sm:py-0 md:py-0 lg:py-0">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
          <Flex direction="col" gap={8}>
            <Flex align="center" justify="between" gap={4} fullWidth className="border-b pb-4 mb-4">
              <Flex direction="col" gap={1}>
                <TypographyH2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-primary">
                  Tin tức & Sự kiện
                </TypographyH2>
                <TypographyDescriptionSmall className="text-sm sm:text-base text-muted-foreground">
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
    </Flex>
  );
};
