import { getActiveRoles, getUserDetailById } from "../server/queries"
import { serializeUserDetail } from "../server/helpers"
import { UserEditClient } from "./user-edit.client"
import type { UserEditClientProps } from "./user-edit.client"
import { NotFoundMessage } from "@/features/admin/resources/components"

export interface UserEditProps {
  userId: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
  variant?: "dialog" | "sheet" | "page"
  backUrl?: string
  backLabel?: string
}

export async function UserEdit({
  userId,
  open = true,
  onOpenChange,
  onSuccess,
  variant = "dialog",
  backUrl,
  backLabel = "Quay lại",
}: UserEditProps) {
  const [user, roles] = await Promise.all([
    getUserDetailById(userId),
    getActiveRoles(),
  ])

  if (!user) {
    return <NotFoundMessage resourceName="người dùng" />
  }

  const userForEdit: UserEditClientProps["user"] = {
    ...serializeUserDetail(user),
    roles: user.roles,
  }

  return (
    <UserEditClient
      user={userForEdit}
      open={open}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
      variant={variant}
      backUrl={backUrl}
      backLabel={backLabel}
      userId={userId}
      roles={roles}
    />
  )
}
