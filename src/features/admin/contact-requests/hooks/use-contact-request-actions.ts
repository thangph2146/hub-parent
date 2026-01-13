import { createResourceActionsHook } from "@/features/admin/resources/hooks"
import type { ContactRequestRow } from "../types"
import { CONTACT_REQUEST_MESSAGES } from "../constants/messages"
import { apiRoutes, queryKeys } from "@/constants"

export const useContactRequestActions = createResourceActionsHook<ContactRequestRow>({
  resourceName: "contact-requests",
  messages: CONTACT_REQUEST_MESSAGES,
  getRecordName: (row) => row.subject,
  getLogMetadata: (row) => ({
    contactRequestId: row.id,
    subject: row.subject,
    email: row.email,
  }),
  customApiRoutes: {
    delete: (id) => apiRoutes.contactRequests.delete(id),
    restore: (id) => apiRoutes.contactRequests.restore(id),
    hardDelete: (id) => apiRoutes.contactRequests.hardDelete(id),
    bulk: apiRoutes.contactRequests.bulk,
  },
  customQueryKeys: {
    all: () => queryKeys.adminContactRequests.all(),
  },
})


