import { useMemo } from "react"
import { TypographyP, TypographyPSmallMuted } from "@/components/ui/typography"
import { Flex } from "@/components/ui/flex"
import type { DataTableColumn } from "@/components/tables"
import { useDynamicFilterOptions } from "@/features/admin/resources/hooks/use-dynamic-filter-options"
import { apiRoutes } from "@/constants"
import type { CategoryRow } from "../types"

export const useCategoryColumns = () => {
  const nameFilter = useDynamicFilterOptions({
    optionsEndpoint: apiRoutes.categories.options({ column: "name" }),
  })

  const slugFilter = useDynamicFilterOptions({
    optionsEndpoint: apiRoutes.categories.options({ column: "slug" }),
  })

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [],
  )

  const baseColumns = useMemo<DataTableColumn<CategoryRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Tên danh mục",
        filter: {
          type: "select",
          placeholder: "Chọn tên danh mục...",
          searchPlaceholder: "Tìm kiếm...",
          emptyMessage: "Không tìm thấy.",
          options: nameFilter.options,
          onSearchChange: nameFilter.onSearchChange,
          isLoading: nameFilter.isLoading,
        },
        className: "min-w-[150px] max-w-[250px]",
        headerClassName: "min-w-[150px] max-w-[250px]",
        cell: (row) => (
          <Flex maxWidth="75" className="break-words" title={row.name} align="center" gap={2}>
            {row.parentId && (
              <TypographyPSmallMuted className="whitespace-nowrap">
                └─
              </TypographyPSmallMuted>
            )}
            {row.name}
          </Flex>
        ),
      },
      {
        accessorKey: "slug",
        header: "Slug",
        filter: {
          type: "select",
          placeholder: "Chọn slug...",
          searchPlaceholder: "Tìm kiếm...",
          emptyMessage: "Không tìm thấy.",
          options: slugFilter.options,
          onSearchChange: slugFilter.onSearchChange,
          isLoading: slugFilter.isLoading,
        },
        className: "min-w-[150px] max-w-[250px]",
        headerClassName: "min-w-[150px] max-w-[250px]",
        cell: (row) => (
          <Flex maxWidth="75" className="break-words truncate" title={row.slug}>
            {row.slug}
          </Flex>
        ),
      },
      {
        accessorKey: "parentName",
        header: "Danh mục cha",
        className: "min-w-[150px] max-w-[250px]",
        headerClassName: "min-w-[150px] max-w-[250px]",
        cell: (row) => (
          <Flex maxWidth="75" className="break-words" title={row.parentName || undefined}>
            {row.parentName ?? <TypographyPSmallMuted>-</TypographyPSmallMuted>}
          </Flex>
        ),
      },
      {
        accessorKey: "description",
        header: "Mô tả",
        className: "min-w-[200px] max-w-[400px]",
        headerClassName: "min-w-[200px] max-w-[400px]",
        cell: (row) => (
          <TypographyP className="break-words max-w-[400px]" title={row.description || undefined}>
            {row.description ?? <TypographyPSmallMuted>-</TypographyPSmallMuted>}
          </TypographyP>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Ngày tạo",
        filter: {
          type: "date",
          placeholder: "Chọn ngày tạo",
          dateFormat: "dd/MM/yyyy",
        },
        className: "min-w-[140px] max-w-[180px]",
        headerClassName: "min-w-[140px] max-w-[180px]",
        cell: (row) => {
          try {
            return dateFormatter.format(new Date(row.createdAt))
          } catch {
            return row.createdAt
          }
        },
      },
    ],
    [
      dateFormatter,
      nameFilter.options,
      nameFilter.onSearchChange,
      nameFilter.isLoading,
      slugFilter.options,
      slugFilter.onSearchChange,
      slugFilter.isLoading,
    ],
  )

  const deletedColumns = useMemo<DataTableColumn<CategoryRow>[]>(
    () => [
      ...baseColumns,
      {
        accessorKey: "deletedAt",
        header: "Ngày xóa",
        filter: {
          type: "date",
          placeholder: "Chọn ngày xóa",
          dateFormat: "dd/MM/yyyy",
        },
        className: "min-w-[140px] max-w-[180px]",
        headerClassName: "min-w-[140px] max-w-[180px]",
        cell: (row) => {
          if (!row.deletedAt) return <TypographyPSmallMuted>-</TypographyPSmallMuted>
          try {
            return dateFormatter.format(new Date(row.deletedAt))
          } catch {
            return row.deletedAt
          }
        },
      },
    ],
    [baseColumns, dateFormatter],
  )

  return {
    baseColumns,
    deletedColumns,
  }
}

