import { useMemo } from "react"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import type { DataTableColumn } from "@/components/tables"
import { useDynamicFilterOptions } from "@/features/admin/resources/hooks/use-dynamic-filter-options"
import { apiRoutes } from "@/constants"
import type { NotificationRow } from "../types"
import { NOTIFICATION_KINDS, NOTIFICATION_LABELS } from "../constants"
import { TypographySpanSmallMuted, TypographyP } from "@/components/ui/typography"
import { Flex } from "@/components/ui/flex"

interface UseNotificationColumnsOptions {
  togglingNotifications: Set<string>
  sessionUserId?: string
  isSuperAdmin?: boolean
  onToggleRead: (row: NotificationRow, checked: boolean) => void
}

export const useNotificationColumns = ({
  togglingNotifications,
  sessionUserId,
  isSuperAdmin = false,
  onToggleRead,
}: UseNotificationColumnsOptions) => {
  const userEmailFilter = useDynamicFilterOptions({
    optionsEndpoint: apiRoutes.adminNotifications.options({ column: "userEmail" }),
  })

  const userNameFilter = useDynamicFilterOptions({
    optionsEndpoint: apiRoutes.adminNotifications.options({ column: "userName" }),
  })
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [],
  )

  const baseColumns = useMemo<DataTableColumn<NotificationRow>[]>(
    () => [
      {
        accessorKey: "userEmail",
        header: "Email người nhận",
        filter: {
          type: "select",
          placeholder: "Chọn email...",
          searchPlaceholder: "Tìm kiếm...",
          emptyMessage: "Không tìm thấy.",
          options: userEmailFilter.options,
          onSearchChange: userEmailFilter.onSearchChange,
          isLoading: userEmailFilter.isLoading,
        },
        className: "min-w-[180px]",
        headerClassName: "min-w-[180px]",
        cell: (row) => {
          const isOwner = sessionUserId === row.userId
          return (
            <Flex align="center" gap={2}>
              <TypographyP className="font-medium">{row.userEmail || "-"}</TypographyP>
              {isOwner && (
                <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 w-[80px] text-center">
                  {NOTIFICATION_LABELS.OWN_NOTIFICATION}
                </Badge>
              )}
            </Flex>
          )
        },
      },
      {
        accessorKey: "userName",
        header: "Tên người nhận",
        filter: {
          type: "select",
          placeholder: "Chọn tên...",
          searchPlaceholder: "Tìm kiếm...",
          emptyMessage: "Không tìm thấy.",
          options: userNameFilter.options,
          onSearchChange: userNameFilter.onSearchChange,
          isLoading: userNameFilter.isLoading,
        },
        className: "min-w-[180px]",
        headerClassName: "min-w-[180px]",
        cell: (row) => <TypographyP>{row.userName || "-"}</TypographyP>,
      },
      {
        accessorKey: "kind",
        header: "Loại",
        filter: {
          type: "select",
          placeholder: "Chọn loại...",
          options: Object.entries(NOTIFICATION_KINDS).map(([value, { label }]) => ({
            label,
            value,
          })),
        },
        className: "min-w-[120px]",
        headerClassName: "min-w-[120px]",
        cell: (row) => {
          const kind = NOTIFICATION_KINDS[row.kind] || { label: row.kind, variant: "secondary" as const }
          return <Badge variant={kind.variant}>{kind.label}</Badge>
        },
      },
      {
        accessorKey: "title",
        header: "Tiêu đề",
        className: "min-w-[250px] max-w-[400px]",
        headerClassName: "min-w-[250px] max-w-[400px]",
        cell: (row) => (
          <a
            href={`/admin/notifications/${row.id}`}
            className="text-primary hover:underline break-words"
            title={row.title}
          >
            <TypographyP>{row.title}</TypographyP>
          </a>
        ),
      },
      {
        accessorKey: "description",
        header: "Mô tả",
        className: "min-w-[300px] max-w-[500px]",
        headerClassName: "min-w-[300px] max-w-[500px]",
        cell: (row) => (
          <div className="break-words max-w-[500px]" title={row.description || undefined}>
            {row.description || "-"}
          </div>
        ),
      },
      {
        accessorKey: "isRead",
        header: "Trạng thái",
        className: "min-w-[140px] max-w-[180px]",
        headerClassName: "min-w-[140px] max-w-[180px]",
        cell: (row) => {
          const isOwner = sessionUserId === row.userId
          const canToggle = isOwner || isSuperAdmin
          
          return (
            <Flex align="center" gap={2}>
              <Switch
                checked={row.isRead}
                disabled={togglingNotifications.has(row.id) || !canToggle}
                onCheckedChange={(checked) => {
                  if (canToggle) {
                    onToggleRead(row, checked)
                  }
                }}
                aria-label={row.isRead ? "Đánh dấu chưa đọc" : "Đánh dấu đã đọc"}
              />
              <TypographySpanSmallMuted>
                {row.isRead ? NOTIFICATION_LABELS.READ : NOTIFICATION_LABELS.UNREAD}
              </TypographySpanSmallMuted>
            </Flex>
          )
        },
      },
      {
        accessorKey: "createdAt",
        header: "Ngày tạo",
        className: "min-w-[180px]",
        headerClassName: "min-w-[180px]",
        cell: (row) => dateFormatter.format(new Date(row.createdAt)),
      },
      {
        accessorKey: "readAt",
        header: "Ngày đọc",
        className: "min-w-[180px]",
        headerClassName: "min-w-[180px]",
        cell: (row) => row.readAt ? dateFormatter.format(new Date(row.readAt)) : "-",
      },
      {
        accessorKey: "expiresAt",
        header: "Ngày hết hạn",
        className: "min-w-[180px]",
        headerClassName: "min-w-[180px]",
        cell: (row) => row.expiresAt ? dateFormatter.format(new Date(row.expiresAt)) : "-",
      },
    ],
    [
      dateFormatter,
      userEmailFilter.options,
      userEmailFilter.onSearchChange,
      userEmailFilter.isLoading,
      userNameFilter.options,
      userNameFilter.onSearchChange,
      userNameFilter.isLoading,
      sessionUserId,
      isSuperAdmin,
      togglingNotifications,
      onToggleRead,
    ],
  )

  return {
    baseColumns,
  }
}

