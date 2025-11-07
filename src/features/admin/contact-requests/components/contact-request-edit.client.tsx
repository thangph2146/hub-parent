/**
 * Client Component: Contact Request Edit Form
 * 
 * Handles form interactions, validation, và API calls
 * Pattern: Server Component → Client Component (UI/interactions)
 */

"use client"

import { ResourceForm } from "@/features/admin/resources/components"
import { useResourceFormSubmit } from "@/features/admin/resources/hooks"
import { apiRoutes } from "@/lib/api/routes"
import { getBaseContactRequestFields, type ContactRequestFormData } from "../form-fields"
import type { ContactStatus, ContactPriority } from "../types"

interface ContactRequestEditData {
  id: string
  name: string
  email: string
  phone: string | null
  subject: string
  content: string
  status: ContactStatus
  priority: ContactPriority
  isRead: boolean
  assignedToId: string | null
  updatedAt: string
  [key: string]: unknown
}

export interface ContactRequestEditClientProps {
  contactRequest: ContactRequestEditData | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
  variant?: "dialog" | "sheet" | "page"
  backUrl?: string
  backLabel?: string
  contactRequestId?: string
  usersOptions?: Array<{ label: string; value: string }>
}

export function ContactRequestEditClient({
  contactRequest,
  open = true,
  onOpenChange,
  onSuccess,
  variant = "dialog",
  backUrl,
  backLabel = "Quay lại",
  contactRequestId: _contactRequestId,
  usersOptions = [],
}: ContactRequestEditClientProps) {
  const { handleSubmit } = useResourceFormSubmit({
    apiRoute: (id) => apiRoutes.contactRequests.update(id),
    method: "PUT",
    resourceId: contactRequest?.id,
    messages: {
      successTitle: "Cập nhật yêu cầu liên hệ thành công",
      successDescription: "Yêu cầu liên hệ đã được cập nhật thành công.",
      errorTitle: "Lỗi cập nhật yêu cầu liên hệ",
    },
    navigation: {
      toDetail: variant === "page" && backUrl
        ? backUrl
        : variant === "page" && contactRequest?.id
          ? `/admin/contact-requests/${contactRequest.id}`
          : undefined,
      fallback: backUrl,
    },
    onSuccess: async () => {
      if (onSuccess) {
        onSuccess()
      }
    },
  })

  if (!contactRequest?.id) {
    return null
  }

  const editFields = getBaseContactRequestFields(usersOptions)

  return (
    <ResourceForm<ContactRequestFormData>
      data={contactRequest}
      fields={editFields}
      onSubmit={handleSubmit}
      title="Chỉnh sửa yêu cầu liên hệ"
      description={`Cập nhật thông tin yêu cầu liên hệ: ${contactRequest.subject}`}
      submitLabel="Cập nhật"
      cancelLabel="Hủy"
      backUrl={backUrl}
      backLabel={backLabel}
      variant={variant}
      open={open}
      onOpenChange={onOpenChange}
      showCard={variant === "page" ? false : true}
      className={variant === "page" ? "max-w-[100%]" : "max-w-[800px]"}
    />
  )
}

