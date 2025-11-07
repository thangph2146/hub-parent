/**
 * Client Component: Session Edit Form
 * 
 * Handles form interactions, validation, và API calls
 * Pattern: Server Component → Client Component (UI/interactions)
 */

"use client"

import { ResourceForm } from "@/features/admin/resources/components"
import { useResourceFormSubmit } from "@/features/admin/resources/hooks"
import { apiRoutes } from "@/lib/api/routes"
import { getBaseSessionFields, getSessionFormSections, type SessionFormData } from "../form-fields"
import type { SessionRow } from "../types"

interface SessionEditData extends SessionRow {
  userId: string
  [key: string]: unknown
}

export interface SessionEditClientProps {
  session: SessionEditData | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
  variant?: "dialog" | "sheet" | "page"
  backUrl?: string
  backLabel?: string
  sessionId?: string
  users?: Array<{ label: string; value: string }>
}

export function SessionEditClient({
  session,
  open = true,
  onOpenChange,
  onSuccess,
  variant = "dialog",
  backUrl,
  backLabel = "Quay lại",
  sessionId: _sessionId,
  users: usersFromServer = [],
}: SessionEditClientProps) {
  const { handleSubmit } = useResourceFormSubmit({
    apiRoute: (id) => apiRoutes.sessions.update(id),
    method: "PUT",
    resourceId: session?.id,
    messages: {
      successTitle: "Cập nhật session thành công",
      successDescription: "Session đã được cập nhật thành công.",
      errorTitle: "Lỗi cập nhật session",
    },
    navigation: {
      toDetail: variant === "page" && backUrl
        ? backUrl
        : variant === "page" && session?.id
          ? `/admin/sessions/${session.id}`
          : undefined,
      fallback: backUrl,
    },
    onSuccess: async () => {
      if (onSuccess) {
        onSuccess()
      }
    },
  })

  if (!session?.id) {
    return null
  }

  const editFields = getBaseSessionFields(usersFromServer)
  const formSections = getSessionFormSections()

  return (
    <ResourceForm<SessionFormData>
      data={session}
      fields={editFields}
      sections={formSections}
      onSubmit={handleSubmit}
      title="Chỉnh sửa session"
      description="Cập nhật thông tin session"
      submitLabel="Lưu thay đổi"
      cancelLabel="Hủy"
      backUrl={backUrl}
      backLabel={backLabel}
      variant={variant}
      open={open}
      onOpenChange={onOpenChange}
      showCard={variant === "page" ? false : true}
      className={variant === "page" ? "max-w-[100%]" : undefined}
    />
  )
}

