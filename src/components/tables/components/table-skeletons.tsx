import { TableBody, TableCell, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Flex } from "@/components/ui/flex"

export interface TableBodySkeletonProps {
    columnCount: number
    rowCount?: number
}

export function TableBodySkeleton({ columnCount, rowCount = 5 }: TableBodySkeletonProps) {
    return (
        <TableBody>
            {Array.from({ length: rowCount }).map((_, rowIndex) => (
                <TableRow key={`skeleton-row-${rowIndex}`} className="animate-pulse">
                    {Array.from({ length: columnCount }).map((__, cellIndex) => (
                        <TableCell key={`skeleton-cell-${rowIndex}-${cellIndex}`}>
                            <Skeleton className="h-6 w-full" />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </TableBody>
    )
}

export function SummarySkeleton() {
    return (
        <Flex align="center" justify="between" gap={3} className="border-t border-border px-2 py-4">
            <Skeleton className="h-5 w-58" />
            <Flex align="center" gap={2}>
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-20" />
            </Flex>
        </Flex>
    )
}
