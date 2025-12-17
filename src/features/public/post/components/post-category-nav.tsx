"use client"

import Link from "next/link"
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
      <div className="lg:hidden">
        <div className="flex flex-wrap items-stretch gap-2">
          <Link
            href={clearAllCategories()}
            className={cn(
              "group flex items-center gap-2 px-3 sm:px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all border",
              selectedCategories.size === 0
                ? "bg-accent/10 hover:bg-accent/10 text-primary border-primary/20 shadow-sm"
                : "hover:bg-accent/10 text-muted-foreground border-transparent hover:border-border"
            )}
          >
            <FolderOpen className={cn(
              "h-4 w-4 transition-transform",
              selectedCategories.size === 0 && "scale-110"
            )} />
            <span>Tất cả</span>
            {selectedCategories.size > 0 && (
              <X className="h-3 w-3 opacity-50 group-hover:opacity-100" />
            )}
          </Link>
          {categories.map((category) => {
            const isActive = selectedCategories.has(category.slug)
            return (
              <Link
                key={category.id}
                href={toggleCategory(category.slug)}
                className={cn(
                  "group flex items-center gap-2 px-3 sm:px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all border",
                  isActive
                    ? "bg-accent/10 hover:bg-accent/10 text-primary border-primary/20 shadow-sm"
                    : "hover:bg-accent/10 text-muted-foreground border-transparent hover:border-border"
                )}
              >
                <FolderOpen className={cn(
                  "h-4 w-4 transition-transform",
                  isActive && "scale-110"
                )} />
                <span>{category.name}</span>
                {isActive && (
                  <X className="h-3 w-3 opacity-50 group-hover:opacity-100 ml-auto" />
                )}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Desktop: Vertical scroll */}
      <div className="hidden lg:block">
        <ScrollArea className="w-full max-h-[calc(100vh-12rem)]">
          <div className="flex flex-col items-stretch gap-2 pr-4">
            <Link
              href={clearAllCategories()}
              className={cn(
                "group flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all border w-full",
                selectedCategories.size === 0
                  ? "bg-primary/10 text-primary border-primary/20 shadow-sm"
                  : "hover:bg-accent/10 text-muted-foreground border-transparent hover:border-border"
              )}
            >
              <FolderOpen className={cn(
                "h-4 w-4 transition-transform",
                selectedCategories.size === 0 && "scale-110"
              )} />
              <span>Tất cả</span>
              {selectedCategories.size > 0 && (
                <X className="h-3 w-3 opacity-50 group-hover:opacity-100 ml-auto" />
              )}
            </Link>
            {categories.map((category) => {
              const isActive = selectedCategories.has(category.slug)
              return (
                <Link
                  key={category.id}
                  href={toggleCategory(category.slug)}
                  className={cn(
                    "group flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all border w-full",
                    isActive
                      ? "bg-primary/10 text-primary border-primary/20 shadow-sm"
                      : "hover:bg-accent/10 text-muted-foreground border-transparent hover:border-border"
                  )}
                >
                  <FolderOpen className={cn(
                    "h-4 w-4 transition-transform",
                    isActive && "scale-110"
                  )} />
                  <span>{category.name}</span>
                  {isActive && (
                    <X className="h-3 w-3 opacity-50 group-hover:opacity-100 ml-auto" />
                  )}
                </Link>
              )
            })}
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </div>
    </nav>
  )
}

