/**
 * Server Component: Contact Request Edit
 * 
 * Fetches contact request data và users options, sau đó pass xuống client component
 * Pattern: Server Component (data fetching) → Client Component (UI/interactions)
 */

import { getContactRequestDetailById } from "../server/cache"
import { serializeContactRequestDetail } from "../server/helpers"
import { ContactRequestEditClient } from "./contact-request-edit.client"
import type { ContactRequestEditClientProps } from "./contact-request-edit.client"
import { getActiveUsersForSelectCached } from "@/features/admin/users/server/cache"

export interface ContactRequestEditProps {
  contactRequestId: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
  variant?: "dialog" | "sheet" | "page"
  backUrl?: string
  backLabel?: string
}

export async function ContactRequestEdit({
  contactRequestId,
  open = true,
  onOpenChange,
  onSuccess,
  variant = "dialog",
  backUrl,
  backLabel = "Quay lại",
}: ContactRequestEditProps) {
  const [contactRequest, usersOptions] = await Promise.all([
    getContactRequestDetailById(contactRequestId),
    getActiveUsersForSelectCached(100),
  ])

  if (!contactRequest) {
    return null
  }

  const contactRequestForEdit: ContactRequestEditClientProps["contactRequest"] = {
    ...serializeContactRequestDetail(contactRequest),
  }

  return (
    <ContactRequestEditClient
      contactRequest={contactRequestForEdit}
      open={open}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
      variant={variant}
      backUrl={backUrl}
      backLabel={backLabel}
      contactRequestId={contactRequestId}
      usersOptions={usersOptions}
    />
  )
}

