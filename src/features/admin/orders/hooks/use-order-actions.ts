import { createResourceActionsHook, createApiRoutesConfig, createQueryKeysConfig } from "@/features/admin/resources/hooks/create-resource-actions"
import type { OrderRow } from "../types"
import { ORDER_MESSAGES } from "../constants/messages"

const useOrderActionsBase = createResourceActionsHook<OrderRow>({
  resourceName: "orders",
  queryKeyFn: createQueryKeysConfig("orders"),
  apiRoutes: createApiRoutesConfig("orders"),
  messages: ORDER_MESSAGES,
  getRecordName: (row) => row.orderNumber,
  getLogMetadata: (row) => ({
    orderId: row.id,
    orderNumber: row.orderNumber,
    customerName: row.customerName,
  }),
})

export { useOrderActionsBase as useOrderActions }

// Re-export type for convenience
export type UseOrderActionsOptions = Parameters<typeof useOrderActionsBase>[0]

