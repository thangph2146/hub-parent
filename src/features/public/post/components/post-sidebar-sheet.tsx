"use client"

import { useState } from "react"
import { Filter, Tags, SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { CollapsibleSection } from "@/features/public/post/components/collapsible-section"
import { PostCategoryNav } from "@/features/public/post/components/post-category-nav"
import { PostTagNav } from "@/features/public/post/components/post-tag-nav"
import { IconSize } from "@/components/ui/typography"

interface Category {
  id: string
  name: string
  slug: string
}

interface Tag {
  id: string
  name: string
  slug: string
}

interface PostSidebarSheetProps {
  categories: Category[]
  tags: Tag[]
}

export function PostSidebarSheet({ categories, tags }: PostSidebarSheetProps) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label="Mở bộ lọc"
        >
          <IconSize size="sm">
            <SlidersHorizontal />
          </IconSize>
          <span className="ml-2 hidden sm:inline">Bộ lọc</span>
        </Button>
      </SheetTrigger>
      <SheetContent 
        side="left" 
        className="w-[280px] sm:w-[320px] lg:w-[360px] overflow-y-auto p-0 flex flex-col"
      >
        <SheetHeader className="px-4 sm:px-6 pt-6 pb-4 border-b">
          <SheetTitle className="text-lg font-semibold">Bộ lọc</SheetTitle>
        </SheetHeader>
        <div 
          className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4"
        >
          {/* Category Navigation */}
          <CollapsibleSection
            title="Danh mục:"
            icon={<Filter className="h-4 w-4" />}
            defaultOpen={true}
          >
            <PostCategoryNav categories={categories} />
          </CollapsibleSection>

          {/* Tag Navigation */}
          <CollapsibleSection
            title="Thẻ tag:"
            icon={<Tags className="h-4 w-4" />}
            defaultOpen={true}
          >
            <PostTagNav tags={tags} />
          </CollapsibleSection>
        </div>
      </SheetContent>
    </Sheet>
  )
}

