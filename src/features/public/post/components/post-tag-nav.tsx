"use client"

import Link from "next/link"
import { IconSize, TypographySpanSmall } from "@/components/ui/typography"
import { Flex } from "@/components/ui/flex"
import { useSearchParams } from "next/navigation"
import { useMemo } from "react"
import { Tag, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

interface Tag {
  id: string
  name: string
  slug: string
}

interface PostTagNavProps {
  tags: Tag[]
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
    <nav aria-label="Tag navigation">
      {/* Mobile: Flex wrap */}
      <Flex wrap={true} align="stretch" gap={2} className="lg:hidden">
          <Link
            href={clearAllTags()}
            className={cn(
              "group px-3 sm:px-4 py-2 rounded-md whitespace-nowrap transition-all border",
              selectedTags.size === 0
                ? "bg-accent/10 hover:bg-accent/10 text-primary border-primary/20 shadow-sm"
                : "hover:bg-accent/10 text-muted-foreground border-transparent hover:border-border"
            )}
          >
            <Flex align="center" gap={2}>
              <IconSize size="sm" className={cn("transition-transform", selectedTags.size === 0 && "scale-110")}>
                <Tag />
              </IconSize>
              <TypographySpanSmall>Tất cả</TypographySpanSmall>
              {selectedTags.size > 0 && (
                <IconSize size="xs" className="opacity-50 group-hover:opacity-100">
                  <X />
                </IconSize>
              )}
            </Flex>
          </Link>
          {tags.map((tag) => {
            const isActive = selectedTags.has(tag.slug)
            return (
              <Link
                key={tag.id}
                href={toggleTag(tag.slug)}
                className={cn(
                  "group px-3 sm:px-4 py-2 rounded-md whitespace-nowrap transition-all border",
                  isActive
                    ? "bg-accent/10 hover:bg-accent/10 text-primary border-primary/20 shadow-sm"
                    : "hover:bg-accent/10 text-muted-foreground border-transparent hover:border-border"
                )}
              >
                <Flex align="center" gap={2} justify="between">
                  <Flex align="center" gap={2}>
                    <IconSize size="sm" className={cn("transition-transform", isActive && "scale-110")}>
                      <Tag />
                    </IconSize>
                    <TypographySpanSmall>{tag.name}</TypographySpanSmall>
                  </Flex>
                  {isActive && (
                    <IconSize size="xs" className="opacity-50 group-hover:opacity-100">
                      <X />
                    </IconSize>
                  )}
                </Flex>
              </Link>
            )
          })}
        </Flex>

      {/* Desktop: Vertical scroll - Tree style */}
      <Flex className="hidden lg:block">
        <ScrollArea className="w-full max-h-[calc(100vh-20rem)]">
          <Flex direction="col" align="stretch" gap={1} className="pr-4">
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
                <IconSize size="sm" className={cn(
                  "transition-all flex-shrink-0",
                  selectedTags.size === 0 && "text-primary"
                )}>
                  <Tag />
                </IconSize>
                <TypographySpanSmall className={cn(
                  "flex-1",
                  selectedTags.size === 0 && "font-medium"
                )}>
                  Tất cả
                </TypographySpanSmall>
                {selectedTags.size > 0 && (
                  <IconSize size="xs" className="opacity-50 group-hover:opacity-100 flex-shrink-0">
                    <X />
                  </IconSize>
                )}
              </Flex>
            </Link>
            {tags.map((tag, index) => {
              const isActive = selectedTags.has(tag.slug)
              const isLast = index === tags.length - 1
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
                    {/* Tree line */}
                    <div className="absolute left-0 top-0 bottom-0 w-px bg-border/50" />
                    <div className={cn(
                      "absolute left-0 top-0 w-3 h-px bg-border/50",
                      isLast && "hidden"
                    )} />
                    <IconSize size="sm" className={cn(
                      "transition-all flex-shrink-0 ml-1",
                      isActive && "text-primary"
                    )}>
                      <Tag />
                    </IconSize>
                    <TypographySpanSmall className={cn(
                      "flex-1",
                      isActive && "font-medium"
                    )}>
                      {tag.name}
                    </TypographySpanSmall>
                    {isActive && (
                      <IconSize size="xs" className="opacity-50 group-hover:opacity-100 flex-shrink-0">
                        <X />
                      </IconSize>
                    )}
                  </Flex>
                </Link>
              )
            })}
          </Flex>
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </Flex>
    </nav>
  )
}

