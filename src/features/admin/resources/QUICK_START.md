# 🚀 Quick Start - Tạo Feature Admin Mới

**Chỉ cần 2 bước để tạo feature admin mới hoàn chỉnh!**

> **✨ Chỉ cần định nghĩa form-fields và prisma model, tất cả sẽ được generate tự động!**
>
> **🎯 Single Source of Truth: `formFields` → Types, Helpers, Schemas, Mutations đều đồng bộ tự động!**
>
> **✅ Tự động: API endpoints, search fields, filter fields, form submit hooks!**
>
> **✅ Events & Queries tự động sử dụng Helpers đã generate → Đảm bảo hoạt động chính xác!**

## Bước 1: Tạo Config File

Tạo file `{resource}-config.ts`:

```typescript
import type { AdminFeatureConfig, ServerConfig } from "@/features/admin/resources"
import { createFeatureConfig, createServerConfigFromFeature } from "@/features/admin/resources"
import React from "react"
import { FileText } from "lucide-react"

// 1. Feature Config - CHỈ CẦN API endpoints + Form fields
export const articleFeatureConfig: AdminFeatureConfig<ArticleRow, ArticleFormData> = {
  resourceName: {
    singular: "article",
    plural: "articles",
    displayName: "Bài viết",
  },
  apiEndpoints: {
    list: "/api/admin/articles",
    detail: (id) => `/api/admin/articles/${id}`,
    create: "/api/admin/articles",
    update: (id) => `/api/admin/articles/${id}`,
    delete: (id) => `/api/admin/articles/${id}`,
    restore: (id) => `/api/admin/articles/${id}/restore`,
    hardDelete: (id) => `/api/admin/articles/${id}/hard-delete`,
    bulk: "/api/admin/articles/bulk",
  },
  formFields: {
    sections: [/* ... */],
    fields: [/* ... */], // Single source of truth!
  },
  getRecordName: (row) => row.title,
}

// 2. Server Config - Tự động từ feature config (hoặc tạo thủ công)
export const articleServerConfig = createServerConfigFromFeature(articleFeatureConfig, {
  prismaModel: "article",
  searchFields: ["title", "slug"],
  filterFields: [
    { name: "title", type: "string" },
    { name: "status", type: "status" },
  ],
})
```

## Bước 2: Generate Files

### Cách 1: One-liner (Khuyến nghị - Đơn giản nhất!)

```typescript
import { createFeatureFromMinimal } from "@/features/admin/resources"

// Chỉ cần: resource name, form fields, prisma model!
// Search fields và filter fields tự động extract từ form fields!
const files = createFeatureFromMinimal({
  resourceName: { singular: "article", plural: "articles", displayName: "Bài viết" },
  formFields: { sections: [...], fields: [...] },
  getRecordName: (row) => row.title,
  prismaModel: "article",
  // searchFields và filterFields tự động extract từ form fields!
})

// ✅ Tất cả files đồng bộ từ formFields
// ✅ API endpoints tự động tạo
// ✅ Events → Helpers → Mutations → Queries hoạt động chính xác
```

### Cách 2: Tách riêng config (Nếu cần tùy chỉnh)

```typescript
import { createFeature, createFeatureConfig, createServerConfigFromFeature } from "@/features/admin/resources"
import { articleFeatureConfig } from "./article-config"

// Tự động tạo server config
const serverConfig = createServerConfigFromFeature(articleFeatureConfig, {
  prismaModel: "article",
  searchFields: ["title", "slug"]
})

// Tạo config hoàn chỉnh và generate
const config = createFeatureConfig(articleFeatureConfig, serverConfig)
const files = createFeature(config)
```

## ✅ Files Tự Động Hoàn Chỉnh

Các files sau được generate **hoàn chỉnh tự động** từ form fields:

- ✅ `constants/messages.ts` - Messages tự động từ resource name
- ✅ `hooks/index.ts` - **Hooks tự động từ config + Form submit hooks tự động từ API endpoints** ✅
- ✅ `types.ts` - **Tự động generate fields từ form fields** (Row, Listed, Detail)
- ✅ `server/helpers.ts` - **Tự động generate mapRecord, serializeForTable, serializeDetail từ form fields**
- ✅ `server/queries.ts` - **Tự động sử dụng mapRecord từ helpers** ✅
- ✅ `server/events.ts` - **Tự động sử dụng mapRecord, serializeForTable từ helpers** ✅
- ✅ `server/schemas.ts` - **Tự động generate validation từ form fields**
- ✅ `server/mutations.ts` - **Tự động generate data mapping từ form fields + schemas** ✅
- ✅ `server/index.ts` - Exports tự động
- ✅ `app/api/admin/{resource}/**/*.ts` - API routes tự động từ endpoints

**🎯 Đảm bảo đồng bộ:** Events → Helpers → Mutations → Queries hoạt động chính xác với nhau!

## 📚 Tài Liệu

- **`SYNC_GUIDE.md`** - Hướng dẫn đồng bộ chi tiết
- **`README.md`** - Tài liệu generator đầy đủ
- **`TEMPLATE.md`** - Template và ví dụ

