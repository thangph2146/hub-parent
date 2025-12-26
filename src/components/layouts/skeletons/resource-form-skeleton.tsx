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
import { FieldSet, FieldLegend } from "@/components/ui/field"
import { cn } from "@/lib/utils"
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
  sectionCount?: number
}

export function ResourceFormSkeleton({
  variant = "page",
  fieldCount = 6,
  title = true,
  showCard = true,
  sectionCount = 1,
}: ResourceFormSkeletonProps) {
  const fieldsPerSection = Math.ceil(fieldCount / sectionCount)
  
  const formFields = sectionCount > 1 ? (
    <Flex direction="col" gap={6} fullWidth>
      {Array.from({ length: sectionCount }).map((_, sectionIndex) => (
        <FieldSet 
          key={sectionIndex}
          className={cn(
            "group/field-set",
            "transition-all duration-300"
          )}
        >
          <FieldLegend variant="legend">
            <Skeleton className="h-5 w-48 inline-block" />
          </FieldLegend>
          <div className="mx-0 mb-3 px-2 border-b-0 w-auto text-xs sm:text-sm md:text-base font-normal text-muted-foreground">
            <Skeleton className="h-4 w-64 inline-block" />
          </div>
          <Grid cols="2-lg" fullWidth gap={6}>
            {Array.from({ length: fieldsPerSection }).map((_, fieldIndex) => (
              <Flex key={fieldIndex} direction="col" gap={2} fullWidth>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </Flex>
            ))}
          </Grid>
        </FieldSet>
      ))}
    </Flex>
  ) : (
    <Grid cols="2-lg" fullWidth gap={6}>
      {Array.from({ length: fieldCount }).map((_, index) => (
        <Flex key={index} direction="col" gap={2} fullWidth>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </Flex>
      ))}
    </Grid>
  )

  const headerContent = title ? (
    <Flex direction="col" gap={2} fullWidth>
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-64" />
    </Flex>
  ) : (
    <Skeleton className="h-4 w-64" />
  )

  const footerContent = (
    <Flex align="center" gap={3} fullWidth>
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-10 w-20" />
    </Flex>
  )

  if (variant === "dialog") {
    return (
      <Dialog open={true}>
        <DialogContent className="max-w-2xl w-full p-0">
          <Flex direction="col" fullWidth>
            <DialogHeader className="px-6 pt-6 pb-4">
              {headerContent}
            </DialogHeader>
            <Flex maxHeight="600" overflow="auto" fullWidth>
              <Flex padding="md" fullWidth>
                {formFields}
              </Flex>
            </Flex>
            <DialogFooter className="px-6 pb-6 pt-4 border-t border-border">
              {footerContent}
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
            <SheetHeader>{headerContent}</SheetHeader>
            <Flex flex="1" overflow="auto" fullWidth paddingX={6} marginTop={6}>
              <Flex paddingX={4} fullWidth>
                {formFields}
              </Flex>
            </Flex>
            <SheetFooter className="mt-6 pt-4 border-t border-border">
              {footerContent}
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
    <Flex direction="col" gap={6} flex="1" fullWidth marginX="auto" padding="md">
      {title && (
        <Flex direction="col-lg-row-items-center" justify="between" gap={4} fullWidth paddingBottom={4} border="b-border">
          <Flex direction="col" gap={2} fullWidth flex="1" minWidth="0">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </Flex>
        </Flex>
      )}

      {formContent}

      <Flex align="center" justify="end" gap={3} fullWidth paddingY={4} border="top">
        {footerContent}
      </Flex>
    </Flex>
  )
}

