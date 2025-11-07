# Filter Options API Pattern - Next.js 16

Tài liệu này mô tả pattern để tạo API routes cho filter options theo column, tuân thủ chuẩn Next.js 16 với server-side caching và response caching.

## 📋 Tổng quan

Pattern này cho phép client components fetch filter options từ server với:
- **Server-side caching**: Sử dụng React `cache()` để deduplicate requests
- **Response caching**: Cache-Control headers cho API routes
- **Type-safe**: TypeScript đầy đủ
- **Consistent**: Tất cả resources sử dụng cùng pattern
- **Security**: Column whitelisting và input validation

## 🏗️ Kiến trúc

```
Client Component (useDynamicFilterOptions)
    ↓
API Route (/api/admin/{resource}/options)
    ↓
Helper Function (createOptionsHandler)
    ↓
Cached Query (get{Resource}ColumnOptionsCached)
    ↓
Database Query (get{Resource}ColumnOptions)
```

## 📁 Cấu trúc Files

### 1. Server Queries (`server/queries.ts`)

Non-cached database queries để lấy unique values cho một column:

```typescript
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/database"

/**
 * Get unique values for a specific column (for filter options)
 * 
 * @param column - Column name (phải được whitelist trong API route)
 * @param search - Optional search query để filter results
 * @param limit - Maximum number of options (default: 50)
 * @returns Array of { label, value } options
 */
export async function get{Resource}ColumnOptions(
  column: string,
  search?: string,
  limit: number = 50
): Promise<Array<{ label: string; value: string }>> {
  const where: Prisma.{Resource}WhereInput = {
    deletedAt: null, // Only active records
  }

  // Add search filter if provided
  if (search && search.trim()) {
    const searchValue = search.trim()
    switch (column) {
      case "columnName":
        where.columnName = { contains: searchValue, mode: "insensitive" }
        break
      // ... other columns
      default:
        // Fallback to first searchable column
        where.columnName = { contains: searchValue, mode: "insensitive" }
    }
  }

  // Build select based on column
  let selectField: Prisma.{Resource}Select
  switch (column) {
    case "columnName":
      selectField = { columnName: true }
      break
    // ... other columns
    default:
      selectField = { columnName: true }
  }

  const results = await prisma.{resource}.findMany({
    where,
    select: selectField,
    orderBy: { [column]: "asc" },
    take: limit,
  })

  // Map results to options format
  return results
    .map((item) => {
      const value = item[column as keyof typeof item]
      if (typeof value === "string" && value.trim()) {
        return {
          label: value,
          value: value,
        }
      }
      return null
    })
    .filter((item): item is { label: string; value: string } => item !== null)
}
```

**Lưu ý:**
- Chỉ lấy records với `deletedAt: null` (active records)
- Support search với `contains` và `mode: "insensitive"`
- Order by column ascending
- Limit kết quả để tránh quá nhiều options
- Filter out null/empty values

### 2. Server Cache (`server/cache.ts`)

Cached queries với React `cache()` để deduplicate requests:

```typescript
import { cache } from "react"
import { get{Resource}ColumnOptions } from "./queries"

/**
 * Cache function: Get {resource} column options for filters
 * 
 * Sử dụng cache() để tự động deduplicate requests và cache kết quả
 * Dùng cho Server Components và API routes
 * 
 * @param column - Column name
 * @param search - Optional search query
 * @param limit - Maximum number of options (default: 50)
 * @returns Array of { label, value } options
 */
export const get{Resource}ColumnOptionsCached = cache(
  async (
    column: string,
    search?: string,
    limit: number = 50
  ): Promise<Array<{ label: string; value: string }>> => {
    return get{Resource}ColumnOptions(column, search, limit)
  }
)
```

**Lợi ích:**
- Tự động deduplicate requests trong cùng render pass
- Cache kết quả để tái sử dụng
- Giảm database queries

### 3. API Route (`app/api/admin/{resource}/options/route.ts`)

API route handler sử dụng helper function:

```typescript
/**
 * API Route: GET /api/admin/{resource}/options - Get filter options for a column
 * 
 * Theo chuẩn Next.js 16:
 * - Sử dụng server-side caching với React cache()
 * - Response caching với short-term cache (30s) để optimize performance
 * - Dynamic route vì có search query parameter
 * - Column whitelisting để bảo mật
 * - Input validation và sanitization
 */
import { NextRequest } from "next/server"
import { get{Resource}ColumnOptionsCached } from "@/features/admin/{resource}/server/cache"
import { createGetRoute } from "@/lib/api/api-route-wrapper"
import type { ApiRouteContext } from "@/lib/api/types"
import { createOptionsHandler } from "@/lib/api/options-route-helper"

async function get{Resource}OptionsHandler(req: NextRequest, _context: ApiRouteContext) {
  return createOptionsHandler(req, {
    allowedColumns: ["column1", "column2"], // Whitelist allowed columns
    getOptions: (column, search, limit) => get{Resource}ColumnOptionsCached(column, search, limit),
  })
}

// Route Segment Config theo Next.js 16
// LƯU Ý: Phải export static values, không thể lấy từ object (Next.js requirement)
// Theo: https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config
export const dynamic = "force-dynamic"
export const revalidate = false

export const GET = createGetRoute(get{Resource}OptionsHandler)
```

**Lưu ý quan trọng:**
- `dynamic` và `revalidate` phải là static values, không thể từ object
- Sử dụng `createGetRoute` để tự động handle authentication và permissions
- Column whitelisting trong `allowedColumns` để bảo mật

### 4. Options Route Helper (`lib/api/options-route-helper.ts`)

Helper function để đảm bảo consistency:

```typescript
import { NextRequest, NextResponse } from "next/server"
import { sanitizeSearchQuery } from "./validation"
import { logger } from "@/lib/config"

export interface OptionsRouteConfig {
  allowedColumns: string[]
  getOptions: (column: string, search?: string, limit?: number) => Promise<Array<{ label: string; value: string }>>
}

export async function createOptionsHandler(
  req: NextRequest,
  config: OptionsRouteConfig
): Promise<NextResponse> {
  const searchParams = req.nextUrl.searchParams
  const column = searchParams.get("column")
  const search = searchParams.get("search") || ""
  const limitParam = searchParams.get("limit")

  // Validate column parameter
  if (!column) {
    return NextResponse.json(
      { error: "Column parameter is required" },
      { status: 400 }
    )
  }

  // Validate column (whitelist allowed columns)
  if (!config.allowedColumns.includes(column)) {
    return NextResponse.json(
      {
        error: `Column '${column}' is not allowed. Allowed columns: ${config.allowedColumns.join(", ")}`,
      },
      { status: 400 }
    )
  }

  // Validate and sanitize search query
  const searchValidation = sanitizeSearchQuery(search, 100)
  const searchValue = searchValidation.valid ? searchValidation.value : undefined

  // Validate limit
  const limit = limitParam ? parseInt(limitParam, 10) : 50
  if (isNaN(limit) || limit < 1 || limit > 100) {
    return NextResponse.json(
      { error: "Limit must be between 1 and 100" },
      { status: 400 }
    )
  }

  try {
    const options = await config.getOptions(column, searchValue, limit)
    
    // Create response with caching headers
    const response = NextResponse.json({ data: options })
    
    // Set cache headers theo Next.js 16 best practices
    // - private: Chỉ cache ở client, không cache ở shared CDN (vì có authentication)
    // - s-maxage=30: Cache ở edge/CDN trong 30 giây
    // - stale-while-revalidate=60: Serve stale content trong 60s khi đang revalidate
    response.headers.set(
      "Cache-Control",
      "private, s-maxage=30, stale-while-revalidate=60"
    )
    
    return response
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error(
      `Error fetching filter options for column '${column}'`,
      error instanceof Error ? error : new Error(errorMessage)
    )
    
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi lấy danh sách tùy chọn" },
      { status: 500 }
    )
  }
}
```

### 5. API Routes Config (`lib/api/routes.ts`)

Cấu hình API routes cho options endpoint:

```typescript
{resource}: {
  // ... other routes
  options: (params?: { column: string; search?: string; limit?: number }) => {
    const searchParams = new URLSearchParams()
    if (params?.column) searchParams.set("column", params.column)
    if (params?.search) searchParams.set("search", params.search)
    if (params?.limit) searchParams.set("limit", params.limit.toString())
    const queryString = searchParams.toString()
    return `/admin/{resource}/options${queryString ? `?${queryString}` : ""}`
  },
}
```

**Lưu ý:** Không include `/api` prefix vì `apiClient` đã có `baseURL: "/api"`

### 6. Client Hooks

#### useFilterOptions (`hooks/use-filter-options.ts`)

Hook cơ bản để fetch options với debouncing:

```typescript
"use client"

import { useEffect, useMemo, useState } from "react"
import { apiClient } from "@/lib/api/axios"
import type { ColumnFilterSelectOption } from "@/components/tables"

interface UseFilterOptionsParams {
  optionsEndpoint: string
  searchQuery?: string
  limit?: number
}

export function useFilterOptions({
  optionsEndpoint,
  searchQuery = "",
  limit = 50,
}: UseFilterOptionsParams) {
  const [options, setOptions] = useState<ColumnFilterSelectOption[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery)

  // Debounce search query (300ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch options khi endpoint hoặc debounced query thay đổi
  useEffect(() => {
    let cancelled = false

    const fetchOptions = async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams({
          limit: limit.toString(),
          ...(debouncedQuery && { search: debouncedQuery }),
        })

        // optionsEndpoint đã có column parameter, chỉ cần thêm search và limit
        const url = `${optionsEndpoint}${optionsEndpoint.includes("?") ? "&" : "?"}${params}`
        const response = await apiClient.get<{ data: ColumnFilterSelectOption[] }>(url)
        
        if (cancelled) return

        setOptions(response.data.data || [])
      } catch (error) {
        if (!cancelled) {
          console.error(`Error fetching filter options:`, error)
          setOptions([])
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchOptions()
    return () => {
      cancelled = true
    }
  }, [optionsEndpoint, debouncedQuery, limit])

  return useMemo(() => ({ options, isLoading }), [options, isLoading])
}
```

#### useDynamicFilterOptions (`hooks/use-dynamic-filter-options.ts`)

Hook wrapper với search functionality:

```typescript
"use client"

import { useCallback, useState } from "react"
import { useFilterOptions } from "./use-filter-options"
import type { ColumnFilterSelectOption } from "@/components/tables"

interface UseDynamicFilterOptionsParams {
  optionsEndpoint: string
  limit?: number
}

export function useDynamicFilterOptions({
  optionsEndpoint,
  limit = 50,
}: UseDynamicFilterOptionsParams) {
  const [searchQuery, setSearchQuery] = useState("")
  const { options, isLoading } = useFilterOptions({ optionsEndpoint, searchQuery, limit })

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  return { 
    options, 
    isLoading, 
    onSearchChange: handleSearchChange 
  } as {
    options: ColumnFilterSelectOption[]
    isLoading: boolean
    onSearchChange: (query: string) => void
  }
}
```

### 7. Client Component Usage

Sử dụng trong Client Components:

```typescript
"use client"

import { useMemo } from "react"
import { useDynamicFilterOptions } from "@/features/admin/resources/hooks/use-dynamic-filter-options"
import { apiRoutes } from "@/lib/api/routes"
import type { DataTableColumn } from "@/components/tables"

export function {Resource}TableClient() {
  // Sử dụng hook để fetch options động
  const nameFilter = useDynamicFilterOptions({
    optionsEndpoint: apiRoutes.{resource}.options({ column: "name" }),
  })

  const emailFilter = useDynamicFilterOptions({
    optionsEndpoint: apiRoutes.{resource}.options({ column: "email" }),
  })

  const columns = useMemo<DataTableColumn<{Resource}Row>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        filter: {
          type: "select",
          placeholder: "Chọn name...",
          searchPlaceholder: "Tìm kiếm...",
          emptyMessage: "Không tìm thấy.",
          options: nameFilter.options,
          onSearchChange: nameFilter.onSearchChange,
          isLoading: nameFilter.isLoading,
        },
      },
      {
        accessorKey: "email",
        header: "Email",
        filter: {
          type: "select",
          placeholder: "Chọn email...",
          searchPlaceholder: "Tìm kiếm...",
          emptyMessage: "Không tìm thấy.",
          options: emailFilter.options,
          onSearchChange: emailFilter.onSearchChange,
          isLoading: emailFilter.isLoading,
        },
      },
    ],
    [nameFilter, emailFilter]
  )
  
  // ... rest of component
}
```

## 🔄 Caching Strategy

### 1. React Cache (Server-side)
- **Location**: `server/cache.ts`
- **Function**: `get{Resource}ColumnOptionsCached`
- **Purpose**: Deduplicate requests trong cùng render pass
- **Scope**: Request-level cache (chỉ trong một request)
- **Implementation**: Sử dụng `React.cache()` wrapper

### 2. Response Cache (API Route)
- **Location**: `lib/api/options-route-helper.ts`
- **Headers**: `Cache-Control: private, s-maxage=30, stale-while-revalidate=60`
- **Purpose**: Cache response ở edge/CDN và client
- **Duration**: 
  - 30 giây (s-maxage) - Cache ở edge/CDN
  - 60 giây stale-while-revalidate - Serve stale content khi đang revalidate
- **Private**: Chỉ cache ở client, không cache ở shared CDN (vì có authentication)

### 3. Route Segment Config
- **dynamic**: `'force-dynamic'` - Route luôn dynamic vì có search query parameter
- **revalidate**: `false` - Sử dụng Cache-Control headers thay vì time-based revalidation
- **Lưu ý**: Phải export static values, không thể từ object (Next.js requirement)

### 4. Client-side Debouncing
- **Location**: `hooks/use-filter-options.ts`
- **Duration**: 300ms
- **Purpose**: Tránh quá nhiều API calls khi user đang gõ

## ✅ Best Practices

### 1. Column Whitelisting
Luôn whitelist allowed columns trong API route để tránh SQL injection và unauthorized access:

```typescript
const allowedColumns = ["name", "slug"]
if (!allowedColumns.includes(column)) {
  return NextResponse.json({ error: "Column not allowed" }, { status: 400 })
}
```

### 2. Input Validation
Sử dụng `sanitizeSearchQuery` để validate và sanitize search input:

```typescript
const searchValidation = sanitizeSearchQuery(search, 100)
const searchValue = searchValidation.valid ? searchValidation.value : undefined
```

### 3. Limit Validation
Validate limit parameter (1-100):

```typescript
const limit = limitParam ? parseInt(limitParam, 10) : 50
if (isNaN(limit) || limit < 1 || limit > 100) {
  return NextResponse.json(
    { error: "Limit must be between 1 and 100" },
    { status: 400 }
  )
}
```

### 4. Error Handling
Sử dụng logger để log errors:

```typescript
catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error)
  logger.error(
    `Error fetching filter options for column '${column}'`,
    error instanceof Error ? error : new Error(errorMessage)
  )
  return NextResponse.json(
    { error: "Đã xảy ra lỗi khi lấy danh sách tùy chọn" },
    { status: 500 }
  )
}
```

### 5. Type Safety
Đảm bảo type safety với TypeScript:

```typescript
export interface OptionsRouteConfig {
  allowedColumns: string[]
  getOptions: (column: string, search?: string, limit?: number) => Promise<Array<{ label: string; value: string }>>
}
```

### 6. Route Segment Config
Phải export static values:

```typescript
// ✅ GOOD
export const dynamic = "force-dynamic"
export const revalidate = false

// ❌ BAD
const config = { dynamic: "force-dynamic", revalidate: false }
export const dynamic = config.dynamic // ❌ Next.js không nhận diện được
```

## 📊 Performance

### Caching Layers
1. **React Cache**: Deduplicate requests trong render pass
2. **Response Cache**: 30s cache ở edge/CDN
3. **Stale-while-revalidate**: Serve stale content trong 60s khi revalidating
4. **Client Debouncing**: 300ms debounce để tránh quá nhiều requests

### Benefits
- ✅ Giảm database queries
- ✅ Faster response times
- ✅ Better UX với stale-while-revalidate
- ✅ Automatic request deduplication
- ✅ Debouncing để optimize client-side requests

## 🔒 Security

### 1. Authentication
- Tất cả routes yêu cầu authentication (qua `createGetRoute`)
- Auto-detect permissions từ route config

### 2. Authorization
- Permission checks tự động qua `api-route-wrapper`
- Whitelist columns để tránh unauthorized access

### 3. Input Validation
- Sanitize search queries (max 100 characters)
- Validate column names (whitelist)
- Validate limit (1-100)

### 4. SQL Injection Prevention
- Column whitelisting
- Prisma ORM (parameterized queries)
- Input sanitization

## 📝 Examples

### Categories
- **Columns**: `name`, `slug`
- **Route**: `/api/admin/categories/options`
- **File**: `app/api/admin/categories/options/route.ts`

### Tags
- **Columns**: `name`, `slug`
- **Route**: `/api/admin/tags/options`
- **File**: `app/api/admin/tags/options/route.ts`

### Users
- **Columns**: `email`, `name`
- **Route**: `/api/admin/users/options`
- **File**: `app/api/admin/users/options/route.ts`

### Roles
- **Columns**: `name`, `displayName`
- **Route**: `/api/admin/roles/options`
- **File**: `app/api/admin/roles/options/route.ts`

### Students
- **Columns**: `studentCode`, `name`, `email`
- **Route**: `/api/admin/students/options`
- **File**: `app/api/admin/students/options/route.ts`

### Contact Requests
- **Columns**: `name`, `email`, `phone`, `subject`
- **Route**: `/api/admin/contact-requests/options`
- **File**: `app/api/admin/contact-requests/options/route.ts`

### Notifications
- **Columns**: `userEmail` (từ user relation)
- **Route**: `/api/admin/notifications/options`
- **File**: `app/api/admin/notifications/options/route.ts`

## 🔄 Complete Flow Example

### 1. User types in filter search input

```typescript
// Client Component
const emailFilter = useDynamicFilterOptions({
  optionsEndpoint: apiRoutes.users.options({ column: "email" }),
})

// User types "john" → onSearchChange("john") được gọi
// → searchQuery state được update
// → Debounced (300ms) → API call
```

### 2. API Request

```
GET /api/admin/users/options?column=email&search=john&limit=50
```

### 3. API Route Handler

```typescript
// app/api/admin/users/options/route.ts
async function getUserOptionsHandler(req: NextRequest, _context: ApiRouteContext) {
  return createOptionsHandler(req, {
    allowedColumns: ["email", "name"],
    getOptions: (column, search, limit) => getUserColumnOptionsCached(column, search, limit),
  })
}
```

### 4. Helper Function

```typescript
// lib/api/options-route-helper.ts
// - Validate column (whitelist)
// - Sanitize search query
// - Validate limit
// - Call getOptions function
// - Set Cache-Control headers
```

### 5. Cached Query

```typescript
// features/admin/users/server/cache.ts
export const getUserColumnOptionsCached = cache(
  async (column: string, search?: string, limit: number = 50) => {
    return getUserColumnOptions(column, search, limit)
  }
)
```

### 6. Database Query

```typescript
// features/admin/users/server/queries.ts
export async function getUserColumnOptions(column: string, search?: string, limit: number = 50) {
  // Prisma query với where clause và search filter
  // Return array of { label, value }
}
```

### 7. Response

```json
{
  "data": [
    { "label": "john.doe@example.com", "value": "john.doe@example.com" },
    { "label": "john.smith@example.com", "value": "john.smith@example.com" }
  ]
}
```

### 8. Client Update

```typescript
// Hook update options state
// Component re-render với new options
// Filter combobox hiển thị filtered options
```

## 🎓 Tài liệu tham khảo

- [Next.js 16: Caching](https://nextjs.org/docs/app/building-your-application/caching)
- [Next.js 16: Route Segment Config](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config)
- [React cache() API](https://react.dev/reference/react/cache)
- [Next.js 16: Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching)
