import { useResourceActions } from "@/features/admin/resources/hooks"
import { apiRoutes } from "@/lib/api/routes"
import { queryKeys } from "@/lib/query-keys"
import type { OrderRow } from "../types"
import type { FeedbackVariant } from "@/components/dialogs"
import { ORDER_MESSAGES } from "../constants/messages"

interface UseOrderActionsOptions {
  canDelete: boolean
  canRestore: boolean
  canManage: boolean
  showFeedback: (variant: FeedbackVariant, title: string, description?: string, details?: string) => void
}

export function useOrderActions({
  canDelete,
  canRestore,
  canManage,
  showFeedback,
}: UseOrderActionsOptions) {
  return useResourceActions<OrderRow>({
    resourceName: "orders",
    queryKeys: {
      all: () => queryKeys.adminOrders.all(),
    },
    apiRoutes: {
      delete: (id) => apiRoutes.orders.delete(id),
      restore: (id) => apiRoutes.orders.restore(id),
      hardDelete: (id) => apiRoutes.orders.hardDelete(id),
      bulk: apiRoutes.orders.bulk,
    },
    messages: ORDER_MESSAGES,
    getRecordName: (row) => row.orderNumber,
    permissions: {
      canDelete,
      canRestore,
      canManage,
    },
    showFeedback,
    getLogMetadata: (row) => ({
      orderId: row.id,
      orderNumber: row.orderNumber,
      customerName: row.customerName,
    }),
  })
}

