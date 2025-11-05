# Query Keys & API Routes Configuration

## 📋 Tổng quan

Tài liệu này mô tả cách sử dụng **Query Keys Configuration** và **API Routes Configuration** để quản lý queries và API routes một cách tập trung và tối ưu theo chuẩn Next.js 16.

## 🎯 Mục tiêu

1. **Tập trung quản lý**: Tất cả query keys và API routes được quản lý ở một nơi
2. **Type-safe**: TypeScript đảm bảo type safety
3. **Tối ưu performance**: Chỉ invalidate những queries thực sự cần thiết
4. **Dễ maintain**: Dễ dàng thêm/sửa/xóa queries và routes

## 📁 Cấu trúc Files

```
src/lib/
├── query-keys.ts      # Query keys configuration
└── api/
    └── routes.ts      # API routes configuration
```

## 🔑 Query Keys Configuration

### File: `src/lib/query-keys.ts`

Tập trung quản lý tất cả query keys cho TanStack Query.

### Sử dụng Query Keys

```typescript
import { queryKeys } from "@/lib/query-keys"

// User notifications với params
const userNotificationsKey = queryKeys.notifications.user(userId, {
  limit: 10,
  offset: 0,
  unreadOnly: false
})

// Admin notifications
const adminNotificationsKey = queryKeys.notifications.admin()

// Users list
const usersListKey = queryKeys.users.list({ page: 1, limit: 20 })
```

### Invalidate Queries

Sử dụng helper functions để invalidate queries một cách chính xác:

```typescript
import { invalidateQueries } from "@/lib/query-keys"
import { useQueryClient } from "@tanstack/react-query"

const queryClient = useQueryClient()

// Chỉ invalidate user notifications (NotificationBell)
invalidateQueries.userNotifications(queryClient, userId)

// Chỉ invalidate admin notifications (Admin Table)
invalidateQueries.adminNotifications(queryClient)

// Invalidate cả user và admin (chỉ khi cần thiết)
invalidateQueries.allNotifications(queryClient, userId)
```

### Best Practices

1. **Chỉ invalidate khi cần thiết**:
   - ✅ `useMarkNotificationRead`: Chỉ invalidate user notifications
   - ✅ `useDeleteNotification`: Invalidate cả user và admin (vì xóa ảnh hưởng cả 2)
   - ❌ Không invalidate tất cả queries khi chỉ cần 1 query

2. **Sử dụng exact mode khi biết chính xác params**:
   ```typescript
   // Tốn ít tài nguyên hơn - chỉ invalidate query chính xác
   invalidateQueries.userNotifications(queryClient, userId, { exact: true })
   
   // Invalidate tất cả queries của user (khi không biết params)
   invalidateQueries.userNotifications(queryClient, userId)
   ```

3. **Tách biệt user và admin queries**:
   - User notifications: `["notifications", "user", userId, ...]`
   - Admin notifications: `["notifications", "admin"]`
   - Không invalidate cả 2 nếu không cần thiết

## 🛣️ API Routes Configuration

### File: `src/lib/api/routes.ts`

Tập trung quản lý tất cả API routes cho toàn hệ thống.

### Sử dụng API Routes

```typescript
import { apiRoutes } from "@/lib/api/routes"

// Notifications
const listUrl = apiRoutes.notifications.list({ limit: 10, offset: 0 })
const detailUrl = apiRoutes.notifications.detail(notificationId)
const markReadUrl = apiRoutes.notifications.markRead(notificationId)
const deleteUrl = apiRoutes.notifications.delete(notificationId)

// Admin Notifications
const adminListUrl = apiRoutes.adminNotifications.list({ page: 1, limit: 20 })

// Users
const usersListUrl = apiRoutes.users.list({ page: 1, limit: 20, search: "test" })
const userDetailUrl = apiRoutes.users.detail(userId)
```

### Best Practices

1. **Luôn sử dụng `apiRoutes` thay vì hardcode URLs**:
   ```typescript
   // ❌ Không làm thế này
   await apiClient.get(`/notifications/${id}`)
   
   // ✅ Làm thế này
   await apiClient.get(apiRoutes.notifications.detail(id))
   ```

2. **Type-safe với params**:
   ```typescript
   // Tự động build query string
   apiRoutes.notifications.list({ limit: 10, offset: 0, unreadOnly: true })
   // → "/api/notifications?limit=10&offset=0&unreadOnly=true"
   ```

## 📊 So sánh: Trước và Sau

### Trước (Không tối ưu)

```typescript
// Hardcode query keys
queryKey: ["notifications", session?.user?.id, limit, offset, unreadOnly]

// Hardcode API routes
await apiClient.get(`notifications?limit=10&offset=0`)

// Invalidate tất cả queries (không cần thiết)
queryClient.invalidateQueries({ queryKey: ["notifications"] })
queryClient.invalidateQueries({ queryKey: ["admin", "notifications"] })
```

### Sau (Tối ưu)

```typescript
// Sử dụng query keys config
queryKey: queryKeys.notifications.user(userId, { limit, offset, unreadOnly })

// Sử dụng API routes config
await apiClient.get(apiRoutes.notifications.list({ limit: 10, offset: 0 }))

// Chỉ invalidate queries cần thiết
invalidateQueries.userNotifications(queryClient, userId)
```

## 🎯 Tối ưu Invalidate Queries

### Khi nào invalidate gì?

| Action | Invalidate | Lý do |
|--------|------------|-------|
| Mark as read/unread | `userNotifications` | Chỉ ảnh hưởng NotificationBell |
| Delete notification | `allNotifications` | Ảnh hưởng cả NotificationBell và Admin Table |
| Delete all notifications | `allNotifications` | Ảnh hưởng cả 2 |
| Socket update | `userNotifications` | Chỉ ảnh hưởng NotificationBell |

### Ví dụ Implementation

```typescript
// Mark as read - chỉ invalidate user notifications
export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()

  return useMutation({
    mutationFn: async ({ id, isRead = true }) => {
      const response = await apiClient.patch(
        apiRoutes.notifications.markRead(id),
        { isRead }
      )
      return response.data
    },
    onSuccess: () => {
      // Chỉ invalidate user notifications - admin table không cần refresh
      invalidateQueries.userNotifications(queryClient, session?.user?.id)
    },
  })
}

// Delete notification - invalidate cả user và admin
export function useDeleteNotification() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(apiRoutes.notifications.delete(id))
      return id
    },
    onSuccess: () => {
      // Invalidate cả 2 vì xóa notification ảnh hưởng đến cả NotificationBell và Admin Table
      invalidateQueries.allNotifications(queryClient, session?.user?.id)
    },
  })
}
```

## 🚀 Mở rộng

### Thêm Query Keys mới

```typescript
// src/lib/query-keys.ts
export const queryKeys = {
  // ... existing keys
  
  // Thêm feature mới
  messages: {
    list: (userId: string, params?: { page?: number }): readonly unknown[] => {
      const { page } = params || {}
      const keys: unknown[] = ["messages", "list", userId]
      if (page !== undefined) keys.push(page)
      return keys
    },
    detail: (id: string): readonly unknown[] => ["messages", "detail", id],
  },
}
```

### Thêm API Routes mới

```typescript
// src/lib/api/routes.ts
export const apiRoutes = {
  // ... existing routes
  
  // Thêm feature mới
  messages: {
    list: (params?: { page?: number; limit?: number }) => {
      const searchParams = new URLSearchParams()
      if (params?.page) searchParams.set("page", params.page.toString())
      if (params?.limit) searchParams.set("limit", params.limit.toString())
      const queryString = searchParams.toString()
      return `${API_BASE}/messages${queryString ? `?${queryString}` : ""}`
    },
    detail: (id: string) => `${API_BASE}/messages/${id}`,
  },
}
```

## 📝 Checklist

Khi thêm/sửa notification operations:

- [ ] Sử dụng `queryKeys` từ config thay vì hardcode
- [ ] Sử dụng `apiRoutes` từ config thay vì hardcode URLs
- [ ] Chỉ invalidate queries thực sự cần thiết
- [ ] Sử dụng `invalidateQueries` helpers thay vì `queryClient.invalidateQueries` trực tiếp
- [ ] Đảm bảo type-safe với TypeScript

## 🔍 Troubleshooting

### Query không được invalidate?

1. Kiểm tra query key có đúng format không
2. Đảm bảo đang sử dụng `invalidateQueries` helpers
3. Kiểm tra `userId` có tồn tại không

### API route không hoạt động?

1. Kiểm tra route có được định nghĩa trong `apiRoutes` không
2. Kiểm tra params có đúng type không
3. Kiểm tra query string có được build đúng không

