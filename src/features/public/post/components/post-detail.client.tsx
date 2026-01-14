"use client"

import dynamic from "next/dynamic"
import { IconSize } from "@/components/ui/typography"
import { TypographySpanSmallMuted, TypographyH1 } from "@/components/ui/typography"
import { Flex } from "@/components/ui/flex"

import { Calendar, User, Clock } from "lucide-react"
import { PostContent } from "./post-content"
import { formatPostDateLong, formatPostTime } from "../utils/date-formatter"
import { appConfig } from "@/constants"
import type { PostDetail } from "../types"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { PostTagsAndBottomShareProps } from "./post-tags-bottom-share"

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
    <Flex direction="col" className="relative">
      {/* Sticky Share - Desktop only */}
      <PostShare title={post.title} url={postUrl} variant="sticky" />

      <Flex direction="col" gap={8}>
        {/* Header */}
        <Flex direction="col" gap={6}>
          {/* Title */}
          <TypographyH1 className="tracking-tight leading-tight">
            {post.title}
          </TypographyH1>

          {/* Meta Info */}
          <Flex align="center" gap={4} wrap className="sm:gap-6 pt-2 border-t">
            <Flex align="center" gap={2}>
              <IconSize size="sm">
                <User />
              </IconSize>
              <TypographySpanSmallMuted>{post.author.name ?? post.author.email}</TypographySpanSmallMuted>
            </Flex>
            {post.publishedAt && (
              <Flex align="center" gap={2}>
                <IconSize size="sm">
                  <Calendar />
                </IconSize>
                <time dateTime={getPublishedAtISO()} suppressHydrationWarning>
                  <TypographySpanSmallMuted className="text-foreground/80 font-medium">
                    {formatPostDateLong(post.publishedAt)}
                  </TypographySpanSmallMuted>
                </time>
              </Flex>
            )}
            {post.publishedAt && (
              <Flex align="center" gap={2}>
                <IconSize size="sm">
                  <Clock />
                </IconSize>
                <TypographySpanSmallMuted suppressHydrationWarning>
                  {formatPostTime(post.publishedAt)}
                </TypographySpanSmallMuted>
              </Flex>
            )}
          </Flex>
        </Flex>

        {/* Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none prose-p:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
          <PostContent content={post.content} />
        </div>

        {/* Tags and Bottom Share */}
        <PostTagsAndBottomShare post={post} postUrl={postUrl} />
      </Flex>
    </Flex>
  )
}
