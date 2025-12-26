import { useMemo } from "react"
import type { DataTableColumn } from "@/components/tables"
import { useDynamicFilterOptions } from "@/features/admin/resources/hooks/use-dynamic-filter-options"
import { apiRoutes } from "@/lib/api/routes"
import { Switch } from "@/components/ui/switch"
import type { PostRow } from "../types"
import { TypographySpanSmall, TypographySpanSmallMuted, TypographyP } from "@/components/ui/typography"
import { Flex } from "@/components/ui/flex"

interface UsePostColumnsOptions {
  togglingPosts: Set<string>
  canToggleStatus: boolean
  onTogglePublished: (row: PostRow, newStatus: boolean, refresh: () => void) => void
  refreshTable: () => void
}

export const usePostColumns = ({
  togglingPosts,
  canToggleStatus,
  onTogglePublished,
  refreshTable,
}: UsePostColumnsOptions) => {
  const titleFilter = useDynamicFilterOptions({
    optionsEndpoint: apiRoutes.posts.options({ column: "title" }),
  })

  const slugFilter = useDynamicFilterOptions({
    optionsEndpoint: apiRoutes.posts.options({ column: "slug" }),
  })

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [],
  )

  const baseColumns = useMemo<DataTableColumn<PostRow>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Tiêu đề",
        filter: {
          type: "select",
          placeholder: "Tìm kiếm tiêu đề...",
          searchPlaceholder: "Tìm kiếm...",
          emptyMessage: "Không tìm thấy.",
          options: titleFilter.options,
          onSearchChange: titleFilter.onSearchChange,
          isLoading: titleFilter.isLoading,
        },
        className: "min-w-[200px]",
        headerClassName: "min-w-[200px]",
        cell: (row) => (
          <Flex direction="col" gap={1.5}>
            <TypographyP>{row.title}</TypographyP>
            {row.excerpt && (
              <TypographySpanSmallMuted className="line-clamp-1">{row.excerpt}</TypographySpanSmallMuted>
            )}
            {(row.categories && row.categories.length > 0) || (row.tags && row.tags.length > 0) ? (
              <Flex wrap gap={1} marginTop={0.5}>
                {row.categories && row.categories.length > 0 && (
                  <>
                    {row.categories.slice(0, 2).map((category) => (
                      <TypographySpanSmall
                        key={category.id}
                        className="inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 text-primary"
                      >
                        {category.name}
                      </TypographySpanSmall>
                    ))}
                    {row.categories.length > 2 && (
                      <TypographySpanSmallMuted>
                        +{row.categories.length - 2}
                      </TypographySpanSmallMuted>
                    )}
                  </>
                )}
                {row.tags && row.tags.length > 0 && (
                  <>
                    {row.tags.slice(0, 2).map((tag) => (
                      <TypographySpanSmall
                        key={tag.id}
                        className="inline-flex items-center rounded-md bg-secondary/50 px-1.5 py-0.5 text-secondary-foreground"
                      >
                        {tag.name}
                      </TypographySpanSmall>
                    ))}
                    {row.tags.length > 2 && (
                      <TypographySpanSmallMuted>
                        +{row.tags.length - 2}
                      </TypographySpanSmallMuted>
                    )}
                  </>
                )}
              </Flex>
            ) : null}
          </Flex>
        ),
      },
      {
        accessorKey: "slug",
        header: "Slug",
        filter: {
          type: "select",
          placeholder: "Tìm kiếm slug...",
          searchPlaceholder: "Tìm kiếm...",
          emptyMessage: "Không tìm thấy.",
          options: slugFilter.options,
          onSearchChange: slugFilter.onSearchChange,
          isLoading: slugFilter.isLoading,
        },
        className: "min-w-[150px]",
        headerClassName: "min-w-[150px]",
        cell: (row) => (
          <TypographySpanSmallMuted className="font-mono">{row.slug}</TypographySpanSmallMuted>
        ),
      },
      {
        accessorKey: "author",
        header: "Tác giả",
        className: "min-w-[150px]",
        headerClassName: "min-w-[150px]",
        cell: (row) => (
          <Flex direction="col" gap={0.5}>
            <TypographyP>{row.author.name || "N/A"}</TypographyP>
            <TypographySpanSmallMuted>{row.author.email}</TypographySpanSmallMuted>
          </Flex>
        ),
      },
      {
        accessorKey: "published",
        header: "Trạng thái",
        filter: {
          type: "select",
          placeholder: "Chọn trạng thái",
          searchPlaceholder: "Tìm kiếm...",
          emptyMessage: "Không tìm thấy.",
          options: [
            { label: "Đã xuất bản", value: "true" },
            { label: "Bản nháp", value: "false" },
          ],
        },
        className: "w-[120px]",
        headerClassName: "w-[120px]",
        cell: (row) => {
          if (row.deletedAt) {
            return (
              <TypographySpanSmall className="inline-flex min-w-[88px] items-center justify-center rounded-full bg-rose-100 px-2 py-1 text-rose-700">
                Đã xóa
              </TypographySpanSmall>
            )
          }

          return (
            <Flex align="center" gap={2}>
              <Switch
                checked={row.published}
                disabled={togglingPosts.has(row.id) || !canToggleStatus}
                onCheckedChange={(checked) => {
                  onTogglePublished(row, checked, refreshTable)
                }}
                aria-label={row.published ? "Chuyển thành bản nháp" : "Xuất bản bài viết"}
              />
              <TypographySpanSmallMuted>
                {row.published ? "Đã xuất bản" : "Bản nháp"}
              </TypographySpanSmallMuted>
            </Flex>
          )
        },
      },
      {
        accessorKey: "publishedAt",
        header: "Ngày xuất bản",
        filter: {
          type: "date",
          placeholder: "Chọn ngày",
          dateFormat: "dd/MM/yyyy",
        },
        className: "min-w-[140px] max-w-[180px]",
        headerClassName: "min-w-[140px] max-w-[180px]",
        cell: (row) => {
          if (!row.publishedAt) return "-"
          try {
            return dateFormatter.format(new Date(row.publishedAt))
          } catch {
            return row.publishedAt
          }
        },
      },
      {
        accessorKey: "createdAt",
        header: "Ngày tạo",
        filter: {
          type: "date",
          placeholder: "Chọn ngày",
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
      titleFilter.options,
      titleFilter.onSearchChange,
      titleFilter.isLoading,
      slugFilter.options,
      slugFilter.onSearchChange,
      slugFilter.isLoading,
      togglingPosts,
      canToggleStatus,
      onTogglePublished,
      refreshTable,
    ],
  )

  const deletedColumns = useMemo<DataTableColumn<PostRow>[]>(
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
          if (!row.deletedAt) return "-"
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

