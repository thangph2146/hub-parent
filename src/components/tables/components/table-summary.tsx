import { use, useMemo } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Flex } from "@/components/ui/flex"
import { Button } from "@/components/ui/button"
import { TypographySpanSmall, IconSize } from "@/components/ui/typography"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import type { DataTableResult } from "../types"

export interface TableSummaryProps<T extends object> {
    dataPromise: Promise<DataTableResult<T>>
    isPending: boolean
    onPageChange: (nextPage: number, totalPages?: number) => void
}

export function TableSummary<T extends object>({
    dataPromise,
    isPending,
    onPageChange,
}: TableSummaryProps<T>) {
    const result = use(dataPromise)
    const hasResults = result.total > 0
    const startIndex = hasResults ? (result.page - 1) * result.limit + 1 : 0
    const endIndex = hasResults ? Math.min(result.page * result.limit, result.total) : 0
    const totalPages = result.totalPages || 1

    const pageOptions = useMemo(() => {
        return Array.from({ length: Math.max(totalPages, 1) }, (_, i) => i + 1)
    }, [totalPages])

    const handlePageSelect = (value: string) => {
        const pageNum = parseInt(value, 10)
        if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
            onPageChange(pageNum, totalPages)
        }
    }

    return (
        <Flex 
            direction="col" 
            align="center" 
            justify="between" 
            gap={3} 
            className="border-t border-border px-2 py-4 sm:flex-row sm:gap-4"
        >
            <TypographySpanSmall className="text-muted-foreground whitespace-nowrap order-2 sm:order-1 font-medium text-base">
                Hiển thị từ <span className="font-bold text-foreground">{startIndex}</span> đến <span className="font-bold text-foreground">{endIndex}</span> trong tổng số <span className="font-bold text-foreground">{result.total}</span> bản ghi
            </TypographySpanSmall>

            <Flex align="center" gap={2} className="w-full sm:w-auto justify-between sm:justify-end order-1 sm:order-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(result.page - 1, totalPages)}
                    disabled={isPending || result.page <= 1}
                    className="h-8 px-2 sm:px-3 flex-shrink-0"
                    aria-label="Trang trước"
                >
                    <IconSize size="sm">
                        <ChevronLeft />
                    </IconSize>
                    <span className="hidden sm:inline ml-2">Trước</span>
                </Button>
                <Flex align="center" gap={2} wrap={false}>
                    <TypographySpanSmall className="hidden sm:inline whitespace-nowrap font-semibold text-foreground text-base">
                        Trang
                    </TypographySpanSmall>
                    <Select
                        value={String(result.page)}
                        onValueChange={handlePageSelect}
                        disabled={isPending || totalPages === 0}
                    >
                        <SelectTrigger
                            size="sm"
                            className="w-16 min-w-[64px] h-8 flex-shrink-0 font-bold text-base"
                            aria-label="Chọn trang"
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px] overflow-y-auto">
                            {pageOptions.map((page) => (
                                <SelectItem key={page} value={String(page)}>
                                    {page}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <TypographySpanSmall className="whitespace-nowrap flex-shrink-0 font-semibold text-foreground text-base">
                        / <span className="font-bold text-lg">{Math.max(totalPages, 1)}</span>
                    </TypographySpanSmall>
                </Flex>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(result.page + 1, totalPages)}
                    disabled={isPending || result.page >= totalPages}
                    className="h-8 px-2 sm:px-3 flex-shrink-0"
                    aria-label="Trang sau"
                >
                    <span className="hidden sm:inline mr-2">Sau</span>
                    <IconSize size="sm">
                        <ChevronRight />
                    </IconSize>
                </Button>
            </Flex>
        </Flex>
    )
}
