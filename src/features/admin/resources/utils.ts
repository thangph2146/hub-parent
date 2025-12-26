import type { AdminBreadcrumbItem } from "@/components/layouts/headers/admin-header"
import { applyResourceSegmentToPath, DEFAULT_RESOURCE_SEGMENT } from "@/lib/permissions"
import { logActionFlow } from "./server/mutation-helpers"
import { resourceRefreshRegistry } from "./hooks/resource-refresh-registry"

export const formatDateVi = (date: string | Date | null | undefined): string => {
  if (!date) return "—"
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date
    if (isNaN(dateObj.getTime())) return "—"
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(dateObj)
  } catch {
    return "—"
  }
}

export const generateSlug = (name: string): string =>
  name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

export const validateName = (value: unknown): { valid: boolean; error?: string } => {
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

export const validateSlug = (value: unknown): { valid: boolean; error?: string } => {
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

export const validateEmail = (value: unknown): { valid: boolean; error?: string } => {
  if (!value || typeof value !== "string") {
    return { valid: false, error: "Email là bắt buộc" }
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(value.trim())) {
    return { valid: false, error: "Email không hợp lệ" }
  }
  return { valid: true }
}

export const validatePhone = (value: unknown): { valid: boolean; error?: string } => {
  if (!value || value === "") {
    return { valid: true }
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

export const validateDescription = (value: unknown): { valid: boolean; error?: string } => {
  if (!value || value === "") {
    return { valid: true }
  }
  if (typeof value !== "string") {
    return { valid: false, error: "Mô tả không hợp lệ" }
  }
  if (value.length > 500) {
    return { valid: false, error: "Mô tả không được vượt quá 500 ký tự" }
  }
  return { valid: true }
}

export const getUserInitials = (name?: string | null, email?: string): string => {
  if (name) {
    const parts = name.trim().split(" ")
    return parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase()
  }
  return email ? email.substring(0, 2).toUpperCase() : "U"
}

export const validatePassword = (value: unknown, allowEmpty = false): { valid: boolean; error?: string } => {
  if (allowEmpty && (!value || value === "")) {
    return { valid: true }
  }
  if (!value || value === "" || typeof value !== "string") {
    return { valid: false, error: "Mật khẩu là bắt buộc" }
  }
  if (value.length < 6) {
    return { valid: false, error: "Mật khẩu phải có ít nhất 6 ký tự" }
  }
  return { valid: true }
}

export const normalizeSearch = (value: string | undefined | null): string | undefined => {
  if (!value) return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export const sanitizeFilters = (
  filters?: Record<string, string | null | undefined>,
): Record<string, string> => {
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

export const truncateBreadcrumbLabel = (text: string, maxLength: number = 30): string => {
  if (!text || text.length <= maxLength) {
    return text
  }
  return text.substring(0, maxLength).trim() + "..."
}

export const getResourceSegmentFromParams = (
  resource?: string,
  defaultSegment: string = DEFAULT_RESOURCE_SEGMENT
): string => (resource && resource.length > 0 ? resource.toLowerCase() : defaultSegment)

export interface CreateBreadcrumbsOptions {
  resourceSegment?: string
  listLabel: string
  listPath: string
  detailLabel?: string
  detailPath?: string
  editLabel?: string
  editPath?: string
  createLabel?: string
  createPath?: string
}

export const createListBreadcrumbs = ({
  resourceSegment: _resourceSegment = DEFAULT_RESOURCE_SEGMENT,
  listLabel,
}: Pick<CreateBreadcrumbsOptions, "resourceSegment" | "listLabel">): AdminBreadcrumbItem[] => {
  return [{ label: listLabel, isActive: true }]
}

export const createDetailBreadcrumbs = ({
  resourceSegment = DEFAULT_RESOURCE_SEGMENT,
  listLabel,
  listPath,
  detailLabel,
  detailPath,
}: Pick<CreateBreadcrumbsOptions, "resourceSegment" | "listLabel" | "listPath" | "detailLabel" | "detailPath">): AdminBreadcrumbItem[] => {
  if (!detailLabel || !detailPath) {
    return createListBreadcrumbs({ resourceSegment, listLabel })
  }
  
  return [
    { label: listLabel, href: applyResourceSegmentToPath(listPath, resourceSegment) },
    { label: truncateBreadcrumbLabel(detailLabel), isActive: true },
  ]
}

export const createEditBreadcrumbs = ({
  resourceSegment = DEFAULT_RESOURCE_SEGMENT,
  listLabel,
  listPath,
  detailLabel,
  detailPath,
  editLabel = "Chỉnh sửa",
}: Pick<CreateBreadcrumbsOptions, "resourceSegment" | "listLabel" | "listPath" | "detailLabel" | "detailPath" | "editLabel">): AdminBreadcrumbItem[] => {
  const items: AdminBreadcrumbItem[] = [
    { label: listLabel, href: applyResourceSegmentToPath(listPath, resourceSegment) },
  ]
  
  if (detailLabel && detailPath) {
    items.push({ label: truncateBreadcrumbLabel(detailLabel), href: applyResourceSegmentToPath(detailPath, resourceSegment) })
  }
  
  items.push({ label: editLabel, isActive: true })
  return items
}

export const createCreateBreadcrumbs = ({
  resourceSegment = DEFAULT_RESOURCE_SEGMENT,
  listLabel,
  listPath,
  createLabel = "Tạo mới",
}: Pick<CreateBreadcrumbsOptions, "resourceSegment" | "listLabel" | "listPath" | "createLabel">): AdminBreadcrumbItem[] => {
  return [
    { label: listLabel, href: applyResourceSegmentToPath(listPath, resourceSegment) },
    { label: createLabel, isActive: true },
  ]
}

export const createNestedBreadcrumbs = ({
  resourceSegment = DEFAULT_RESOURCE_SEGMENT,
  parentLabel,
  parentPath,
  currentLabel,
}: {
  resourceSegment?: string
  parentLabel: string
  parentPath: string
  currentLabel: string
}): AdminBreadcrumbItem[] => {
  return [
    { label: parentLabel, href: applyResourceSegmentToPath(parentPath, resourceSegment) },
    { label: currentLabel, isActive: true },
  ]
}

const getResourceSingularName = (resourceName: string): string => {
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
  return specialCases[resourceName] || (resourceName.endsWith("s") ? resourceName.slice(0, -1) : resourceName)
}

export const createResourceEditOnSuccess = ({
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
}) => {
  return async (response: import("axios").AxiosResponse) => {
    const responseData = response?.data?.data

    // Invalidate và refetch queries để đảm bảo data được cập nhật ngay lập tức
    // Sử dụng refetchType: "all" để đảm bảo refetch tất cả queries, không chỉ active
    await queryClient.invalidateQueries({ queryKey: allQueryKey, refetchType: "all" })
    await queryClient.refetchQueries({ queryKey: allQueryKey, type: "all" })
    if (resourceId) {
      await queryClient.invalidateQueries({ queryKey: detailQueryKey(resourceId), refetchType: "all" })
      await queryClient.refetchQueries({ queryKey: detailQueryKey(resourceId), type: "all" })
    }

    // Trigger UI refresh ngay lập tức thông qua registry
    // Registry sẽ gọi handleRefresh để update refreshKey, trigger DataTable re-render và fetch fresh data
    // Gọi trực tiếp ngay lập tức - queries đã được refetch xong và cache đã được cập nhật
    resourceRefreshRegistry.triggerRefresh(allQueryKey)

    const recordName = getRecordName?.(responseData) || (responseData?.name as string | undefined)
    const singularName = getResourceSingularName(resourceName)
    logActionFlow(resourceName, "update", "success", {
      [`${singularName}Id`]: resourceId,
      [`${singularName}Name`]: recordName,
      responseStatus: response?.status,
      cacheStrategy: "invalidate-and-refetch-nextjs16",
    })

    onSuccess?.()
  }
}


