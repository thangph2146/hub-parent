/**
 * Server Component: Post Create
 * 
 * Fetches users options với cached query, sau đó pass xuống client component
 * Pattern: Server Component (data fetching với cache) → Client Component (UI/interactions)
 */

import { PostCreateClient } from "./post-create.client"
import { getActiveUsersForSelectCached } from "@/features/admin/users/server/cache"
import { getActiveCategoriesForSelectCached } from "@/features/admin/categories/server/cache"
import { getActiveTagsForSelectCached } from "@/features/admin/tags/server/cache"
import { getAuthInfo } from "@/features/admin/resources/server"

export interface PostCreateProps {
  backUrl?: string
}

export async function PostCreate({ backUrl = "/admin/posts" }: PostCreateProps) {
  const { isSuperAdminUser } = await getAuthInfo()

  // Fetch options in parallel
  const [usersOptions, categoriesOptions, tagsOptions] = await Promise.all([
    // Chỉ fetch users options nếu là super admin
    isSuperAdminUser ? getActiveUsersForSelectCached(100) : Promise.resolve([]),
    getActiveCategoriesForSelectCached(100),
    getActiveTagsForSelectCached(100),
  ])

  return (
    <PostCreateClient
      backUrl={backUrl}
      users={usersOptions}
      categories={categoriesOptions}
      tags={tagsOptions}
      isSuperAdmin={isSuperAdminUser}
    />
  )
}

