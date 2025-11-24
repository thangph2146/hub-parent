# Admin Features Pattern - Chuẩn Code cho Tất cả Admin Features

## Tổng quan

Tài liệu này mô tả pattern chuẩn cho tất cả admin features, dựa trên `@features/admin/resources` làm code chuẩn. Tất cả các feature admin phải tuân thủ pattern này để đảm bảo consistency, maintainability và performance.

## Nguyên tắc cốt lõi

1. **Không cache admin data**: Tất cả admin features sử dụng `staleTime: 0` để đảm bảo data luôn fresh
2. **TanStack Query**: Sử dụng TanStack Query cho tất cả data fetching và mutations
3. **REST API**: Tất cả operations sử dụng REST API (GET, POST, PUT, DELETE)
4. **Next.js 16**: Tuân thủ chuẩn Next.js 16 App Router
5. **Prisma**: Sử dụng Prisma cho database queries
6. **Type Safety**: Đảm bảo type safety với TypeScript

## Cấu trúc thư mục

Mỗi admin feature phải có cấu trúc thư mục như sau:

```
src/features/admin/{resource-name}/
├── components/          # React components
│   ├── {resource}-table.tsx          # Server Component - Table page
│   ├── {resource}-table.client.tsx   # Client Component - Table logic
│   ├── {resource}-detail.tsx         # Server Component - Detail page
│   ├── {resource}-detail.client.tsx  # Client Component - Detail logic
│   ├── {resource}-create.tsx         # Server Component - Create page
│   ├── {resource}-create.client.tsx  # Client Component - Create form
│   ├── {resource}-edit.tsx           # Server Component - Edit page
│   └── {resource}-edit.client.tsx    # Client Component - Edit form
├── hooks/               # Custom hooks
│   ├── use-{resource}-actions.ts    # Actions hook (delete, restore, etc.)
│   ├── use-{resource}-socket-bridge.ts # Socket bridge hook
│   └── index.ts
├── server/              # Server-side logic
│   ├── queries.ts       # Database queries (non-cached)
│   ├── mutations.ts     # Mutations (create, update, delete)
│   ├── schemas.ts       # Zod validation schemas
│   ├── helpers.ts       # Helper functions
│   └── index.ts
├── types.ts             # TypeScript types
├── utils.ts             # Utility functions
└── constants/           # Constants (messages, etc.)
    └── messages.ts
```

## Query Configuration

### TanStack Query Config

Tất cả admin queries phải sử dụng `createAdminQueryOptions` từ `@features/admin/resources/config`:

```typescript
import { createAdminQueryOptions } from "@/features/admin/resources/config"
import { useQuery } from "@tanstack/react-query"

const { data } = useQuery(
  createAdminQueryOptions({
    queryKey: queryKeys.adminStudents.list(params),
    queryFn: () => fetchStudents(params),
  })
)
```

**Config mặc định:**
- `staleTime: 0` - Luôn coi là stale, không cache
- `gcTime: 5 * 60 * 1000` - Giữ cache trong memory 5 phút (chỉ để tránh flash of old data)
- `refetchOnMount: "always"` - Luôn refetch khi mount
- `refetchOnWindowFocus: false` - Không refetch khi focus
- `refetchOnReconnect: false` - Không refetch khi reconnect

### Query Keys

Tất cả query keys phải được định nghĩa trong `src/lib/query-keys.ts`:

```typescript
export const queryKeys = {
  adminStudents: {
    all: (): readonly unknown[] => ["adminStudents"],
    list: (params: AdminStudentsListParams): readonly unknown[] => {
      return ["adminStudents", normalizeListParams(params)]
    },
    detail: (id: string): readonly unknown[] => ["adminStudents", "detail", id],
  },
}
```

## Server-side Queries

### Queries (Non-cached)

Tất cả queries trong `server/queries.ts` phải là **non-cached** (không có cache wrapper):

```typescript
// ✅ ĐÚNG - Non-cached query
export async function listStudents(params: ListStudentsInput): Promise<ListStudentsResult> {
  const { page, limit } = validatePagination(params.page, params.limit)
  // ... query logic
  return result
}

// ❌ SAI - Cached query (không dùng cho admin)
export async function listStudentsCached(params: ListStudentsInput): Promise<ListStudentsResult> {
  // ... với cache wrapper
}
```

### Mutations

Tất cả mutations phải có:
- Auth context check
- Permission check
- Error handling
- Logging

```typescript
import { ensurePermission } from "@/features/admin/resources/server/mutations-helpers"
import type { AuthContext } from "@/features/admin/resources/server/mutations-helpers"

export async function createStudent(
  ctx: AuthContext,
  input: CreateStudentInput
): Promise<Student> {
  ensurePermission(ctx, PERMISSIONS.STUDENTS_CREATE)
  
  // ... mutation logic
  return student
}
```

## API Routes

### Route Structure

Tất cả API routes phải tuân thủ pattern:

```
src/app/api/admin/{resource}/
├── route.ts              # GET (list), POST (create)
├── [id]/
│   └── route.ts          # GET (detail), PUT (update), DELETE (delete)
├── [id]/
│   ├── restore/
│   │   └── route.ts      # POST (restore)
│   └── hard-delete/
│       └── route.ts      # DELETE (hard delete)
├── bulk/
│   └── route.ts         # POST (bulk operations)
└── options/
    └── route.ts         # GET (filter options)
```

### Route Implementation

```typescript
// src/app/api/admin/students/route.ts
import { createGetRoute, createPostRoute } from "@/lib/api/api-route-wrapper"
import { listStudents } from "@/features/admin/students/server/queries"
import { createStudent } from "@/features/admin/students/server/mutations"

async function getStudentsHandler(req: NextRequest, context: ApiRouteContext) {
  // Validate pagination
  const paginationValidation = validatePagination({
    page: searchParams.get("page"),
    limit: searchParams.get("limit"),
  })
  
  // Fetch data (non-cached)
  const result = await listStudents({
    page: paginationValidation.page,
    limit: paginationValidation.limit,
    // ...
  })
  
  return createSuccessResponse({
    data: result.rows,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    },
  })
}

export const GET = createGetRoute(getStudentsHandler)
export const POST = createPostRoute(postStudentsHandler)
```

## Client Components

### Table Component

```typescript
// components/students-table.client.tsx
"use client"

import { useQueryClient } from "@tanstack/react-query"
import { ResourceTable } from "@/features/admin/resources/components"
import { useResourceTableLoader } from "@/features/admin/resources/hooks"
import { createAdminFetchOptions } from "@/features/admin/resources/config"
import { queryKeys } from "@/lib/query-keys"
import { apiClient } from "@/lib/api/axios"
import { apiRoutes } from "@/lib/api/routes"

export function StudentsTableClient({ initialData }: Props) {
  const queryClient = useQueryClient()
  
  const loader = useResourceTableLoader({
    queryClient,
    fetcher: async (params) => {
      const response = await apiClient.get(apiRoutes.students.list(params))
      return response.data
    },
    buildParams: ({ query, view }) => ({
      page: query.pagination.page,
      limit: query.pagination.limit,
      search: query.search,
      status: view.status || "active",
    }),
    buildQueryKey: (params) => queryKeys.adminStudents.list(params),
  })
  
  return <ResourceTable loader={loader} initialData={initialData} />
}
```

### Form Component

```typescript
// components/student-edit.client.tsx
"use client"

import { useQueryClient } from "@tanstack/react-query"
import { ResourceForm } from "@/features/admin/resources/components"
import { useResourceFormSubmit, useResourceDetailData } from "@/features/admin/resources/hooks"
import { createResourceEditOnSuccess } from "@/features/admin/resources/utils"
import { queryKeys } from "@/lib/query-keys"
import { apiRoutes } from "@/lib/api/routes"

export function StudentEditClient({ student: initialStudent, studentId }: Props) {
  const queryClient = useQueryClient()
  
  // Fetch fresh data
  const { data: studentData } = useResourceDetailData({
    initialData: initialStudent || {},
    resourceId: studentId || "",
    detailQueryKey: queryKeys.adminStudents.detail,
    resourceName: "students",
    fetchOnMount: !!studentId,
  })
  
  const { handleSubmit } = useResourceFormSubmit({
    apiRoute: (id) => apiRoutes.students.update(id),
    method: "PUT",
    resourceId: student?.id,
    messages: {
      successTitle: "Cập nhật học sinh thành công",
      successDescription: "Học sinh đã được cập nhật thành công.",
      errorTitle: "Lỗi cập nhật học sinh",
    },
    onSuccess: createResourceEditOnSuccess({
      queryClient,
      resourceId: student?.id,
      allQueryKey: queryKeys.adminStudents.all(),
      detailQueryKey: queryKeys.adminStudents.detail,
      resourceName: "students",
      getRecordName: (data) => data.name as string,
    }),
  })
  
  return <ResourceForm data={studentData} onSubmit={handleSubmit} />
}
```

## Actions Hook

```typescript
// hooks/use-student-actions.ts
import { useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api/axios"
import { queryKeys } from "@/lib/query-keys"

export function useStudentActions({ canDelete, canRestore }: Options) {
  const queryClient = useQueryClient()
  
  const executeDelete = useCallback(async (id: string) => {
    await apiClient.delete(apiRoutes.students.delete(id))
    
    // Invalidate và refetch - Next.js 16 pattern
    await queryClient.invalidateQueries({ 
      queryKey: queryKeys.adminStudents.all(), 
      refetchType: "active" 
    })
    await queryClient.refetchQueries({ 
      queryKey: queryKeys.adminStudents.all(), 
      type: "active" 
    })
  }, [queryClient])
  
  return { executeDelete }
}
```

## Cache Strategy

### Nguyên tắc

1. **Không cache admin data**: Tất cả admin queries có `staleTime: 0`
2. **Invalidate sau mutations**: Sau mỗi mutation, invalidate và refetch queries
3. **Socket updates**: Socket events có thể update cache trực tiếp, nhưng queries vẫn luôn fetch fresh data

### Invalidate Pattern

```typescript
// Sau mỗi mutation
await queryClient.invalidateQueries({ 
  queryKey: queryKeys.adminStudents.all(), 
  refetchType: "active" 
})
await queryClient.refetchQueries({ 
  queryKey: queryKeys.adminStudents.all(), 
  type: "active" 
})
```

## Checklist cho mỗi Feature

- [ ] Cấu trúc thư mục đúng pattern
- [ ] Query keys được định nghĩa trong `query-keys.ts`
- [ ] Server queries là non-cached
- [ ] Client components sử dụng `createAdminQueryOptions`
- [ ] API routes tuân thủ structure
- [ ] Mutations có auth và permission checks
- [ ] Actions hook invalidate queries sau mutations
- [ ] Types được định nghĩa đầy đủ
- [ ] Error handling được implement
- [ ] Logging được thêm vào các operations quan trọng

## Best Practices

1. **Luôn sử dụng shared hooks**: Sử dụng hooks từ `@features/admin/resources/hooks`
2. **Reuse components**: Sử dụng `ResourceTable`, `ResourceForm`, `ResourceDetail` từ resources
3. **Type safety**: Đảm bảo tất cả types được định nghĩa rõ ràng
4. **Error handling**: Luôn có error handling và user feedback
5. **Logging**: Log các operations quan trọng để debug
6. **Performance**: Tránh unnecessary re-renders và fetches

## Ví dụ hoàn chỉnh

Xem `src/features/admin/students` như một ví dụ hoàn chỉnh tuân thủ pattern này.

