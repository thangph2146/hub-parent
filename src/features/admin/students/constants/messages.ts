export const STUDENT_MESSAGES = {
  // Success messages
  TOGGLE_ACTIVE_SUCCESS: "Cập nhật thành công",
  ACTIVE_SUCCESS: "Kích hoạt thành công",
  UNACTIVE_SUCCESS: "Vô hiệu hóa thành công",
  DELETE_SUCCESS: "Xóa thành công",
  RESTORE_SUCCESS: "Khôi phục thành công",
  HARD_DELETE_SUCCESS: "Xóa vĩnh viễn thành công",
  
  // Error messages
  TOGGLE_ACTIVE_ERROR: "Lỗi cập nhật",
  ACTIVE_ERROR: "Kích hoạt thất bại",
  UNACTIVE_ERROR: "Vô hiệu hóa thất bại",
  DELETE_ERROR: "Xóa thất bại",
  RESTORE_ERROR: "Khôi phục thất bại",
  HARD_DELETE_ERROR: "Xóa vĩnh viễn thất bại",
  
  // Bulk action messages
  BULK_DELETE_SUCCESS: "Xóa hàng loạt thành công",
  BULK_RESTORE_SUCCESS: "Khôi phục hàng loạt thành công",
  BULK_HARD_DELETE_SUCCESS: "Xóa vĩnh viễn hàng loạt thành công",
  BULK_ACTIVE_SUCCESS: "Kích hoạt hàng loạt thành công",
  BULK_UNACTIVE_SUCCESS: "Bỏ kích hoạt hàng loạt thành công",
  
  BULK_DELETE_ERROR: "Xóa hàng loạt thất bại",
  BULK_RESTORE_ERROR: "Khôi phục hàng loạt thất bại",
  BULK_HARD_DELETE_ERROR: "Xóa vĩnh viễn hàng loạt thất bại",
  BULK_ACTIVE_ERROR: "Kích hoạt hàng loạt thất bại",
  BULK_UNACTIVE_ERROR: "Bỏ kích hoạt hàng loạt thất bại",
  
  // Permission errors
  NO_PERMISSION: "Không có quyền",
  NO_MANAGE_PERMISSION: "Bạn không có quyền thay đổi trạng thái sinh viên",
  NO_ACTIVE_PERMISSION: "Bạn không có quyền kích hoạt sinh viên",
  
  // Generic errors
  UNKNOWN_ERROR: "Đã xảy ra lỗi không xác định",
  LOAD_ERROR: "Không thể tải danh sách sinh viên",
} as const

export const STUDENT_LABELS = {
  // Status labels
  ACTIVE: "Hoạt động",
  INACTIVE: "Tạm khóa",
  DELETED: "Đã xóa",
  
  // Action labels
  VIEW_DETAIL: "Xem chi tiết",
  EDIT: "Chỉnh sửa",
  TOGGLE_ACTIVE: "Kích hoạt/Vô hiệu hóa",
  DELETE: "Xóa",
  RESTORE: "Khôi phục",
  HARD_DELETE: "Xóa vĩnh viễn",
  CLEAR_SELECTION: "Bỏ chọn",
  
  // Loading labels
  DELETING: "Đang xóa...",
  RESTORING: "Đang khôi phục...",
  HARD_DELETING: "Đang xóa vĩnh viễn...",
  
  // View mode labels
  ACTIVE_VIEW: "Đang hoạt động",
  INACTIVE_VIEW: "Tạm khóa",
  DELETED_VIEW: "Đã xóa",
  ALL_VIEW: "Tất cả",
  
  // Empty messages
  NO_STUDENTS: "Không tìm thấy sinh viên nào phù hợp",
  NO_INACTIVE_STUDENTS: "Không tìm thấy sinh viên tạm khóa nào",
  NO_DELETED_STUDENTS: "Không tìm thấy sinh viên đã xóa nào",
  
  // Selection messages
  SELECTED_STUDENTS: (count: number) => `Đã chọn ${count} sinh viên`,
  SELECTED_DELETED_STUDENTS: (count: number) => `Đã chọn ${count} sinh viên (đã xóa)`,
  DELETE_SELECTED: (count: number) => `Xóa đã chọn (${count})`,
  RESTORE_SELECTED: (count: number) => `Khôi phục (${count})`,
  HARD_DELETE_SELECTED: (count: number) => `Xóa vĩnh viễn (${count})`,
  ACTIVE_SELECTED: (count: number) => `Kích hoạt (${count})`,
  UNACTIVE_SELECTED: (count: number) => `Bỏ kích hoạt (${count})`,
  
  // Titles
  MANAGE_STUDENTS: "Quản lý sinh viên",
  ADD_NEW: "Thêm mới",
  
  // Table headers
  STUDENT_CODE: "Mã sinh viên",
  STUDENT_NAME: "Tên sinh viên",
  EMAIL: "Email",
  STATUS: "Trạng thái",
  CREATED_AT: "Ngày tạo",
  DELETED_AT: "Ngày xóa",
  
  // Pending approval messages
  PENDING_APPROVAL_TITLE: "Đang chờ xét duyệt",
  PENDING_APPROVAL_MESSAGE: "Hồ sơ sinh viên đang được xem xét và sẽ được xét duyệt trong thời gian sớm nhất. Quý phụ huynh vui lòng chờ trong vòng 24 giờ. Nếu cần hỗ trợ gấp, vui lòng liên hệ với chúng tôi để được hỗ trợ nhanh chóng.",
  
  // Approved messages
  APPROVED_TITLE: "Đã được xét duyệt",
  APPROVED_MESSAGE: "Hồ sơ sinh viên đã được xét duyệt và kích hoạt thành công. sinh viên có thể sử dụng đầy đủ các tính năng của hệ thống.",
} as const

export const STUDENT_CONFIRM_MESSAGES = {
  DELETE_TITLE: (count?: number, studentCode?: string) => 
    count ? `Xóa ${count} sinh viên?` : `Xóa sinh viên ${studentCode}?`,
  DELETE_DESCRIPTION: (count?: number, studentCode?: string) =>
    count
      ? `Bạn có chắc chắn muốn xóa ${count} sinh viên? Họ sẽ được chuyển vào thùng rác và có thể khôi phục sau.`
      : `Bạn có chắc chắn muốn xóa sinh viên "${studentCode || ""}"? sinh viên sẽ được chuyển vào thùng rác và có thể khôi phục sau.`,
  
  RESTORE_TITLE: (count?: number, studentCode?: string) => 
    count ? `Khôi phục ${count} sinh viên?` : `Khôi phục sinh viên ${studentCode}?`,
  RESTORE_DESCRIPTION: (count?: number, studentCode?: string) =>
    count
      ? `Bạn có chắc chắn muốn khôi phục ${count} sinh viên? Họ sẽ được chuyển về trạng thái hoạt động.`
      : `Bạn có chắc chắn muốn khôi phục sinh viên "${studentCode || ""}"? sinh viên sẽ được chuyển về trạng thái hoạt động.`,
  
  HARD_DELETE_TITLE: (count?: number, studentCode?: string) =>
    count ? `Xóa vĩnh viễn ${count} sinh viên?` : `Xóa vĩnh viễn sinh viên ${studentCode}?`,
  HARD_DELETE_DESCRIPTION: (count?: number, studentCode?: string) =>
    count
      ? `Hành động này sẽ xóa vĩnh viễn ${count} sinh viên khỏi hệ thống. Dữ liệu sẽ không thể khôi phục. Bạn có chắc chắn muốn tiếp tục?`
      : `Hành động này sẽ xóa vĩnh viễn sinh viên "${studentCode || ""}" khỏi hệ thống. Dữ liệu sẽ không thể khôi phục. Bạn có chắc chắn muốn tiếp tục?`,
  
  CONFIRM_LABEL: "Xóa",
  RESTORE_LABEL: "Khôi phục",
  HARD_DELETE_LABEL: "Xóa vĩnh viễn",
  CANCEL_LABEL: "Hủy",
  
  TOGGLE_TITLE: (studentCode?: string, newStatus?: boolean) =>
    newStatus
      ? `Kích hoạt sinh viên ${studentCode}?`
      : `Vô hiệu hóa sinh viên ${studentCode}?`,
  TOGGLE_DESCRIPTION: (studentCode?: string, newStatus?: boolean) =>
    newStatus
      ? `Bạn có chắc chắn muốn kích hoạt sinh viên "${studentCode || ""}"? Sinh viên sẽ có thể sử dụng đầy đủ các tính năng của hệ thống.`
      : `Bạn có chắc chắn muốn vô hiệu hóa sinh viên "${studentCode || ""}"? Sinh viên sẽ không thể sử dụng các tính năng của hệ thống.`,
  TOGGLE_CONFIRM_LABEL: (newStatus?: boolean) =>
    newStatus ? "Kích hoạt" : "Vô hiệu hóa",
  
  BULK_TOGGLE_TITLE: (count?: number, newStatus?: boolean) =>
    newStatus
      ? `Kích hoạt ${count} sinh viên?`
      : `Vô hiệu hóa ${count} sinh viên?`,
  BULK_TOGGLE_DESCRIPTION: (count?: number, newStatus?: boolean) =>
    newStatus
      ? `Bạn có chắc chắn muốn kích hoạt ${count} sinh viên đã chọn? Các sinh viên sẽ có thể sử dụng đầy đủ các tính năng của hệ thống.`
      : `Bạn có chắc chắn muốn vô hiệu hóa ${count} sinh viên đã chọn? Các sinh viên sẽ không thể sử dụng các tính năng của hệ thống.`,
  BULK_TOGGLE_CONFIRM_LABEL: (newStatus?: boolean) =>
    newStatus ? "Kích hoạt" : "Vô hiệu hóa",
} as const
