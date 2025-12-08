import type { ResourceFormField, ResourceFormSection } from "@/features/admin/resources/components"
import React from "react"
import { Package, Hash, AlignLeft, DollarSign, Box, ToggleLeft, Image as ImageIcon, Tag } from "lucide-react"
import { MultipleImagesField } from "@/features/admin/resources/components/form-fields/multiple-images-field"

export interface ProductFormData {
  name: string
  slug: string
  description?: string | null
  shortDescription?: string | null
  sku: string
  price: string | number
  compareAtPrice?: string | number | null
  cost?: string | number | null
  stock: number
  trackInventory?: boolean
  weight?: string | number | null
  status?: "DRAFT" | "ACTIVE" | "INACTIVE" | "ARCHIVED"
  featured?: boolean
  categoryIds?: string[] | string
  images?: Array<{
    url: string
    alt?: string | null
    order?: number
    isPrimary?: boolean
  }>
  specifications?: Record<string, unknown> | null // Thông số kỹ thuật (JSON)
  relatedProductIds?: string[] // IDs sản phẩm liên quan
  bundleProductIds?: string[] // IDs sản phẩm mua kèm
  variants?: Array<{
    id?: string
    name: string
    value?: string | null
    type: "version" | "color" | "size"
    price?: string | number | null
    sku?: string | null
    stock?: number | null
    imageUrl?: string | null
    order?: number
    isDefault?: boolean
  }>
  [key: string]: unknown
}

export function getProductFormSections(): ResourceFormSection[] {
  return [
    {
      id: "basic",
      title: "Thông tin cơ bản",
      description: "Thông tin chính về sản phẩm",
    },
    {
      id: "pricing",
      title: "Giá và tồn kho",
      description: "Thông tin về giá và số lượng tồn kho",
    },
    {
      id: "variants",
      title: "Biến thể sản phẩm",
      description: "Quản lý các biến thể (màu sắc, size, phiên bản)",
    },
    {
      id: "specifications",
      title: "Thông số kỹ thuật",
      description: "Thông số kỹ thuật chi tiết của sản phẩm",
    },
    {
      id: "related",
      title: "Sản phẩm liên quan",
      description: "Sản phẩm liên quan và mua kèm",
    },
    {
      id: "media",
      title: "Hình ảnh",
      description: "Hình ảnh sản phẩm",
    },
    {
      id: "settings",
      title: "Cài đặt",
      description: "Trạng thái và cài đặt sản phẩm",
    },
  ]
}

export function getBaseProductFields(
  categories: Array<{ label: string; value: string }> = []
): ResourceFormField<ProductFormData>[] {
  return [
    {
      name: "name",
      label: "Tên sản phẩm",
      type: "text",
      placeholder: "Nhập tên sản phẩm",
      required: true,
      description: "Tên sản phẩm sẽ hiển thị trên website",
      icon: React.createElement(Package, { className: "h-4 w-4" }),
      section: "basic",
    },
    {
      name: "slug",
      label: "Slug",
      type: "slug",
      sourceField: "name",
      placeholder: "san-pham-slug",
      required: true,
      description: "URL-friendly identifier (tự động tạo từ tên)",
      icon: React.createElement(Hash, { className: "h-4 w-4" }),
      section: "basic",
    },
    {
      name: "sku",
      label: "SKU",
      type: "text",
      placeholder: "SKU-001",
      required: true,
      description: "Mã SKU duy nhất của sản phẩm",
      icon: React.createElement(Hash, { className: "h-4 w-4" }),
      section: "basic",
    },
    {
      name: "shortDescription",
      label: "Mô tả ngắn",
      type: "textarea",
      placeholder: "Nhập mô tả ngắn về sản phẩm",
      description: "Mô tả ngắn gọn về sản phẩm (hiển thị trong danh sách)",
      icon: React.createElement(AlignLeft, { className: "h-4 w-4" }),
      section: "basic",
    },
    {
      name: "description",
      label: "Mô tả chi tiết",
      type: "editor",
      description: "Mô tả đầy đủ về sản phẩm (hỗ trợ rich text)",
      icon: React.createElement(AlignLeft, { className: "h-4 w-4" }),
      section: "basic",
    },
    ...(categories.length > 0
      ? [
          {
            name: "categoryIds",
            label: "Danh mục",
            type: "multiple-select",
            options: categories,
            description: "Chọn danh mục cho sản phẩm (có thể chọn nhiều)",
            icon: React.createElement(Tag, { className: "h-4 w-4" }),
            section: "basic",
          } as ResourceFormField<ProductFormData>,
        ]
      : []),
    {
      name: "price",
      label: "Giá bán",
      type: "number",
      placeholder: "0",
      required: true,
      description: "Giá bán của sản phẩm",
      icon: React.createElement(DollarSign, { className: "h-4 w-4" }),
      section: "pricing",
    },
    {
      name: "compareAtPrice",
      label: "Giá so sánh",
      type: "number",
      placeholder: "0",
      description: "Giá gốc (để hiển thị giảm giá)",
      icon: React.createElement(DollarSign, { className: "h-4 w-4" }),
      section: "pricing",
    },
    {
      name: "cost",
      label: "Giá vốn",
      type: "number",
      placeholder: "0",
      description: "Giá vốn của sản phẩm (nội bộ)",
      icon: React.createElement(DollarSign, { className: "h-4 w-4" }),
      section: "pricing",
    },
    {
      name: "stock",
      label: "Tồn kho",
      type: "number",
      placeholder: "0",
      required: true,
      defaultValue: 0,
      description: "Số lượng tồn kho",
      icon: React.createElement(Box, { className: "h-4 w-4" }),
      section: "pricing",
    },
    {
      name: "trackInventory",
      label: "Theo dõi tồn kho",
      type: "switch",
      defaultValue: true,
      description: "Bật để theo dõi số lượng tồn kho",
      icon: React.createElement(ToggleLeft, { className: "h-4 w-4" }),
      section: "pricing",
    },
    {
      name: "weight",
      label: "Trọng lượng (kg)",
      type: "number",
      placeholder: "0",
      description: "Trọng lượng sản phẩm (tính bằng kg)",
      icon: React.createElement(Box, { className: "h-4 w-4" }),
      section: "pricing",
    },
    {
      name: "images",
      label: "Hình ảnh",
      type: "image",
      description: "Thêm nhiều hình ảnh cho sản phẩm (có thể upload, sắp xếp, đặt ảnh chính)",
      icon: React.createElement(ImageIcon, { className: "h-4 w-4" }),
      section: "media",
      render: (field, value, onChange) => {
        return React.createElement(MultipleImagesField, {
          value,
          onChange,
          error: undefined,
          disabled: field.disabled,
        })
      },
    },
    {
      name: "status",
      label: "Trạng thái",
      type: "select",
      required: true,
      defaultValue: "DRAFT",
      options: [
        { label: "Nháp", value: "DRAFT" },
        { label: "Hoạt động", value: "ACTIVE" },
        { label: "Không hoạt động", value: "INACTIVE" },
        { label: "Lưu trữ", value: "ARCHIVED" },
      ],
      description: "Trạng thái hiển thị của sản phẩm",
      icon: React.createElement(ToggleLeft, { className: "h-4 w-4" }),
      section: "settings",
    },
    {
      name: "featured",
      label: "Sản phẩm nổi bật",
      type: "switch",
      defaultValue: false,
      description: "Đánh dấu sản phẩm nổi bật",
      icon: React.createElement(ToggleLeft, { className: "h-4 w-4" }),
      section: "settings",
    },
  ]
}

