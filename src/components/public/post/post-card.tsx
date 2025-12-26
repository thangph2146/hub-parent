"use client"

import Link from "next/link"
import Image from "next/image"
import { Calendar, Tag, ArrowRight, FolderOpen } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Flex } from "@/components/ui/flex"
import { cn } from "@/lib/utils"
import { TypographyH4, TypographySpanSmall, TypographyPMuted, IconSize, TypographyPSmall } from "@/components/ui/typography"
import type { Post } from "@/features/public/post/types"
import { formatPostDate } from "@/features/public/post/utils/date-formatter"

interface PostCardProps {
  post: Post
  className?: string
  priority?: boolean
}

export function PostCard({ post, className, priority = false }: PostCardProps) {
  const primaryCategory = post.categories[0]
  const displayTags = post.tags.slice(0, 2)

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
    <Flex as="article" direction="col" height="full" bg="card" rounded="lg" border="all" overflow="hidden" className={cn("group transition-all hover:shadow-lg", className)}>
      <Link href={`/bai-viet/${post.slug}`} className="flex flex-col flex-1">
            {/* Featured Image */}
            {post.image ? (
              <Flex className="relative aspect-video w-full overflow-hidden bg-muted">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  loading={priority ? "eager" : "lazy"}
                  priority={priority}
                  quality={75}
                />
                <Flex className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Flex>
            ) : (
              <Flex align="center" justify="center" className="aspect-video w-full bg-gradient-to-br from-muted to-muted/50">
                <IconSize size="4xl">
                  <FolderOpen />
                </IconSize>
              </Flex>
            )}
            
            {/* Content */}
            <Flex direction="col" gap={3} padding="lg">
              {/* Category Badge */}
              {primaryCategory && primaryCategory.name && (
                <Badge variant="secondary" className="w-fit">
                  <TypographySpanSmall>{primaryCategory.name}</TypographySpanSmall>
                </Badge>
              )}

              {/* Title */}
              <TypographyH4 className="line-clamp-2 group-hover:text-primary transition-colors">
                {post.title}
              </TypographyH4>

              {/* Date */}
              {post.publishedAt && (
                <Flex align="center" gap={2}>
                  <IconSize size="sm">
                    <Calendar />
                  </IconSize>
                  <time dateTime={getPublishedAtISO()}>
                    <TypographyPMuted>{formatPostDate(post.publishedAt)}</TypographyPMuted>
                  </time>
                </Flex>
              )}

              {/* Read Now Button */}
              <Flex align="center" gap={2} className="mt-auto text-primary group-hover:gap-3 transition-all">
                <TypographyPSmall>Đọc ngay</TypographyPSmall>
                <IconSize size="sm" className="transition-transform group-hover:translate-x-1">
                  <ArrowRight />
                </IconSize>
              </Flex>
            </Flex>
          </Link>

        {/* Tags */}
        {displayTags.length > 0 && (
          <Flex align="center" gap={2} wrap={true} padding="md" border="top">
            <IconSize size="xs">
              <Tag />
            </IconSize>
            {displayTags.map((tag) => (
              <Badge key={tag.id} variant="outline">
                <TypographySpanSmall>{tag.name}</TypographySpanSmall>
              </Badge>
            ))}
          </Flex>
        )}
    </Flex>
  )
}


