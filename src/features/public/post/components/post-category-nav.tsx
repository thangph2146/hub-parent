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
  parentId?: string | null
}

interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[]
}

interface PostCategoryNavProps {
  categories: Category[]
}

const CategoryTreeItem = ({ 
  node, 
  level = 0, 
  selectedCategories, 
  toggleCategory,
  isLast = false,
}: { 
  node: CategoryTreeNode
  level?: number
  selectedCategories: Set<string>
  toggleCategory: (slug: string) => string
  isLast?: boolean
}) => {
  const isActive = selectedCategories.has(node.slug)
  const hasChildren = node.children.length > 0

  return (
    <div className="relative">
      <Link
        href={toggleCategory(node.slug)}
        prefetch={false}
        className={cn(
          "group relative px-3 py-2 rounded-md transition-all w-full block",
          "hover:bg-accent/50 active:bg-accent",
          isActive
            ? "bg-primary/10 text-primary font-medium"
            : "text-foreground/70 hover:text-foreground"
        )}
        style={{ paddingLeft: `${level * 1.25 + 0.75}rem` }}
      >
        <Flex align="center" gap={2.5}>
          {/* Tree lines for child levels */}
          {level > 0 && (
            <>
              {/* Vertical line from parent area */}
              <div 
                className={cn(
                  "absolute top-0 w-px bg-border/50",
                  isLast ? "h-1/2" : "h-full"
                )}
                style={{ left: `${(level - 1) * 1.25 + 1.25}rem` }}
              />
              {/* Horizontal line to current item */}
              <div 
                className="absolute top-1/2 w-2.5 h-px bg-border/50"
                style={{ left: `${(level - 1) * 1.25 + 1.25}rem` }}
              />
            </>
          )}

          <IconSize size="sm" className={cn(
            "transition-all flex-shrink-0",
            isActive && "text-primary",
            level > 0 && "ml-1"
          )}>
            <FolderOpen className={cn("transition-transform h-4 w-4", isActive && "scale-110")} />
          </IconSize>
          <TypographySpanSmall className={cn(
            "flex-1 truncate",
            isActive && "font-medium"
          )}>
            {node.name}
          </TypographySpanSmall>
          {isActive && (
            <IconSize size="xs" className="opacity-50 group-hover:opacity-100 flex-shrink-0">
              <X className="h-3 w-3" />
            </IconSize>
          )}
        </Flex>
      </Link>
      
      {hasChildren && (
        <div className="mt-0.5">
          {node.children.map((child, index) => (
            <CategoryTreeItem
              key={child.id}
              node={child}
              level={level + 1}
              selectedCategories={selectedCategories}
              toggleCategory={toggleCategory}
              isLast={index === node.children.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  )
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

  const categoryTree = useMemo(() => {
    const map = new Map<string, CategoryTreeNode>()
    const roots: CategoryTreeNode[] = []

    // First pass: create all nodes
    categories.forEach(cat => {
      map.set(cat.id, { ...cat, children: [] })
    })

    // Second pass: link children to parents
    categories.forEach(cat => {
      const node = map.get(cat.id)!
      if (cat.parentId && map.has(cat.parentId)) {
        map.get(cat.parentId)!.children.push(node)
      } else {
        roots.push(node)
      }
    })

    return roots
  }, [categories])

  return (
    <nav aria-label="Category navigation" className="w-full">
      <ScrollArea className="w-full max-h-[calc(100vh-12rem)]">
        <Flex direction="col" align="stretch" gap={1} className="pr-4">
          <Link
            href={clearAllCategories()}
            prefetch={false}
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
                <FolderOpen className="h-4 w-4" />
              </IconSize>
              <TypographySpanSmall className={cn(
                "flex-1",
                selectedCategories.size === 0 && "font-medium"
              )}>
                Tất cả
              </TypographySpanSmall>
              {selectedCategories.size > 0 && (
                <IconSize size="xs" className="opacity-50 group-hover:opacity-100 flex-shrink-0">
                  <X className="h-3 w-3" />
                </IconSize>
              )}
            </Flex>
          </Link>
          
          <div className="space-y-0.5">
            {categoryTree.map((node, index) => (
              <CategoryTreeItem
                key={node.id}
                node={node}
                selectedCategories={selectedCategories}
                toggleCategory={toggleCategory}
                isLast={index === categoryTree.length - 1}
              />
            ))}
          </div>
        </Flex>
        <ScrollBar orientation="vertical" />
      </ScrollArea>
    </nav>
  )
}
