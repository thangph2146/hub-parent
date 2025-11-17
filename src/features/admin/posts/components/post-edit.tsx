/**
 * Server Component: Post Edit
 * 
 * Fetches post data và pass xuống client component
 * Pattern: Server Component (data fetching) → Client Component (UI/interactions)
 */

import { getPostDetailById } from "../server/cache"
import { serializePostDetail } from "../server/helpers"
import { PostEditClient } from "./post-edit.client"
import type { PostEditData } from "./post-edit.client"
import { NotFoundMessage } from "@/features/admin/resources/components"
import { getActiveUsersForSelectCached } from "@/features/admin/users/server/cache"
import { getActiveCategoriesForSelectCached } from "@/features/admin/categories/server/cache"
import { getActiveTagsForSelectCached } from "@/features/admin/tags/server/cache"
import { getAuthInfo } from "@/features/admin/resources/server"

export interface PostEditProps {
  postId: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
  variant?: "dialog" | "sheet" | "page"
  backUrl?: string
  backLabel?: string
}

export async function PostEdit({
  postId,
  open = true,
  onOpenChange,
  onSuccess,
  variant = "dialog",
  backUrl,
  backLabel = "Quay lại",
}: PostEditProps) {
  const post = await getPostDetailById(postId)

  if (!post) {
    return <NotFoundMessage resourceName="bài viết" />
  }

  const { isSuperAdminUser } = await getAuthInfo()
  
  // Fetch options in parallel
  const [usersOptions, categoriesOptions, tagsOptions] = await Promise.all([
    // Chỉ fetch users options nếu là super admin
    isSuperAdminUser ? getActiveUsersForSelectCached(100) : Promise.resolve([]),
    getActiveCategoriesForSelectCached(100),
    getActiveTagsForSelectCached(100),
  ])

  const postForEdit: PostEditData = {
    ...serializePostDetail(post),
    authorId: post.author.id,
    categoryIds: post.categories?.map((c) => c.id) || [],
    tagIds: post.tags?.map((t) => t.id) || [],
  }

  return (
    <PostEditClient
      post={postForEdit}
      open={open}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
      variant={variant}
      backUrl={backUrl}
      backLabel={backLabel}
      postId={postId}
      users={usersOptions}
      categories={categoriesOptions}
      tags={tagsOptions}
      isSuperAdmin={isSuperAdminUser}
    />
  )
}

