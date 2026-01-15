import { createResourceActionsHook } from "@/features/admin/resources/hooks"
import type { CategoryRow } from "../types"
import { CATEGORY_MESSAGES } from "../constants/messages"

export const useCategoryActions = createResourceActionsHook<CategoryRow>({
  resourceName: "categories",
  resourceDisplayName: "danh mục",
  messages: CATEGORY_MESSAGES,
  getRecordName: (row) => row.name,
  getLogMetadata: (row) => ({ categoryId: row.id, categoryName: row.name }),
  beforeSingleAction: async (action, row) => {
    if (action === "delete" || action === "hard-delete") {
      // Kiểm tra nếu danh mục có danh mục con
      if (row._count && row._count.children > 0) {
        return {
          allowed: false,
          title: "Không thể xóa",
          message: `Danh mục "${row.name}" đang có danh mục con. Vui lòng xóa hoặc di chuyển các danh mục con trước.`
        }
      }
    }
    return { allowed: true }
  },
  beforeBulkAction: async (action, ids, rows) => {
    if (action === "delete" || action === "hard-delete") {
      if (!rows) return { allowed: true }
      
      const categoriesWithChildren = rows.filter(row => row._count && row._count.children > 0)
      
      if (categoriesWithChildren.length > 0) {
        const targetIds = rows
          .filter(row => !(row._count && row._count.children > 0))
          .map(row => row.id)
        
        if (targetIds.length === 0) {
          return {
            allowed: false,
            title: "Không thể thực hiện",
            message: "Tất cả danh mục đã chọn đều có danh mục con. Vui lòng xử lý danh mục con trước."
          }
        }
        
        return {
          allowed: true,
          targetIds,
          title: "Thông báo",
          message: `Có ${categoriesWithChildren.length} danh mục có danh mục con sẽ bị bỏ qua.`
        }
      }
    }
    return { allowed: true }
  },
})

