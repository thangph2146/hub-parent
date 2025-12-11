import { createResourceActionsHook, createApiRoutesConfig, createQueryKeysConfig } from "@/features/admin/resources/hooks/create-resource-actions"
import type { ProductRow } from "../types"
import { PRODUCT_MESSAGES } from "../constants/messages"

const useProductActionsBase = createResourceActionsHook<ProductRow>({
  resourceName: "products",
  queryKeyFn: createQueryKeysConfig("products"),
  apiRoutes: createApiRoutesConfig("products"),
  messages: PRODUCT_MESSAGES,
  getRecordName: (row) => row.name,
  getLogMetadata: (row) => ({
    productId: row.id,
    productName: row.name,
    productSku: row.sku,
  }),
})

export { useProductActionsBase as useProductActions }
export type { UseResourceActionsOptions as UseProductActionsOptions } from "@/features/admin/resources/hooks/create-resource-actions"

