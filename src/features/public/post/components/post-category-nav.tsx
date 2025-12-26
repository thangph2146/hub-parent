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
    <nav aria-label="Category navigation">
      {/* Mobile: Flex wrap */}
      <Flex wrap={true} align="stretch" gap={2} className="lg:hidden">
          <Link
            href={clearAllCategories()}
            className={cn(
              "group px-3 sm:px-4 py-2 rounded-md whitespace-nowrap transition-all border",
              selectedCategories.size === 0
                ? "bg-accent/10 hover:bg-accent/10 text-primary border-primary/20 shadow-sm"
                : "hover:bg-accent/10 text-muted-foreground border-transparent hover:border-border"
            )}
          >
            <Flex align="center" gap={2}>
              <IconSize size="sm" className={cn("transition-transform", selectedCategories.size === 0 && "scale-110")}>
                <FolderOpen />
              </IconSize>
              <TypographySpanSmall>Tất cả</TypographySpanSmall>
              {selectedCategories.size > 0 && (
                <IconSize size="xs" className="opacity-50 group-hover:opacity-100">
                  <X />
                </IconSize>
              )}
            </Flex>
          </Link>
          {categories.map((category) => {
            const isActive = selectedCategories.has(category.slug)
            return (
              <Link
                key={category.id}
                href={toggleCategory(category.slug)}
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
                      <FolderOpen />
                    </IconSize>
                    <TypographySpanSmall>{category.name}</TypographySpanSmall>
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
        <ScrollArea className="w-full max-h-[calc(100vh-12rem)]">
          <Flex direction="col" align="stretch" gap={2} className="pr-4">
            <Link
              href={clearAllCategories()}
              className={cn(
                "group px-4 py-2 rounded-md whitespace-nowrap transition-all border w-full",
                selectedCategories.size === 0
                  ? "bg-primary/10 text-primary border-primary/20 shadow-sm"
                  : "hover:bg-accent/10 text-muted-foreground border-transparent hover:border-border"
              )}
            >
              <Flex align="center" gap={2} justify="between">
                <Flex align="center" gap={2}>
                  <IconSize size="sm" className={cn("transition-transform", selectedCategories.size === 0 && "scale-110")}>
                    <FolderOpen />
                  </IconSize>
                  <TypographySpanSmall>Tất cả</TypographySpanSmall>
                </Flex>
                {selectedCategories.size > 0 && (
                  <IconSize size="xs" className="opacity-50 group-hover:opacity-100">
                    <X />
                  </IconSize>
                )}
              </Flex>
            </Link>
            {categories.map((category) => {
              const isActive = selectedCategories.has(category.slug)
              return (
                <Link
                  key={category.id}
                  href={toggleCategory(category.slug)}
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
                        <FolderOpen />
                      </IconSize>
                      <TypographySpanSmall>{category.name}</TypographySpanSmall>
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

