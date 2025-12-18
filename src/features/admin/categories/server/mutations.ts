"use server"

import type { Prisma } from "@prisma/client"
import { PERMISSIONS, canPerformAnyAction } from "@/lib/permissions"
import { prisma } from "@/lib/database"
import { mapCategoryRecord, type CategoryWithRelations } from "./helpers"
import type { ListedCategory } from "../types"
import { generateSlug } from "../utils"
import type { BulkActionResult } from "../types"
import {
  CreateCategorySchema,
  UpdateCategorySchema,
} from "./schemas"
import { notifySuperAdminsOfCategoryAction, notifySuperAdminsOfBulkCategoryAction } from "./notifications"
import { emitCategoryUpsert, emitCategoryRemove } from "./events"
import {
  ApplicationError,
  ForbiddenError,
  NotFoundError,
  ensurePermission,
  logTableStatusAfterMutation,
  logActionFlow,
  logDetailAction,
  validateBulkIds,
  buildBulkError,
  type AuthContext,
} from "@/features/admin/resources/server"
import { z } from "zod"

export { ApplicationError, ForbiddenError, NotFoundError, type AuthContext }

const sanitizeCategory = (category: CategoryWithRelations): ListedCategory => mapCategoryRecord(category)

const mapCategoryForNotification = (category: { id: string; name: string; slug: string }) => ({
  id: category.id,
  name: category.name,
  slug: category.slug,
})


export const createCategory = async (ctx: AuthContext, input: z.infer<typeof CreateCategorySchema>): Promise<ListedCategory> => {
  const startTime = Date.now()
  
  logActionFlow("categories", "create", "start", { actorId: ctx.actorId, input: { name: input.name, slug: input.slug } })
  ensurePermission(ctx, PERMISSIONS.CATEGORIES_CREATE, PERMISSIONS.CATEGORIES_MANAGE)

  const validatedInput = CreateCategorySchema.parse(input)
  const trimmedName = validatedInput.name.trim()
  const slug = validatedInput.slug?.trim() || generateSlug(trimmedName)

  const existing = await prisma.category.findFirst({
    where: {
      OR: [{ name: trimmedName }, { slug: slug }],
      deletedAt: null,
    },
  })

  if (existing) {
    if (existing.name === trimmedName) {
      throw new ApplicationError("Tên danh mục đã tồn tại", 400)
    }
    if (existing.slug === slug) {
      throw new ApplicationError("Slug đã tồn tại", 400)
    }
  }

  const category = await prisma.category.create({
    data: {
      name: trimmedName,
      slug: slug,
      description: validatedInput.description?.trim() || null,
    },
  })

  const sanitized = sanitizeCategory(category)

  await emitCategoryUpsert(sanitized.id, null)

  await notifySuperAdminsOfCategoryAction("create", ctx.actorId, {
    id: sanitized.id,
    name: sanitized.name,
    slug: sanitized.slug,
  })

  logActionFlow("categories", "create", "success", { categoryId: sanitized.id, categoryName: sanitized.name }, startTime)
  logDetailAction("categories", "create", sanitized.id, sanitized as unknown as Record<string, unknown>)

  return sanitized
}

export const updateCategory = async (ctx: AuthContext, id: string, input: z.infer<typeof UpdateCategorySchema>): Promise<ListedCategory> => {
  const startTime = Date.now()
  logActionFlow("categories", "update", "start", { categoryId: id, actorId: ctx.actorId })
  ensurePermission(ctx, PERMISSIONS.CATEGORIES_UPDATE, PERMISSIONS.CATEGORIES_MANAGE)

  if (!id?.trim()) throw new ApplicationError("ID danh mục không hợp lệ", 400)

  const validatedInput = UpdateCategorySchema.parse(input)
  const existing = await prisma.category.findUnique({ where: { id } })
  if (!existing || existing.deletedAt) throw new NotFoundError("Danh mục không tồn tại")

  const changes: { name?: { old: string; new: string }; slug?: { old: string; new: string }; description?: { old: string | null; new: string | null } } = {}
  const updateData: Prisma.CategoryUpdateInput = {}

  if (validatedInput.name !== undefined) {
    const trimmedName = validatedInput.name.trim()
    if (trimmedName !== existing.name) {
      const nameExists = await prisma.category.findFirst({ where: { name: trimmedName, deletedAt: null, id: { not: id } } })
      if (nameExists) throw new ApplicationError("Tên danh mục đã được sử dụng", 400)
      changes.name = { old: existing.name, new: trimmedName }
    }
    updateData.name = trimmedName
  }

  if (validatedInput.slug !== undefined) {
    const trimmedSlug = validatedInput.slug.trim()
    if (trimmedSlug !== existing.slug) {
      const slugExists = await prisma.category.findFirst({ where: { slug: trimmedSlug, deletedAt: null, id: { not: id } } })
      if (slugExists) throw new ApplicationError("Slug đã được sử dụng", 400)
      changes.slug = { old: existing.slug, new: trimmedSlug }
    }
    updateData.slug = trimmedSlug
  }

  if (validatedInput.description !== undefined) {
    const trimmedDescription = validatedInput.description?.trim() || null
    if (trimmedDescription !== existing.description) changes.description = { old: existing.description, new: trimmedDescription }
    updateData.description = trimmedDescription
  }

  if (Object.keys(updateData).length === 0) {
    const sanitized = sanitizeCategory(existing)
    logActionFlow("categories", "update", "success", { categoryId: sanitized.id, categoryName: sanitized.name, changes: {}, noChanges: true }, startTime)
    return sanitized
  }

  const category = await prisma.category.update({ where: { id }, data: updateData })
  const sanitized = sanitizeCategory(category)
  const previousStatus: "active" | "deleted" | null = existing.deletedAt ? "deleted" : "active"

  await emitCategoryUpsert(sanitized.id, previousStatus)
  await notifySuperAdminsOfCategoryAction("update", ctx.actorId, mapCategoryForNotification(sanitized), Object.keys(changes).length > 0 ? changes : undefined)

  logActionFlow("categories", "update", "success", { categoryId: sanitized.id, categoryName: sanitized.name, changes }, startTime)
  logDetailAction("categories", "update", sanitized.id, { ...sanitized, changes } as unknown as Record<string, unknown>)

  return sanitized
}

export const softDeleteCategory = async (ctx: AuthContext, id: string): Promise<void> => {
  const startTime = Date.now()
  logActionFlow("categories", "delete", "start", { categoryId: id, actorId: ctx.actorId })
  ensurePermission(ctx, PERMISSIONS.CATEGORIES_DELETE, PERMISSIONS.CATEGORIES_MANAGE)

  const category = await prisma.category.findUnique({ where: { id } })
  if (!category || category.deletedAt) throw new NotFoundError("Danh mục không tồn tại")

  await prisma.category.update({ where: { id }, data: { deletedAt: new Date() } })
  await logTableStatusAfterMutation({ resource: "categories", action: "delete", prismaModel: prisma.category, affectedIds: id })
  await emitCategoryUpsert(id, "active")
  await notifySuperAdminsOfCategoryAction("delete", ctx.actorId, mapCategoryForNotification(category))

  logActionFlow("categories", "delete", "success", { categoryId: id, categoryName: category.name }, startTime)
}

export const bulkSoftDeleteCategories = async (ctx: AuthContext, ids: string[]): Promise<BulkActionResult> => {
  const startTime = Date.now()
  logActionFlow("categories", "bulk-delete", "start", { count: ids.length, categoryIds: ids, actorId: ctx.actorId })

  ensurePermission(ctx, PERMISSIONS.CATEGORIES_DELETE, PERMISSIONS.CATEGORIES_MANAGE)
  validateBulkIds(ids, "danh mục")

  const categories = await prisma.category.findMany({ where: { id: { in: ids }, deletedAt: null }, select: { id: true, name: true, slug: true } })

  if (categories.length === 0) {
    const allCategories = await prisma.category.findMany({ where: { id: { in: ids } }, select: { id: true, deletedAt: true } })
    logActionFlow("categories", "bulk-delete", "error", { requestedCount: ids.length, foundCount: categories.length, error: "Không có danh mục nào có thể xóa" }, startTime)
    throw new ApplicationError(buildBulkError(allCategories, ids, "danh mục"), 400)
  }

  const result = await prisma.category.updateMany({
    where: { id: { in: categories.map((c) => c.id) }, deletedAt: null },
    data: { deletedAt: new Date() },
  })

  if (result.count > 0) {
    await logTableStatusAfterMutation({
      resource: "categories",
      action: "bulk-delete",
      prismaModel: prisma.category,
      affectedIds: categories.map((c) => c.id),
      affectedCount: result.count,
    })
    await Promise.allSettled(categories.map((category) => emitCategoryUpsert(category.id, "active").catch(() => null)))
    await notifySuperAdminsOfBulkCategoryAction("delete", ctx.actorId, result.count, categories)
    logActionFlow("categories", "bulk-delete", "success", { requestedCount: ids.length, affectedCount: result.count }, startTime)
  }

  return { success: true, message: `Đã xóa ${result.count} danh mục`, affected: result.count }
}

export const restoreCategory = async (ctx: AuthContext, id: string): Promise<void> => {
  const startTime = Date.now()
  logActionFlow("categories", "restore", "start", { categoryId: id, actorId: ctx.actorId })
  ensurePermission(ctx, PERMISSIONS.CATEGORIES_UPDATE, PERMISSIONS.CATEGORIES_MANAGE)

  const category = await prisma.category.findUnique({ where: { id } })
  if (!category || !category.deletedAt) throw new NotFoundError("Danh mục không tồn tại hoặc chưa bị xóa")

  await prisma.category.update({ where: { id }, data: { deletedAt: null } })
  await logTableStatusAfterMutation({ resource: "categories", action: "restore", prismaModel: prisma.category, affectedIds: id })
  await emitCategoryUpsert(id, "deleted")
  await notifySuperAdminsOfCategoryAction("restore", ctx.actorId, mapCategoryForNotification(category))

  logActionFlow("categories", "restore", "success", { categoryId: id, categoryName: category.name }, startTime)
}

export const bulkRestoreCategories = async (ctx: AuthContext, ids: string[]): Promise<BulkActionResult> => {
  const startTime = Date.now()
  logActionFlow("categories", "bulk-restore", "start", { count: ids.length, categoryIds: ids, actorId: ctx.actorId })

  ensurePermission(ctx, PERMISSIONS.CATEGORIES_UPDATE, PERMISSIONS.CATEGORIES_MANAGE)
  validateBulkIds(ids, "danh mục")

  const allRequestedCategories = await prisma.category.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, slug: true, deletedAt: true } })
  const softDeletedCategories = allRequestedCategories.filter((c) => c.deletedAt !== null)
  const activeCategories = allRequestedCategories.filter((c) => c.deletedAt === null)
  const notFoundCount = ids.length - allRequestedCategories.length

  if (softDeletedCategories.length === 0) {
    const parts: string[] = []
    if (activeCategories.length > 0) parts.push(`${activeCategories.length} danh mục đang hoạt động`)
    if (notFoundCount > 0) parts.push(`${notFoundCount} danh mục không tồn tại (đã bị xóa vĩnh viễn)`)

    const message = parts.length > 0
      ? `Không có danh mục nào để khôi phục (${parts.join(", ")})`
      : `Không tìm thấy danh mục nào để khôi phục`

    return { success: true, message, affected: 0 }
  }

  const result = await prisma.category.updateMany({
    where: { id: { in: softDeletedCategories.map((c) => c.id) }, deletedAt: { not: null } },
    data: { deletedAt: null },
  })

  if (result.count > 0) {
    await logTableStatusAfterMutation({
      resource: "categories",
      action: "bulk-restore",
      prismaModel: prisma.category,
      affectedIds: softDeletedCategories.map((c) => c.id),
      affectedCount: result.count,
    })
    await Promise.allSettled(softDeletedCategories.map((category) => emitCategoryUpsert(category.id, "deleted").catch(() => null)))
    await notifySuperAdminsOfBulkCategoryAction("restore", ctx.actorId, result.count, softDeletedCategories)
    logActionFlow("categories", "bulk-restore", "success", { requestedCount: ids.length, affectedCount: result.count }, startTime)
  }

  let message = `Đã khôi phục ${result.count} danh mục`
  if (result.count < ids.length) {
    const skippedParts: string[] = []
    if (activeCategories.length > 0) skippedParts.push(`${activeCategories.length} danh mục đang hoạt động`)
    if (notFoundCount > 0) skippedParts.push(`${notFoundCount} danh mục đã bị xóa vĩnh viễn`)
    if (skippedParts.length > 0) message += ` (${ids.length - result.count} danh mục không thể khôi phục: ${skippedParts.join(", ")})`
  }

  return { success: true, message, affected: result.count }
}

export const hardDeleteCategory = async (ctx: AuthContext, id: string): Promise<void> => {
  if (!canPerformAnyAction(ctx.permissions, ctx.roles, [PERMISSIONS.CATEGORIES_MANAGE])) throw new ForbiddenError()

  const category = await prisma.category.findUnique({ where: { id }, select: { id: true, name: true, slug: true, deletedAt: true } })
  if (!category) throw new NotFoundError("Danh mục không tồn tại")

  const previousStatus: "active" | "deleted" = category.deletedAt ? "deleted" : "active"
  await prisma.category.delete({ where: { id } })
  emitCategoryRemove(id, previousStatus)
  await notifySuperAdminsOfCategoryAction("hard-delete", ctx.actorId, category)
}

export const bulkHardDeleteCategories = async (ctx: AuthContext, ids: string[]): Promise<BulkActionResult> => {
  const startTime = Date.now()
  logActionFlow("categories", "bulk-hard-delete", "start", { count: ids.length, categoryIds: ids, actorId: ctx.actorId })

  if (!canPerformAnyAction(ctx.permissions, ctx.roles, [PERMISSIONS.CATEGORIES_MANAGE])) throw new ForbiddenError()
  validateBulkIds(ids, "danh mục")

  const categories = await prisma.category.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, slug: true, deletedAt: true } })
  const result = await prisma.category.deleteMany({ where: { id: { in: ids } } })

  if (result.count > 0) {
    categories.forEach((category) => {
      const previousStatus: "active" | "deleted" = category.deletedAt ? "deleted" : "active"
      try {
        emitCategoryRemove(category.id, previousStatus)
      } catch (error) {
        logActionFlow("categories", "bulk-hard-delete", "error", {
          categoryId: category.id,
          error: error instanceof Error ? error.message : String(error),
        }, startTime)
      }
    })
    await notifySuperAdminsOfBulkCategoryAction("hard-delete", ctx.actorId, result.count, categories)
    logActionFlow("categories", "bulk-hard-delete", "success", { requestedCount: ids.length, affectedCount: result.count }, startTime)
  }

  return { success: true, message: `Đã xóa vĩnh viễn ${result.count} danh mục${result.count < categories.length ? ` (${categories.length - result.count} danh mục không tồn tại)` : ""}`, affected: result.count }
}
