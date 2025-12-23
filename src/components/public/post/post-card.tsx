"use client"

import Link from "next/link"
import Image from "next/image"
import { Calendar, Tag, ArrowRight, FolderOpen } from "lucide-react"
import { Badge } from "@/components/ui/badge"
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
    <article className={cn("group flex flex-col h-full bg-card rounded-lg border overflow-hidden transition-all hover:shadow-lg", className)}>
      <Link 
        href={`/bai-viet/${post.slug}`} 
        className="flex flex-col flex-1"
      >
        {/* Featured Image */}
        {post.image ? (
          <div className="relative aspect-video w-full overflow-hidden bg-muted">
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
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        ) : (
          <div className="aspect-video w-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
            <IconSize size="4xl">
              <FolderOpen className="text-muted-foreground/50" />
            </IconSize>
          </div>
        )}
        
        {/* Content */}
        <div className="flex flex-col flex-1 p-6">
          {/* Category Badge */}
          {primaryCategory && primaryCategory.name && (
            <Badge variant="secondary" className="w-fit mb-3">
              <TypographySpanSmall>{primaryCategory.name}</TypographySpanSmall>
            </Badge>
          )}

          {/* Title */}
          <TypographyH4 className="mb-3 line-clamp-2 group-hover:text-primary transition-colors">
            {post.title}
          </TypographyH4>

          {/* Date */}
          {post.publishedAt && (
            <div className="flex items-center gap-1.5 mb-4">
              <IconSize size="sm">
                <Calendar />
              </IconSize>
              <time dateTime={getPublishedAtISO()}>
                <TypographyPMuted>{formatPostDate(post.publishedAt)}</TypographyPMuted>
              </time>
            </div>
          )}

          {/* Read Now Button */}
          <div className="mt-auto flex items-center gap-2 text-primary group-hover:gap-3 transition-all">
            <TypographyPSmall>Đọc ngay</TypographyPSmall>
            <IconSize size="sm" className="transition-transform group-hover:translate-x-1">
              <ArrowRight />
            </IconSize>
          </div>
        </div>
      </Link>

      {/* Tags */}
      {displayTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-4 border-t">
          <IconSize size="xs">
            <Tag className="text-muted-foreground" />
          </IconSize>
          {displayTags.map((tag) => (
            <Badge key={tag.id} variant="outline">
              <TypographySpanSmall>{tag.name}</TypographySpanSmall>
            </Badge>
          ))}
        </div>
      )}
    </article>
  )
}


