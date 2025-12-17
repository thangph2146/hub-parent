import { useResourceActions } from "@/features/admin/resources/hooks"
import { apiRoutes } from "@/lib/api/routes"
import { queryKeys } from "@/lib/query-keys"
import type { CategoryRow } from "../types"
import type { FeedbackVariant } from "@/components/dialogs"
import { CATEGORY_MESSAGES } from "../constants/messages"

interface UseCategoryActionsOptions {
  canDelete: boolean
  canRestore: boolean
  canManage: boolean
  isSocketConnected?: boolean
  showFeedback: (variant: FeedbackVariant, title: string, description?: string, details?: string) => void
}

export const useCategoryActions = ({
  canDelete,
  canRestore,
  canManage,
  isSocketConnected,
  showFeedback,
}: UseCategoryActionsOptions) =>
  useResourceActions<CategoryRow>({
    resourceName: "categories",
    queryKeys: {
      all: () => queryKeys.adminCategories.all(),
    },
    apiRoutes: {
      delete: (id) => apiRoutes.categories.delete(id),
      restore: (id) => apiRoutes.categories.restore(id),
      hardDelete: (id) => apiRoutes.categories.hardDelete(id),
      bulk: apiRoutes.categories.bulk,
    },
    messages: CATEGORY_MESSAGES,
    getRecordName: (row) => row.name,
    permissions: {
      canDelete,
      canRestore,
      canManage,
    },
    showFeedback,
    isSocketConnected,
    getLogMetadata: (row) => ({
      categoryId: row.id,
      categoryName: row.name,
    }),
  })

