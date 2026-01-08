"use client"

import Link from "next/link"
import { TypographySpanSmall } from "@/components/ui/typography"
import { Flex } from "@/components/ui/flex"
import { useSearchParams } from "next/navigation"
import { useMemo } from "react"
import { Tag as TagIcon, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

interface PostTag {
  id: string
  name: string
  slug: string
}

interface PostTagNavProps {
  tags: PostTag[]
}

export const PostTagNav = ({ tags }: PostTagNavProps) => {
  const searchParams = useSearchParams()
  const selectedTags = useMemo(() => {
    const tags = searchParams?.getAll("tag") || []
    return new Set(tags)
  }, [searchParams])

  const toggleTag = useMemo(
    () => (slug: string) => {
      const params = new URLSearchParams(searchParams?.toString() || "")
      const currentTags = params.getAll("tag")

      if (currentTags.includes(slug)) {
        // Remove tag
        params.delete("tag")
        currentTags.filter(t => t !== slug).forEach(t => params.append("tag", t))
      } else {
        // Add tag
        params.append("tag", slug)
      }

      params.delete("page") // Reset to page 1 when changing tag
      return `/bai-viet${params.toString() ? `?${params.toString()}` : ""}`
    },
    [searchParams]
  )

  const clearAllTags = useMemo(
    () => () => {
      const params = new URLSearchParams(searchParams?.toString() || "")
      params.delete("tag")
      params.delete("page")
      return `/bai-viet${params.toString() ? `?${params.toString()}` : ""}`
    },
    [searchParams]
  )

  return (
    <nav aria-label="Tag navigation" className="w-full">
      <ScrollArea className="w-full max-h-[calc(100vh-12rem)] pr-4">
        <Flex direction="col" align="stretch" gap={1}>
          <Link
            href={clearAllTags()}
            className={cn(
              "group relative px-3 py-2 rounded-md transition-all w-full",
              "hover:bg-accent/50 active:bg-accent",
              selectedTags.size === 0
                ? "bg-primary/10 text-primary font-medium"
                : "text-foreground/70 hover:text-foreground"
            )}
          >
            <Flex align="center" gap={2.5}>
              <TagIcon className={cn(
                "w-4 h-4 transition-all flex-shrink-0",
                selectedTags.size === 0 && "fill-current"
              )} />
              <TypographySpanSmall className={cn(
                "flex-1",
                selectedTags.size === 0 && "font-medium"
              )}>
                Tất cả
              </TypographySpanSmall>
            </Flex>
          </Link>
          {tags.map((tag) => {
            const isActive = selectedTags.has(tag.slug)
            return (
              <Link
                key={tag.id}
                href={toggleTag(tag.slug)}
                className={cn(
                  "group relative px-3 py-2 rounded-md transition-all w-full",
                  "hover:bg-accent/50 active:bg-accent",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-foreground/70 hover:text-foreground"
                )}
              >
                <Flex align="center" gap={2.5}>
                  <TagIcon className={cn(
                    "w-4 h-4 transition-all flex-shrink-0",
                    isActive && "fill-current"
                  )} />
                  <TypographySpanSmall className={cn(
                    "flex-1",
                    isActive && "font-medium"
                  )}>
                    {tag.name}
                  </TypographySpanSmall>
                  {isActive && (
                    <X className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 flex-shrink-0" />
                  )}
                </Flex>
              </Link>
            )
          })}
        </Flex>
        <ScrollBar orientation="vertical" />
      </ScrollArea>
    </nav>
  )
}

