# Admin Feature Generator

Hệ thống tự động tạo feature admin mới chỉ với **form fields và prisma model**!

> **✨ Chỉ cần định nghĩa form-fields và prisma model, tất cả sẽ được generate tự động!**
>
> **🚀 Tự động: API endpoints, search fields, filter fields, form submit hooks!**

## 🎯 Tính năng mới

- ✅ **Tự động generate types** từ form fields (Row, Listed, Detail)
- ✅ **Tự động generate helpers** (mapRecord, serializeForTable, serializeDetail) từ form fields
- ✅ **Tự động generate mutations** (create, update data mapping) từ form fields
- ✅ **Tự động generate schemas** (validation) từ form fields
- ✅ **Không cần điền fields thủ công** - tất cả đã được generate tự động!

## 🚀 Quick Start

### Bước 1: Tạo Config Files

Tạo file `{resource}-config.ts`:

```typescript
import type { AdminFeatureConfig, ServerConfig } from "@/features/admin/resources"

// 1. Feature Config - API endpoints + Form fields
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
    fields: [/* ... */],
  },
  getRecordName: (row) => row.title,
}

// 2. Server Config - Prisma model + Search fields
export const articleServerConfig: ServerConfig<ArticleRow> = {
  prismaModel: "article",
  resourceName: {
    singular: "article",
    plural: "articles",
    displayName: "Bài viết",
  },
  searchFields: ["title", "slug"],
  filterFields: [
    { name: "title", type: "string" },
    { name: "status", type: "status" },
  ],
}
```

### Bước 2: Generate Files

```typescript
import { createFeature, createFeatureConfig } from "@/features/admin/resources"
import { articleFeatureConfig, articleServerConfig } from "./article-config"

// Tạo config hoàn chỉnh
const config = createFeatureConfig(articleFeatureConfig, articleServerConfig)

// Generate tất cả files
const files = createFeature(config)

// Files được generate HOÀN CHỈNH TỰ ĐỘNG:
// - files.messages -> constants/messages.ts ✅
// - files.hooks -> hooks/index.ts ✅
// - files.types -> types.ts ✅ (tự động generate fields từ form fields)
// - files.helpers -> server/helpers.ts ✅ (tự động generate mapRecord, serialize từ form fields)
// - files.queries -> server/queries.ts ✅
// - files.events -> server/events.ts ✅
// - files.schemas -> server/schemas.ts ✅ (tự động generate validation từ form fields)
// - files.mutations -> server/mutations.ts ✅ (tự động generate data mapping từ form fields)
// - files.serverIndex -> server/index.ts ✅
// - files.apiRoutes.main -> app/api/admin/articles/route.ts ✅
// - files.apiRoutes.detail -> app/api/admin/articles/[id]/route.ts ✅
// - files.apiRoutes.restore -> app/api/admin/articles/[id]/restore/route.ts ✅
// - files.apiRoutes.hardDelete -> app/api/admin/articles/[id]/hard-delete/route.ts ✅
// - files.apiRoutes.bulk -> app/api/admin/articles/bulk/route.ts ✅
```

### Bước 3: Kiểm tra và Điều chỉnh (Nếu cần)

**Tất cả files đã được generate hoàn chỉnh tự động từ form fields!** 

Chỉ cần điều chỉnh nếu có logic đặc biệt:

1. **`server/mutations.ts`**: Thêm unique checks, custom validation logic (nếu cần)
2. **`server/schemas.ts`**: Điều chỉnh validation phức tạp (nếu cần)
3. **`server/helpers.ts`**: Custom mapRecord nếu có relations phức tạp (nếu cần)

## 📁 Generated Files Structure

```
{resource}/
├── constants/
│   └── messages.ts          ✅ Auto-generated (complete)
├── hooks/
│   └── index.ts             ✅ Auto-generated (complete)
├── types.ts                 ✅ Auto-generated (fields từ form fields)
├── server/
│   ├── index.ts             ✅ Auto-generated (complete)
│   ├── helpers.ts           ✅ Auto-generated (mapRecord, serialize từ form fields)
│   ├── queries.ts           ✅ Auto-generated (complete)
│   ├── events.ts            ✅ Auto-generated (complete)
│   ├── schemas.ts           ✅ Auto-generated (validation từ form fields)
│   └── mutations.ts         ✅ Auto-generated (data mapping từ form fields)
└── app/api/admin/{resource}/
    ├── route.ts             ✅ Auto-generated (complete)
    ├── [id]/
    │   ├── route.ts         ✅ Auto-generated (complete)
    │   ├── restore/
    │   │   └── route.ts     ✅ Auto-generated (complete)
    │   └── hard-delete/
    │       └── route.ts     ✅ Auto-generated (complete)
    └── bulk/
        └── route.ts         ✅ Auto-generated (complete)
```

## 🎯 Features

### ✅ Fully Auto-Generated (Từ Form Fields)
- **Messages constants** - Tự động từ resource name
- **Hooks** (actions, feedback, delete-confirm) - Tự động từ config
- **Types** (Row, Listed, Detail) - **Tự động từ form fields** ✨
- **Helpers** (mapRecord, serializeForTable, serializeDetail) - **Tự động từ form fields** ✨
- **Queries** - Tự động từ server config
- **Events** - Tự động từ server config
- **Schemas** (validation) - **Tự động từ form fields** ✨
- **Mutations** (create, update data mapping) - **Tự động từ form fields** ✨
- **API route handlers** - Tự động từ endpoints
- **Server index exports** - Tự động

### ⚠️ Điều chỉnh (Chỉ khi cần logic đặc biệt)
- Mutations: Thêm unique checks, custom validation
- Schemas: Điều chỉnh validation phức tạp
- Helpers: Custom mapRecord cho relations phức tạp

## 📝 Example

Xem `FEATURE_CONFIG_EXAMPLE.ts` để xem ví dụ đầy đủ.

## 🔧 Advanced Usage

### Custom Where Clause

```typescript
export const articleServerConfig: ServerConfig<ArticleRow> = {
  // ...
  customWhereClause: `export const buildWhereClause = (params: ListArticlesInput): Prisma.ArticleWhereInput => {
    // Custom logic here
  }`,
}
```

### Custom Map Record

```typescript
export const articleServerConfig: ServerConfig<ArticleRow> = {
  // ...
  customMapRecord: `export const mapArticleRecord = (article: ArticleWithRelations): ListedArticle => {
    // Custom mapping logic here
  }`,
}
```

### Include Relations

```typescript
export const articleServerConfig: ServerConfig<ArticleRow> = {
  // ...
  includeRelations: {
    author: { select: { id: true, name: true } },
    category: true,
  },
}
```

## 📚 Documentation

Xem `TEMPLATE.md` để xem hướng dẫn chi tiết.

