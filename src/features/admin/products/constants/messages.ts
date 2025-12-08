export const PRODUCT_MESSAGES = {
  CREATE_SUCCESS: "Tạo sản phẩm thành công",
  CREATE_ERROR: "Không thể tạo sản phẩm",
  UPDATE_SUCCESS: "Cập nhật sản phẩm thành công",
  UPDATE_ERROR: "Không thể cập nhật sản phẩm",
  DELETE_SUCCESS: "Xóa sản phẩm thành công",
  DELETE_ERROR: "Không thể xóa sản phẩm",
  RESTORE_SUCCESS: "Khôi phục sản phẩm thành công",
  RESTORE_ERROR: "Không thể khôi phục sản phẩm",
  HARD_DELETE_SUCCESS: "Xóa vĩnh viễn sản phẩm thành công",
  HARD_DELETE_ERROR: "Không thể xóa vĩnh viễn sản phẩm",
  BULK_DELETE_SUCCESS: "Xóa {count} sản phẩm thành công",
  BULK_DELETE_ERROR: "Không thể xóa sản phẩm",
  BULK_RESTORE_SUCCESS: "Khôi phục {count} sản phẩm thành công",
  BULK_RESTORE_ERROR: "Không thể khôi phục sản phẩm",
  BULK_HARD_DELETE_SUCCESS: "Xóa vĩnh viễn {count} sản phẩm thành công",
  BULK_HARD_DELETE_ERROR: "Không thể xóa vĩnh viễn sản phẩm",
  NOT_FOUND: "Sản phẩm không tồn tại",
  UNKNOWN_ERROR: "Đã xảy ra lỗi không xác định",
} as const

export const PRODUCT_LABELS = {
  ACTIVE_VIEW: "Sản phẩm đang bán",
  DELETED_VIEW: "Sản phẩm đã xóa",
  NO_PRODUCTS: "Chưa có sản phẩm nào",
  NO_DELETED_PRODUCTS: "Chưa có sản phẩm nào bị xóa",
  VIEW_DETAIL: "Xem chi tiết",
  EDIT: "Chỉnh sửa",
  DELETE: "Xóa",
  RESTORE: "Khôi phục",
  HARD_DELETE: "Xóa vĩnh viễn",
  DELETING: "Đang xóa...",
  RESTORING: "Đang khôi phục...",
  HARD_DELETING: "Đang xóa vĩnh viễn...",
  TOGGLE_FEATURED: "Đánh dấu nổi bật",
  UNTOGGLE_FEATURED: "Bỏ đánh dấu nổi bật",
} as const

export const PRODUCT_CONFIRM_MESSAGES = {
  DELETE_TITLE: (count?: number) =>
    count && count > 1 ? `Xóa ${count} sản phẩm?` : "Xóa sản phẩm?",
  DELETE_DESCRIPTION: (count?: number, name?: string) =>
    count && count > 1
      ? `Bạn có chắc chắn muốn xóa ${count} sản phẩm đã chọn? Hành động này có thể hoàn tác.`
      : `Bạn có chắc chắn muốn xóa sản phẩm "${name || ""}"? Hành động này có thể hoàn tác.`,
  RESTORE_TITLE: (count?: number) =>
    count && count > 1 ? `Khôi phục ${count} sản phẩm?` : "Khôi phục sản phẩm?",
  RESTORE_DESCRIPTION: (count?: number, name?: string) =>
    count && count > 1
      ? `Bạn có chắc chắn muốn khôi phục ${count} sản phẩm đã chọn?`
      : `Bạn có chắc chắn muốn khôi phục sản phẩm "${name || ""}"?`,
  HARD_DELETE_TITLE: (count?: number) =>
    count && count > 1 ? `Xóa vĩnh viễn ${count} sản phẩm?` : "Xóa vĩnh viễn sản phẩm?",
  HARD_DELETE_DESCRIPTION: (count?: number, name?: string) =>
    count && count > 1
      ? `Bạn có chắc chắn muốn xóa vĩnh viễn ${count} sản phẩm đã chọn? Hành động này không thể hoàn tác.`
      : `Bạn có chắc chắn muốn xóa vĩnh viễn sản phẩm "${name || ""}"? Hành động này không thể hoàn tác.`,
} as const
