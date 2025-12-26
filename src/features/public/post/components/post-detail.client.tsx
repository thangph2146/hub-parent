"use client"

import { IconSize } from "@/components/ui/typography"
import { TypographySpanSmallMuted, TypographyH1 } from "@/components/ui/typography"
import { Flex } from "@/components/ui/flex"

import { Calendar, User, Tag, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { PostContent } from "./post-content"
import { formatPostDateLong } from "../utils/date-formatter"
import type { PostDetail } from "../types"

interface PostDetailClientProps {
  post: PostDetail
}

export const PostDetailClient = ({ post }: PostDetailClientProps) => {
  // Helper function to convert publishedAt to ISO string
  // Handles both Date objects and string values (from serialization)
  const getPublishedAtISO = (): string => {
    if (!post.publishedAt) return ""
    if (typeof post.publishedAt === "string") {
      return post.publishedAt
    }
    if (post.publishedAt instanceof Date) {
      return post.publishedAt.toISOString()
    }
    // Fallback: convert to Date and then to ISO string
    const dateValue = post.publishedAt as string | number | Date
    return new Date(dateValue).toISOString()
  }

  return (
    <Flex direction="col" padding="responsive-lg">
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
                  <time dateTime={getPublishedAtISO()}>
                    <TypographySpanSmallMuted>{formatPostDateLong(post.publishedAt)}</TypographySpanSmallMuted>
                  </time>
                </Flex>
              )}
              {post.publishedAt && (
                <Flex align="center" gap={2}>
                  <IconSize size="sm">
                    <Clock />
                  </IconSize>
                  <TypographySpanSmallMuted>
                    {(() => {
                      try {
                        const date = new Date(post.publishedAt)
                        if (isNaN(date.getTime())) return ""
                        return date.toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      } catch {
                        return ""
                      }
                    })()}
                  </TypographySpanSmallMuted>
                </Flex>
              )}
            </Flex>
        </Flex>

        {/* Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none prose-p:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
          <PostContent content={post.content} />
        </div>

        {/* Tags */}
        {post.tags.length > 0 && (
          <Flex align="center" gap={3} wrap className="pt-8 border-t">
            <IconSize size="md">
              <Tag />
            </IconSize>
            <Flex gap={2} wrap>
              {post.tags.map((tag) => (
                <Badge key={tag.id} variant="outline">
                  {tag.name}
                </Badge>
              ))}
            </Flex>
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}
