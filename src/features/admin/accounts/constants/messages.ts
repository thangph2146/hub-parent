export const ACCOUNT_MESSAGES = {
  // Success messages
  UPDATE_SUCCESS: "Cập nhật thông tin tài khoản thành công",
  
  // Error messages
  UPDATE_ERROR: "Cập nhật thông tin tài khoản thất bại",
  LOAD_ERROR: "Không thể tải thông tin tài khoản",
  
  // Validation messages
  NAME_REQUIRED: "Họ và tên là bắt buộc",
  NAME_MIN: "Họ và tên phải có ít nhất 2 ký tự",
  PASSWORD_MIN: "Mật khẩu phải có ít nhất 6 ký tự",
  
  // Permission errors
  NO_PERMISSION: "Bạn không có quyền thực hiện hành động này",
  
  // Generic errors
  UNKNOWN_ERROR: "Đã xảy ra lỗi không xác định",
} as const

export const ACCOUNT_LABELS = {
  // Field labels
  NAME: "Họ và tên",
  EMAIL: "Email",
  BIO: "Giới thiệu",
  PHONE: "Số điện thoại",
  ADDRESS: "Địa chỉ",
  AVATAR: "Ảnh đại diện",
  PASSWORD: "Mật khẩu mới",
  PASSWORD_HINT: "Để trống nếu không muốn đổi mật khẩu",
  
  // Action labels
  EDIT_PROFILE: "Chỉnh sửa hồ sơ",
  SAVE_CHANGES: "Lưu thay đổi",
  SAVING: "Đang lưu...",
  CANCEL: "Hủy",
  
  // Titles
  MY_PROFILE: "Hồ sơ của tôi",
} as const
