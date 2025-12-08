import { useResourceActions } from "@/features/admin/resources/hooks"
import { apiRoutes } from "@/lib/api/routes"
import { queryKeys } from "@/lib/query-keys"
import type { ProductRow } from "../types"
import type { FeedbackVariant } from "@/components/dialogs"
import { PRODUCT_MESSAGES } from "../constants/messages"

interface UseProductActionsOptions {
  canDelete: boolean
  canRestore: boolean
  canManage: boolean
  showFeedback: (variant: FeedbackVariant, title: string, description?: string, details?: string) => void
}

export function useProductActions({
  canDelete,
  canRestore,
  canManage,
  showFeedback,
}: UseProductActionsOptions) {
  return useResourceActions<ProductRow>({
    resourceName: "products",
    queryKeys: {
      all: () => queryKeys.adminProducts.all(),
    },
    apiRoutes: {
      delete: (id) => apiRoutes.products.delete(id),
      restore: (id) => apiRoutes.products.restore(id),
      hardDelete: (id) => apiRoutes.products.hardDelete(id),
      bulk: apiRoutes.products.bulk,
    },
    messages: PRODUCT_MESSAGES,
    getRecordName: (row) => row.name,
    permissions: {
      canDelete,
      canRestore,
      canManage,
    },
    showFeedback,
    getLogMetadata: (row) => ({
      productId: row.id,
      productName: row.name,
      productSku: row.sku,
    }),
  })
}

