# 🔄 Hướng Dẫn Đồng Bộ - Admin Feature Generator

## 🎯 Nguyên Tắc Đồng Bộ

**Single Source of Truth: `formFields`**

Tất cả generators sử dụng cùng `formFields` từ config để đảm bảo tính đồng bộ 100%.

**Luồng đồng bộ:**
```
formFields (config)
    ↓
    ├─→ Types → types.ts (Row, Listed, Detail)
    ├─→ Helpers → server/helpers.ts (mapRecord, serialize)
    ├─→ Schemas → server/schemas.ts (validation)
    └─→ Mutations → server/mutations.ts (data mapping)
    
Helpers → Events & Queries (sử dụng helpers đã generate)
```

```
formFields (config)
    ↓
    ├─→ Types Generator → types.ts (Row, Listed, Detail)
    ├─→ Helpers Generator → server/helpers.ts (mapRecord, serialize)
    ├─→ Schemas Generator → server/schemas.ts (validation)
    └─→ Mutations Generator → server/mutations.ts (data mapping)
```

## 📊 Luồng Đồng Bộ

### 1. **Types** ← `formFields`
```typescript
generateTypesFile(server, formFields)
```
- Generate `Row` type (string dates)
- Generate `Listed` type (Date objects)
- Generate `Detail` type (same as Listed)

### 2. **Helpers** ← `formFields`
```typescript
generateHelpersFile(server, formFields)
```
- `mapRecord`: Map Prisma model → Listed (dùng fields từ formFields)
- `serializeForTable`: Map Listed → Row (dùng fields từ formFields)
- `serializeDetail`: Map Detail → serialized (dùng fields từ formFields)

### 3. **Schemas** ← `formFields`
```typescript
generateSchemasFile(formFields, resourceName)
```
- `CreateSchema`: Validation cho create (dùng fields từ formFields)
- `UpdateSchema`: Validation cho update (dùng fields từ formFields)

### 4. **Mutations** ← `formFields`
```typescript
generateMutationsFile(server, formFields)
```
- `create`: Data mapping từ validatedInput → Prisma (dùng fields từ formFields)
- `update`: Data mapping từ validatedInput → Prisma (dùng fields từ formFields)

### 5. **Events & Queries** ← Helpers (đã generate)
```typescript
generateEventsFile(server) // Sử dụng helpers đã generate
generateQueriesFile(server) // Sử dụng helpers đã generate
```
- Events sử dụng `mapRecord` và `serializeForTable` từ helpers
- Queries sử dụng `mapRecord` từ helpers

## ✅ Đảm Bảo Đồng Bộ

### Cách Hoạt Động

1. **Tất cả cùng nguồn**: Types, Helpers, Schemas, Mutations đều extract fields từ cùng `formFields`
2. **Tự động mapping**: Field names, types, validation đều được generate tự động
3. **Type-safe**: TypeScript đảm bảo types khớp nhau
4. **Runtime-safe**: Schemas validate data trước khi vào mutations

### Ví Dụ Đồng Bộ

```typescript
// formFields config
{
  name: "title",
  type: "text",
  required: true
}

// → Types: title: string
// → Helpers: title: model.title
// → Schemas: title: z.string().min(1)
// → Mutations: title: validatedInput.title.trim()
```

Tất cả đều đồng bộ với nhau! ✨

## 🚀 Sử Dụng

```typescript
import { createFeature, createFeatureConfig } from "@/features/admin/resources"

// 1. Định nghĩa config với formFields
const featureConfig = {
  apiEndpoints: { /* ... */ },
  formFields: {
    fields: [/* ... */] // Single source of truth
  }
}

// 2. Generate - Tất cả tự động đồng bộ
const config = createFeatureConfig(featureConfig, serverConfig)
const files = createFeature(config)

// ✅ Types, Helpers, Schemas, Mutations đều đồng bộ từ formFields
// ✅ Events, Queries sử dụng Helpers đã generate
// ✅ Tất cả hoạt động chính xác với nhau!
```

## 📝 Lưu Ý

- **Chỉ cần thay đổi `formFields`** → Tất cả sẽ tự động cập nhật
- **Không cần điền thủ công** → Tất cả đã được generate tự động
- **Đảm bảo đồng bộ** → Cùng một nguồn dữ liệu (formFields)

