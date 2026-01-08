"use client"

import Link from "next/link"
import Image from "next/image"
import { Calendar, FolderOpen } from "lucide-react"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Flex } from "@/components/ui/flex"
import { cn } from "@/lib/utils"
import { TypographyH4, TypographySpanSmall, TypographyPMuted, IconSize } from "@/components/ui/typography"
import type { Post } from "@/features/public/post/types"
import { formatPostDate } from "@/features/public/post/utils/date-formatter"

interface PostCardProps {
  post: Post
  className?: string
  priority?: boolean
}

export function PostCard({ post, className, priority = false }: PostCardProps) {
  const primaryCategory = post.categories[0]

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.4 }}
      className={cn("h-full", className)}
    >
      <Flex as="article" direction="col" height="full" bg="card" rounded="xl" border="all" overflow="hidden" className="group h-full shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 relative">
        <Link href={`/bai-viet/${post.slug}`} className="flex flex-col flex-1">
          {/* Featured Image with Zoom Effect */}
          <div className="relative aspect-video w-full overflow-hidden bg-muted">
            {post.image ? (
              <>
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  loading={priority ? "eager" : "lazy"}
                  priority={priority}
                  quality={85}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 transition-opacity duration-300" />
              </>
            ) : (
              <Flex align="center" justify="center" className="h-full w-full bg-gradient-to-br from-primary/5 to-primary/10">
                <IconSize size="4xl">
                  <FolderOpen className="text-primary/20" />
                </IconSize>
              </Flex>
            )}

            {/* Floating Category Badge */}
            {primaryCategory && primaryCategory.name && (
              <div className="absolute top-4 left-4 z-10">
                <Badge variant="secondary" className="backdrop-blur-md bg-white/90 dark:bg-black/50 text-foreground border-white/20 shadow-sm hover:bg-white dark:hover:bg-black/70 transition-colors">
                  <TypographySpanSmall className="font-medium">{primaryCategory.name}</TypographySpanSmall>
                </Badge>
              </div>
            )}
          </div>

          {/* Content */}
          <Flex direction="col" gap={4} padding="lg" className="flex-1 relative">
            {/* Date */}
            {post.publishedAt && (
              <Flex align="center" gap={2} className="text-muted-foreground/80">
                <IconSize size="xs">
                  <Calendar className="w-3.5 h-3.5" />
                </IconSize>
                <time 
                  dateTime={getPublishedAtISO()} 
                  className="text-xs font-semibold uppercase tracking-wider text-foreground/90"
                  suppressHydrationWarning
                >
                  {formatPostDate(post.publishedAt)}
                </time>
              </Flex>
            )}

            {/* Title */}
            <TypographyH4 className="line-clamp-2 text-xl font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
              {post.title}
            </TypographyH4>

            {/* Excerpt (Optional) */}
            {post.excerpt && (
              <TypographyPMuted className="line-clamp-2 text-sm text-muted-foreground/90">
                {post.excerpt}
              </TypographyPMuted>
            )}

          </Flex>
        </Link>
      </Flex>
    </motion.div>
  )
}


