/**
 * Ví dụ tối thiểu - Tạo feature admin mới chỉ với form-fields và prisma model
 * 
 * ✨ Chỉ cần định nghĩa form-fields và prisma model, tất cả sẽ được generate tự động!
 */

import { createFeatureFromMinimal } from "./create-feature"
import React from "react"
import { FileText, Hash } from "lucide-react"

// Định nghĩa types
export interface ArticleRow {
  id: string
  title: string
  slug: string
  content: string | null
  createdAt: string
  deletedAt: string | null
}

// One-liner để tạo feature - CHỈ CẦN FORM FIELDS VÀ PRISMA MODEL!
export const articleFiles = createFeatureFromMinimal<ArticleRow>({
  // 1. Resource name
  resourceName: {
    singular: "article",
    plural: "articles",
    displayName: "Bài viết",
  },

  // 2. Form Fields - CHỈ CẦN ĐIỀN PHẦN NÀY!
  formFields: {
    sections: [
      {
        id: "basic",
        title: "Thông tin cơ bản",
        description: "Tiêu đề và slug",
      },
      {
        id: "content",
        title: "Nội dung",
        description: "Nội dung bài viết",
      },
    ],
    fields: [
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
        name: "content",
        label: "",
        type: "editor",
        section: "content",
        className: "w-full max-w-5xl mx-auto",
      },
    ],
  },

  // 3. Record name getter
  getRecordName: (row) => row.title,

  // 4. Prisma model - CHỈ CẦN ĐIỀN PHẦN NÀY!
  prismaModel: "article",
  
  // Optional: Search fields (tự động extract từ form fields nếu không cung cấp)
  // searchFields: ["title", "slug"], // Tự động từ form fields: text, slug fields

  // Optional: Filter fields (tự động extract từ form fields nếu không cung cấp)
  // filterFields: [
  //   { name: "title", type: "string" },
  // ],

  // Optional: Include relations
  // includeRelations: {
  //   author: {
  //     select: { id: true, name: true, email: true },
  //   },
  // },
})

/**
 * Kết quả:
 * 
 * - articleFiles.messages -> constants/messages.ts
 * - articleFiles.hooks -> hooks/index.ts (bao gồm form submit hooks)
 * - articleFiles.types -> types.ts (tự động từ form fields)
 * - articleFiles.helpers -> server/helpers.ts (tự động từ form fields)
 * - articleFiles.queries -> server/queries.ts (sử dụng helpers)
 * - articleFiles.events -> server/events.ts (sử dụng helpers)
 * - articleFiles.schemas -> server/schemas.ts (tự động từ form fields)
 * - articleFiles.mutations -> server/mutations.ts (tự động từ form fields)
 * - articleFiles.apiRoutes -> app/api/admin/articles/route.ts, app/api/admin/articles/[id]/route.ts, app/api/admin/articles/[id]/restore/route.ts, app/api/admin/articles/[id]/hard-delete/route.ts, app/api/admin/articles/bulk/route.ts (tự động từ endpoints)
 * 
 * Tất cả đồng bộ từ formFields!
 * Events, Helpers, Mutations, Queries hoạt động chính xác!
 */

