import type { DataTableColumn } from "@/components/tables"
import { Badge } from "@/components/ui/badge"
import type { OrderRow } from "../types"

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  PROCESSING: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  SHIPPED: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  DELIVERED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
}

const paymentStatusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  PAID: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  REFUNDED: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  FAILED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
}

export function useOrderColumns() {
  const baseColumns: DataTableColumn<OrderRow>[] = [
    {
      accessorKey: "orderNumber",
      header: "Mã đơn hàng",
      cell: (row) => (
        <div className="font-medium">#{row.orderNumber}</div>
      ),
    },
    {
      accessorKey: "customerName",
      header: "Khách hàng",
      cell: (row) => (
        <div>
          <div className="font-medium">{row.customerName}</div>
          <div className="text-sm text-muted-foreground">{row.customerEmail}</div>
          {row.customerPhone && (
            <div className="text-sm text-muted-foreground">{row.customerPhone}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: (row) => {
        const status = row.status
        return (
          <Badge className={statusColors[status] || "bg-gray-100 text-gray-800"}>
            {status === "PENDING" && "Chờ xử lý"}
            {status === "PROCESSING" && "Đang xử lý"}
            {status === "SHIPPED" && "Đã giao hàng"}
            {status === "DELIVERED" && "Đã nhận hàng"}
            {status === "CANCELLED" && "Đã hủy"}
            {!["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].includes(status) && status}
          </Badge>
        )
      },
    },
    {
      accessorKey: "paymentStatus",
      header: "Thanh toán",
      cell: (row) => {
        const paymentStatus = row.paymentStatus
        return (
          <Badge className={paymentStatusColors[paymentStatus] || "bg-gray-100 text-gray-800"}>
            {paymentStatus === "PENDING" && "Chờ thanh toán"}
            {paymentStatus === "PAID" && "Đã thanh toán"}
            {paymentStatus === "REFUNDED" && "Đã hoàn tiền"}
            {paymentStatus === "FAILED" && "Thanh toán thất bại"}
            {!["PENDING", "PAID", "REFUNDED", "FAILED"].includes(paymentStatus) && paymentStatus}
          </Badge>
        )
      },
    },
    {
      accessorKey: "total",
      header: "Tổng tiền",
      cell: (row) => (
        <div className="font-semibold">
          {new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
          }).format(parseFloat(row.total))}
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Ngày tạo",
      cell: (row) => {
        const date = new Date(row.createdAt)
        return (
          <div className="text-sm">
            {date.toLocaleDateString("vi-VN", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            })}
            <div className="text-muted-foreground">
              {date.toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        )
      },
    },
  ]

  const deletedColumns: DataTableColumn<OrderRow>[] = [
    ...baseColumns,
    {
      accessorKey: "deletedAt",
      header: "Ngày xóa",
      cell: (row) => {
        if (!row.deletedAt) return null
        const date = new Date(row.deletedAt)
        return (
          <div className="text-sm">
            {date.toLocaleDateString("vi-VN", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            })}
          </div>
        )
      },
    },
  ]

  return {
    baseColumns,
    deletedColumns,
  }
}

