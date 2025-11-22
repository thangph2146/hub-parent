/**
 * Shared utility functions cho resource features
 * 
 * Các hàm utility chung được dùng bởi nhiều resource features
 */

import { resourceLogger } from "@/lib/config"

/**
 * Format date to Vietnamese locale
 */
export function formatDateVi(date: string | Date): string {
  return new Date(date).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/**
 * Generate slug from name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with dash
    .replace(/^-+|-+$/g, "") // Remove leading/trailing dashes
}

/**
 * Validate name (minimum 2 characters)
 */
export function validateName(value: unknown): { valid: boolean; error?: string } {
  if (!value || typeof value !== "string") {
    return { valid: false, error: "Tên là bắt buộc" }
  }
  const trimmed = value.trim()
  if (trimmed.length < 2) {
    return { valid: false, error: "Tên phải có ít nhất 2 ký tự" }
  }
  if (trimmed.length > 100) {
    return { valid: false, error: "Tên không được vượt quá 100 ký tự" }
  }
  return { valid: true }
}

/**
 * Validate slug (alphanumeric, dashes)
 */
export function validateSlug(value: unknown): { valid: boolean; error?: string } {
  if (!value || typeof value !== "string") {
    return { valid: false, error: "Slug là bắt buộc" }
  }
  const trimmed = value.trim()
  if (trimmed.length < 2) {
    return { valid: false, error: "Slug phải có ít nhất 2 ký tự" }
  }
  if (!/^[a-z0-9-]+$/.test(trimmed)) {
    return { valid: false, error: "Slug chỉ được chứa chữ thường, số và dấu gạch ngang" }
  }
  return { valid: true }
}

/**
 * Validate email format
 */
export function validateEmail(value: unknown): { valid: boolean; error?: string } {
  if (!value || typeof value !== "string") {
    return { valid: false, error: "Email là bắt buộc" }
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(value.trim())) {
    return { valid: false, error: "Email không hợp lệ" }
  }
  return { valid: true }
}

/**
 * Validate phone (optional, basic format check)
 */
export function validatePhone(value: unknown): { valid: boolean; error?: string } {
  if (!value || value === "") {
    return { valid: true } // Phone is optional
  }
  if (typeof value !== "string") {
    return { valid: false, error: "Số điện thoại không hợp lệ" }
  }
  const phoneRegex = /^[0-9+\-\s()]+$/
  if (!phoneRegex.test(value.trim())) {
    return { valid: false, error: "Số điện thoại chỉ được chứa số, dấu +, -, khoảng trắng và dấu ngoặc" }
  }
  return { valid: true }
}

/**
 * Validate description (optional, max 500 characters)
 */
export function validateDescription(value: unknown): { valid: boolean; error?: string } {
  if (!value || value === "") {
    return { valid: true } // Description is optional
  }
  if (typeof value !== "string") {
    return { valid: false, error: "Mô tả không hợp lệ" }
  }
  if (value.length > 500) {
    return { valid: false, error: "Mô tả không được vượt quá 500 ký tự" }
  }
  return { valid: true }
}

/**
 * Chuẩn hoá giá trị search: trim khoảng trắng, trả về undefined nếu rỗng
 */
export function normalizeSearch(value: string | undefined | null): string | undefined {
  if (!value) return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

/**
 * Loại bỏ các filter rỗng/null khỏi record trước khi gửi lên API
 */
export function sanitizeFilters(
  filters?: Record<string, string | null | undefined>,
): Record<string, string> {
  if (!filters) return {}

  return Object.entries(filters).reduce<Record<string, string>>((acc, [key, rawValue]) => {
    if (rawValue === undefined || rawValue === null) {
      return acc
    }

    const value = String(rawValue).trim()
    if (value.length > 0) {
      acc[key] = value
    }

    return acc
  }, {})
}

/**
 * Truncate text cho breadcrumb labels
 * Giới hạn độ dài để tránh breadcrumb quá dài
 * 
 * @param text - Text cần truncate
 * @param maxLength - Độ dài tối đa (default: 30)
 * @returns Text đã được truncate với "..." nếu quá dài
 */
export function truncateBreadcrumbLabel(text: string, maxLength: number = 30): string {
  if (!text || text.length <= maxLength) {
    return text
  }
  return text.substring(0, maxLength).trim() + "..."
}

/**
 * Helper function để chuyển resource name từ plural sang singular
 * Ví dụ: "categories" -> "category", "tags" -> "tag"
 */
function getResourceSingularName(resourceName: string): string {
  // Mapping cho các trường hợp đặc biệt
  const specialCases: Record<string, string> = {
    categories: "category",
    tags: "tag",
    users: "user",
    posts: "post",
    comments: "comment",
    roles: "role",
    sessions: "session",
    students: "student",
    "contact-requests": "contact-request",
    notifications: "notification",
  }
  
  if (specialCases[resourceName]) {
    return specialCases[resourceName]
  }
  
  // Fallback: xóa "s" ở cuối nếu có
  if (resourceName.endsWith("s")) {
    return resourceName.slice(0, -1)
  }
  
  return resourceName
}

/**
 * Helper function để cập nhật React Query cache sau khi edit resource
 * Cập nhật cả detail cache và list cache với dữ liệu mới từ response
 */
export function updateResourceCacheAfterEdit({
  queryClient,
  resourceId,
  responseData,
  allQueryKey,
  detailQueryKey,
}: {
  queryClient: ReturnType<typeof import("@tanstack/react-query").useQueryClient>
  resourceId: string
  responseData: Record<string, unknown>
  allQueryKey: readonly unknown[]
  detailQueryKey: (id: string) => readonly unknown[]
}): void {
  // Cập nhật detail cache - đảm bảo structure đúng { data: ... }
  const currentDetailData = queryClient.getQueryData<{ data: Record<string, unknown> }>(detailQueryKey(resourceId))
  queryClient.setQueryData(detailQueryKey(resourceId), { 
    data: { ...(currentDetailData?.data || {}), ...responseData }
  })

  // Cập nhật list cache với item đã được edit
  // Đảm bảo structure đúng: DataTableResult<T> = { rows, page, limit, total, totalPages }
  const listQueries = queryClient.getQueriesData({ queryKey: allQueryKey })
  for (const [queryKey, queryData] of listQueries) {
    if (queryData && typeof queryData === "object" && "rows" in queryData) {
      const data = queryData as { 
        rows: Array<Record<string, unknown>>; 
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        [key: string]: unknown;
      }
      const rowIndex = data.rows.findIndex((row) => row.id === resourceId)
      if (rowIndex >= 0) {
        // Tạo object mới để React Query detect được thay đổi
        const updatedRows = [...data.rows]
        const currentRow = updatedRows[rowIndex]
        const oldData = { ...currentRow }
        
        // Merge responseData vào currentRow, ưu tiên responseData (dữ liệu mới từ server)
        // Sử dụng !== undefined để đảm bảo null values được áp dụng đúng cách
        const mergedRow: typeof currentRow = { ...currentRow }
        for (const key in responseData) {
          if (responseData[key] !== undefined) {
            ;(mergedRow as Record<string, unknown>)[key] = responseData[key]
          }
        }
        updatedRows[rowIndex] = mergedRow
        const newData = { ...mergedRow }
        
        // Tạo object mới hoàn toàn để React Query detect được thay đổi
        // Spread tất cả properties từ data để đảm bảo không mất bất kỳ field nào
        const updatedData = { 
          ...data, 
          rows: updatedRows 
        }
        
        // Sử dụng setQueryData với option để đảm bảo React Query detect được thay đổi
        queryClient.setQueryData(queryKey, updatedData)
        
        // Log để debug cache update với đầy đủ oldData và newData
        resourceLogger.actionFlow({
          resource: "resources",
          action: "update",
          step: "success",
          metadata: {
            resourceId,
            queryKey: queryKey.slice(0, 2),
            rowIndex,
            oldData,
            newData,
            fieldsUpdated: Object.keys(responseData),
            cacheType: "list-cache-updated",
          },
        })
      }
    }
  }
}

/**
 * Helper function để tạo onSuccess handler cho resource edit forms
 * Tự động cập nhật cache và invalidate queries
 */
export function createResourceEditOnSuccess({
  queryClient,
  resourceId,
  allQueryKey,
  detailQueryKey,
  resourceName,
  getRecordName,
  onSuccess,
}: {
  queryClient: ReturnType<typeof import("@tanstack/react-query").useQueryClient>
  resourceId: string | undefined
  allQueryKey: readonly unknown[]
  detailQueryKey: (id: string) => readonly unknown[]
  resourceName: string
  getRecordName?: (responseData: Record<string, unknown>) => string | undefined
  onSuccess?: () => void
}) {
  return async (response: import("axios").AxiosResponse) => {
    const responseData = response?.data?.data

    // Cập nhật React Query cache với dữ liệu mới từ response TRƯỚC KHI invalidate
    // Điều này đảm bảo detail page hiển thị dữ liệu mới ngay lập tức
    if (resourceId && responseData) {
      const updatedData = {
        ...responseData,
        updatedAt: responseData.updatedAt || new Date().toISOString(),
      }
      
      // Cập nhật cả detail và list cache với dữ liệu mới
      updateResourceCacheAfterEdit({
        queryClient,
        resourceId,
        responseData: updatedData,
        allQueryKey,
        detailQueryKey,
      })
    }

    // Invalidate queries trong background để đảm bảo data mới nhất từ server
    // Cache đã được cập nhật trước đó nên UI sẽ hiển thị dữ liệu mới ngay
    // Không await để không block navigation
    // Socket events sẽ trigger refresh nếu có, nên không cần refetch ngay
    void queryClient.invalidateQueries({ queryKey: allQueryKey, refetchType: "none" })
    if (resourceId) {
      void queryClient.invalidateQueries({ queryKey: detailQueryKey(resourceId), refetchType: "none" })
    }

    // Log success
    const recordName = getRecordName?.(responseData) || (responseData?.name as string | undefined)
    const singularName = getResourceSingularName(resourceName)
    const resourceIdKey = `${singularName}Id` // tagId, categoryId, etc.
    const resourceNameKey = `${singularName}Name` // tagName, categoryName, etc.
    
    resourceLogger.actionFlow({
      resource: resourceName,
      action: "update",
      step: "success",
      metadata: {
        [resourceIdKey]: resourceId,
        [resourceNameKey]: recordName,
        responseStatus: response?.status,
        cacheType: "react-query-detail-and-list",
      },
    })

    if (onSuccess) {
      onSuccess()
    }
  }
}


