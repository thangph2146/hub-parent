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

      {/* Desktop: Vertical scroll */}
      <Flex className="hidden lg:block">
        <ScrollArea className="w-full max-h-[calc(100vh-20rem)]">
          <Flex direction="col" align="stretch" gap={2} className="pr-4">
            <Link
              href={clearAllTags()}
              className={cn(
                "group px-4 py-2 rounded-md whitespace-nowrap transition-all border w-full",
                selectedTags.size === 0
                  ? "bg-primary/10 text-primary border-primary/20 shadow-sm"
                  : "hover:bg-accent/10 text-muted-foreground border-transparent hover:border-border"
              )}
            >
              <Flex align="center" gap={2} justify="between">
                <Flex align="center" gap={2}>
                  <IconSize size="sm" className={cn("transition-transform", selectedTags.size === 0 && "scale-110")}>
                    <Tag />
                  </IconSize>
                  <TypographySpanSmall>Tất cả</TypographySpanSmall>
                </Flex>
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
                    "group px-4 py-2 rounded-md whitespace-nowrap transition-all border w-full",
                    isActive
                      ? "bg-primary/10 text-primary border-primary/20 shadow-sm"
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
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </Flex>
    </nav>
  )
}

