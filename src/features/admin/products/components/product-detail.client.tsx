"use client"

import * as React from "react"
import {
  Package,
  Hash,
  DollarSign,
  Box,
  Tag,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Edit,
  Image as ImageIcon,
} from "lucide-react"
import { Editor } from "@/components/editor/editor-x/editor"
import type { SerializedEditorState } from "lexical"
import {
  ResourceDetailClient,
  FieldItem,
  type ResourceDetailField,
  type ResourceDetailSection,
} from "@/features/admin/resources/components"
import { useResourceDetailData, useResourceDetailLogger } from "@/features/admin/resources/hooks"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useResourceRouter } from "@/hooks/use-resource-segment"
import { formatDateVi } from "@/features/admin/resources/utils"
import { cn } from "@/lib/utils"
import { queryKeys } from "@/lib/query-keys"
import { logger } from "@/lib/config/logger"
import { usePageLoadLogger } from "@/hooks/use-page-load-logger"
import { usePermissions } from "@/hooks/use-permissions"
import { PERMISSIONS } from "@/lib/permissions"
import Image from "next/image"

export interface ProductDetailData {
  id: string
  name: string
  slug: string
  sku: string
  price: string
  compareAtPrice: string | null
  stock: number
  status: string
  featured: boolean
  description?: string | null
  shortDescription?: string | null
  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
  categories?: Array<{
    id: string
    name: string
  }>
  images?: Array<{
    id: string
    url: string
    alt: string | null
    order: number
    isPrimary: boolean
  }>
  [key: string]: unknown
}

export interface ProductDetailClientProps {
  productId: string
  product: ProductDetailData
  backUrl?: string
}

export function ProductDetailClient({
  productId,
  product,
  backUrl = "/admin/products",
}: ProductDetailClientProps) {
  const router = useResourceRouter()
  const { hasAnyPermission } = usePermissions()

  // Log page load
  usePageLoadLogger("detail")

  // Check permission for edit
  const canUpdate = hasAnyPermission([PERMISSIONS.PRODUCTS_UPDATE, PERMISSIONS.PRODUCTS_MANAGE])

  const { data: detailData, isFetched, isFromApi, fetchedData } = useResourceDetailData({
    initialData: product,
    resourceId: productId,
    detailQueryKey: queryKeys.adminProducts.detail,
    resourceName: "products",
    fetchOnMount: true,
  })

  useResourceDetailLogger({
    resourceName: "products",
    resourceId: productId,
    data: detailData,
    isFetched,
    isFromApi,
    fetchedData,
  })

  const detailFields: ResourceDetailField<ProductDetailData>[] = []

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { label: "Hoạt động", className: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20", icon: CheckCircle2 },
      DRAFT: { label: "Nháp", className: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20", icon: XCircle },
      INACTIVE: { label: "Không hoạt động", className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20", icon: XCircle },
      ARCHIVED: { label: "Lưu trữ", className: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20", icon: XCircle },
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT
    const Icon = config.icon
    return (
      <Badge className={cn("text-sm font-medium px-2.5 py-1", config.className)} variant="outline">
        <Icon className="mr-1.5 h-3.5 w-3.5" />
        {config.label}
      </Badge>
    )
  }

  const primaryImage = detailData.images?.find((img) => img.isPrimary) || detailData.images?.[0]

  const detailSections: ResourceDetailSection<ProductDetailData>[] = [
    {
      id: "basic",
      title: "Thông tin cơ bản",
      description: "Thông tin chính về sản phẩm",
      fieldHeader: (
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg border border-border/50">
          {primaryImage && (
            <div className="relative h-24 w-24 rounded-lg overflow-hidden border-2 border-border">
              <Image
                src={primaryImage.url}
                alt={primaryImage.alt || detailData.name}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{detailData.name}</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
              <Hash className="h-4 w-4" />
              {detailData.sku}
            </p>
            {detailData.categories && detailData.categories.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {detailData.categories.map((category) => (
                  <Badge
                    key={category.id}
                    variant="outline"
                    className="inline-flex items-center gap-1.5 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary border-primary/20"
                  >
                    <Tag className="h-3 w-3" />
                    {category.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      ),
      fieldsContent: (_fields, data) => {
        const productData = data as ProductDetailData

        return (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
            {/* Name */}
            <FieldItem icon={Package} label="Tên sản phẩm">
              <div className="text-sm font-medium text-foreground">{productData.name || "—"}</div>
            </FieldItem>

            {/* SKU */}
            <FieldItem icon={Hash} label="SKU">
              <div className="text-sm font-medium text-foreground">{productData.sku || "—"}</div>
            </FieldItem>

            {/* Slug */}
            <FieldItem icon={Hash} label="Slug">
              <div className="text-sm font-medium text-foreground font-mono">{productData.slug || "—"}</div>
            </FieldItem>

            {/* Price */}
            <FieldItem icon={DollarSign} label="Giá bán">
              <div className="text-sm font-medium text-foreground">
                {productData.price ? new Intl.NumberFormat("vi-VN").format(Number(productData.price)) : "—"} đ
              </div>
            </FieldItem>

            {/* Compare At Price */}
            {productData.compareAtPrice && (
              <FieldItem icon={DollarSign} label="Giá so sánh">
                <div className="text-sm font-medium text-foreground line-through text-muted-foreground">
                  {new Intl.NumberFormat("vi-VN").format(Number(productData.compareAtPrice))} đ
                </div>
              </FieldItem>
            )}

            {/* Stock */}
            <FieldItem icon={Box} label="Tồn kho">
              <div className="text-sm font-medium text-foreground">{productData.stock || 0}</div>
            </FieldItem>

            {/* Status */}
            <FieldItem icon={productData.status === "ACTIVE" ? CheckCircle2 : XCircle} label="Trạng thái">
              {getStatusBadge(productData.status)}
            </FieldItem>

            {/* Featured */}
            <FieldItem icon={CheckCircle2} label="Sản phẩm nổi bật">
              <Badge
                className={cn(
                  "text-sm font-medium px-2.5 py-1",
                  productData.featured
                    ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
                    : "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20"
                )}
                variant="outline"
              >
                {productData.featured ? "Có" : "Không"}
              </Badge>
            </FieldItem>

            {/* Short Description */}
            {productData.shortDescription && (
              <FieldItem icon={Package} label="Mô tả ngắn">
                <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground break-words">
                  {productData.shortDescription}
                </div>
              </FieldItem>
            )}

            {/* Description */}
            {productData.description && (
              <FieldItem icon={Package} label="Mô tả chi tiết" className="col-span-full">
                <div className="w-full">
                  {(() => {
                    // Try to parse as SerializedEditorState
                    let editorState: SerializedEditorState | null = null
                    try {
                      if (
                        productData.description &&
                        typeof productData.description === "object" &&
                        productData.description !== null
                      ) {
                        editorState = productData.description as unknown as SerializedEditorState
                      } else if (typeof productData.description === "string") {
                        const parsed = JSON.parse(productData.description)
                        if (parsed && typeof parsed === "object") {
                          editorState = parsed as SerializedEditorState
                        }
                      }
                    } catch {
                      // Not a valid editor state, treat as plain text
                    }

                    if (editorState) {
                      return (
                        <div className="w-full">
                          <Editor editorSerializedState={editorState} readOnly={true} />
                        </div>
                      )
                    }

                    // Fallback to plain text
                    return (
                      <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground break-words">
                        {typeof productData.description === "string"
                          ? productData.description
                          : JSON.stringify(productData.description)}
                      </div>
                    )
                  })()}
                </div>
              </FieldItem>
            )}

            {/* Categories */}
            {productData.categories && productData.categories.length > 0 && (
              <FieldItem icon={Tag} label="Danh mục">
                <div className="flex flex-wrap gap-2">
                  {productData.categories.map((category) => (
                    <Badge
                      key={category.id}
                      variant="outline"
                      className="inline-flex items-center gap-1.5 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary border-primary/20"
                    >
                      <Tag className="h-3 w-3" />
                      {category.name}
                    </Badge>
                  ))}
                </div>
              </FieldItem>
            )}

            {/* Images */}
            {productData.images && productData.images.length > 0 && (
              <div className="col-span-full">
                <FieldItem icon={ImageIcon} label="Hình ảnh">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {productData.images.map((image) => (
                      <div key={image.id} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                        <Image src={image.url} alt={image.alt || productData.name} fill className="object-cover" />
                      </div>
                    ))}
                  </div>
                </FieldItem>
              </div>
            )}

            {/* Timestamps */}
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 col-span-1 sm:col-span-2">
              <FieldItem icon={Calendar} label="Ngày tạo">
                <div className="text-sm font-medium text-foreground">
                  {productData.createdAt ? formatDateVi(productData.createdAt) : "—"}
                </div>
              </FieldItem>

              <FieldItem icon={Clock} label="Cập nhật lần cuối">
                <div className="text-sm font-medium text-foreground">
                  {productData.updatedAt ? formatDateVi(productData.updatedAt) : "—"}
                </div>
              </FieldItem>
            </div>
          </div>
        )
      },
    },
  ]

  const isDeleted = detailData.deletedAt !== null && detailData.deletedAt !== undefined

  return (
    <ResourceDetailClient<ProductDetailData>
      data={detailData}
      fields={detailFields}
      detailSections={detailSections}
      title={detailData.name}
      description={`Chi tiết sản phẩm ${detailData.sku}`}
      backUrl={backUrl}
      backLabel="Quay lại danh sách"
      actions={
        !isDeleted && canUpdate ? (
          <Button
            variant="outline"
            onClick={() => {
              logger.info("✏️ Edit from detail page", {
                source: "detail-page-edit-button",
                resourceId: productId,
                resourceName: "products",
                targetUrl: `/admin/products/${productId}/edit`,
              })
              router.push(`/admin/products/${productId}/edit`)
            }}
            className="gap-2"
          >
            <Edit className="h-4 w-4" />
            Chỉnh sửa
          </Button>
        ) : null
      }
    />
  )
}

