import { getCurrentUserProfile } from "../server/queries"
import { getAuthInfo } from "@/features/admin/resources/server"
import { AccountProfileClient } from "./account-profile.client"
import { NotFoundMessage } from "@/features/admin/resources/components"

export interface AccountProfileViewProps {
  variant?: "page" | "dialog" | "sheet"
}

export const AccountProfileView = async ({ variant = "page" }: AccountProfileViewProps) => {
  const authInfo = await getAuthInfo()

  if (!authInfo.actorId) {
    return (
      <NotFoundMessage
        resourceName="tài khoản"
        description="Bạn cần đăng nhập để xem thông tin tài khoản"
      />
    )
  }

  const account = await getCurrentUserProfile(authInfo.actorId)

  if (!account) {
    return <NotFoundMessage resourceName="tài khoản" />
  }

  return (
    <AccountProfileClient
      account={account}
      variant={variant}
    />
  )
}

