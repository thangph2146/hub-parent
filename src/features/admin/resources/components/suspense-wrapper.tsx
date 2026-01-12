import { Suspense, type ReactNode } from "react"

import {
  MessagesPageSkeleton,
  ResourceDetailSkeleton,
  ResourceTableSkeleton,
} from "@/components/skeletons"
import { Flex } from "@/components/ui/flex"
import { TypographyPSmallMuted } from "@/components/ui/typography"

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

export type SuspensePreset = "detail" | "table" | "messages" | "inline"

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
  <Flex align="center" fullWidth>
    <TypographyPSmallMuted>Loading...</TypographyPSmallMuted>
  </Flex>
)

type FallbackConfig = {
  detail?: DetailSkeletonConfig
  table?: TableSkeletonConfig
}

const fallbackBuilders: Record<SuspensePreset, (config?: FallbackConfig) => ReactNode> = {
  detail: config => {
    const detailProps = { ...defaultDetailSkeleton, ...(config?.detail ?? {}) }

    return (
      <ResourceDetailSkeleton
        showHeader={detailProps.showHeader}
        fieldCount={detailProps.fieldCount}
        sectionCount={detailProps.sectionCount}
      />
    )
  },
  table: config => {
    const tableProps = { ...defaultTableSkeleton, ...(config?.table ?? {}) }

    return (
      <ResourceTableSkeleton
        title={tableProps.withTitle}
        rowCount={tableProps.rowCount}
        columnCount={tableProps.columnCount}
      />
    )
  },
  messages: () => <MessagesPageSkeleton />,
  inline: () => <LoadingPlaceholder />,
}

export interface SuspenseWrapperProps {
  children: ReactNode
  fallback?: ReactNode
  preset?: SuspensePreset
  detailConfig?: DetailSkeletonConfig
  tableConfig?: TableSkeletonConfig
}

export const SuspenseWrapper = ({
  children,
  fallback,
  preset = "detail",
  detailConfig,
  tableConfig,
}: SuspenseWrapperProps) => {
  const fallbackNode =
    fallback ?? resolveFallback(preset, { detail: detailConfig, table: tableConfig })

  return <Suspense fallback={fallbackNode}>{children}</Suspense>
}

const resolveFallback = (preset: SuspensePreset, config?: FallbackConfig) => {
  const builder = fallbackBuilders[preset] ?? fallbackBuilders.detail
  return builder(config)
}

export interface FormPageSuspenseProps {
  children: ReactNode
  fieldCount?: number
  sectionCount?: number
}

export const FormPageSuspense = ({
  children,
  fieldCount = defaultDetailSkeleton.fieldCount,
  sectionCount = defaultDetailSkeleton.sectionCount,
}: FormPageSuspenseProps) => {
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

export const TablePageSuspense = ({
  children,
  columnCount = defaultTableSkeleton.columnCount,
  rowCount = defaultTableSkeleton.rowCount,
  showTitle = defaultTableSkeleton.withTitle,
}: TablePageSuspenseProps) => {
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

export const MessagesPageSuspense = ({ children }: MessagesPageSuspenseProps) => {
  return (
    <SuspenseWrapper preset="messages">{children}</SuspenseWrapper>
  )
}

export interface InlineSuspenseProps {
  children: ReactNode
  fallback?: ReactNode
}

export const InlineSuspense = ({ children, fallback }: InlineSuspenseProps) => {
  return (
    <SuspenseWrapper preset="inline" fallback={fallback}>
      {children}
    </SuspenseWrapper>
  )
}

export const SuspenseBoundary = SuspenseWrapper
