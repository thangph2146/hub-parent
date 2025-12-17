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
  type AuthContext,
} from "@/features/admin/resources/server"
import { z } from "zod"

// Re-export for backward compatibility with API routes
export { ApplicationError, ForbiddenError, NotFoundError, type AuthContext }

const sanitizeCategory = (category: CategoryWithRelations): ListedCategory => {
  return mapCategoryRecord(category)
}

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

  if (!id || typeof id !== "string" || id.trim() === "") {
    throw new ApplicationError("ID danh mục không hợp lệ", 400)
  }

  const validatedInput = UpdateCategorySchema.parse(input)
  const existing = await prisma.category.findUnique({ where: { id } })

  if (!existing || existing.deletedAt) {
    throw new NotFoundError("Danh mục không tồn tại")
  }

  const changes: {
    name?: { old: string; new: string }
    slug?: { old: string; new: string }
    description?: { old: string | null; new: string | null }
  } = {}
  const updateData: Prisma.CategoryUpdateInput = {}

  if (validatedInput.name !== undefined) {
    const trimmedName = validatedInput.name.trim()
    if (trimmedName !== existing.name) {
      const nameExists = await prisma.category.findFirst({
        where: { name: trimmedName, deletedAt: null, id: { not: id } },
      })
      if (nameExists) {
        throw new ApplicationError("Tên danh mục đã được sử dụng", 400)
      }
      changes.name = { old: existing.name, new: trimmedName }
    }
    updateData.name = trimmedName
  }

  if (validatedInput.slug !== undefined) {
    const trimmedSlug = validatedInput.slug.trim()
    if (trimmedSlug !== existing.slug) {
      const slugExists = await prisma.category.findFirst({
        where: { slug: trimmedSlug, deletedAt: null, id: { not: id } },
      })
      if (slugExists) {
        throw new ApplicationError("Slug đã được sử dụng", 400)
      }
      changes.slug = { old: existing.slug, new: trimmedSlug }
    }
    updateData.slug = trimmedSlug
  }

  if (validatedInput.description !== undefined) {
    const trimmedDescription = validatedInput.description?.trim() || null
    if (trimmedDescription !== existing.description) {
      changes.description = { old: existing.description, new: trimmedDescription }
    }
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

  await notifySuperAdminsOfCategoryAction("update", ctx.actorId, {
    id: sanitized.id,
    name: sanitized.name,
    slug: sanitized.slug,
  }, Object.keys(changes).length > 0 ? changes : undefined)

  logActionFlow("categories", "update", "success", { categoryId: sanitized.id, categoryName: sanitized.name, changes }, startTime)
  logDetailAction("categories", "update", sanitized.id, { ...sanitized, changes } as unknown as Record<string, unknown>)

  return sanitized
}

export const softDeleteCategory = async (ctx: AuthContext, id: string): Promise<void> => {
  const startTime = Date.now()
  
  logActionFlow("categories", "delete", "start", { categoryId: id, actorId: ctx.actorId })
  ensurePermission(ctx, PERMISSIONS.CATEGORIES_DELETE, PERMISSIONS.CATEGORIES_MANAGE)

  const category = await prisma.category.findUnique({ where: { id } })
  if (!category || category.deletedAt) {
    throw new NotFoundError("Danh mục không tồn tại")
  }

  await prisma.category.update({ where: { id }, data: { deletedAt: new Date() } })

  await logTableStatusAfterMutation({
    resource: "categories",
    action: "delete",
    prismaModel: prisma.category,
    affectedIds: id,
  })

  await emitCategoryUpsert(id, "active")

  await notifySuperAdminsOfCategoryAction("delete", ctx.actorId, {
    id: category.id,
    name: category.name,
    slug: category.slug,
  })

  logActionFlow("categories", "delete", "success", { categoryId: id, categoryName: category.name }, startTime)
}

export const bulkSoftDeleteCategories = async (ctx: AuthContext, ids: string[]): Promise<BulkActionResult> => {
  const startTime = Date.now()
  logActionFlow("categories", "bulk-delete", "start", { count: ids.length, categoryIds: ids, actorId: ctx.actorId })

  ensurePermission(ctx, PERMISSIONS.CATEGORIES_DELETE, PERMISSIONS.CATEGORIES_MANAGE)

  if (!ids || ids.length === 0) {
    logActionFlow("categories", "bulk-delete", "error", { error: "Danh sách danh mục trống" }, startTime)
    throw new ApplicationError("Danh sách danh mục trống", 400)
  }

  const categories = await prisma.category.findMany({
    where: {
      id: { in: ids },
      deletedAt: null,
    },
    select: { id: true, name: true, slug: true },
  })

  const foundIds = categories.map(c => c.id)
  const _notFoundIds = ids.filter(id => !foundIds.includes(id))

  if (categories.length === 0) {
    const allCategories = await prisma.category.findMany({
      where: { id: { in: ids } },
      select: { id: true, deletedAt: true },
    })
    const alreadyDeletedCount = allCategories.filter(c => c.deletedAt !== null).length
    const notFoundCount = ids.length - allCategories.length
    
    let errorMessage = "Không có danh mục nào có thể xóa"
    if (alreadyDeletedCount > 0) {
      errorMessage += `. ${alreadyDeletedCount} danh mục đã bị xóa trước đó`
    }
    if (notFoundCount > 0) {
      errorMessage += `. ${notFoundCount} danh mục không tồn tại`
    }
    
    logActionFlow("categories", "bulk-delete", "error", {
      requestedCount: ids.length,
      foundCount: categories.length,
      alreadyDeletedCount,
      notFoundCount,
      error: errorMessage,
    }, startTime)
    
    throw new ApplicationError(errorMessage, 400)
  }

  const result = await prisma.category.updateMany({
    where: {
      id: { in: categories.map(c => c.id) },
      deletedAt: null,
    },
    data: {
      deletedAt: new Date(),
    },
  })

  if (result.count > 0) {
    await logTableStatusAfterMutation({
      resource: "categories",
      action: "bulk-delete",
      prismaModel: prisma.category,
      affectedIds: categories.map(c => c.id),
      affectedCount: result.count,
    })
  }

  // Emit socket events và tạo bulk notification
  if (result.count > 0 && categories.length > 0) {
    try {
      await Promise.allSettled(
        categories.map((category) => emitCategoryUpsert(category.id, "active").catch((error) => {
          logActionFlow("categories", "bulk-delete", "error", {
            categoryId: category.id,
            error: error instanceof Error ? error.message : String(error),
          }, startTime)
          return null
        }))
      )
    } catch (error) {
      logActionFlow("categories", "bulk-delete", "error", {
        error: error instanceof Error ? error.message : String(error),
        count: result.count,
      }, startTime)
    }

    try {
      await notifySuperAdminsOfBulkCategoryAction("delete", ctx.actorId, result.count, categories)
    } catch (error) {
      logActionFlow("categories", "bulk-delete", "error", {
        error: error instanceof Error ? error.message : String(error),
        notificationError: true,
      }, startTime)
    }

    logActionFlow("categories", "bulk-delete", "success", { requestedCount: ids.length, affectedCount: result.count }, startTime)
  }

  return { success: true, message: `Đã xóa ${result.count} danh mục`, affected: result.count }
}

export const restoreCategory = async (ctx: AuthContext, id: string): Promise<void> => {
  const startTime = Date.now()
  
  logActionFlow("categories", "restore", "start", { categoryId: id, actorId: ctx.actorId })
  ensurePermission(ctx, PERMISSIONS.CATEGORIES_UPDATE, PERMISSIONS.CATEGORIES_MANAGE)

  const category = await prisma.category.findUnique({ where: { id } })
  if (!category || !category.deletedAt) {
    throw new NotFoundError("Danh mục không tồn tại hoặc chưa bị xóa")
  }

  await prisma.category.update({ where: { id }, data: { deletedAt: null } })

  await logTableStatusAfterMutation({
    resource: "categories",
    action: "restore",
    prismaModel: prisma.category,
    affectedIds: id,
  })

  await emitCategoryUpsert(id, "deleted")

  await notifySuperAdminsOfCategoryAction("restore", ctx.actorId, {
    id: category.id,
    name: category.name,
    slug: category.slug,
  })

  logActionFlow("categories", "restore", "success", { categoryId: id, categoryName: category.name }, startTime)
}

export const bulkRestoreCategories = async (ctx: AuthContext, ids: string[]): Promise<BulkActionResult> => {
  const startTime = Date.now()
  logActionFlow("categories", "bulk-restore", "start", { count: ids.length, categoryIds: ids, actorId: ctx.actorId })

  ensurePermission(ctx, PERMISSIONS.CATEGORIES_UPDATE, PERMISSIONS.CATEGORIES_MANAGE)

  if (!ids || ids.length === 0) {
    throw new ApplicationError("Danh sách danh mục trống", 400)
  }

  // Tìm tất cả categories được request để phân loại trạng thái
  // Prisma findMany mặc định KHÔNG filter theo deletedAt, nên sẽ tìm thấy cả soft-deleted và active categories
  // Nhưng KHÔNG tìm thấy hard-deleted categories (đã bị xóa vĩnh viễn khỏi database)
  // Sử dụng findMany mà KHÔNG filter theo deletedAt để tìm được tất cả categories (kể cả đã bị soft delete)
  const allRequestedCategories = await prisma.category.findMany({
    where: {
      id: { in: ids },
      // KHÔNG filter theo deletedAt ở đây để tìm được cả soft-deleted và active categories
    },
    select: { id: true, name: true, slug: true, deletedAt: true },
  })

  // Phân loại categories
  const softDeletedCategories = allRequestedCategories.filter((c) => c.deletedAt !== null)
  const activeCategories = allRequestedCategories.filter((c) => c.deletedAt === null)
  const notFoundCount = ids.length - allRequestedCategories.length

  // Nếu không có category nào đã bị soft delete, trả về message chi tiết
  if (softDeletedCategories.length === 0) {
    const parts: string[] = []
    if (activeCategories.length > 0) {
      parts.push(`${activeCategories.length} danh mục đang hoạt động`)
    }
    if (notFoundCount > 0) {
      parts.push(`${notFoundCount} danh mục không tồn tại (đã bị xóa vĩnh viễn)`)
    }

    const message = parts.length > 0
      ? `Không có danh mục nào để khôi phục (${parts.join(", ")})`
      : `Không tìm thấy danh mục nào để khôi phục`

    return { 
      success: true, 
      message, 
      affected: 0 
    }
  }

  // Chỉ restore những categories đã bị soft delete
  const categoriesToRestore = softDeletedCategories

  const result = await prisma.category.updateMany({
    where: {
      id: { in: categoriesToRestore.map(c => c.id) },
      deletedAt: { not: null },
    },
    data: {
      deletedAt: null,
    },
  })

  if (result.count > 0) {
    await logTableStatusAfterMutation({
      resource: "categories",
      action: "bulk-restore",
      prismaModel: prisma.category,
      affectedIds: categoriesToRestore.map(c => c.id),
      affectedCount: result.count,
    })
  }

  // Emit socket events và tạo bulk notification
  if (result.count > 0 && categoriesToRestore.length > 0) {
    try {
      await Promise.allSettled(
        categoriesToRestore.map((category) => emitCategoryUpsert(category.id, "deleted").catch((error) => {
          logActionFlow("categories", "bulk-restore", "error", {
            categoryId: category.id,
            error: error instanceof Error ? error.message : String(error),
          }, startTime)
          return null
        }))
      )
    } catch (error) {
      logActionFlow("categories", "bulk-restore", "error", {
        error: error instanceof Error ? error.message : String(error),
        count: result.count,
      }, startTime)
    }

    try {
      await notifySuperAdminsOfBulkCategoryAction("restore", ctx.actorId, result.count, categoriesToRestore)
    } catch (error) {
      logActionFlow("categories", "bulk-restore", "error", {
        error: error instanceof Error ? error.message : String(error),
        notificationError: true,
      }, startTime)
    }

    logActionFlow("categories", "bulk-restore", "success", { requestedCount: ids.length, affectedCount: result.count }, startTime)
  }

  // Tạo message chi tiết nếu có categories không thể restore
  let message = `Đã khôi phục ${result.count} danh mục`
  if (result.count < ids.length) {
    const skippedCount = ids.length - result.count
    const skippedParts: string[] = []
    if (activeCategories.length > 0) {
      skippedParts.push(`${activeCategories.length} danh mục đang hoạt động`)
    }
    if (notFoundCount > 0) {
      skippedParts.push(`${notFoundCount} danh mục đã bị xóa vĩnh viễn`)
    }
    if (skippedParts.length > 0) {
      message += ` (${skippedCount} danh mục không thể khôi phục: ${skippedParts.join(", ")})`
    }
  }

  return { success: true, message, affected: result.count }
}

export const hardDeleteCategory = async (ctx: AuthContext, id: string): Promise<void> => {
  if (!canPerformAnyAction(ctx.permissions, ctx.roles, [PERMISSIONS.CATEGORIES_MANAGE])) {
    throw new ForbiddenError()
  }

  const category = await prisma.category.findUnique({
    where: { id },
    select: { id: true, name: true, slug: true, deletedAt: true },
  })

  if (!category) {
    throw new NotFoundError("Danh mục không tồn tại")
  }

  const previousStatus: "active" | "deleted" = category.deletedAt ? "deleted" : "active"
  
  await prisma.category.delete({
    where: { id },
  })

  // Emit socket event for real-time updates
  emitCategoryRemove(id, previousStatus)

  // Emit notification realtime
  await notifySuperAdminsOfCategoryAction(
    "hard-delete",
    ctx.actorId,
    category
  )

}

export const bulkHardDeleteCategories = async (ctx: AuthContext, ids: string[]): Promise<BulkActionResult> => {
  const startTime = Date.now()
  logActionFlow("categories", "bulk-hard-delete", "start", { count: ids.length, categoryIds: ids, actorId: ctx.actorId })

  if (!canPerformAnyAction(ctx.permissions, ctx.roles, [PERMISSIONS.CATEGORIES_MANAGE])) {
    throw new ForbiddenError()
  }

  if (!ids || ids.length === 0) {
    throw new ApplicationError("Danh sách danh mục trống", 400)
  }

  // Lấy thông tin categories trước khi delete để tạo notifications và socket events
  const categories = await prisma.category.findMany({
    where: {
      id: { in: ids },
    },
    select: { id: true, name: true, slug: true, deletedAt: true },
  })

  const result = await prisma.category.deleteMany({
    where: {
      id: { in: ids },
    },
  })

  // Emit socket events và tạo bulk notification
  if (result.count > 0) {
    // Emit events (emitCategoryRemove trả về void, không phải Promise)
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

    try {
      await notifySuperAdminsOfBulkCategoryAction("hard-delete", ctx.actorId, result.count, categories)
    } catch (error) {
      logActionFlow("categories", "bulk-hard-delete", "error", {
        error: error instanceof Error ? error.message : String(error),
        notificationError: true,
      }, startTime)
    }

    logActionFlow("categories", "bulk-hard-delete", "success", { requestedCount: ids.length, affectedCount: result.count }, startTime)
  }

  // Invalidate cache cho bulk operation
  return { success: true, message: `Đã xóa vĩnh viễn ${result.count} danh mục${result.count < categories.length ? ` (${categories.length - result.count} danh mục không tồn tại)` : ""}`, affected: result.count }
}
