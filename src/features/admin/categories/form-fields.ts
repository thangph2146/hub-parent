import type { ResourceFormField, ResourceFormSection } from "@/features/admin/resources/components"
import { validateName, validateSlug, validateDescription } from "./utils"
import React from "react"
import { Tag, Hash, AlignLeft } from "lucide-react"
import { IconSize } from "@/components/ui/typography"

// Helper function to create icon with IconSize wrapper
const createIcon = (Icon: React.ComponentType<{ className?: string }>) =>
  React.createElement(IconSize, { size: "sm" as const, children: React.createElement(Icon) } as React.ComponentProps<typeof IconSize>)

export interface CategoryFormData {
  name: string
  slug: string
  description?: string | null
  [key: string]: unknown
}

export const getCategoryFormSections = (): ResourceFormSection[] => [
  {
    id: "basic",
    title: "Thông tin cơ bản",
    description: "Thông tin chính về danh mục",
  },
]

export const getBaseCategoryFields = (): ResourceFormField<CategoryFormData>[] => [
    {
      name: "name",
      label: "Tên danh mục",
      type: "text",
      placeholder: "vd: Công nghệ, Hướng dẫn",
      required: true,
      description: "Tên danh mục sẽ hiển thị trên website",
      validate: validateName,
      icon: createIcon(Tag),
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
      validate: validateSlug,
      icon: createIcon(Hash),
      section: "basic",
    },
    {
      name: "description",
      label: "Mô tả",
      type: "textarea",
      placeholder: "Nhập mô tả về danh mục",
      validate: validateDescription,
      icon: createIcon(AlignLeft),
      section: "basic",
    },
]

