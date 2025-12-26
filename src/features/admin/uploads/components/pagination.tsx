/**
 * Pagination Component
 * Component hiển thị pagination controls
 */

import { Button } from "@/components/ui/button"
import { TypographySpanSmallMuted, IconSize } from "@/components/ui/typography"
import { Flex } from "@/components/ui/flex"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  if (totalPages <= 1) return null

  const handlePrevious = () => onPageChange(Math.max(1, currentPage - 1))
  const handleNext = () => onPageChange(Math.min(totalPages, currentPage + 1))

  return (
    <Flex
      direction="col"
      align="center"
      justify="center"
      gap={3}
      className="sm:flex-row mt-8 pt-6 border-t"
    >
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className="w-full sm:w-auto"
      >
        <IconSize size="sm" className="mr-1">
          <ChevronLeft />
        </IconSize>
        Trước
      </Button>
      <TypographySpanSmallMuted className="whitespace-nowrap px-4">
        Trang {currentPage} / {totalPages}
      </TypographySpanSmallMuted>
      <Button
        variant="outline"
        size="sm"
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className="w-full sm:w-auto"
      >
        Sau
        <IconSize size="sm" className="ml-1">
          <ChevronRight />
        </IconSize>
      </Button>
    </Flex>
  )
}

