/**
 * Common Constants for the Application
 */

export const COMMON_MESSAGES = {
  // Success messages
  SUCCESS: "Thành công",
  DELETE_SUCCESS: "Xóa thành công",
  RESTORE_SUCCESS: "Khôi phục thành công",
  HARD_DELETE_SUCCESS: "Xóa vĩnh viễn thành công",
  UPDATE_SUCCESS: "Cập nhật thành công",
  CREATE_SUCCESS: "Tạo mới thành công",
  
  // Error messages
  ERROR: "Đã xảy ra lỗi",
  DELETE_ERROR: "Xóa thất bại",
  RESTORE_ERROR: "Khôi phục thất bại",
  HARD_DELETE_ERROR: "Xóa vĩnh viễn thất bại",
  UPDATE_ERROR: "Cập nhật thất bại",
  CREATE_ERROR: "Tạo mới thất bại",
  LOAD_ERROR: "Không thể tải dữ liệu",
  
  // Permission errors
  NO_PERMISSION: "Bạn không có quyền thực hiện hành động này",
  
  // Generic errors
  UNKNOWN_ERROR: "Đã xảy ra lỗi không xác định",
} as const

export const COMMON_LABELS = {
  // Action labels
  VIEW: "Xem",
  EDIT: "Chỉnh sửa",
  DELETE: "Xóa",
  RESTORE: "Khôi phục",
  HARD_DELETE: "Xóa vĩnh viễn",
  SAVE: "Lưu",
  CANCEL: "Hủy",
  CONFIRM: "Xác nhận",
  ADD_NEW: "Thêm mới",
  SEARCH: "Tìm kiếm",
  FILTER: "Lọc",
  CLOSE: "Đóng",
  BACK: "Quay lại",
  
  // Status labels
  ACTIVE: "Hoạt động",
  INACTIVE: "Không hoạt động",
  DELETED: "Đã xóa",
  PENDING: "Đang chờ",
  
  // Selection messages
  CLEAR_SELECTION: "Bỏ chọn",
  SELECTED: (count: number) => `Đã chọn ${count}`,
} as const

export const PAGINATION_DEFAULTS = {
  PAGE_SIZE: 10,
  PAGE_INDEX: 0,
} as const
