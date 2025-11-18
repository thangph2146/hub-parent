/**
 * Constants cho messages và labels trong notifications feature
 */

export const NOTIFICATION_MESSAGES = {
  // Success messages
  MARK_READ_SUCCESS: "Đã đánh dấu đã đọc",
  MARK_UNREAD_SUCCESS: "Đã đánh dấu chưa đọc",
  DELETE_SUCCESS: "Đã xóa thông báo",
  
  // Error messages
  MARK_READ_ERROR: "Đánh dấu đã đọc thất bại",
  MARK_UNREAD_ERROR: "Đánh dấu chưa đọc thất bại",
  DELETE_ERROR: "Xóa thất bại",
  
  // Bulk action messages
  BULK_MARK_READ_SUCCESS: "Đã đánh dấu đã đọc",
  BULK_MARK_UNREAD_SUCCESS: "Đã đánh dấu chưa đọc",
  BULK_DELETE_SUCCESS: "Đã xóa thông báo",
  
  BULK_MARK_READ_ERROR: "Lỗi",
  BULK_MARK_UNREAD_ERROR: "Lỗi",
  BULK_DELETE_ERROR: "Xóa thất bại",
  
  // Permission errors
  NO_PERMISSION: "Không có quyền",
  NO_OWNER_PERMISSION: "Bạn chỉ có thể đánh dấu đã đọc/chưa đọc thông báo của chính mình.",
  NO_DELETE_PERMISSION: "Bạn chỉ có thể xóa thông báo của chính mình.",
  NO_DELETE_SYSTEM: "Thông báo hệ thống không thể xóa.",
  NO_DELETE_OTHER: "Bạn chỉ có thể xóa thông báo cá nhân của chính mình.",
  
  // Status messages
  NO_NOTIFICATIONS_TO_MARK: "Không có thông báo cần đánh dấu",
  ALL_ALREADY_READ: "Tất cả thông báo bạn chọn đã được đánh dấu là đã đọc.",
  ALL_ALREADY_UNREAD: "Tất cả thông báo bạn chọn đã ở trạng thái chưa đọc.",
  NO_CHANGES: "Không có thay đổi",
  NO_NOTIFICATIONS_UPDATED: "Không có thông báo nào được cập nhật.",
  
  // Generic errors
  UNKNOWN_ERROR: "Đã xảy ra lỗi không xác định",
  LOAD_ERROR: "Không nhận được dữ liệu thông báo",
  LOGIN_REQUIRED: "Bạn cần đăng nhập để thực hiện thao tác này.",
} as const

export const NOTIFICATION_LABELS = {
  // Status labels
  READ: "Đã đọc",
  UNREAD: "Chưa đọc",
  
  // Action labels
  VIEW_DETAIL: "Xem chi tiết",
  MARK_READ: "Đánh dấu đã đọc",
  MARK_UNREAD: "Đánh dấu chưa đọc",
  DELETE: "Xóa",
  CLEAR_SELECTION: "Bỏ chọn",
  
  // View mode labels
  ALL: "Tất cả",
  
  // Empty messages
  NO_NOTIFICATIONS: "Không tìm thấy thông báo nào",
  
  // Selection messages
  SELECTED_NOTIFICATIONS: (count: number) => `Đã chọn ${count} thông báo`,
  OWN_NOTIFICATION: "- Của bạn -",
} as const

export const NOTIFICATION_KINDS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  MESSAGE: { label: "Tin nhắn", variant: "default" },
  SYSTEM: { label: "Hệ thống", variant: "secondary" },
  ANNOUNCEMENT: { label: "Thông báo", variant: "outline" },
  ALERT: { label: "Cảnh báo", variant: "destructive" },
  WARNING: { label: "Cảnh báo", variant: "destructive" },
  SUCCESS: { label: "Thành công", variant: "default" },
  INFO: { label: "Thông tin", variant: "secondary" },
} as const

