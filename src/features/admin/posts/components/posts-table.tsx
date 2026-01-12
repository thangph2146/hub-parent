
import { listPosts } from "../server/queries"
import { serializePostsList } from "../server/helpers"
import { PostsTableClient } from "./posts-table.client"
import { requireAuth, getPermissions } from "@/auth"
import { PERMISSIONS, hasPermission } from "@/permissions"
import { logger } from "@/utils"

export interface PostsTableProps {
  canDelete?: boolean
  canRestore?: boolean
  canManage?: boolean
  canCreate?: boolean
}

export async function PostsTable({ canDelete, canRestore, canManage, canCreate }: PostsTableProps) {
  // Get session and permissions for filtering
  const session = await requireAuth()
  const permissions = await getPermissions()
  
  // Kiểm tra permission: nếu có POSTS_VIEW_ALL thì xem tất cả, nếu chỉ có POSTS_VIEW_OWN thì chỉ xem của mình
  const hasViewAllPermission = hasPermission(permissions, PERMISSIONS.POSTS_VIEW_ALL)
  const hasViewOwnPermission = hasPermission(permissions, PERMISSIONS.POSTS_VIEW_OWN)
  
  const filters: Record<string, string> = {}
  
  logger.debug("[Posts Table Server] Permission check", {
    userId: session?.user?.id,
    email: session?.user?.email,
    hasViewAllPermission,
    hasViewOwnPermission,
    permissions: permissions.filter((p) => p.includes("posts:view")),
  })
  
  // Nếu chỉ có POSTS_VIEW_OWN (không có POSTS_VIEW_ALL), filter theo authorId của user đang đăng nhập
  if (!hasViewAllPermission && hasViewOwnPermission && session?.user?.id) {
    filters.authorId = session.user.id
    logger.info("[Posts Table Server] Applied authorId filter", {
      userId: session.user.id,
      reason: "User has POSTS_VIEW_OWN but not POSTS_VIEW_ALL",
    })
  } else if (hasViewAllPermission) {
    logger.debug("[Posts Table Server] No filter applied", {
      reason: "User has POSTS_VIEW_ALL permission",
    })
  }
  
  const postsData = await listPosts({
    page: 1,
    limit: 10,
    status: "active",
    filters: Object.keys(filters).length > 0 ? filters : undefined,
  })

  return (
    <PostsTableClient
      canDelete={canDelete}
      canRestore={canRestore}
      canManage={canManage}
      canCreate={canCreate}
      initialData={serializePostsList(postsData)}
    />
  )
}

