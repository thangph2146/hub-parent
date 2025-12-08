import { useMemo } from "react"
import type { DataTableColumn } from "@/components/tables"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import type { ProductRow } from "../types"

interface UseProductColumnsOptions {
  canToggleStatus?: boolean
  onToggleFeatured?: (row: ProductRow, newStatus: boolean) => void
  togglingProducts?: Set<string>
}

export function useProductColumns({
  canToggleStatus = false,
  onToggleFeatured,
  togglingProducts = new Set(),
}: UseProductColumnsOptions = {}) {
  const baseColumns = useMemo<DataTableColumn<ProductRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Tên sản phẩm",
        cell: (row) => {
          return (
            <div className="flex flex-col gap-1">
              <span className="font-medium">{row.name}</span>
              <span className="text-xs text-muted-foreground">SKU: {row.sku}</span>
            </div>
          )
        },
      },
      {
        accessorKey: "price",
        header: "Giá",
        cell: (row) => {
          const price = parseFloat(row.price)
          const comparePrice = row.compareAtPrice ? parseFloat(row.compareAtPrice) : null
          return (
            <div className="flex flex-col gap-1">
              <span className="font-medium">
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(price)}
              </span>
              {comparePrice && comparePrice > price && (
                <span className="text-xs text-muted-foreground line-through">
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(comparePrice)}
                </span>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: "stock",
        header: "Tồn kho",
        cell: (row) => {
          const stock = row.stock
          return (
            <Badge variant={stock > 0 ? "default" : "destructive"}>
              {stock > 0 ? `${stock} sản phẩm` : "Hết hàng"}
            </Badge>
          )
        },
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: (row) => {
          const status = row.status
          const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
            ACTIVE: { label: "Đang bán", variant: "default" },
            DRAFT: { label: "Nháp", variant: "secondary" },
            INACTIVE: { label: "Ngừng bán", variant: "outline" },
            ARCHIVED: { label: "Lưu trữ", variant: "secondary" },
          }
          const statusInfo = statusMap[status] || { label: status, variant: "outline" as const }
          return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        },
      },
      {
        accessorKey: "featured",
        header: "Nổi bật",
        cell: (row) => {
          const isToggling = togglingProducts?.has(row.id)
          return (
            <Checkbox
              checked={row.featured}
              disabled={!canToggleStatus || isToggling}
              onCheckedChange={(checked) => {
                if (canToggleStatus && onToggleFeatured) {
                  onToggleFeatured(row, !!checked)
                }
              }}
            />
          )
        },
      },
      {
        accessorKey: "categories",
        header: "Danh mục",
        cell: (row) => {
          const categories = row.categories || []
          if (categories.length === 0) {
            return <span className="text-muted-foreground text-sm">-</span>
          }
          return (
            <div className="flex flex-wrap gap-1">
              {categories.slice(0, 2).map((cat) => (
                <Badge key={cat.id} variant="outline" className="text-xs">
                  {cat.name}
                </Badge>
              ))}
              {categories.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{categories.length - 2}
                </Badge>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: "createdAt",
        header: "Ngày tạo",
        cell: (row) => {
          const date = new Date(row.createdAt)
          return (
            <span className="text-sm text-muted-foreground">
              {date.toLocaleDateString("vi-VN")}
            </span>
          )
        },
      },
    ],
    [canToggleStatus, onToggleFeatured, togglingProducts]
  )

  const deletedColumns = useMemo<DataTableColumn<ProductRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Tên sản phẩm",
        cell: (row) => {
          return (
            <div className="flex flex-col gap-1">
              <span className="font-medium">{row.name}</span>
              <span className="text-xs text-muted-foreground">SKU: {row.sku}</span>
            </div>
          )
        },
      },
      {
        accessorKey: "deletedAt",
        header: "Ngày xóa",
        cell: (row) => {
          const date = row.deletedAt ? new Date(row.deletedAt) : null
          return date ? (
            <span className="text-sm text-muted-foreground">
              {date.toLocaleDateString("vi-VN")}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">-</span>
          )
        },
      },
    ],
    []
  )

  return { baseColumns, deletedColumns }
}
