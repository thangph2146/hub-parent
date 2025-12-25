import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Flex } from "@/components/ui/flex"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export interface ResourceTableSkeletonProps {
  title?: boolean
  viewModes?: number
  rowCount?: number
  columnCount?: number
}

export function ResourceTableSkeleton({
  title = true,
  viewModes = 1,
  rowCount = 5,
  columnCount = 4,
}: ResourceTableSkeletonProps) {
  return (
    <Flex direction="col" gap={4} fullWidth>
      {(title || viewModes > 1) && (
        <Flex direction="col" align="start" justify="between" gap={2} fullWidth className="sm:flex-row sm:items-center">
          {title ? <Skeleton className="h-6 w-32" /> : <div />}
          {viewModes > 1 && (
            <Flex align="center" gap={2} wrap>
              {Array.from({ length: viewModes }).map((_, index) => (
                <Skeleton key={index} className="h-8 w-20" />
              ))}
            </Flex>
          )}
        </Flex>
      )}

      <Card>
        <CardHeader className="pb-3">
          <Flex align="center" justify="between" gap={2} fullWidth>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-9 w-24" />
          </Flex>
        </CardHeader>
        <CardContent>
          <Flex rounded="md" border="all" overflow="hidden" fullWidth>
            <Flex overflow="auto" fullWidth>
              <Table>
                <TableHeader>
                  <TableRow>
                    {Array.from({ length: columnCount }).map((_, index) => (
                      <TableHead key={index}>
                        <Skeleton className="h-4 w-24" />
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: rowCount }).map((_, rowIndex) => (
                    <TableRow key={`skeleton-row-${rowIndex}`}>
                      {Array.from({ length: columnCount }).map((__, cellIndex) => (
                        <TableCell key={`skeleton-cell-${rowIndex}-${cellIndex}`}>
                          <Skeleton className="h-5 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Flex>
          </Flex>
          <Flex align="center" justify="between" gap={3} fullWidth border="top" paddingX={2} paddingY={4} marginTop={4} wrap>
            <Skeleton className="h-5 w-48" />
            <Flex align="center" gap={2} wrap>
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-20" />
            </Flex>
          </Flex>
        </CardContent>
      </Card>
    </Flex>
  )
}

