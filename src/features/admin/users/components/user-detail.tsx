/**
 * Server Component: User Detail
 * 
 * Fetches user data và pass xuống client component
 * Pattern: Server Component (data fetching) → Client Component (UI/interactions)
 */

import { getUserDetailById } from "../server/cache"
import { serializeUserDetail } from "../server/helpers"
import { UserDetailClient } from "./user-detail.client"
import type { UserDetailData } from "./user-detail.client"
import { NotFoundMessage } from "@/features/admin/resources/components"

export interface UserDetailProps {
  userId: string
  backUrl?: string
}

export async function UserDetail({ userId, backUrl = "/admin/users" }: UserDetailProps) {
  const user = await getUserDetailById(userId)

  if (!user) {
    return <NotFoundMessage resourceName="người dùng" />
  }

  return (
    <UserDetailClient
      userId={userId}
      user={serializeUserDetail(user) as UserDetailData}
      backUrl={backUrl}
    />
  )
}
