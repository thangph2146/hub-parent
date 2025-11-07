/**
 * Client Component: User Edit Form
 * 
 * Handles form interactions, validation, và API calls
 * Pattern: Server Component → Client Component (UI/interactions)
 */

"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { ResourceForm, type ResourceFormField } from "@/features/admin/resources/components"
import { useResourceFormSubmit } from "@/features/admin/resources/hooks"
import { apiRoutes } from "@/lib/api/routes"
import { isSuperAdmin } from "@/lib/permissions"
import { useRoles } from "../hooks/use-roles"
import { normalizeRoleIds, type Role } from "../utils"
import { getBaseUserFields, getPasswordEditField } from "../form-fields"
import type { UserRow } from "../types"

interface UserEditData extends UserRow {
  avatar?: string | null
  bio?: string | null
  phone?: string | null
  address?: string | null
  roleIds?: string[] | string
  password?: string
  [key: string]: unknown
}

export interface UserEditClientProps {
  user: UserEditData | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
  variant?: "dialog" | "sheet" | "page"
  backUrl?: string
  backLabel?: string
  userId?: string
  roles?: Role[]
}

export function UserEditClient({
  user,
  open = true,
  onOpenChange,
  onSuccess,
  variant = "dialog",
  backUrl,
  backLabel = "Quay lại",
  userId,
  roles: rolesFromServer,
}: UserEditClientProps) {
  const { data: session } = useSession()
  const currentUserRoles = session?.roles || []
  const isSuperAdminUser = isSuperAdmin(currentUserRoles)
  const { roles } = useRoles({ initialRoles: rolesFromServer })
  const router = useRouter()

  const { handleSubmit } = useResourceFormSubmit({
    apiRoute: (id) => apiRoutes.users.update(id),
    method: "PUT",
    resourceId: user?.id,
    messages: {
      successTitle: "Cập nhật thành công",
      successDescription: "Thông tin người dùng đã được cập nhật.",
      errorTitle: "Lỗi cập nhật",
    },
    navigation: {
      toDetail: variant === "page" && userId ? `/admin/users/${userId}` : undefined,
      fallback: backUrl,
    },
    transformData: (data) => {
      const submitData: Record<string, unknown> = {
        ...data,
        roleIds: normalizeRoleIds(data.roleIds),
      }
      // Remove password if empty
      if (!submitData.password || submitData.password === "") {
        delete submitData.password
      }
      return submitData
    },
    onSuccess: async () => {
      onSuccess?.()
      if (variant === "page" && userId) {
        router.refresh()
      }
    },
  })

  if (!user?.id) {
    return null
  }

  const userForEdit: UserEditData | null = user
    ? {
        ...user,
        roleIds: user.roles && user.roles.length > 0 ? user.roles[0].id : "",
      }
    : null

  const roleDefaultValue = typeof userForEdit?.roleIds === "string" ? userForEdit.roleIds : ""
  const editFields = [
    ...(getBaseUserFields(roles, roleDefaultValue) as unknown as ResourceFormField<UserEditData>[]),
    ...(isSuperAdminUser ? [getPasswordEditField() as unknown as ResourceFormField<UserEditData>] : []),
  ]

  return (
    <ResourceForm<UserEditData>
      data={userForEdit}
      fields={editFields}
      onSubmit={handleSubmit}
      open={open}
      onOpenChange={onOpenChange}
      variant={variant}
      title="Chỉnh sửa người dùng"
      description="Cập nhật thông tin người dùng"
      submitLabel="Lưu thay đổi"
      cancelLabel="Hủy"
      backUrl={backUrl}
      backLabel={backLabel}
      onSuccess={onSuccess}
      showCard={false}
      className="max-w-[100%]"
    />
  )
}

