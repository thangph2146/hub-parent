import type { ResourceFormField, ResourceFormSection } from "@/features/admin/resources/components"
import React from "react"
import { Tag, Hash, AlignLeft, Layers } from "lucide-react"
import { CreateCategorySchema } from "./server/schemas"

export interface CategoryFormData {
  name: string
  slug: string
  parentId?: string | null
  description?: string | null
  [key: string]: unknown
}

// Helper to create validation function from Zod schema field
const validateField = (fieldName: keyof typeof CreateCategorySchema.shape) => (value: unknown) => {
  const result = CreateCategorySchema.shape[fieldName].safeParse(value)
  if (!result.success) {
    return { valid: false, error: result.error.issues[0].message }
  }
  return { valid: true }
}

export const getCategoryFormSections = (): ResourceFormSection[] => [
  {
    id: "basic",
    title: "Thông tin cơ bản",
    description: "Thông tin chính về danh mục",
  },
]

export const getBaseCategoryFields = (
  categories: Array<{ id: string; name: string; parentId: string | null }> = [],
  currentCategoryId?: string,
  currentParentId?: string | null,
  currentParentName?: string | null
): ResourceFormField<CategoryFormData>[] => {
  // 1. Identify children to avoid cycles
  const descendants = new Set<string>()
  if (currentCategoryId) {
    const findDescendants = (parentId: string) => {
      categories.forEach(c => {
        if (c.parentId === parentId) {
          descendants.add(c.id)
          findDescendants(c.id)
        }
      })
    }
    findDescendants(currentCategoryId)
  }

  // 3. Filter out current category and its descendants
  const availableCategories = categories.filter(c => 
    c.id !== currentCategoryId && !descendants.has(c.id)
  )

  // 4. Sort hierarchically and add indentation
  const sortedOptions: Array<{ label: string; value: string }> = []
  
  const addOptions = (parentId: string | null = null, level = 0) => {
    const children = availableCategories
      .filter(c => {
        // Nếu đang tìm gốc (parentId === null)
        if (parentId === null) {
          // Là gốc nếu parentId trống HOẶC parentId không nằm trong danh sách available (tránh bị mất nếu cha bị ẩn/xóa)
          return !c.parentId || c.parentId === "" || !availableCategories.some(p => p.id === c.parentId)
        }
        return c.parentId === parentId
      })
      .sort((a, b) => a.name.localeCompare(b.name))
      
    children.forEach(c => {
      const prefix = level > 0 ? "　".repeat(level) + "└─ " : ""
      sortedOptions.push({
        label: prefix + c.name,
        value: c.id
      })
      // Chỉ đệ quy nếu tìm thấy con thực sự (tránh vòng lặp vô tận nếu data lỗi)
      if (c.id !== parentId) {
        addOptions(c.id, level + 1)
      }
    })
  }
  
  addOptions(null)

  // 5. Nếu có currentParentId mà chưa có trong list (ví dụ danh mục cha bị ẩn/xóa), add vào đầu list
  if (currentParentId && !sortedOptions.some(opt => opt.value === currentParentId)) {
    sortedOptions.unshift({
      label: (currentParentName || "Danh mục cha hiện tại") + " (Đã ẩn/xóa)",
      value: currentParentId
    })
  }

  return [
    {
      name: "name",
      label: "Tên danh mục",
      type: "text",
      placeholder: "vd: Công nghệ, Hướng dẫn",
      required: true,
      description: "Tên danh mục sẽ hiển thị trên website",
      validate: validateField("name"),
      icon: React.createElement(Tag, { className: "h-4 w-4" }),
      section: "basic",
    },
    {
      name: "slug",
      label: "Slug",
      type: "slug",
      sourceField: "name",
      placeholder: "vd: cong-nghe, huong-dan",
      required: true,
      description: "URL-friendly identifier (tự động tạo từ tên)",
      validate: validateField("slug"),
      icon: React.createElement(Hash, { className: "h-4 w-4" }),
      section: "basic",
    },
    {
      name: "parentId",
      label: "Danh mục cha",
      type: "select",
      placeholder: "Chọn danh mục cha (không bắt buộc)",
      options: [
        { label: "Không có (Danh mục gốc)", value: "" },
        ...sortedOptions
      ],
      description: "Chọn danh mục cấp trên nếu đây là danh mục con",
      validate: validateField("parentId"),
      icon: React.createElement(Layers, { className: "h-4 w-4" }),
      section: "basic",
    },
    {
      name: "description",
      label: "Mô tả",
      type: "textarea",
      placeholder: "Nhập mô tả về danh mục",
      validate: validateField("description"),
      icon: React.createElement(AlignLeft, { className: "h-4 w-4" }),
      section: "basic",
    },
  ]
}

