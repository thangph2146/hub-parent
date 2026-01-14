"use client"

import dynamic from "next/dynamic"
import { IconSize } from "@/components/ui/typography"
import { TypographySpanSmallMuted, TypographyH1 } from "@/components/ui/typography"
import { Flex } from "@/components/ui/flex"

import { Calendar, User, Clock, BookOpen } from "lucide-react"
import { PostContent } from "./post-content"
import { formatPostDateLong, formatPostTime } from "../utils/date-formatter"
import { estimateReadingTime } from "../utils/content-helpers"
import { appConfig } from "@/constants"
import type { PostDetail } from "../types"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { PostTagsAndBottomShareProps } from "./post-tags-bottom-share"
import Image from "next/image"

// Dynamic import PostShare to reduce initial bundle size
const PostShare = dynamic(() => import("./post-share").then(mod => mod.PostShare), {
  ssr: false,
});

// Dynamic import Tags and bottom share section
const PostTagsAndBottomShare = dynamic<PostTagsAndBottomShareProps>(
  () => import("./post-tags-bottom-share").then((mod) => mod.PostTagsAndBottomShare),
  {
    loading: () => <Skeleton className="h-24 w-full" />,
  }
);

interface PostDetailClientProps {
  post: PostDetail
}

export const PostDetailClient = ({ post }: PostDetailClientProps) => {
  const [baseUrl, setBaseUrl] = useState(appConfig.url)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const timer = setTimeout(() => {
        setBaseUrl(window.location.origin)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [])

  const postUrl = `${baseUrl}/bai-viet/${post.slug}`
  const readingTime = estimateReadingTime(post.content)

  // Helper function to convert publishedAt to ISO string
  const getPublishedAtISO = (): string => {
    if (!post.publishedAt) return ""
    if (typeof post.publishedAt === "string") {
      return post.publishedAt
    }
    if (post.publishedAt instanceof Date) {
      return post.publishedAt.toISOString()
    }
    const dateValue = post.publishedAt as string | number | Date
    return new Date(dateValue).toISOString()
  }

  return (
    <Flex as="article" direction="col" className="relative">
      {/* Sticky Share - Desktop only */}
      <PostShare title={post.title} url={postUrl} variant="sticky" />

      <Flex direction="col" gap={8}>
        {/* Featured Image - Optimized for LCP */}
        {post.image && (
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-muted shadow-lg border border-border/50">
            <Image
              src={post.image}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
              priority
              quality={75}
            />
          </div>
        )}

        {/* Header */}
        <Flex as="header" direction="col" gap={6}>
          {/* Title */}
          <TypographyH1 className="tracking-tight leading-tight">
            {post.title}
          </TypographyH1>

          {/* Meta Info */}
          <Flex align="center" gap={4} wrap className="sm:gap-6 pt-2 border-t">
            <Flex align="center" gap={2} title={`Tác giả: ${post.author.name ?? post.author.email}`}>
              <IconSize size="sm" className="text-muted-foreground">
                <User aria-hidden="true" />
              </IconSize>
              <TypographySpanSmallMuted className="font-medium">
                {post.author.name ?? post.author.email}
              </TypographySpanSmallMuted>
            </Flex>
            {post.publishedAt && (
              <Flex align="center" gap={2}>
                <IconSize size="sm" className="text-muted-foreground">
                  <Calendar aria-hidden="true" />
                </IconSize>
                <time 
                  dateTime={getPublishedAtISO()} 
                  suppressHydrationWarning
                  aria-label={`Ngày đăng: ${formatPostDateLong(post.publishedAt)}`}
                >
                  <TypographySpanSmallMuted className="text-foreground/80 font-medium">
                    {formatPostDateLong(post.publishedAt)}
                  </TypographySpanSmallMuted>
                </time>
              </Flex>
            )}
            {post.publishedAt && (
              <Flex align="center" gap={2}>
                <IconSize size="sm" className="text-muted-foreground">
                  <Clock aria-hidden="true" />
                </IconSize>
                <TypographySpanSmallMuted suppressHydrationWarning aria-label={`Thời gian đăng: ${formatPostTime(post.publishedAt)}`}>
                  {formatPostTime(post.publishedAt)}
                </TypographySpanSmallMuted>
              </Flex>
            )}
            <Flex align="center" gap={2}>
              <IconSize size="sm" className="text-muted-foreground">
                <BookOpen aria-hidden="true" />
              </IconSize>
              <TypographySpanSmallMuted aria-label={`Ước tính thời gian đọc: ${readingTime} phút`}>
                {readingTime} phút đọc
              </TypographySpanSmallMuted>
            </Flex>
          </Flex>
        </Flex>

        {/* Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none prose-p:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
          <PostContent content={post.content} isPriority={!post.image} />
        </div>

        {/* Tags and Bottom Share */}
        <footer className="mt-8">
          <PostTagsAndBottomShare post={post} postUrl={postUrl} />
        </footer>
      </Flex>
    </Flex>
  )
}
