"use client"

import Link from "next/link"
import { IconSize, TypographySpanSmall } from "@/components/ui/typography"
import { Flex } from "@/components/ui/flex"
import { useSearchParams } from "next/navigation"
import { useMemo } from "react"
import { FolderOpen, X } from "lucide-react"
import { cn } from "@/lib/utils"
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
      {/* Mobile: Horizontal Scrollable List with Gradient Fade */}
      <div className="lg:hidden relative group">
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />

        <ScrollArea className="w-full pb-4">
          <Flex wrap={false} gap={2} className="px-1">
            <Link
              href={clearAllCategories()}
              className={cn(
                "relative flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all border text-sm font-medium",
                selectedCategories.size === 0
                  ? "bg-primary text-primary-foreground border-primary shadow-md hover:shadow-lg hover:shadow-primary/20"
                  : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:bg-accent hover:text-foreground"
              )}
            >
              <FolderOpen className={cn("w-4 h-4", selectedCategories.size === 0 ? "fill-current" : "")} />
              <span>Tất cả</span>
            </Link>

            {categories.map((category) => {
              const isActive = selectedCategories.has(category.slug)
              return (
                <Link
                  key={category.id}
                  href={toggleCategory(category.slug)}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all border text-sm font-medium",
                    isActive
                      ? "bg-primary text-primary-foreground border-primary shadow-md hover:shadow-lg hover:shadow-primary/20"
                      : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:bg-accent hover:text-foreground"
                  )}
                >
                  <FolderOpen className={cn("w-4 h-4", isActive ? "fill-current" : "")} />
                  <span>{category.name}</span>
                  {isActive && <X className="w-3 h-3 ml-1 opacity-70" />}
                </Link>
              )
            })}
          </Flex>
          <ScrollBar orientation="horizontal" className="h-1.5" />
        </ScrollArea>
      </div>

      {/* Desktop: Vertical scroll - Tree style */}
      <Flex className="hidden lg:block">
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
                    <div className={cn(
                      "absolute left-0 top-0 w-3 h-px bg-border/50",
                      isLast && "hidden"
                    )} />
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
      </Flex>
    </nav>
  )
}

