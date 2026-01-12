"use client"

import Link from "next/link"
import { IconSize, TypographySpanSmall } from "@/components/ui/typography"
import { Flex } from "@/components/ui/flex"
import { useSearchParams } from "next/navigation"
import { useMemo } from "react"
import { FolderOpen, X } from "lucide-react"
import { cn } from "@/utils"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

interface Category {
  id: string
  name: string
  slug: string
}

interface PostCategoryNavProps {
  categories: Category[]
}

export const PostCategoryNav = ({ categories }: PostCategoryNavProps) => {
  const searchParams = useSearchParams()
  const selectedCategories = useMemo(() => {
    const categories = searchParams?.getAll("category") || []
    return new Set(categories)
  }, [searchParams])

  const toggleCategory = useMemo(
    () => (slug: string) => {
      const params = new URLSearchParams(searchParams?.toString() || "")
      const currentCategories = params.getAll("category")

      if (currentCategories.includes(slug)) {
        // Remove category
        params.delete("category")
        currentCategories.filter(c => c !== slug).forEach(c => params.append("category", c))
      } else {
        // Add category
        params.append("category", slug)
      }

      params.delete("page") // Reset to page 1 when changing category
      return `/bai-viet${params.toString() ? `?${params.toString()}` : ""}`
    },
    [searchParams]
  )

  const clearAllCategories = useMemo(
    () => () => {
      const params = new URLSearchParams(searchParams?.toString() || "")
      params.delete("category")
      params.delete("page")
      return `/bai-viet${params.toString() ? `?${params.toString()}` : ""}`
    },
    [searchParams]
  )

  return (
    <nav aria-label="Category navigation" className="w-full">
      <ScrollArea className="w-full max-h-[calc(100vh-12rem)]">
        <Flex direction="col" align="stretch" gap={1} className="pr-4">
          <Link
            href={clearAllCategories()}
            className={cn(
              "group relative px-3 py-2 rounded-md transition-all w-full",
              "hover:bg-accent/50 active:bg-accent",
              selectedCategories.size === 0
                ? "bg-primary/10 text-primary font-medium"
                : "text-foreground/70 hover:text-foreground"
            )}
          >
            <Flex align="center" gap={2.5}>
              <IconSize size="sm" className={cn(
                "transition-all flex-shrink-0",
                selectedCategories.size === 0 && "text-primary"
              )}>
                <FolderOpen />
              </IconSize>
              <TypographySpanSmall className={cn(
                "flex-1",
                selectedCategories.size === 0 && "font-medium"
              )}>
                Tất cả
              </TypographySpanSmall>
              {selectedCategories.size > 0 && (
                <IconSize size="xs" className="opacity-50 group-hover:opacity-100 flex-shrink-0">
                  <X />
                </IconSize>
              )}
            </Flex>
          </Link>
          {categories.map((category, index) => {
            const isActive = selectedCategories.has(category.slug)
            const isLast = index === categories.length - 1
            return (
              <Link
                key={category.id}
                href={toggleCategory(category.slug)}
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
                  {!isLast && (
                    <div className="absolute left-0 top-0 w-3 h-px bg-border/50" />
                  )}
                  <IconSize size="sm" className={cn(
                    "transition-all flex-shrink-0 ml-1",
                    isActive && "text-primary"
                  )}>
                    <FolderOpen />
                  </IconSize>
                  <TypographySpanSmall className={cn(
                    "flex-1",
                    isActive && "font-medium"
                  )}>
                    {category.name}
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
    </nav>
  )
}

