/**
 * ResourceFormSkeleton Component
 * 
 * Skeleton loading state cho ResourceForm
 * Hiển thị cấu trúc form với skeleton fields
 */

import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Flex } from "@/components/ui/flex"
import { Grid } from "@/components/ui/grid"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetFooter,
} from "@/components/ui/sheet"

export interface ResourceFormSkeletonProps {
  variant?: "page" | "dialog" | "sheet"
  fieldCount?: number
  title?: boolean
  showCard?: boolean
}

export function ResourceFormSkeleton({
  variant = "page",
  fieldCount = 6,
  title = true,
  showCard = true,
}: ResourceFormSkeletonProps) {
  const formFields = (
    <Grid cols={2} fullWidth gap={6}>
      {Array.from({ length: fieldCount }).map((_, index) => (
        <Flex key={index} direction="col" fullWidth gap={2}>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </Flex>
      ))}
    </Grid>
  )

  if (variant === "dialog") {
    return (
      <Dialog open={true}>
        <DialogContent className="max-w-2xl w-full p-0">
          <Flex direction="col" fullWidth>
          <DialogHeader className="px-6 pt-6 pb-4">
              {title && (
                <Flex direction="col" gap={2}>
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-64" />
                </Flex>
              )}
              {!title && <Skeleton className="h-4 w-64" />}
          </DialogHeader>
            <Flex className="max-h-[calc(60dvh)] overflow-y-auto">
              <Flex padding="md" fullWidth>
              {formFields}
              </Flex>
            </Flex>
            <DialogFooter className="px-6 pb-6 pt-4 border-t border-border">
              <Flex align="center" gap={3}>
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-20" />
              </Flex>
          </DialogFooter>
          </Flex>
        </DialogContent>
      </Dialog>
    )
  }

  if (variant === "sheet") {
    return (
      <Sheet open={true}>
        <SheetContent>
          <Flex direction="col" fullWidth flex="1">
          <SheetHeader>
              {title ? (
                <Flex direction="col" gap={2}>
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-64" />
                </Flex>
              ) : (
                <Skeleton className="h-4 w-64" />
              )}
          </SheetHeader>
            <Flex flex="1" className="-mx-6 px-6 mt-6 overflow-y-auto">
              <Flex className="pr-4" fullWidth>
              {formFields}
              </Flex>
            </Flex>
            <SheetFooter className="mt-6 border-t border-border pt-4">
              <Flex align="center" gap={3}>
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-20" />
              </Flex>
          </SheetFooter>
          </Flex>
        </SheetContent>
      </Sheet>
    )
  }

  const formContent = showCard ? (
    <Card>
      {title && (
        <CardHeader>
          <Flex direction="col" gap={2}>
          <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </Flex>
        </CardHeader>
      )}
      <CardContent className={title ? undefined : "pt-6"}>
        {formFields}
      </CardContent>
    </Card>
  ) : (
    <Flex fullWidth>{formFields}</Flex>
  )

  return (
    <Flex direction="col" flex="1" gap={6} marginX="auto" fullWidth padding="md">
      {title && (
        <Flex direction="col-lg-row-items-center" align="start" justify="between" gap={4} paddingBottom={4} border="b-border">
          <Flex direction="col" gap={2} flex="1" minWidth="0">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </Flex>
        </Flex>
      )}

      {formContent}

      <Flex align="center" justify="end" gap={3} paddingY="responsive" border="top">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-20" />
      </Flex>
    </Flex>
  )
}

