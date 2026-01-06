import type { ResourceFormField, ResourceFormSection } from "@/features/admin/resources/components"
import React from "react"
import { Hash, FileText, Image as ImageIcon, Eye, User, Tag, Tags, Calendar } from "lucide-react"

export interface PostFormData {
  title: string
  slug: string
  excerpt: string | null
  image: string | null
  published: boolean
  [key: string]: unknown
}

export const getPostFormSections = (): ResourceFormSection[] => [
  {
    id: "basic",
    title: "Thông tin cơ bản",
    description: "Tiêu đề, slug, tóm tắt và hình ảnh",
  },
  {
    id: "publishing",
    title: "Xuất bản",
    description: "Trạng thái và ngày xuất bản",
  },
  {
    id: "categories",
    title: "Danh mục và Thẻ",
    description: "Chọn danh mục và thẻ tag cho bài viết",
  },
  {
    id: "content",
    title: "Nội dung",
    description: "Nội dung chính của bài viết",
  },
]

export const getBasePostFields = (): ResourceFormField<PostFormData>[] => [
  {
    name: "title",
    label: "Tiêu đề",
    type: "text",
    required: true,
    placeholder: "Nhập tiêu đề bài viết",
    description: "Tiêu đề của bài viết",
    icon: React.createElement(FileText, { className: "h-4 w-4" }),
    section: "basic",
  },
  {
    name: "slug",
    label: "Slug",
    type: "slug",
    sourceField: "title",
    required: true,
    placeholder: "bai-viet-slug",
    description: "URL-friendly version của tiêu đề",
    icon: React.createElement(Hash, { className: "h-4 w-4" }),
    section: "basic",
  },
  {
    name: "excerpt",
    label: "Tóm tắt",
    type: "textarea",
    placeholder: "Nhập tóm tắt bài viết",
    description: "Mô tả ngắn gọn về nội dung bài viết",
    icon: React.createElement(FileText, { className: "h-4 w-4" }),
    section: "basic",
  },
  {
    name: "image",
    label: "Hình ảnh",
    type: "image",
    placeholder: "https://example.com/image.jpg",
    description: "URL hình ảnh đại diện cho bài viết",
    icon: React.createElement(ImageIcon, { className: "h-4 w-4" }),
    section: "basic",
  },
  {
    name: "published",
    label: "Trạng thái xuất bản",
    type: "switch",
    description: "Trạng thái xuất bản của bài viết",
    icon: React.createElement(Eye, { className: "h-4 w-4" }),
    section: "publishing",
  },
  {
    name: "publishedAt",
    label: "Ngày xuất bản",
    type: "date",
    description: "Chọn ngày và giờ xuất bản bài viết (để trống để tự động đặt khi bật trạng thái xuất bản)",
    icon: React.createElement(Calendar, { className: "h-4 w-4" }),
    section: "publishing",
  },
]

export const getPostContentField = <T extends Record<string, unknown>>(): ResourceFormField<T> => ({
  name: "content",
  label: "",
  type: "editor",
  section: "content",
  className: "w-full max-w-5xl mx-auto",
})

export const getPostAuthorField = <T extends Record<string, unknown>>(
  users: Array<{ label: string; value: string }>
): ResourceFormField<T> => ({
  name: "authorId",
  label: "Tác giả",
  type: "select",
  options: users,
  required: true,
  description: "Chọn tác giả của bài viết",
  icon: React.createElement(User, { className: "h-4 w-4" }),
  section: "basic",
})

export const getPostCategoriesField = <T extends Record<string, unknown>>(
  categories: Array<{ label: string; value: string }> = []
): ResourceFormField<T> => ({
  name: "categoryIds",
  label: "Danh mục",
  type: "multiple-select",
  options: categories,
  disabled: categories.length === 0,
  description: categories.length > 0 
    ? "Chọn danh mục cho bài viết (có thể chọn nhiều)" 
    : "Chưa có danh mục nào. Vui lòng tạo danh mục trước.",
  icon: React.createElement(Tag, { className: "h-4 w-4" }),
  section: "categories",
})

export const getPostTagsField = <T extends Record<string, unknown>>(
  tags: Array<{ label: string; value: string }> = []
): ResourceFormField<T> => ({
  name: "tagIds",
  label: "Thẻ tag",
  type: "multiple-select",
  options: tags,
  disabled: tags.length === 0,
  description: tags.length > 0 
    ? "Chọn thẻ tag cho bài viết (có thể chọn nhiều)" 
    : "Chưa có thẻ tag nào. Vui lòng tạo thẻ tag trước.",
  icon: React.createElement(Tags, { className: "h-4 w-4" }),
  section: "categories",
})
