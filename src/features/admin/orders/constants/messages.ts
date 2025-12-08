export const ORDER_MESSAGES = {
  CREATE_SUCCESS: "Tạo đơn hàng thành công",
  CREATE_ERROR: "Không thể tạo đơn hàng",
  UPDATE_SUCCESS: "Cập nhật đơn hàng thành công",
  UPDATE_ERROR: "Không thể cập nhật đơn hàng",
  DELETE_SUCCESS: "Xóa đơn hàng thành công",
  DELETE_ERROR: "Không thể xóa đơn hàng",
  RESTORE_SUCCESS: "Khôi phục đơn hàng thành công",
  RESTORE_ERROR: "Không thể khôi phục đơn hàng",
  HARD_DELETE_SUCCESS: "Xóa vĩnh viễn đơn hàng thành công",
  HARD_DELETE_ERROR: "Không thể xóa vĩnh viễn đơn hàng",
  BULK_DELETE_SUCCESS: "Xóa {count} đơn hàng thành công",
  BULK_DELETE_ERROR: "Không thể xóa đơn hàng",
  BULK_RESTORE_SUCCESS: "Khôi phục {count} đơn hàng thành công",
  BULK_RESTORE_ERROR: "Không thể khôi phục đơn hàng",
  BULK_HARD_DELETE_SUCCESS: "Xóa vĩnh viễn {count} đơn hàng thành công",
  BULK_HARD_DELETE_ERROR: "Không thể xóa vĩnh viễn đơn hàng",
  NOT_FOUND: "Đơn hàng không tồn tại",
  UNKNOWN_ERROR: "Đã xảy ra lỗi không xác định",
} as const

export const ORDER_LABELS = {
  ACTIVE_VIEW: "Đơn hàng đang xử lý",
  DELETED_VIEW: "Đơn hàng đã xóa",
  NO_ORDERS: "Chưa có đơn hàng nào",
  NO_DELETED_ORDERS: "Chưa có đơn hàng nào bị xóa",
  VIEW_DETAIL: "Xem chi tiết",
  EDIT: "Chỉnh sửa",
  DELETE: "Xóa",
  RESTORE: "Khôi phục",
  HARD_DELETE: "Xóa vĩnh viễn",
  DELETING: "Đang xóa...",
  RESTORING: "Đang khôi phục...",
  HARD_DELETING: "Đang xóa vĩnh viễn...",
  SELECTED_ORDERS: (count: number) => `Đã chọn ${count} đơn hàng`,
  SELECTED_DELETED_ORDERS: (count: number) => `Đã chọn ${count} đơn hàng (đã xóa)`,
  DELETE_SELECTED: (count: number) => `Xóa đã chọn (${count})`,
  RESTORE_SELECTED: (count: number) => `Khôi phục (${count})`,
  HARD_DELETE_SELECTED: (count: number) => `Xóa vĩnh viễn (${count})`,
  CLEAR_SELECTION: "Bỏ chọn",
  MANAGE_ORDERS: "Quản lý đơn hàng",
  ADD_NEW: "Thêm mới",
} as const

export const ORDER_CONFIRM_MESSAGES = {
  DELETE_TITLE: (count?: number) =>
    count && count > 1 ? `Xóa ${count} đơn hàng?` : "Xóa đơn hàng?",
  DELETE_DESCRIPTION: (count?: number, orderNumber?: string) =>
    count && count > 1
      ? `Bạn có chắc chắn muốn xóa ${count} đơn hàng đã chọn? Hành động này có thể hoàn tác.`
      : `Bạn có chắc chắn muốn xóa đơn hàng "${orderNumber || ""}"? Hành động này có thể hoàn tác.`,
  RESTORE_TITLE: (count?: number) =>
    count && count > 1 ? `Khôi phục ${count} đơn hàng?` : "Khôi phục đơn hàng?",
  RESTORE_DESCRIPTION: (count?: number, orderNumber?: string) =>
    count && count > 1
      ? `Bạn có chắc chắn muốn khôi phục ${count} đơn hàng đã chọn?`
      : `Bạn có chắc chắn muốn khôi phục đơn hàng "${orderNumber || ""}"?`,
  HARD_DELETE_TITLE: (count?: number) =>
    count && count > 1 ? `Xóa vĩnh viễn ${count} đơn hàng?` : "Xóa vĩnh viễn đơn hàng?",
  HARD_DELETE_DESCRIPTION: (count?: number, orderNumber?: string) =>
    count && count > 1
      ? `Bạn có chắc chắn muốn xóa vĩnh viễn ${count} đơn hàng đã chọn? Hành động này không thể hoàn tác.`
      : `Bạn có chắc chắn muốn xóa vĩnh viễn đơn hàng "${orderNumber || ""}"? Hành động này không thể hoàn tác.`,
  CONFIRM_LABEL: "Xóa",
  RESTORE_LABEL: "Khôi phục",
  CANCEL_LABEL: "Hủy",
} as const

