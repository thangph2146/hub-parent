"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Flex } from "@/components/ui/flex"
import { cn } from "@/lib/utils"
import { IconSize } from "@/components/ui/typography"

interface PostPaginationProps {
  currentPage: number
  totalPages: number
}

export function PostPagination({ currentPage, totalPages }: PostPaginationProps) {
  const searchParams = useSearchParams()
  
  if (totalPages <= 1) return null

  const getPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams?.toString() || "")
    if (page === 1) {
      params.delete("page")
    } else {
      params.set("page", page.toString())
    }
    const queryString = params.toString()
    return `/bai-viet${queryString ? `?${queryString}` : ""}`
  }

  // Calculate visible page range
  const maxVisible = 5
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2))
  const endPage = Math.min(totalPages, startPage + maxVisible - 1)

  // Adjust if we're near the end
  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1)
  }

  const pages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i)

  return (
    <nav aria-label="Pagination">
      <Flex align="center" justify="center" gap={2}>
      <Button
        variant="outline"
        size="icon"
        asChild
        disabled={currentPage === 1}
        className={cn(currentPage === 1 && "opacity-50 cursor-not-allowed")}
      >
        <Link href={getPageUrl(currentPage - 1)} aria-label="Previous page">
          <IconSize size="sm">
            <ChevronLeft />
          </IconSize>
        </Link>
      </Button>

      {startPage > 1 && (
        <>
          <Button variant="outline" asChild>
            <Link href={getPageUrl(1)}>1</Link>
          </Button>
          {startPage > 2 && (
            <Flex paddingX="2">
              <span>...</span>
            </Flex>
          )}
        </>
      )}

      {pages.map((page) => (
        <Button
          key={page}
          variant={currentPage === page ? "default" : "outline"}
          asChild
        >
          <Link href={getPageUrl(page)}>{page}</Link>
        </Button>
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && (
            <Flex paddingX="2">
              <span>...</span>
            </Flex>
          )}
          <Button variant="outline" asChild>
            <Link href={getPageUrl(totalPages)}>{totalPages}</Link>
          </Button>
        </>
      )}

      <Button
        variant="outline"
        size="icon"
        asChild
        disabled={currentPage === totalPages}
        className={cn(currentPage === totalPages && "opacity-50 cursor-not-allowed")}
      >
        <Link href={getPageUrl(currentPage + 1)} aria-label="Next page">
          <IconSize size="sm">
            <ChevronRight />
          </IconSize>
        </Link>
      </Button>
      </Flex>
    </nav>
  )
}

