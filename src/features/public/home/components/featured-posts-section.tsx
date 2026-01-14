"use client";

import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Flex } from "@/components/ui/flex";
import { Grid } from "@/components/ui/grid";
import { Button } from "@/components/ui/button";
import { TypographyDescriptionSmall, TypographyH2, TypographySpan } from "@/components/ui/typography";
import { PostCard } from "@/features/public/post/components";
import type { Post } from "@/features/public/post/types";
import { cn } from "@/utils";
import { HOME_ROUTES } from "../constants";

export interface FeaturedPostsSectionProps {
  featuredPosts?: Post[];
  className?: string;
}

const ViewAllButton = ({ mobile = false }: { mobile?: boolean }) => (
  <Button asChild variant={mobile ? "outline" : "ghost"} size="default" className={cn(mobile && "w-full")}>
    <Link href={HOME_ROUTES.posts} prefetch={false}>
      <Flex align="center" gap={2}>
        <TypographySpan>{mobile ? "Xem tất cả tin tức" : "Xem tất cả"}</TypographySpan>
        <ArrowRight className={cn(!mobile && "transition-transform group-hover:translate-x-1")} />
      </Flex>
    </Link>
  </Button>
);

export const FeaturedPostsSection = ({ featuredPosts = [], className }: FeaturedPostsSectionProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);

  if (featuredPosts.length === 0) return null;

  return (
    <Flex
      as="section"
      ref={sectionRef}
      fullWidth
      position="relative"
      className={cn("bg-background", className)}
    >
      <Flex
        container
        fullWidth
        direction="col"
        align="center"
        justify="center"
        className="px-4 sm:px-8 md:px-12 py-8 sm:py-12 md:py-16 lg:py-20 h-full"
      >
        <Flex direction="col" gap={8} fullWidth>
          <Flex align="center" justify="between" gap={4} fullWidth className="border-b pb-6">
            <div className="space-y-1">
              <TypographyH2 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">
                Tin tức & Sự kiện
              </TypographyH2>
              <TypographyDescriptionSmall className="text-sm sm:text-base text-muted-foreground">
                Cập nhật những thông tin mới nhất từ nhà trường
              </TypographyDescriptionSmall>
            </div>
            <div className="hidden md:block group">
              <ViewAllButton />
            </div>
          </Flex>

          <Grid cols={3} gap={8} className="md:grid-cols-3 sm:grid-cols-2 grid-cols-1">
            {featuredPosts.slice(0, 3).map((post) => (
              <PostCard
                key={post.id}
                post={post}
                priority={false}
                className="h-full"
                headingLevel="h3"
              />
            ))}
          </Grid>

          <div className="md:hidden mt-4">
            <ViewAllButton mobile />
          </div>
        </Flex>
      </Flex>
    </Flex>
  );
};
