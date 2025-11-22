"use server"

import type { Prisma } from "@prisma/client"
import { revalidatePath, revalidateTag, updateTag } from "next/cache"
import { PERMISSIONS } from "@/lib/permissions"
import { isSuperAdmin } from "@/lib/permissions"
import { prisma } from "@/lib/database"
import { resourceLogger } from "@/lib/config"
import { mapPostRecord, type PostWithAuthor } from "./helpers"
import {
  ApplicationError,
  ForbiddenError,
  NotFoundError,
  ensurePermission,
  invalidateResourceCache,
  invalidateResourceCacheBulk,
  type AuthContext,
} from "@/features/admin/resources/server"
import { emitPostUpsert, emitPostRemove, type PostStatus } from "./events"
import { createPostSchema, updatePostSchema, type CreatePostSchema, type UpdatePostSchema } from "./validation"
import { notifySuperAdminsOfPostAction, notifySuperAdminsOfBulkPostAction } from "./notifications"

// Re-export for backward compatibility with API routes
export { ApplicationError, ForbiddenError, NotFoundError, type AuthContext }

export interface BulkActionResult {
  success: boolean
  message: string
  affected: number
}

function sanitizePost(post: PostWithAuthor) {
  return mapPostRecord(post)
}

export async function createPost(ctx: AuthContext, input: CreatePostSchema) {
  resourceLogger.actionFlow({
    resource: "posts",
    action: "create",
    step: "start",
    metadata: { actorId: ctx.actorId },
  })

  ensurePermission(ctx, PERMISSIONS.POSTS_CREATE, PERMISSIONS.POSTS_MANAGE)

  const validated = createPostSchema.parse(input)

  // Chỉ super admin mới được chọn tác giả khác, user khác chỉ được set là chính mình
  const isSuperAdminUser = isSuperAdmin(ctx.roles)
  if (!isSuperAdminUser && validated.authorId !== ctx.actorId) {
    throw new ForbiddenError("Bạn không có quyền tạo bài viết cho người khác")
  }

  // Check if slug already exists
  const existing = await prisma.post.findUnique({ where: { slug: validated.slug } })
  if (existing) {
    throw new ApplicationError("Slug đã tồn tại", 400)
  }

  // If published, set publishedAt to now if not provided
  const publishedAt = validated.published && !validated.publishedAt ? new Date() : validated.publishedAt

  // Create post with categories and tags using transaction
  const post = await prisma.$transaction(async (tx) => {
    // Create post first
    const createdPost = await tx.post.create({
      data: {
        title: validated.title,
        content: validated.content as Prisma.InputJsonValue,
        excerpt: validated.excerpt,
        slug: validated.slug,
        image: validated.image,
        published: validated.published ?? false,
        publishedAt: publishedAt,
        authorId: validated.authorId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Create categories if provided
    if (validated.categoryIds && validated.categoryIds.length > 0) {
      await tx.postCategory.createMany({
        data: validated.categoryIds.map((categoryId) => ({
          postId: createdPost.id,
          categoryId,
        })),
        skipDuplicates: true,
      })
    }

    // Create tags if provided
    if (validated.tagIds && validated.tagIds.length > 0) {
      await tx.postTag.createMany({
        data: validated.tagIds.map((tagId) => ({
          postId: createdPost.id,
          tagId,
        })),
        skipDuplicates: true,
      })
    }

    return createdPost
  })

  const sanitized = sanitizePost(post as PostWithAuthor)

  // Invalidate admin cache
  await invalidateResourceCache({
    resource: "posts",
    id: sanitized.id,
    additionalTags: ["active-posts"],
  })

  resourceLogger.cache({
    resource: "posts",
    action: "cache-invalidate",
    operation: "invalidate",
    resourceId: sanitized.id,
    additionalTags: ["active-posts"],
  })

  // Emit socket event for real-time updates
  await emitPostUpsert(sanitized.id, null)

  resourceLogger.socket({
    resource: "posts",
    event: "post:upsert",
    action: "socket-update",
    resourceId: sanitized.id,
    payload: { postId: sanitized.id, previousStatus: null },
  })

  // Notify super admins
  await notifySuperAdminsOfPostAction("create", ctx.actorId, {
    id: sanitized.id,
    title: sanitized.title,
    slug: sanitized.slug,
  })

  resourceLogger.actionFlow({
    resource: "posts",
    action: "create",
    step: "success",
    metadata: { postId: sanitized.id, postTitle: sanitized.title },
  })

  return sanitized
}

export async function updatePost(
  ctx: AuthContext,
  postId: string,
  input: UpdatePostSchema
) {
  resourceLogger.actionFlow({
    resource: "posts",
    action: "update",
    step: "start",
    metadata: { postId, actorId: ctx.actorId },
  })

  ensurePermission(ctx, PERMISSIONS.POSTS_UPDATE, PERMISSIONS.POSTS_MANAGE)

  const validated = updatePostSchema.parse(input)

  const existing = await prisma.post.findUnique({ where: { id: postId } })
  if (!existing) {
    resourceLogger.actionFlow({
      resource: "posts",
      action: "update",
      step: "error",
      metadata: { postId, error: "Post not found" },
    })
    throw new NotFoundError("Bài viết không tồn tại")
  }

  // Track changes for notification
  const changes: {
    title?: { old: string; new: string }
    published?: { old: boolean; new: boolean }
  } = {}
  if (validated.title !== undefined && validated.title !== existing.title) {
    changes.title = { old: existing.title, new: validated.title }
  }
  if (validated.published !== undefined && validated.published !== existing.published) {
    changes.published = { old: existing.published, new: validated.published }
  }

  // Chỉ super admin mới được thay đổi tác giả, user khác không được phép
  const isSuperAdminUser = isSuperAdmin(ctx.roles)
  if (validated.authorId !== undefined) {
    if (!isSuperAdminUser) {
      throw new ForbiddenError("Bạn không có quyền thay đổi tác giả bài viết")
    }
    // Super admin có thể thay đổi tác giả
  }

  // Check if slug is being changed and if new slug already exists
  if (validated.slug && validated.slug !== existing.slug) {
    const slugExists = await prisma.post.findUnique({ where: { slug: validated.slug } })
    if (slugExists) {
      throw new ApplicationError("Slug đã tồn tại", 400)
    }
  }

  // If published is being set to true and publishedAt is not set, set it to now
  let publishedAt = validated.publishedAt
  if (validated.published === true && !existing.publishedAt && !publishedAt) {
    publishedAt = new Date()
  } else if (validated.published === false) {
    publishedAt = null
  } else if (validated.published === true && existing.publishedAt && !publishedAt) {
    publishedAt = existing.publishedAt
  }

  const updateData: Prisma.PostUpdateInput = {}
  
  if (validated.title !== undefined) updateData.title = validated.title
  if (validated.content !== undefined) updateData.content = validated.content as Prisma.InputJsonValue
  if (validated.excerpt !== undefined) updateData.excerpt = validated.excerpt
  if (validated.slug !== undefined) updateData.slug = validated.slug
  if (validated.image !== undefined) updateData.image = validated.image
  if (validated.published !== undefined) updateData.published = validated.published
  if (publishedAt !== undefined) updateData.publishedAt = publishedAt
  if (validated.authorId !== undefined && isSuperAdminUser) {
    // Update author relation using connect
    updateData.author = {
      connect: { id: validated.authorId },
    }
  }

  // Handle categories and tags update using transaction
  const post = await prisma.$transaction(async (tx) => {
    // Update post basic fields
    const updatedPost = await tx.post.update({
      where: { id: postId },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Handle categories update
    if (validated.categoryIds !== undefined) {
      // Delete existing categories
      await tx.postCategory.deleteMany({
        where: { postId },
      })
      // Create new categories
      if (validated.categoryIds.length > 0) {
        await tx.postCategory.createMany({
          data: validated.categoryIds.map((categoryId) => ({
            postId,
            categoryId,
          })),
          skipDuplicates: true,
        })
      }
    }

    // Handle tags update
    if (validated.tagIds !== undefined) {
      // Delete existing tags
      await tx.postTag.deleteMany({
        where: { postId },
      })
      // Create new tags
      if (validated.tagIds.length > 0) {
        await tx.postTag.createMany({
          data: validated.tagIds.map((tagId) => ({
            postId,
            tagId,
          })),
          skipDuplicates: true,
        })
      }
    }

    return updatedPost
  })

  const sanitized = sanitizePost(post as PostWithAuthor)

  // Invalidate admin cache - QUAN TRỌNG: phải invalidate detail page để cập nhật ngay
  await invalidateResourceCache({
    resource: "posts",
    id: postId,
    additionalTags: ["active-posts"],
  })

  resourceLogger.cache({
    resource: "posts",
    action: "cache-invalidate",
    operation: "invalidate",
    resourceId: postId,
    additionalTags: ["active-posts"],
  })

  // Revalidate public cache nếu bài viết đã được publish
  if (post.published && post.publishedAt) {
    // Update tags immediately (read-your-own-writes semantics)
    // Chỉ hoạt động trong Server Actions, wrap trong try-catch để không fail khi gọi từ Route Handlers
    try {
      updateTag(`post-${post.slug}`)
      updateTag("categories") // Categories cũng có thể thay đổi
      if (validated.slug && validated.slug !== existing.slug) {
        updateTag(`post-${existing.slug}`)
      }
    } catch {
      // updateTag chỉ hoạt động trong Server Actions, ignore nếu không phải
    }
    
    // Revalidate slug cũ nếu slug đã thay đổi
    if (validated.slug && validated.slug !== existing.slug) {
      revalidatePath(`/bai-viet/${existing.slug}`, "page")
    }
    
    // Revalidate tags để purge cache (async)
    // Hoạt động trong cả Server Actions và Route Handlers
    revalidateTag(`post-${post.slug}`, "default")
    revalidateTag("categories", "default")
    if (validated.slug && validated.slug !== existing.slug) {
      revalidateTag(`post-${existing.slug}`, "default")
    }
    
    // Revalidate public paths
    revalidatePath("/bai-viet", "page")
    revalidatePath("/bai-viet", "layout")
    revalidatePath(`/bai-viet/${post.slug}`, "page")
  } else if (existing.published && existing.publishedAt) {
    // Nếu bài viết đã được unpublish, vẫn cần revalidate để xóa khỏi public
    updateTag(`post-${existing.slug}`)
    revalidateTag(`post-${existing.slug}`, "default")
    revalidatePath("/bai-viet", "page")
    revalidatePath(`/bai-viet/${existing.slug}`, "page")
  }

  // Determine previous status for socket event
  const previousStatus: "active" | "deleted" | null = existing.deletedAt ? "deleted" : "active"

  // Emit socket event for real-time updates
  await emitPostUpsert(sanitized.id, previousStatus)

  resourceLogger.socket({
    resource: "posts",
    event: "post:upsert",
    action: "socket-update",
    resourceId: sanitized.id,
    payload: { postId: sanitized.id, previousStatus },
  })

  // Notify super admins
  await notifySuperAdminsOfPostAction("update", ctx.actorId, {
    id: sanitized.id,
    title: sanitized.title,
    slug: sanitized.slug,
  }, Object.keys(changes).length > 0 ? changes : undefined)

  resourceLogger.actionFlow({
    resource: "posts",
    action: "update",
    step: "success",
    metadata: { postId: sanitized.id, postTitle: sanitized.title, changes: Object.keys(changes) },
  })

  return sanitized
}

export async function deletePost(ctx: AuthContext, postId: string) {
  resourceLogger.actionFlow({
    resource: "posts",
    action: "delete",
    step: "start",
    metadata: { postId, actorId: ctx.actorId },
  })

  ensurePermission(ctx, PERMISSIONS.POSTS_DELETE, PERMISSIONS.POSTS_MANAGE)

  const existing = await prisma.post.findUnique({ where: { id: postId } })
  if (!existing) {
    resourceLogger.actionFlow({
      resource: "posts",
      action: "delete",
      step: "error",
      metadata: { postId, error: "Post not found" },
    })
    throw new NotFoundError("Bài viết không tồn tại")
  }

  await prisma.post.update({
    where: { id: postId },
    data: { deletedAt: new Date() },
  })

  // Invalidate admin cache
  await invalidateResourceCache({
    resource: "posts",
    id: postId,
    additionalTags: ["active-posts"],
  })

  resourceLogger.cache({
    resource: "posts",
    action: "cache-invalidate",
    operation: "invalidate",
    resourceId: postId,
    additionalTags: ["active-posts"],
  })

  // Revalidate public cache nếu bài viết đã được publish
  if (existing.published && existing.publishedAt) {
    try {
      updateTag(`post-${existing.slug}`)
    } catch {
      // updateTag chỉ hoạt động trong Server Actions, ignore nếu không phải
    }
    revalidateTag(`post-${existing.slug}`, "default")
    revalidatePath("/bai-viet", "page")
    revalidatePath(`/bai-viet/${existing.slug}`, "page")
  }

  // Emit socket event for real-time updates
  await emitPostUpsert(postId, "active")

  resourceLogger.socket({
    resource: "posts",
    event: "post:upsert",
    action: "socket-update",
    resourceId: postId,
    payload: { postId, previousStatus: "active" },
  })

  // Notify super admins
  await notifySuperAdminsOfPostAction("delete", ctx.actorId, {
    id: postId,
    title: existing.title,
    slug: existing.slug,
  })

  resourceLogger.actionFlow({
    resource: "posts",
    action: "delete",
    step: "success",
    metadata: { postId, postTitle: existing.title },
  })

  return { success: true }
}

export async function restorePost(ctx: AuthContext, postId: string) {
  resourceLogger.actionFlow({
    resource: "posts",
    action: "restore",
    step: "start",
    metadata: { postId, actorId: ctx.actorId },
  })

  ensurePermission(ctx, PERMISSIONS.POSTS_UPDATE, PERMISSIONS.POSTS_MANAGE)

  const existing = await prisma.post.findUnique({ where: { id: postId } })
  if (!existing) {
    resourceLogger.actionFlow({
      resource: "posts",
      action: "restore",
      step: "error",
      metadata: { postId, error: "Post not found" },
    })
    throw new NotFoundError("Bài viết không tồn tại")
  }

  await prisma.post.update({
    where: { id: postId },
    data: { deletedAt: null },
  })

  // Invalidate admin cache
  await invalidateResourceCache({
    resource: "posts",
    id: postId,
    additionalTags: ["active-posts"],
  })

  resourceLogger.cache({
    resource: "posts",
    action: "cache-invalidate",
    operation: "invalidate",
    resourceId: postId,
    additionalTags: ["active-posts"],
  })

  // Revalidate public cache nếu bài viết đã được publish
  if (existing.published && existing.publishedAt) {
    try {
      updateTag(`post-${existing.slug}`)
    } catch {
      // updateTag chỉ hoạt động trong Server Actions, ignore nếu không phải
    }
    revalidateTag(`post-${existing.slug}`, "default")
    revalidatePath("/bai-viet", "page")
    revalidatePath(`/bai-viet/${existing.slug}`, "page")
  }

  // Emit socket event for real-time updates
  await emitPostUpsert(postId, "deleted")

  resourceLogger.socket({
    resource: "posts",
    event: "post:upsert",
    action: "socket-update",
    resourceId: postId,
    payload: { postId, previousStatus: "deleted" },
  })

  // Notify super admins
  await notifySuperAdminsOfPostAction("restore", ctx.actorId, {
    id: postId,
    title: existing.title,
    slug: existing.slug,
  })

  resourceLogger.actionFlow({
    resource: "posts",
    action: "restore",
    step: "success",
    metadata: { postId, postTitle: existing.title },
  })

  return { success: true }
}

export async function hardDeletePost(ctx: AuthContext, postId: string) {
  resourceLogger.actionFlow({
    resource: "posts",
    action: "hard-delete",
    step: "start",
    metadata: { postId, actorId: ctx.actorId },
  })

  ensurePermission(ctx, PERMISSIONS.POSTS_MANAGE)

  const existing = await prisma.post.findUnique({ where: { id: postId } })
  if (!existing) {
    resourceLogger.actionFlow({
      resource: "posts",
      action: "hard-delete",
      step: "error",
      metadata: { postId, error: "Post not found" },
    })
    throw new NotFoundError("Bài viết không tồn tại")
  }

  // Determine previous status before deletion
  const previousStatus: "active" | "deleted" = existing.deletedAt ? "deleted" : "active"

  await prisma.post.delete({ where: { id: postId } })

  // Invalidate admin cache
  await invalidateResourceCache({
    resource: "posts",
    id: postId,
    additionalTags: ["active-posts"],
  })

  resourceLogger.cache({
    resource: "posts",
    action: "cache-invalidate",
    operation: "invalidate",
    resourceId: postId,
    additionalTags: ["active-posts"],
  })

  // Revalidate public cache nếu bài viết đã được publish
  if (existing.published && existing.publishedAt) {
    try {
      updateTag(`post-${existing.slug}`)
    } catch {
      // updateTag chỉ hoạt động trong Server Actions, ignore nếu không phải
    }
    revalidateTag(`post-${existing.slug}`, "default")
    revalidatePath("/bai-viet", "page")
    revalidatePath(`/bai-viet/${existing.slug}`, "page")
  }

  // Emit socket event for real-time updates
  emitPostRemove(postId, previousStatus)

  resourceLogger.socket({
    resource: "posts",
    event: "post:remove",
    action: "socket-update",
    resourceId: postId,
    payload: { postId, previousStatus },
  })

  // Notify super admins
  await notifySuperAdminsOfPostAction("hard-delete", ctx.actorId, {
    id: postId,
    title: existing.title,
    slug: existing.slug,
  })

  resourceLogger.actionFlow({
    resource: "posts",
    action: "hard-delete",
    step: "success",
    metadata: { postId, postTitle: existing.title },
  })

  return { success: true }
}

export async function bulkPostsAction(
  ctx: AuthContext,
  action: "delete" | "restore" | "hard-delete",
  postIds: string[]
): Promise<BulkActionResult> {
  const actionType = action === "delete" ? "bulk-delete" : action === "restore" ? "bulk-restore" : "bulk-hard-delete"
  
  resourceLogger.actionFlow({
    resource: "posts",
    action: actionType,
    step: "start",
    metadata: { count: postIds.length, postIds, actorId: ctx.actorId },
  })

  if (action === "hard-delete") {
    ensurePermission(ctx, PERMISSIONS.POSTS_MANAGE)
  } else if (action === "delete") {
    ensurePermission(ctx, PERMISSIONS.POSTS_DELETE, PERMISSIONS.POSTS_MANAGE)
  } else {
    ensurePermission(ctx, PERMISSIONS.POSTS_UPDATE, PERMISSIONS.POSTS_MANAGE)
  }

  if (postIds.length === 0) {
    resourceLogger.actionFlow({
      resource: "posts",
      action: actionType,
      step: "error",
      metadata: { error: "No posts selected" },
    })
    throw new ApplicationError("Không có bài viết nào được chọn", 400)
  }

  let count = 0
  let posts: Array<{ id: string; deletedAt: Date | null; slug: string; published: boolean; publishedAt: Date | null; title?: string }> = []

  if (action === "delete") {
    // Lấy thông tin posts trước khi delete để emit socket events và revalidate cache
    posts = await prisma.post.findMany({
      where: {
        id: { in: postIds },
        deletedAt: null,
      },
      select: { id: true, deletedAt: true, slug: true, published: true, publishedAt: true, title: true },
    })

    count = (
      await prisma.post.updateMany({
        where: { id: { in: postIds }, deletedAt: null },
        data: { deletedAt: new Date() },
      })
    ).count

    // Batch emit thay vì từng record
    if (count > 0) {
      const { emitBatchPostUpsert } = await import("./events")
      await emitBatchPostUpsert(posts.map(p => p.id), "active")
    }
  } else if (action === "restore") {
    // Tìm tất cả posts được request để phân loại trạng thái
    const allRequestedPosts = await prisma.post.findMany({
      where: {
        id: { in: postIds },
      },
      select: { id: true, deletedAt: true, slug: true, published: true, publishedAt: true, createdAt: true, title: true },
    })

    // Phân loại posts
    const softDeletedPosts = allRequestedPosts.filter((post) => post.deletedAt !== null)
    const activePosts = allRequestedPosts.filter((post) => post.deletedAt === null)
    const notFoundCount = postIds.length - allRequestedPosts.length

    // Log chi tiết để debug
    resourceLogger.actionFlow({
      resource: "posts",
      action: actionType,
      step: "start",
      metadata: {
        requested: postIds.length,
        found: allRequestedPosts.length,
        softDeleted: softDeletedPosts.length,
        active: activePosts.length,
        notFound: notFoundCount,
      },
    })

    // Nếu không có post nào đã bị soft delete, trả về message chi tiết
    if (softDeletedPosts.length === 0) {
      const parts: string[] = []
      if (activePosts.length > 0) {
        parts.push(`${activePosts.length} bài viết đang hoạt động`)
      }
      if (notFoundCount > 0) {
        parts.push(`${notFoundCount} bài viết không tồn tại (đã bị xóa vĩnh viễn)`)
      }

      const message = parts.length > 0
        ? `Không có bài viết nào để khôi phục (${parts.join(", ")})`
        : `Không tìm thấy bài viết nào để khôi phục`

      return { 
        success: true, 
        message, 
        affected: 0,
      }
    }

    // Chỉ restore các posts đã bị soft delete
    posts = softDeletedPosts
    count = (
      await prisma.post.updateMany({
        where: { 
          id: { in: softDeletedPosts.map((p) => p.id) },
          deletedAt: { not: null },
        },
        data: { deletedAt: null },
      })
    ).count

    // Batch emit thay vì từng record
    if (count > 0) {
      const { emitBatchPostUpsert } = await import("./events")
      await emitBatchPostUpsert(posts.map(p => p.id), "deleted")
    }
  } else if (action === "hard-delete") {
    // Lấy thông tin posts trước khi delete để emit socket events và revalidate cache
    posts = await prisma.post.findMany({
      where: {
        id: { in: postIds },
      },
      select: { id: true, deletedAt: true, slug: true, published: true, publishedAt: true, title: true },
    })

    count = (
      await prisma.post.deleteMany({
        where: { id: { in: postIds } },
      })
    ).count

    // Emit batch remove events
    if (count > 0) {
      const { getSocketServer } = await import("@/lib/socket/state")
      const io = getSocketServer()
      if (io) {
        const removeEvents = posts.map((post) => ({
          id: post.id,
          previousStatus: (post.deletedAt ? "deleted" : "active") as PostStatus,
        }))
        io.to("role:super_admin").emit("post:batch-remove", { posts: removeEvents })
      }
    }
  }

  // Invalidate admin cache cho bulk operation
  await invalidateResourceCacheBulk({
    resource: "posts",
    additionalTags: ["active-posts"],
  })

  resourceLogger.cache({
    resource: "posts",
    action: "cache-invalidate",
    operation: "invalidate",
    additionalTags: ["active-posts"],
  })

  // Revalidate public cache cho các posts đã được publish
  const publishedPosts = posts.filter((post) => post.published && post.publishedAt)
  if (publishedPosts.length > 0) {
    // Update tags immediately (read-your-own-writes semantics)
    // Chỉ hoạt động trong Server Actions, wrap trong try-catch để không fail khi gọi từ Route Handlers
    try {
      publishedPosts.forEach((post) => {
        updateTag(`post-${post.slug}`)
      })
    } catch {
      // updateTag chỉ hoạt động trong Server Actions, ignore nếu không phải
    }
    // Revalidate tags để purge cache (async)
    // Hoạt động trong cả Server Actions và Route Handlers
    await Promise.all(
      publishedPosts.map((post) => revalidateTag(`post-${post.slug}`, "default"))
    )
    // Revalidate từng post path
    publishedPosts.forEach((post) => {
      revalidatePath(`/bai-viet/${post.slug}`, "page")
    })
    // Revalidate list page
    revalidatePath("/bai-viet", "page")
  }

  // Build success message với số lượng thực tế đã xử lý
  let successMessage = ""
  if (action === "restore") {
    successMessage = `Đã khôi phục ${count} bài viết`
  } else if (action === "delete") {
    successMessage = `Đã xóa ${count} bài viết`
  } else if (action === "hard-delete") {
    successMessage = `Đã xóa vĩnh viễn ${count} bài viết`
  }

  // Notify super admins with post titles
  if (count > 0) {
    await notifySuperAdminsOfBulkPostAction(
      action,
      ctx.actorId,
      count,
      posts.map(p => ({ title: p.title || "Untitled" }))
    )
  }

  resourceLogger.actionFlow({
    resource: "posts",
    action: actionType,
    step: "success",
    metadata: { count, affected: count },
  })

  return { success: true, message: successMessage, affected: count }
}

