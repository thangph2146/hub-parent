import { useMemo } from "react"
import { TypographySpanSmall, TypographySpanSmallMuted, IconSize } from "@/components/ui/typography"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import type { DataTableColumn } from "@/components/tables"
import { useDynamicFilterOptions } from "@/features/admin/resources/hooks/use-dynamic-filter-options"
import { apiRoutes } from "@/lib/api/routes"
import type { StudentRow } from "../types"
import { STUDENT_LABELS } from "../constants/messages"

interface UseStudentColumnsOptions {
  togglingStudents: Set<string>
  canToggleStatus: boolean
  onToggleStatus: (row: StudentRow, checked: boolean) => void
  isParent?: boolean
}

export const useStudentColumns = ({ togglingStudents, canToggleStatus, onToggleStatus, isParent = false }: UseStudentColumnsOptions) => {
  const studentCodeFilter = useDynamicFilterOptions({
    optionsEndpoint: apiRoutes.students.options({ column: "studentCode" }),
  })

  const nameFilter = useDynamicFilterOptions({
    optionsEndpoint: apiRoutes.students.options({ column: "name" }),
  })

  const emailFilter = useDynamicFilterOptions({
    optionsEndpoint: apiRoutes.students.options({ column: "email" }),
  })

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [],
  )

  const baseColumns = useMemo<DataTableColumn<StudentRow>[]>(() => {
    const columns: DataTableColumn<StudentRow>[] = [
      {
        accessorKey: "studentCode",
        header: STUDENT_LABELS.STUDENT_CODE,
        filter: {
          type: "select",
          placeholder: "Chọn mã sinh viên...",
          searchPlaceholder: "Tìm kiếm...",
          emptyMessage: "Không tìm thấy.",
          options: studentCodeFilter.options,
          onSearchChange: studentCodeFilter.onSearchChange,
          isLoading: studentCodeFilter.isLoading,
        },
        className: "min-w-[150px] max-w-[200px]",
        headerClassName: "min-w-[150px] max-w-[200px]",
      },
      {
        accessorKey: "name",
        header: STUDENT_LABELS.STUDENT_NAME,
        filter: {
          type: "select",
          placeholder: "Chọn tên sinh viên...",
          searchPlaceholder: "Tìm kiếm...",
          emptyMessage: "Không tìm thấy.",
          options: nameFilter.options,
          onSearchChange: nameFilter.onSearchChange,
          isLoading: nameFilter.isLoading,
        },
        className: "min-w-[150px] max-w-[250px]",
        headerClassName: "min-w-[150px] max-w-[250px]",
        cell: (row) => row.name ?? <span className="text-muted-foreground">-</span>,
      },
      {
        accessorKey: "email",
        header: STUDENT_LABELS.EMAIL,
        filter: {
          type: "select",
          placeholder: "Chọn email...",
          searchPlaceholder: "Tìm kiếm...",
          emptyMessage: "Không tìm thấy.",
          options: emailFilter.options,
          onSearchChange: emailFilter.onSearchChange,
          isLoading: emailFilter.isLoading,
        },
        className: "min-w-[180px] max-w-[250px]",
        headerClassName: "min-w-[180px] max-w-[250px]",
        cell: (row) => row.email ?? <span className="text-muted-foreground">-</span>,
      },
    ]

    if (canToggleStatus) {
      columns.push({
        accessorKey: "isActive",
        header: STUDENT_LABELS.STATUS,
        filter: {
          type: "select",
          placeholder: "Chọn trạng thái...",
          searchPlaceholder: "Tìm kiếm...",
          emptyMessage: "Không tìm thấy.",
          options: [
            { label: STUDENT_LABELS.ACTIVE, value: "true" },
            { label: STUDENT_LABELS.INACTIVE, value: "false" },
          ],
        },
        className: "w-[120px]",
        headerClassName: "w-[120px]",
        cell: (row) =>
          row.deletedAt ? (
            <TypographySpanSmall className="inline-flex min-w-[88px] items-center justify-center rounded-full bg-rose-100 px-2 py-1 text-rose-700">
              {STUDENT_LABELS.DELETED}
            </TypographySpanSmall>
          ) : (
            <div className="flex items-center gap-2">
              <Switch
                checked={row.isActive}
                disabled={togglingStudents.has(row.id) || !canToggleStatus}
                onCheckedChange={(checked) => onToggleStatus(row, checked)}
                aria-label={row.isActive ? "Vô hiệu hóa sinh viên" : "Kích hoạt sinh viên"}
              />
              <TypographySpanSmallMuted>
                {row.isActive ? STUDENT_LABELS.ACTIVE : STUDENT_LABELS.INACTIVE}
              </TypographySpanSmallMuted>
            </div>
          ),
      })
    }

    columns.push({
      accessorKey: "createdAt",
      header: STUDENT_LABELS.CREATED_AT,
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
    })

    // Thêm cột thông báo cho parent
    if (isParent) {
      columns.push({
        accessorKey: "id" as keyof StudentRow, // Sử dụng id làm accessorKey vì pendingApproval không có trong StudentRow
        header: "Thông báo",
        className: "w-full min-w-[300px] max-w-[500px]",
        headerClassName: "w-full min-w-[300px] max-w-[500px]",
        cell: (row) => {
          // Hiển thị thông báo đã được duyệt nếu student đã active và chưa bị xóa
          if (row.isActive && !row.deletedAt) {
            return (
              <Alert variant="default" className="w-full border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                <IconSize size="sm" className="text-green-600 dark:text-green-400">
                  <CheckCircle2 />
                </IconSize>
                <AlertTitle className="text-green-800 dark:text-green-200">
                  {STUDENT_LABELS.APPROVED_TITLE}
                </AlertTitle>
                <AlertDescription className="text-green-700 dark:text-green-300 mt-1">
                  {STUDENT_LABELS.APPROVED_MESSAGE}
                </AlertDescription>
              </Alert>
            )
          }
          // Hiển thị thông báo chờ xét duyệt nếu student chưa active và chưa bị xóa
          if (!row.isActive && !row.deletedAt) {
            return (
              <Alert variant="default" className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
                <IconSize size="sm" className="text-yellow-600 dark:text-yellow-400">
                  <AlertCircle />
                </IconSize>
                <AlertTitle className="text-yellow-800 dark:text-yellow-200">
                  {STUDENT_LABELS.PENDING_APPROVAL_TITLE}
                </AlertTitle>
                <AlertDescription className="text-yellow-700 dark:text-yellow-300 mt-1">
                  {STUDENT_LABELS.PENDING_APPROVAL_MESSAGE}
                </AlertDescription>
              </Alert>
            )
          }
          return <TypographySpanSmallMuted>-</TypographySpanSmallMuted>
        },
      })
    }

    return columns
  }, [
    isParent,
    canToggleStatus,
    dateFormatter,
    emailFilter.isLoading,
    emailFilter.onSearchChange,
    emailFilter.options,
    nameFilter.isLoading,
    nameFilter.onSearchChange,
    nameFilter.options,
    onToggleStatus,
    studentCodeFilter.isLoading,
    studentCodeFilter.onSearchChange,
    studentCodeFilter.options,
    togglingStudents,
  ])

  const deletedColumns = useMemo<DataTableColumn<StudentRow>[]>(
    () => [
      ...baseColumns,
      {
        accessorKey: "deletedAt",
        header: STUDENT_LABELS.DELETED_AT,
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
