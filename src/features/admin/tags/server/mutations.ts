"use server"

import type { Prisma } from "@prisma/client"
import { PERMISSIONS, canPerformAnyAction } from "@/lib/permissions"
import { prisma } from "@/lib/database"
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
  logTableStatusAfterMutation,
  logActionFlow,
  logDetailAction,
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
  
  logActionFlow("tags", "create", "start", { actorId: ctx.actorId, input: { name: input.name, slug: input.slug } })
  ensurePermission(ctx, PERMISSIONS.TAGS_CREATE, PERMISSIONS.TAGS_MANAGE)

  const validatedInput = CreateTagSchema.parse(input)
  const trimmedName = validatedInput.name.trim()
  const slug = validatedInput.slug?.trim() || generateSlug(trimmedName)

  const existing = await prisma.tag.findFirst({
    where: {
      OR: [{ name: trimmedName }, { slug: slug }],
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
    data: { name: trimmedName, slug: slug },
  })

  const sanitized = sanitizeTag(tag)

  await emitTagUpsert(sanitized.id, null)

  await notifySuperAdminsOfTagAction("create", ctx.actorId, {
    id: sanitized.id,
    name: sanitized.name,
    slug: sanitized.slug,
  })

  logActionFlow("tags", "create", "success", { tagId: sanitized.id, tagName: sanitized.name }, startTime)
  logDetailAction("tags", "create", sanitized.id, sanitized as unknown as Record<string, unknown>)

  return sanitized
}

export async function updateTag(ctx: AuthContext, id: string, input: UpdateTagInput): Promise<ListedTag> {
  const startTime = Date.now()
  
  logActionFlow("tags", "update", "start", { tagId: id, actorId: ctx.actorId, input })
  ensurePermission(ctx, PERMISSIONS.TAGS_UPDATE, PERMISSIONS.TAGS_MANAGE)

  if (!id || typeof id !== "string" || id.trim() === "") {
    throw new ApplicationError("ID thẻ tag không hợp lệ", 400)
  }

  const validatedInput = UpdateTagSchema.parse(input)
  const existing = await prisma.tag.findUnique({ where: { id } })

  if (!existing || existing.deletedAt) {
    throw new NotFoundError("Thẻ tag không tồn tại")
  }

  const changes: {
    name?: { old: string; new: string }
    slug?: { old: string; new: string }
  } = {}
  const updateData: Prisma.TagUpdateInput = {}

  if (validatedInput.name !== undefined) {
    const trimmedName = validatedInput.name.trim()
    if (trimmedName !== existing.name) {
      const nameExists = await prisma.tag.findFirst({
        where: { name: trimmedName, deletedAt: null, id: { not: id } },
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
    if (trimmedSlug !== existing.slug) {
      const slugExists = await prisma.tag.findFirst({
        where: { slug: trimmedSlug, deletedAt: null, id: { not: id } },
      })
      if (slugExists) {
        throw new ApplicationError("Slug đã được sử dụng", 400)
      }
      changes.slug = { old: existing.slug, new: trimmedSlug }
    }
    updateData.slug = trimmedSlug
  }

  if (Object.keys(updateData).length === 0) {
    const sanitized = sanitizeTag(existing)
    logActionFlow("tags", "update", "success", { tagId: sanitized.id, tagName: sanitized.name, changes: {}, noChanges: true }, startTime)
    return sanitized
  }

  const tag = await prisma.tag.update({ where: { id }, data: updateData })
  const sanitized = sanitizeTag(tag)
  const previousStatus: "active" | "deleted" | null = existing.deletedAt ? "deleted" : "active"

  await emitTagUpsert(sanitized.id, previousStatus)

  await notifySuperAdminsOfTagAction("update", ctx.actorId, {
    id: sanitized.id,
    name: sanitized.name,
    slug: sanitized.slug,
  }, Object.keys(changes).length > 0 ? changes : undefined)

  logActionFlow("tags", "update", "success", { tagId: sanitized.id, tagName: sanitized.name, changes }, startTime)
  logDetailAction("tags", "update", sanitized.id, { ...sanitized, changes } as unknown as Record<string, unknown>)

  return sanitized
}

export async function softDeleteTag(ctx: AuthContext, id: string): Promise<void> {
  const startTime = Date.now()
  
  logActionFlow("tags", "delete", "start", { tagId: id, actorId: ctx.actorId })
  ensurePermission(ctx, PERMISSIONS.TAGS_DELETE, PERMISSIONS.TAGS_MANAGE)

  const tag = await prisma.tag.findUnique({ where: { id } })
  if (!tag || tag.deletedAt) {
    throw new NotFoundError("Thẻ tag không tồn tại")
  }

  await prisma.tag.update({ where: { id }, data: { deletedAt: new Date() } })

  await logTableStatusAfterMutation({
    resource: "tags",
    action: "delete",
    prismaModel: prisma.tag,
    affectedIds: id,
  })

  await emitTagUpsert(id, "active")

  await notifySuperAdminsOfTagAction("delete", ctx.actorId, {
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
  })

  logActionFlow("tags", "delete", "success", { tagId: id, tagName: tag.name }, startTime)
}

export async function bulkSoftDeleteTags(ctx: AuthContext, ids: string[]): Promise<BulkActionResult> {
  const startTime = Date.now()
  
  logActionFlow("tags", "bulk-delete", "start", { count: ids.length, tagIds: ids, actorId: ctx.actorId })
  ensurePermission(ctx, PERMISSIONS.TAGS_DELETE, PERMISSIONS.TAGS_MANAGE)

  if (!ids || ids.length === 0) {
    throw new ApplicationError("Danh sách thẻ tag trống", 400)
  }

  const tags = await prisma.tag.findMany({
    where: { id: { in: ids }, deletedAt: null },
    select: { id: true, name: true, slug: true },
  })

  const foundIds = tags.map(t => t.id)
  const _notFoundIds = ids.filter(id => !foundIds.includes(id))

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
    
    logActionFlow("tags", "bulk-delete", "error", {
      requestedCount: ids.length,
      foundCount: tags.length,
      alreadyDeletedCount,
      notFoundCount,
      error: errorMessage,
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

  if (result.count > 0) {
    await logTableStatusAfterMutation({
      resource: "tags",
      action: "bulk-delete",
      prismaModel: prisma.tag,
      affectedIds: tags.map((tag) => tag.id),
      affectedCount: result.count,
    })
  }

  // Emit socket events để update UI
  if (result.count > 0) {
    // Emit events song song
    const emitPromises = tags.map((tag) => 
      emitTagUpsert(tag.id, "active").catch((_error) => {
        return null
      })
    )
    await Promise.allSettled(emitPromises)

    await notifySuperAdminsOfBulkTagAction("delete", ctx.actorId, result.count, tags)

    logActionFlow("tags", "bulk-delete", "success", { requestedCount: ids.length, affectedCount: result.count }, startTime)
  }

  return { success: true, message: `Đã xóa ${result.count} thẻ tag`, affected: result.count }
}

export async function restoreTag(ctx: AuthContext, id: string): Promise<void> {
  const startTime = Date.now()
  
  logActionFlow("tags", "restore", "start", { tagId: id, actorId: ctx.actorId })
  ensurePermission(ctx, PERMISSIONS.TAGS_UPDATE, PERMISSIONS.TAGS_MANAGE)

  const tag = await prisma.tag.findUnique({ where: { id } })
  if (!tag || !tag.deletedAt) {
    throw new NotFoundError("Thẻ tag không tồn tại hoặc chưa bị xóa")
  }

  await prisma.tag.update({ where: { id }, data: { deletedAt: null } })

  await logTableStatusAfterMutation({
    resource: "tags",
    action: "restore",
    prismaModel: prisma.tag,
    affectedIds: id,
  })

  await emitTagUpsert(id, "deleted")

  await notifySuperAdminsOfTagAction("restore", ctx.actorId, {
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
  })

  logActionFlow("tags", "restore", "success", { tagId: id, tagName: tag.name }, startTime)
}

export async function bulkRestoreTags(ctx: AuthContext, ids: string[]): Promise<BulkActionResult> {
  const startTime = Date.now()
  
  logActionFlow("tags", "bulk-restore", "start", { count: ids.length, tagIds: ids, actorId: ctx.actorId })
  ensurePermission(ctx, PERMISSIONS.TAGS_UPDATE, PERMISSIONS.TAGS_MANAGE)

  if (!ids || ids.length === 0) {
    throw new ApplicationError("Danh sách thẻ tag trống", 400)
  }

  const allRequestedTags = await prisma.tag.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, slug: true, deletedAt: true },
  })

  const softDeletedTags = allRequestedTags.filter((tag) => tag.deletedAt !== null)
  const activeTags = allRequestedTags.filter((tag) => tag.deletedAt === null)
  const notFoundCount = ids.length - allRequestedTags.length

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

    logActionFlow("tags", "bulk-restore", "error", {
      requestedCount: ids.length,
      foundCount: allRequestedTags.length,
      softDeletedCount: softDeletedTags.length,
      activeCount: activeTags.length,
      notFoundCount,
      error: errorMessage,
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

  if (result.count > 0) {
    await logTableStatusAfterMutation({
      resource: "tags",
      action: "bulk-restore",
      prismaModel: prisma.tag,
      affectedIds: tagsToRestore.map(t => t.id),
      affectedCount: result.count,
    })
  }

  // Emit socket events để update UI
  if (result.count > 0) {
    // Emit events song song
    const emitPromises = tagsToRestore.map((tag) => 
      emitTagUpsert(tag.id, "deleted").catch((_error) => {
        return null
      })
    )
    await Promise.allSettled(emitPromises)

    await notifySuperAdminsOfBulkTagAction("restore", ctx.actorId, result.count, tagsToRestore)

    logActionFlow("tags", "bulk-restore", "success", { requestedCount: ids.length, affectedCount: result.count }, startTime)
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
  
  logActionFlow("tags", "hard-delete", "start", { tagId: id, actorId: ctx.actorId })

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

  const previousStatus: "active" | "deleted" = tag.deletedAt ? "deleted" : "active"

  await prisma.tag.delete({ where: { id } })

  emitTagRemove(id, previousStatus)

  await notifySuperAdminsOfTagAction("hard-delete", ctx.actorId, tag)

  logActionFlow("tags", "hard-delete", "success", { tagId: id, tagName: tag.name }, startTime)
}

export async function bulkHardDeleteTags(ctx: AuthContext, ids: string[]): Promise<BulkActionResult> {
  const startTime = Date.now()
  
  logActionFlow("tags", "bulk-hard-delete", "start", { count: ids.length, tagIds: ids, actorId: ctx.actorId })

  if (!canPerformAnyAction(ctx.permissions, ctx.roles, [PERMISSIONS.TAGS_MANAGE])) {
    throw new ForbiddenError()
  }

  if (!ids || ids.length === 0) {
    throw new ApplicationError("Danh sách thẻ tag trống", 400)
  }

  const tags = await prisma.tag.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, slug: true, deletedAt: true },
  })

  if (tags.length === 0) {
    return { 
      success: true, 
      message: `Không tìm thấy thẻ tag nào để xóa (có thể đã bị xóa trước đó)`, 
      affected: 0 
    }
  }

  const result = await prisma.tag.deleteMany({
    where: { id: { in: tags.map((tag) => tag.id) } },
  })

  if (result.count > 0) {
    tags.forEach((tag) => {
      const previousStatus: "active" | "deleted" = tag.deletedAt ? "deleted" : "active"
      try {
        emitTagRemove(tag.id, previousStatus)
      } catch {
      }
    })

    await notifySuperAdminsOfBulkTagAction("hard-delete", ctx.actorId, result.count, tags)
  }

  logActionFlow("tags", "bulk-hard-delete", "success", { count: result.count, affected: result.count }, startTime)

  return { 
    success: true, 
    message: `Đã xóa vĩnh viễn ${result.count} thẻ tag${result.count < tags.length ? ` (${tags.length - result.count} tag không tồn tại)` : ""}`, 
    affected: result.count 
  }
}

