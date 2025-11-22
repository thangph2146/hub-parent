"use server"

import type { Prisma } from "@prisma/client"
import { PERMISSIONS, canPerformAnyAction } from "@/lib/permissions"
import { prisma } from "@/lib/database"
import { resourceLogger } from "@/lib/config"
import { mapTagRecord, type TagWithRelations } from "./helpers"
import type { ListedTag } from "../types"
import { generateSlug } from "../utils"
import type { BulkActionResult } from "../types"
import {
  CreateTagSchema,
  UpdateTagSchema,
  type CreateTagInput,
  type UpdateTagInput,
} from "./schemas"
import { notifySuperAdminsOfTagAction, notifySuperAdminsOfBulkTagAction } from "./notifications"
import {
  ApplicationError,
  ForbiddenError,
  NotFoundError,
  ensurePermission,
  invalidateResourceCache,
  invalidateResourceCacheBulk,
  type AuthContext,
} from "@/features/admin/resources/server"
import { emitTagUpsert, emitTagRemove } from "./events"

// Re-export for backward compatibility with API routes
export { ApplicationError, ForbiddenError, NotFoundError, type AuthContext }

function sanitizeTag(tag: TagWithRelations): ListedTag {
  return mapTagRecord(tag)
}

export async function createTag(ctx: AuthContext, input: CreateTagInput): Promise<ListedTag> {
  const startTime = Date.now()
  
  resourceLogger.actionFlow({
    resource: "tags",
    action: "create",
    step: "start",
    metadata: { actorId: ctx.actorId, input: { name: input.name, slug: input.slug } },
  })

  ensurePermission(ctx, PERMISSIONS.TAGS_CREATE, PERMISSIONS.TAGS_MANAGE)

  // Validate input với zod
  const validatedInput = CreateTagSchema.parse(input)

  const trimmedName = validatedInput.name.trim()
  // Generate slug if not provided
  const slug = validatedInput.slug?.trim() || generateSlug(trimmedName)

  // Check if name or slug already exists
  const existing = await prisma.tag.findFirst({
    where: {
      OR: [
        { name: trimmedName },
        { slug: slug },
      ],
      deletedAt: null,
    },
  })

  if (existing) {
    if (existing.name === trimmedName) {
      throw new ApplicationError("Tên thẻ tag đã tồn tại", 400)
    }
    if (existing.slug === slug) {
      throw new ApplicationError("Slug đã tồn tại", 400)
    }
  }

  const tag = await prisma.tag.create({
    data: {
      name: trimmedName,
      slug: slug,
    },
  })

  const sanitized = sanitizeTag(tag)

  // Invalidate cache - Next.js 16 caching pattern
  resourceLogger.cache({
    resource: "tags",
    action: "cache-invalidate",
    operation: "invalidate",
    resourceId: sanitized.id,
    tags: ["tags", `tag-${sanitized.id}`, "tag-options", "active-tags"],
  })
  await invalidateResourceCache({
    resource: "tags",
    id: sanitized.id,
    additionalTags: ["tag-options", "active-tags"],
  })

  // Emit socket event for real-time updates
  resourceLogger.socket({
    resource: "tags",
    action: "create",
    event: "tag:upsert",
    resourceId: sanitized.id,
    payload: { id: sanitized.id, status: "active" },
  })
  await emitTagUpsert(sanitized.id, null)

  // Emit notification realtime
  await notifySuperAdminsOfTagAction(
    "create",
    ctx.actorId,
    {
      id: sanitized.id,
      name: sanitized.name,
      slug: sanitized.slug,
    }
  )

  resourceLogger.actionFlow({
    resource: "tags",
    action: "create",
    step: "success",
    duration: Date.now() - startTime,
    metadata: { tagId: sanitized.id, tagName: sanitized.name },
  })

  resourceLogger.detailAction({
    resource: "tags",
    action: "create",
    resourceId: sanitized.id,
    tagName: sanitized.name,
  })

  return sanitized
}

export async function updateTag(ctx: AuthContext, id: string, input: UpdateTagInput): Promise<ListedTag> {
  const startTime = Date.now()
  
  resourceLogger.actionFlow({
    resource: "tags",
    action: "update",
    step: "start",
    metadata: { tagId: id, actorId: ctx.actorId, input },
  })

  ensurePermission(ctx, PERMISSIONS.TAGS_UPDATE, PERMISSIONS.TAGS_MANAGE)

  if (!id || typeof id !== "string" || id.trim() === "") {
    throw new ApplicationError("ID thẻ tag không hợp lệ", 400)
  }

  // Validate input với zod
  const validatedInput = UpdateTagSchema.parse(input)

  const existing = await prisma.tag.findUnique({
    where: { id },
  })

  if (!existing || existing.deletedAt) {
    throw new NotFoundError("Thẻ tag không tồn tại")
  }

  // Track changes for notification
  const changes: {
    name?: { old: string; new: string }
    slug?: { old: string; new: string }
  } = {}

  const updateData: Prisma.TagUpdateInput = {}

  if (validatedInput.name !== undefined) {
    const trimmedName = validatedInput.name.trim()
    // Check if name is already used by another tag
    if (trimmedName !== existing.name) {
      const nameExists = await prisma.tag.findFirst({
        where: {
          name: trimmedName,
          deletedAt: null,
          id: { not: id },
        },
      })
      if (nameExists) {
        throw new ApplicationError("Tên thẻ tag đã được sử dụng", 400)
      }
      changes.name = { old: existing.name, new: trimmedName }
    }
    updateData.name = trimmedName
  }

  if (validatedInput.slug !== undefined) {
    const trimmedSlug = validatedInput.slug.trim()
    // Check if slug is already used by another tag
    if (trimmedSlug !== existing.slug) {
      const slugExists = await prisma.tag.findFirst({
        where: {
          slug: trimmedSlug,
          deletedAt: null,
          id: { not: id },
        },
      })
      if (slugExists) {
        throw new ApplicationError("Slug đã được sử dụng", 400)
      }
      changes.slug = { old: existing.slug, new: trimmedSlug }
    }
    updateData.slug = trimmedSlug
  }

  // Chỉ update nếu có thay đổi
  if (Object.keys(updateData).length === 0) {
    // Không có thay đổi, trả về tag hiện tại
    const sanitized = sanitizeTag(existing)
    resourceLogger.actionFlow({
      resource: "tags",
      action: "update",
      step: "success",
      duration: Date.now() - startTime,
      metadata: { tagId: sanitized.id, tagName: sanitized.name, changes: {}, noChanges: true },
    })
    return sanitized
  }

  const tag = await prisma.tag.update({
    where: { id },
    data: updateData,
  })

  const sanitized = sanitizeTag(tag)

  // Invalidate cache - Next.js 16 caching pattern
  resourceLogger.cache({
    resource: "tags",
    action: "cache-invalidate",
    operation: "invalidate",
    resourceId: id,
    tags: ["tags", `tag-${id}`, "tag-options", "active-tags"],
  })
  await invalidateResourceCache({
    resource: "tags",
    id,
    additionalTags: ["tag-options", "active-tags"],
  })

  // Determine previous status for socket event
  const previousStatus: "active" | "deleted" | null = existing.deletedAt ? "deleted" : "active"

  // Emit socket event for real-time updates
  resourceLogger.socket({
    resource: "tags",
    action: "update",
    event: "tag:upsert",
    resourceId: sanitized.id,
    payload: { id: sanitized.id, previousStatus },
  })
  await emitTagUpsert(sanitized.id, previousStatus)

  // Emit notification realtime
  await notifySuperAdminsOfTagAction(
    "update",
    ctx.actorId,
    {
      id: sanitized.id,
      name: sanitized.name,
      slug: sanitized.slug,
    },
    Object.keys(changes).length > 0 ? changes : undefined
  )

  resourceLogger.actionFlow({
    resource: "tags",
    action: "update",
    step: "success",
    duration: Date.now() - startTime,
    metadata: { tagId: sanitized.id, tagName: sanitized.name, changes },
  })

  resourceLogger.detailAction({
    resource: "tags",
    action: "update",
    resourceId: sanitized.id,
    tagName: sanitized.name,
    changes,
  })

  return sanitized
}

export async function softDeleteTag(ctx: AuthContext, id: string): Promise<void> {
  const startTime = Date.now()
  
  resourceLogger.actionFlow({
    resource: "tags",
    action: "delete",
    step: "start",
    metadata: { tagId: id, actorId: ctx.actorId },
  })

  ensurePermission(ctx, PERMISSIONS.TAGS_DELETE, PERMISSIONS.TAGS_MANAGE)

  const tag = await prisma.tag.findUnique({ where: { id } })
  if (!tag || tag.deletedAt) {
    throw new NotFoundError("Thẻ tag không tồn tại")
  }

  await prisma.tag.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  })

  // Invalidate cache
  resourceLogger.cache({
    resource: "tags",
    action: "cache-invalidate",
    operation: "invalidate",
    resourceId: id,
    tags: ["tags", `tag-${id}`, "tag-options", "active-tags"],
  })
  await invalidateResourceCache({
    resource: "tags",
    id,
    additionalTags: ["tag-options", "active-tags"],
  })

  // Emit socket event for real-time updates
  resourceLogger.socket({
    resource: "tags",
    action: "delete",
    event: "tag:upsert",
    resourceId: id,
    payload: { id, previousStatus: "active" },
  })
  await emitTagUpsert(id, "active")

  // Emit notification realtime
  await notifySuperAdminsOfTagAction(
    "delete",
    ctx.actorId,
    {
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
    }
  )

  resourceLogger.actionFlow({
    resource: "tags",
    action: "delete",
    step: "success",
    duration: Date.now() - startTime,
    metadata: { tagId: id, tagName: tag.name },
  })
}

export async function bulkSoftDeleteTags(ctx: AuthContext, ids: string[]): Promise<BulkActionResult> {
  const startTime = Date.now()
  
  resourceLogger.actionFlow({
    resource: "tags",
    action: "bulk-delete",
    step: "start",
    metadata: { count: ids.length, tagIds: ids, actorId: ctx.actorId },
  })

  ensurePermission(ctx, PERMISSIONS.TAGS_DELETE, PERMISSIONS.TAGS_MANAGE)

  if (!ids || ids.length === 0) {
    throw new ApplicationError("Danh sách thẻ tag trống", 400)
  }

  // Lấy thông tin tags trước khi delete để tạo notifications
  // Chỉ tìm các tags đang hoạt động (chưa bị xóa)
  const tags = await prisma.tag.findMany({
    where: {
      id: { in: ids },
      deletedAt: null,
    },
    select: { id: true, name: true, slug: true },
  })

  const foundIds = tags.map(t => t.id)
  const notFoundIds = ids.filter(id => !foundIds.includes(id))
  
  // Log để debug với đầy đủ thông tin
  resourceLogger.actionFlow({
    resource: "tags",
    action: "bulk-delete",
    step: "start",
    metadata: {
      requestedCount: ids.length,
      foundCount: tags.length,
      notFoundCount: notFoundIds.length,
      requestedIds: ids,
      foundIds,
      notFoundIds,
    },
  })

  // Nếu không tìm thấy tag nào, trả về error message chi tiết
  if (tags.length === 0) {
    const allTags = await prisma.tag.findMany({
      where: { id: { in: ids } },
      select: { id: true, deletedAt: true },
    })
    const alreadyDeletedCount = allTags.filter(t => t.deletedAt !== null).length
    const notFoundCount = ids.length - allTags.length
    
    let errorMessage = "Không có thẻ tag nào có thể xóa"
    if (alreadyDeletedCount > 0) {
      errorMessage += `. ${alreadyDeletedCount} tag đã bị xóa trước đó`
    }
    if (notFoundCount > 0) {
      errorMessage += `. ${notFoundCount} tag không tồn tại`
    }
    
    resourceLogger.actionFlow({
      resource: "tags",
      action: "bulk-delete",
      step: "error",
      metadata: {
        requestedCount: ids.length,
        foundCount: tags.length,
        alreadyDeletedCount,
        notFoundCount,
        error: errorMessage,
      },
    })
    
    throw new ApplicationError(errorMessage, 400)
  }

  const result = await prisma.tag.updateMany({
    where: {
      id: { in: tags.map((tag) => tag.id) },
      deletedAt: null,
    },
    data: {
      deletedAt: new Date(),
    },
  })

  // Invalidate cache cho bulk operation
  resourceLogger.cache({
    resource: "tags",
    action: "cache-invalidate",
    operation: "invalidate",
    tags: ["tags", "tag-options", "active-tags"],
  })
  await invalidateResourceCacheBulk({
    resource: "tags",
    additionalTags: ["tag-options", "active-tags"],
  })

  // Emit socket events để update UI
  if (result.count > 0) {
    resourceLogger.socket({
      resource: "tags",
      action: "bulk-delete",
      event: "tag:upsert",
      payload: { count: result.count, tagIds: tags.map(t => t.id) },
    })
    // Emit events song song
    const emitPromises = tags.map((tag) => 
      emitTagUpsert(tag.id, "active").catch((error) => {
        resourceLogger.socket({
          resource: "tags",
          action: "bulk-delete",
          event: "tag:upsert",
          resourceId: tag.id,
          payload: { 
            tagId: tag.id, 
            tagName: tag.name,
            error: error instanceof Error ? error.message : String(error),
          },
        })
        return null
      })
    )
    await Promise.allSettled(emitPromises)

    // Emit một notification tổng hợp thay vì từng cái một
    await notifySuperAdminsOfBulkTagAction(
        "delete",
        ctx.actorId,
      result.count,
      tags
      )

    resourceLogger.actionFlow({
      resource: "tags",
      action: "bulk-delete",
      step: "success",
      duration: Date.now() - startTime,
      metadata: { requestedCount: ids.length, affectedCount: result.count },
    })
  }

  return { success: true, message: `Đã xóa ${result.count} thẻ tag`, affected: result.count }
}

export async function restoreTag(ctx: AuthContext, id: string): Promise<void> {
  const startTime = Date.now()
  
  resourceLogger.actionFlow({
    resource: "tags",
    action: "restore",
    step: "start",
    metadata: { tagId: id, actorId: ctx.actorId },
  })

  ensurePermission(ctx, PERMISSIONS.TAGS_UPDATE, PERMISSIONS.TAGS_MANAGE)

  const tag = await prisma.tag.findUnique({ where: { id } })
  if (!tag || !tag.deletedAt) {
    throw new NotFoundError("Thẻ tag không tồn tại hoặc chưa bị xóa")
  }

  await prisma.tag.update({
    where: { id },
    data: {
      deletedAt: null,
    },
  })

  // Invalidate cache
  resourceLogger.cache({
    resource: "tags",
    action: "cache-invalidate",
    operation: "invalidate",
    resourceId: id,
    tags: ["tags", `tag-${id}`, "tag-options", "active-tags"],
  })
  await invalidateResourceCache({
    resource: "tags",
    id,
    additionalTags: ["tag-options", "active-tags"],
  })

  // Emit socket event for real-time updates
  resourceLogger.socket({
    resource: "tags",
    action: "restore",
    event: "tag:upsert",
    resourceId: id,
    payload: { id, previousStatus: "deleted" },
  })
  await emitTagUpsert(id, "deleted")

  // Emit notification realtime
  await notifySuperAdminsOfTagAction(
    "restore",
    ctx.actorId,
    {
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
    }
  )

  resourceLogger.actionFlow({
    resource: "tags",
    action: "restore",
    step: "success",
    duration: Date.now() - startTime,
    metadata: { tagId: id, tagName: tag.name },
  })
}

export async function bulkRestoreTags(ctx: AuthContext, ids: string[]): Promise<BulkActionResult> {
  const startTime = Date.now()
  
  resourceLogger.actionFlow({
    resource: "tags",
    action: "bulk-restore",
    step: "start",
    metadata: { count: ids.length, tagIds: ids, actorId: ctx.actorId },
  })

  ensurePermission(ctx, PERMISSIONS.TAGS_UPDATE, PERMISSIONS.TAGS_MANAGE)

  if (!ids || ids.length === 0) {
    throw new ApplicationError("Danh sách thẻ tag trống", 400)
  }

  // Tìm tất cả tags được request để phân loại trạng thái
  const allRequestedTags = await prisma.tag.findMany({
    where: {
      id: { in: ids },
    },
    select: { id: true, name: true, slug: true, deletedAt: true },
  })

  // Phân loại tags
  const softDeletedTags = allRequestedTags.filter((tag) => tag.deletedAt !== null)
  const activeTags = allRequestedTags.filter((tag) => tag.deletedAt === null)
  const notFoundCount = ids.length - allRequestedTags.length
  const foundIds = allRequestedTags.map(t => t.id)
  const notFoundIds = ids.filter(id => !foundIds.includes(id))
  const softDeletedIds = softDeletedTags.map(t => t.id)
  const activeIds = activeTags.map(t => t.id)

  // Log để debug với đầy đủ thông tin
  resourceLogger.actionFlow({
    resource: "tags",
    action: "bulk-restore",
    step: "start",
    metadata: {
      requestedCount: ids.length,
      foundCount: allRequestedTags.length,
      softDeletedCount: softDeletedTags.length,
      activeCount: activeTags.length,
      notFoundCount,
      requestedIds: ids,
      foundIds,
      softDeletedIds,
      activeIds,
      notFoundIds,
    },
  })

  // Nếu không có tag nào đã bị soft delete, throw error với message chi tiết
  if (softDeletedTags.length === 0) {
    const parts: string[] = []
    if (activeTags.length > 0) {
      parts.push(`${activeTags.length} tag đang hoạt động`)
    }
    if (notFoundCount > 0) {
      parts.push(`${notFoundCount} tag không tồn tại (đã bị xóa vĩnh viễn)`)
    }

    const errorMessage = parts.length > 0
      ? `Không có thẻ tag nào để khôi phục (${parts.join(", ")})`
      : `Không tìm thấy thẻ tag nào để khôi phục`

    resourceLogger.actionFlow({
      resource: "tags",
      action: "bulk-restore",
      step: "error",
      metadata: {
        requestedCount: ids.length,
        foundCount: allRequestedTags.length,
        softDeletedCount: softDeletedTags.length,
        activeCount: activeTags.length,
        notFoundCount,
        error: errorMessage,
      },
    })

    throw new ApplicationError(errorMessage, 400)
  }

  // Chỉ restore những tags đã bị soft delete
  const tagsToRestore = softDeletedTags

  const result = await prisma.tag.updateMany({
    where: {
      id: { in: tagsToRestore.map((tag) => tag.id) },
      deletedAt: { not: null },
    },
    data: {
      deletedAt: null,
    },
  })

  // Invalidate cache cho bulk operation
  resourceLogger.cache({
    resource: "tags",
    action: "cache-invalidate",
    operation: "invalidate",
    tags: ["tags", "tag-options", "active-tags"],
  })
  await invalidateResourceCacheBulk({
    resource: "tags",
    additionalTags: ["tag-options", "active-tags"],
  })

  // Emit socket events để update UI
  if (result.count > 0) {
    resourceLogger.socket({
      resource: "tags",
      action: "bulk-restore",
      event: "tag:upsert",
      payload: { count: result.count, tagIds: tagsToRestore.map(t => t.id) },
    })
    // Emit events song song
    const emitPromises = tagsToRestore.map((tag) => 
      emitTagUpsert(tag.id, "deleted").catch((error) => {
        resourceLogger.socket({
          resource: "tags",
          action: "bulk-restore",
          event: "tag:upsert",
          resourceId: tag.id,
          payload: { 
            tagId: tag.id, 
            tagName: tag.name,
            error: error instanceof Error ? error.message : String(error),
          },
        })
        return null
      })
    )
    await Promise.allSettled(emitPromises)

    // Emit một notification tổng hợp thay vì từng cái một
    await notifySuperAdminsOfBulkTagAction(
        "restore",
        ctx.actorId,
      result.count,
      tagsToRestore
      )

    resourceLogger.actionFlow({
      resource: "tags",
      action: "bulk-restore",
      step: "success",
      duration: Date.now() - startTime,
      metadata: { requestedCount: ids.length, affectedCount: result.count },
    })
  }

  // Tạo message chi tiết nếu có tags không thể restore
  let message = `Đã khôi phục ${result.count} thẻ tag`
  if (result.count < ids.length) {
    const skippedCount = ids.length - result.count
    const skippedParts: string[] = []
    if (activeTags.length > 0) {
      skippedParts.push(`${activeTags.length} tag đang hoạt động`)
    }
    if (notFoundCount > 0) {
      skippedParts.push(`${notFoundCount} tag đã bị xóa vĩnh viễn`)
    }
    if (skippedParts.length > 0) {
      message += ` (${skippedCount} tag không thể khôi phục: ${skippedParts.join(", ")})`
    }
  }

  return { success: true, message, affected: result.count }
}

export async function hardDeleteTag(ctx: AuthContext, id: string): Promise<void> {
  const startTime = Date.now()
  
  resourceLogger.actionFlow({
    resource: "tags",
    action: "hard-delete",
    step: "start",
    metadata: { tagId: id, actorId: ctx.actorId },
  })

  if (!canPerformAnyAction(ctx.permissions, ctx.roles, [PERMISSIONS.TAGS_MANAGE])) {
    throw new ForbiddenError()
  }

  const tag = await prisma.tag.findUnique({
    where: { id },
    select: { id: true, name: true, slug: true, deletedAt: true },
  })

  if (!tag) {
    throw new NotFoundError("Thẻ tag không tồn tại")
  }

  // Determine previous status before deletion
  const previousStatus: "active" | "deleted" = tag.deletedAt ? "deleted" : "active"

  await prisma.tag.delete({
    where: { id },
  })

  // Invalidate cache
  resourceLogger.cache({
    resource: "tags",
    action: "cache-invalidate",
    operation: "invalidate",
    resourceId: id,
    tags: ["tags", `tag-${id}`, "tag-options", "active-tags"],
  })
  await invalidateResourceCache({
    resource: "tags",
    id,
    additionalTags: ["tag-options", "active-tags"],
  })

  // Emit socket event for real-time updates
  resourceLogger.socket({
    resource: "tags",
    action: "hard-delete",
    event: "tag:remove",
    resourceId: id,
    payload: { id, previousStatus },
  })
  emitTagRemove(id, previousStatus)

  // Emit notification realtime
  await notifySuperAdminsOfTagAction(
    "hard-delete",
    ctx.actorId,
    tag
  )

  resourceLogger.actionFlow({
    resource: "tags",
    action: "hard-delete",
    step: "success",
    duration: Date.now() - startTime,
    metadata: { tagId: id, tagName: tag.name },
  })
}

export async function bulkHardDeleteTags(ctx: AuthContext, ids: string[]): Promise<BulkActionResult> {
  const startTime = Date.now()
  
  resourceLogger.actionFlow({
    resource: "tags",
    action: "bulk-hard-delete",
    step: "start",
    metadata: { count: ids.length, tagIds: ids, actorId: ctx.actorId },
  })

  if (!canPerformAnyAction(ctx.permissions, ctx.roles, [PERMISSIONS.TAGS_MANAGE])) {
    throw new ForbiddenError()
  }

  if (!ids || ids.length === 0) {
    throw new ApplicationError("Danh sách thẻ tag trống", 400)
  }

  // Lấy thông tin tags trước khi delete để tạo notifications và socket events
  const tags = await prisma.tag.findMany({
    where: {
      id: { in: ids },
    },
    select: { id: true, name: true, slug: true, deletedAt: true },
  })

  // Nếu không tìm thấy tag nào, có thể chúng đã bị xóa rồi
  if (tags.length === 0) {
    return { 
      success: true, 
      message: `Không tìm thấy thẻ tag nào để xóa (có thể đã bị xóa trước đó)`, 
      affected: 0 
    }
  }

  const result = await prisma.tag.deleteMany({
    where: {
      id: { in: tags.map((tag) => tag.id) },
    },
  })

  // Invalidate cache cho bulk operation
  resourceLogger.cache({
    resource: "tags",
    action: "cache-invalidate",
    operation: "invalidate",
    tags: ["tags", "tag-options", "active-tags"],
  })
  await invalidateResourceCacheBulk({
    resource: "tags",
    additionalTags: ["tag-options", "active-tags"],
  })

  // Emit socket events để update UI
  if (result.count > 0) {
    resourceLogger.socket({
      resource: "tags",
      action: "bulk-hard-delete",
      event: "tag:remove",
      payload: { count: result.count, tagIds: tags.map(t => t.id) },
    })
    // Emit events (emitTagRemove trả về void, không phải Promise)
    tags.forEach((tag) => {
      const previousStatus: "active" | "deleted" = tag.deletedAt ? "deleted" : "active"
      try {
        emitTagRemove(tag.id, previousStatus)
      } catch (error) {
        resourceLogger.socket({
          resource: "tags",
          action: "bulk-hard-delete",
          event: "tag:remove",
          resourceId: tag.id,
          payload: { 
            tagId: tag.id, 
            tagName: tag.name,
            previousStatus,
            error: error instanceof Error ? error.message : String(error),
          },
        })
      }
    })

    // Emit một notification tổng hợp thay vì từng cái một
    await notifySuperAdminsOfBulkTagAction(
        "hard-delete",
        ctx.actorId,
      result.count,
      tags
      )
  }

  resourceLogger.actionFlow({
    resource: "tags",
    action: "bulk-hard-delete",
    step: "success",
    duration: Date.now() - startTime,
    metadata: { count: result.count, affected: result.count },
  })

  // Trả về số lượng tags thực sự đã được xóa
  return { 
    success: true, 
    message: `Đã xóa vĩnh viễn ${result.count} thẻ tag${result.count < tags.length ? ` (${tags.length - result.count} tag không tồn tại)` : ""}`, 
    affected: result.count 
  }
}

