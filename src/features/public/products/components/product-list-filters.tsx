"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

export interface ProductCategory {
  id: string
  name: string
  slug: string
}

export interface ProductListFiltersProps {
  categories?: ProductCategory[]
  currentCategory?: string
  currentSearch?: string
  currentSort?: string
}

export function ProductListFilters({
  categories = [],
  currentCategory,
  currentSearch,
  currentSort = "created_desc",
}: ProductListFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [searchValue, setSearchValue] = useState(currentSearch || "")

  const updateURL = (params: Record<string, string | null>) => {
    const currentParams = searchParams?.toString() || ""
    const newParams = new URLSearchParams(currentParams)
    
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value)
      } else {
        newParams.delete(key)
      }
    })
    
    // Reset to page 1 when filters change
    newParams.delete("page")
    
    startTransition(() => {
      router.push(`/san-pham?${newParams.toString()}`)
    })
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateURL({ search: searchValue || null, category: null })
  }

  const handleCategoryChange = (categorySlug: string) => {
    updateURL({ category: categorySlug === "all" ? null : categorySlug })
  }

  const handleSortChange = (sortBy: string) => {
    updateURL({ sortBy: sortBy === "created_desc" ? null : sortBy })
  }

  const clearFilters = () => {
    setSearchValue("")
    updateURL({ search: null, category: null, sortBy: null })
  }

  const hasActiveFilters = currentCategory || currentSearch || currentSort !== "created_desc"

  return (
    <Card className="p-4 md:p-6 mb-6 md:mb-8">
      <div className="space-y-4">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" disabled={isPending}>
            Tìm kiếm
          </Button>
        </form>

        {/* Filters Row */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          {/* Category Filter */}
          <div className="flex-1">
            <Select
              value={currentCategory || "all"}
              onValueChange={handleCategoryChange}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tất cả danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả danh mục</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.slug}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort Filter */}
          <div className="flex-1 sm:max-w-[200px]">
            <Select
              value={currentSort}
              onValueChange={handleSortChange}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_desc">Mới nhất</SelectItem>
                <SelectItem value="price_asc">Giá: Thấp đến cao</SelectItem>
                <SelectItem value="price_desc">Giá: Cao đến thấp</SelectItem>
                <SelectItem value="name_asc">Tên: A-Z</SelectItem>
                <SelectItem value="name_desc">Tên: Z-A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
            <span className="text-sm text-muted-foreground">Bộ lọc:</span>
            {currentCategory && (
              <Badge variant="secondary" className="gap-1">
                Danh mục: {categories.find((c) => c.slug === currentCategory)?.name || currentCategory}
                <button
                  onClick={() => handleCategoryChange("all")}
                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {currentSearch && (
              <Badge variant="secondary" className="gap-1">
                Tìm kiếm: {currentSearch}
                <button
                  onClick={() => {
                    setSearchValue("")
                    updateURL({ search: null })
                  }}
                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {currentSort !== "created_desc" && (
              <Badge variant="secondary" className="gap-1">
                Sắp xếp: {
                  currentSort === "price_asc" ? "Giá: Thấp đến cao" :
                  currentSort === "price_desc" ? "Giá: Cao đến thấp" :
                  currentSort === "name_asc" ? "Tên: A-Z" :
                  currentSort === "name_desc" ? "Tên: Z-A" :
                  currentSort
                }
                <button
                  onClick={() => handleSortChange("created_desc")}
                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-6 text-xs"
            >
              Xóa tất cả
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}

