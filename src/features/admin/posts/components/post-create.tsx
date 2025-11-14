/**
 * Server Component: Post Create
 * 
 * Fetches users options với cached query, sau đó pass xuống client component
 * Pattern: Server Component (data fetching với cache) → Client Component (UI/interactions)
 */

import { PostCreateClient } from "./post-create.client"
import { getActiveUsersForSelectCached } from "@/features/admin/users/server/cache"
import { getAuthInfo } from "@/features/admin/resources/server"

export interface PostCreateProps {
  backUrl?: string
}

export async function PostCreate({ backUrl = "/admin/posts" }: PostCreateProps) {
  const { isSuperAdminUser } = await getAuthInfo()

  // Chỉ fetch users options nếu là super admin
  const usersOptions = isSuperAdminUser ? await getActiveUsersForSelectCached(100) : []

  return <PostCreateClient backUrl={backUrl} users={usersOptions} isSuperAdmin={isSuperAdminUser} />
}

