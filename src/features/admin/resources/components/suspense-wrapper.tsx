import { Suspense, type ReactNode } from "react"

import {
  MessagesPageSkeleton,
  ResourceDetailSkeleton,
  ResourceTableSkeleton,
} from "@/components/layouts/skeletons"

type DetailSkeletonConfig = {
  showHeader?: boolean
  fieldCount?: number
  sectionCount?: number
}

type TableSkeletonConfig = {
  columnCount?: number
  rowCount?: number
  withTitle?: boolean
}

type SuspensePreset = "detail" | "table" | "messages" | "inline"

const defaultDetailSkeleton: Required<DetailSkeletonConfig> = {
  showHeader: true,
  fieldCount: 6,
  sectionCount: 1,
}

const defaultTableSkeleton: Required<TableSkeletonConfig> = {
  columnCount: 4,
  rowCount: 10,
  withTitle: false,
}

const LoadingPlaceholder = () => (
  <div className="flex min-h-[200px] items-center justify-center">
    <span className="text-muted-foreground">Loading...</span>
  </div>
)

export interface SuspenseWrapperProps {
  children: ReactNode
  fallback?: ReactNode
  preset?: SuspensePreset
  detailConfig?: DetailSkeletonConfig
  tableConfig?: TableSkeletonConfig
}

export function SuspenseWrapper({
  children,
  fallback,
  preset = "detail",
  detailConfig,
  tableConfig,
}: SuspenseWrapperProps) {
  const fallbackNode = fallback ?? buildFallback(preset, { detail: detailConfig, table: tableConfig })

  return <Suspense fallback={fallbackNode}>{children}</Suspense>
}

type FallbackConfig = {
  detail?: DetailSkeletonConfig
  table?: TableSkeletonConfig
}

function buildFallback(preset: SuspensePreset, config?: FallbackConfig): ReactNode {
  switch (preset) {
    case "table": {
      const tableProps = { ...defaultTableSkeleton, ...(config?.table ?? {}) }

      return (
        <ResourceTableSkeleton
          title={tableProps.withTitle}
          rowCount={tableProps.rowCount}
          columnCount={tableProps.columnCount}
        />
      )
    }
    case "messages":
      return <MessagesPageSkeleton />
    case "inline":
      return <LoadingPlaceholder />
    case "detail":
    default: {
      const detailProps = { ...defaultDetailSkeleton, ...(config?.detail ?? {}) }

      return (
        <ResourceDetailSkeleton
          showHeader={detailProps.showHeader}
          fieldCount={detailProps.fieldCount}
          sectionCount={detailProps.sectionCount}
        />
      )
    }
  }
}

export interface FormPageSuspenseProps {
  children: ReactNode
  fieldCount?: number
  sectionCount?: number
}

export function FormPageSuspense({
  children,
  fieldCount = defaultDetailSkeleton.fieldCount,
  sectionCount = defaultDetailSkeleton.sectionCount,
}: FormPageSuspenseProps) {
  return (
    <SuspenseWrapper
      preset="detail"
      detailConfig={{
        showHeader: true,
        fieldCount,
        sectionCount,
      }}
    >
      {children}
    </SuspenseWrapper>
  )
}

export interface TablePageSuspenseProps {
  children: ReactNode
  columnCount?: number
  rowCount?: number
  showTitle?: boolean
}

export function TablePageSuspense({
  children,
  columnCount = defaultTableSkeleton.columnCount,
  rowCount = defaultTableSkeleton.rowCount,
  showTitle = defaultTableSkeleton.withTitle,
}: TablePageSuspenseProps) {
  return (
    <SuspenseWrapper
      preset="table"
      tableConfig={{
        columnCount,
        rowCount,
        withTitle: showTitle,
      }}
    >
      {children}
    </SuspenseWrapper>
  )
}

export interface MessagesPageSuspenseProps {
  children: ReactNode
}

export function MessagesPageSuspense({ children }: MessagesPageSuspenseProps) {
  return (
    <SuspenseWrapper preset="messages">
      {children}
    </SuspenseWrapper>
  )
}

export interface InlineSuspenseProps {
  children: ReactNode
  fallback?: ReactNode
}

export function InlineSuspense({ children, fallback }: InlineSuspenseProps) {
  return (
    <SuspenseWrapper preset="inline" fallback={fallback}>
      {children}
    </SuspenseWrapper>
  )
}
