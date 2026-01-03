/**
 * Example Config Template - Template để tạo feature admin mới
 * 
 * ✨ Copy file này và chỉnh sửa để tạo feature mới nhanh chóng!
 * 
 * Usage:
 * 1. Copy file này thành {resource-name}-config.ts
 * 2. Điền thông tin resource và form fields
 * 3. Sử dụng generateFeatureFiles() để generate tất cả files
 */

import { createApiEndpoints, createServerConfigFromFeature } from "@/features/admin/resources"
import type { AdminFeatureConfig, ServerConfig } from "@/features/admin/resources"
import React from "react"
import { FileText, Hash } from "lucide-react"

// ============================================
// STEP 1: Định nghĩa Resource Name
// ============================================
const RESOURCE_NAME = {
  singular: "article", // "article"
  plural: "articles", // "articles"
  displayName: "Bài viết", // "Bài viết"
}

// ============================================
// STEP 2: Định nghĩa Form Fields
// ============================================
export interface ArticleFormData {
  title: string
  slug: string
  content?: string | null
  [key: string]: unknown
}

export const articleFormFields = {
  sections: [
    { id: "basic", title: "Thông tin cơ bản" },
    { id: "content", title: "Nội dung" },
  ],
  fields: [
    {
      name: "title",
      label: "Tiêu đề",
      type: "text" as const,
      placeholder: "Nhập tiêu đề bài viết",
      required: true,
      section: "basic",
      icon: React.createElement(FileText, { className: "h-4 w-4" }),
    },
    {
      name: "slug",
      label: "Slug",
      type: "slug" as const,
      sourceField: "title",
      placeholder: "slug-tu-dong-tao",
      required: true,
      section: "basic",
      icon: React.createElement(Hash, { className: "h-4 w-4" }),
    },
    {
      name: "content",
      label: "Nội dung",
      type: "editor" as const,
      section: "content",
    },
  ],
}

// ============================================
// STEP 3: Định nghĩa Feature Config
// ============================================
export const articleFeatureConfig: AdminFeatureConfig<
  { id: string; title: string },
  ArticleFormData
> = {
  resourceName: RESOURCE_NAME,
  
  // API Endpoints - Tự động tạo từ resource name
  apiEndpoints: createApiEndpoints(RESOURCE_NAME.singular, RESOURCE_NAME.plural),
  
  // Form Fields
  formFields: articleFormFields,
  
  // Record name getter (để hiển thị trong messages)
  getRecordName: (row) => row.title,
  
  // Optional: Custom messages
  messages: {
    DELETE_SUCCESS: `Xóa ${RESOURCE_NAME.displayName.toLowerCase()} thành công`,
    DELETE_ERROR: `Xóa ${RESOURCE_NAME.displayName.toLowerCase()} thất bại`,
    // ... các messages khác sẽ được auto-generate
  },
}

// ============================================
// STEP 4: Định nghĩa Server Config
// ============================================
export const articleServerConfig: ServerConfig<{ id: string; title: string }> =
  createServerConfigFromFeature(articleFeatureConfig, {
    prismaModel: "article", // Prisma model name
    searchFields: ["title", "slug"], // Fields để search
    filterFields: [
      { name: "status", type: "status" },
      { name: "createdAt", type: "date" },
    ],
    // Optional: Include relations
    // includeRelations: {
    //   author: { select: { id: true, name: true } },
    //   category: true,
    // },
  })

// ============================================
// STEP 5: Generate Files
// ============================================
// Sử dụng trong script hoặc code:
//
// import { generateFeatureFiles } from "@/features/admin/resources/generate-feature"
// 
// await generateFeatureFiles("article", articleFeatureConfig, articleServerConfig)
//
// Sau đó copy-paste sync snippets từ generateAllSyncSnippets() vào:
// - src/lib/query-keys.ts
// - src/lib/api/routes.ts
