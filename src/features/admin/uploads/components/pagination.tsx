/**
 * Pagination Component
 * Component hiển thị pagination controls
 */

import * as React from "react"
import { typography } from "@/lib/typography"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  if (totalPages <= 1) return null

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mt-6">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className={`w-full sm:w-auto px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors ${typography.body.small}`}
      >
        Trước
      </button>
      <span className={`${typography.body.small} text-muted-foreground whitespace-nowrap`}>
        Trang {currentPage} / {totalPages}
      </span>
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className={`w-full sm:w-auto px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors ${typography.body.small}`}
      >
        Sau
      </button>
    </div>
  )
}

