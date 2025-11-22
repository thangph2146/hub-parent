"use server"

import type { Prisma } from "@prisma/client"
import { PERMISSIONS, canPerformAnyAction } from "@/lib/permissions"
import { prisma } from "@/lib/database"
import { resourceLogger } from "@/lib/config"
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
  invalidateResourceCache,
  invalidateResourceCacheBulk,
  type AuthContext,
} from "@/features/admin/resources/server"
import { z } from "zod"

// Re-export for backward compatibility with API routes
export { ApplicationError, ForbiddenError, NotFoundError, type AuthContext }

function sanitizeCategory(category: CategoryWithRelations): ListedCategory {
  return mapCategoryRecord(category)
}

export async function createCategory(ctx: AuthContext, input: z.infer<typeof CreateCategorySchema>): Promise<ListedCategory> {
  const startTime = Date.now()
  
  resourceLogger.actionFlow({
    resource: "categories",
    action: "create",
    step: "start",
    metadata: { actorId: ctx.actorId, input: { name: input.name, slug: input.slug } },
  })

  ensurePermission(ctx, PERMISSIONS.CATEGORIES_CREATE, PERMISSIONS.CATEGORIES_MANAGE)

  // Validate input với zod
  const validatedInput = CreateCategorySchema.parse(input)

  const trimmedName = validatedInput.name.trim()
  // Generate slug if not provided
  const slug = validatedInput.slug?.trim() || generateSlug(trimmedName)

  // Check if name or slug already exists
  const existing = await prisma.category.findFirst({
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

  // Invalidate cache - Next.js 16 caching pattern
  resourceLogger.cache({
    resource: "categories",
    action: "cache-invalidate",
    operation: "invalidate",
    resourceId: sanitized.id,
    tags: ["categories", `category-${sanitized.id}`, "category-options", "active-categories"],
  })
  await invalidateResourceCache({
    resource: "categories",
    id: sanitized.id,
    additionalTags: ["category-options", "active-categories"],
  })

  // Emit socket event for real-time updates
  resourceLogger.socket({
    resource: "categories",
    action: "create",
    event: "category:upsert",
    resourceId: sanitized.id,
    payload: { id: sanitized.id, previousStatus: null },
  })
  await emitCategoryUpsert(sanitized.id, null)

  // Emit notification realtime
  await notifySuperAdminsOfCategoryAction(
    "create",
    ctx.actorId,
    {
      id: sanitized.id,
      name: sanitized.name,
      slug: sanitized.slug,
    }
  )

  resourceLogger.actionFlow({
    resource: "categories",
    action: "create",
    step: "success",
    duration: Date.now() - startTime,
    metadata: { categoryId: sanitized.id, categoryName: sanitized.name },
  })

  resourceLogger.detailAction({
    resource: "categories",
    action: "create",
    resourceId: sanitized.id,
    categoryName: sanitized.name,
    categorySlug: sanitized.slug,
  })

  return sanitized
}

export async function updateCategory(ctx: AuthContext, id: string, input: z.infer<typeof UpdateCategorySchema>): Promise<ListedCategory> {
  const startTime = Date.now()
  
  resourceLogger.actionFlow({
    resource: "categories",
    action: "update",
    step: "start",
    metadata: { categoryId: id, actorId: ctx.actorId },
  })

  ensurePermission(ctx, PERMISSIONS.CATEGORIES_UPDATE, PERMISSIONS.CATEGORIES_MANAGE)

  if (!id || typeof id !== "string" || id.trim() === "") {
    throw new ApplicationError("ID danh mục không hợp lệ", 400)
  }

  // Validate input với zod
  const validatedInput = UpdateCategorySchema.parse(input)

  const existing = await prisma.category.findUnique({
    where: { id },
  })

  if (!existing || existing.deletedAt) {
    throw new NotFoundError("Danh mục không tồn tại")
  }

  // Track changes for notification
  const changes: {
    name?: { old: string; new: string }
    slug?: { old: string; new: string }
    description?: { old: string | null; new: string | null }
  } = {}

  const updateData: Prisma.CategoryUpdateInput = {}

  if (validatedInput.name !== undefined) {
    const trimmedName = validatedInput.name.trim()
    // Check if name is already used by another category
    if (trimmedName !== existing.name) {
      const nameExists = await prisma.category.findFirst({
        where: {
          name: trimmedName,
          deletedAt: null,
          id: { not: id },
        },
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
    // Check if slug is already used by another category
    if (trimmedSlug !== existing.slug) {
      const slugExists = await prisma.category.findFirst({
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

  if (validatedInput.description !== undefined) {
    const trimmedDescription = validatedInput.description?.trim() || null
    if (trimmedDescription !== existing.description) {
      changes.description = { old: existing.description, new: trimmedDescription }
    }
    updateData.description = trimmedDescription
  }

  // Chỉ update nếu có thay đổi
  if (Object.keys(updateData).length === 0) {
    // Không có thay đổi, trả về category hiện tại
    const sanitized = sanitizeCategory(existing)
    resourceLogger.actionFlow({
      resource: "categories",
      action: "update",
      step: "success",
      duration: Date.now() - startTime,
      metadata: { categoryId: sanitized.id, categoryName: sanitized.name, changes: {}, noChanges: true },
    })
    return sanitized
  }

  const category = await prisma.category.update({
    where: { id },
    data: updateData,
  })

  const sanitized = sanitizeCategory(category)

  // Invalidate cache - Next.js 16 caching pattern
  resourceLogger.cache({
    resource: "categories",
    action: "cache-invalidate",
    operation: "invalidate",
    resourceId: id,
    tags: ["categories", `category-${id}`, "category-options", "active-categories"],
  })
  await invalidateResourceCache({
    resource: "categories",
    id,
    additionalTags: ["category-options", "active-categories"],
  })

  // Determine previous status for socket event
  const previousStatus: "active" | "deleted" | null = existing.deletedAt ? "deleted" : "active"

  // Emit socket event for real-time updates
  resourceLogger.socket({
    resource: "categories",
    action: "update",
    event: "category:upsert",
    resourceId: sanitized.id,
    payload: { id: sanitized.id, previousStatus },
  })
  await emitCategoryUpsert(sanitized.id, previousStatus)

  // Emit notification realtime
  await notifySuperAdminsOfCategoryAction(
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
    resource: "categories",
    action: "update",
    step: "success",
    duration: Date.now() - startTime,
    metadata: { categoryId: sanitized.id, categoryName: sanitized.name, changes },
  })

  resourceLogger.detailAction({
    resource: "categories",
    action: "update",
    resourceId: sanitized.id,
    categoryName: sanitized.name,
    categorySlug: sanitized.slug,
    changes,
  })

  return sanitized
}

export async function softDeleteCategory(ctx: AuthContext, id: string): Promise<void> {
  const startTime = Date.now()
  
  resourceLogger.actionFlow({
    resource: "categories",
    action: "delete",
    step: "start",
    metadata: { categoryId: id, actorId: ctx.actorId },
  })

  ensurePermission(ctx, PERMISSIONS.CATEGORIES_DELETE, PERMISSIONS.CATEGORIES_MANAGE)

  const category = await prisma.category.findUnique({ where: { id } })
  if (!category || category.deletedAt) {
    throw new NotFoundError("Danh mục không tồn tại")
  }

  await prisma.category.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  })

  // Invalidate cache
  resourceLogger.cache({
    resource: "categories",
    action: "cache-invalidate",
    operation: "invalidate",
    resourceId: id,
    tags: ["categories", `category-${id}`, "category-options", "active-categories"],
  })
  await invalidateResourceCache({
    resource: "categories",
    id,
    additionalTags: ["category-options", "active-categories"],
  })

  // Emit socket event for real-time updates
  resourceLogger.socket({
    resource: "categories",
    action: "delete",
    event: "category:upsert",
    resourceId: id,
    payload: { id, previousStatus: "active" },
  })
  await emitCategoryUpsert(id, "active")

  // Emit notification realtime
  await notifySuperAdminsOfCategoryAction(
    "delete",
    ctx.actorId,
    {
      id: category.id,
      name: category.name,
      slug: category.slug,
    }
  )

  resourceLogger.actionFlow({
    resource: "categories",
    action: "delete",
    step: "success",
    duration: Date.now() - startTime,
    metadata: { categoryId: id, categoryName: category.name },
  })
}

export async function bulkSoftDeleteCategories(ctx: AuthContext, ids: string[]): Promise<BulkActionResult> {
  const startTime = Date.now()
  
  resourceLogger.actionFlow({
    resource: "categories",
    action: "bulk-delete",
    step: "start",
    metadata: { count: ids.length, categoryIds: ids, actorId: ctx.actorId },
  })

  ensurePermission(ctx, PERMISSIONS.CATEGORIES_DELETE, PERMISSIONS.CATEGORIES_MANAGE)

  if (!ids || ids.length === 0) {
    throw new ApplicationError("Danh sách danh mục trống", 400)
  }

  // Lấy thông tin categories trước khi delete để tạo notifications
  const categories = await prisma.category.findMany({
    where: {
      id: { in: ids },
      deletedAt: null,
    },
    select: { id: true, name: true, slug: true },
  })

  const foundIds = categories.map(c => c.id)
  const notFoundIds = ids.filter(id => !foundIds.includes(id))
  
  // Log để debug với đầy đủ thông tin
  resourceLogger.actionFlow({
    resource: "categories",
    action: "bulk-delete",
    step: "start",
    metadata: {
      requestedCount: ids.length,
      foundCount: categories.length,
      notFoundCount: notFoundIds.length,
      requestedIds: ids,
      foundIds,
      notFoundIds,
    },
  })

  // Nếu không tìm thấy category nào, trả về error message chi tiết
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
    
    resourceLogger.actionFlow({
      resource: "categories",
      action: "bulk-delete",
      step: "error",
      metadata: {
        requestedCount: ids.length,
        foundCount: categories.length,
        alreadyDeletedCount,
        notFoundCount,
        error: errorMessage,
      },
    })
    
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

  // Invalidate cache cho bulk operation
  resourceLogger.cache({
    resource: "categories",
    action: "cache-invalidate",
    operation: "invalidate",
    tags: ["categories", "category-options", "active-categories"],
  })
  await invalidateResourceCacheBulk({
    resource: "categories",
    additionalTags: ["category-options", "active-categories"],
  })

  // Emit socket events và tạo bulk notification
  if (result.count > 0 && categories.length > 0) {
    // Emit events song song
    const emitPromises = categories.map((category) => 
      emitCategoryUpsert(category.id, "active").catch((error) => {
        resourceLogger.actionFlow({
          resource: "categories",
          action: "bulk-delete",
          step: "error",
          metadata: { categoryId: category.id, error: error instanceof Error ? error.message : String(error) },
        })
        return null
      })
    )
    await Promise.allSettled(emitPromises)

    // Tạo bulk notification với tên records
    await notifySuperAdminsOfBulkCategoryAction(
      "delete",
      ctx.actorId,
      result.count,
      categories
    )

    resourceLogger.actionFlow({
      resource: "categories",
      action: "bulk-delete",
      step: "success",
      duration: Date.now() - startTime,
      metadata: { requestedCount: ids.length, affectedCount: result.count },
    })
  }

  return { success: true, message: `Đã xóa ${result.count} danh mục`, affected: result.count }
}

export async function restoreCategory(ctx: AuthContext, id: string): Promise<void> {
  const startTime = Date.now()
  
  resourceLogger.actionFlow({
    resource: "categories",
    action: "restore",
    step: "start",
    metadata: { categoryId: id, actorId: ctx.actorId },
  })

  ensurePermission(ctx, PERMISSIONS.CATEGORIES_UPDATE, PERMISSIONS.CATEGORIES_MANAGE)

  const category = await prisma.category.findUnique({ where: { id } })
  if (!category || !category.deletedAt) {
    throw new NotFoundError("Danh mục không tồn tại hoặc chưa bị xóa")
  }

  await prisma.category.update({
    where: { id },
    data: {
      deletedAt: null,
    },
  })

  // Invalidate cache
  resourceLogger.cache({
    resource: "categories",
    action: "cache-invalidate",
    operation: "invalidate",
    resourceId: id,
    tags: ["categories", `category-${id}`, "category-options", "active-categories"],
  })
  await invalidateResourceCache({
    resource: "categories",
    id,
    additionalTags: ["category-options", "active-categories"],
  })

  // Emit socket event for real-time updates
  resourceLogger.socket({
    resource: "categories",
    action: "restore",
    event: "category:upsert",
    resourceId: id,
    payload: { id, previousStatus: "deleted" },
  })
  await emitCategoryUpsert(id, "deleted")

  // Emit notification realtime
  await notifySuperAdminsOfCategoryAction(
    "restore",
    ctx.actorId,
    {
      id: category.id,
      name: category.name,
      slug: category.slug,
    }
  )

  resourceLogger.actionFlow({
    resource: "categories",
    action: "restore",
    step: "success",
    duration: Date.now() - startTime,
    metadata: { categoryId: id, categoryName: category.name },
  })
}

export async function bulkRestoreCategories(ctx: AuthContext, ids: string[]): Promise<BulkActionResult> {
  const startTime = Date.now()
  
  resourceLogger.actionFlow({
    resource: "categories",
    action: "bulk-restore",
    step: "start",
    metadata: { count: ids.length, categoryIds: ids, actorId: ctx.actorId },
  })

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

  // Invalidate cache cho bulk operation
  resourceLogger.cache({
    resource: "categories",
    action: "cache-invalidate",
    operation: "invalidate",
    tags: ["categories", "category-options", "active-categories"],
  })
  await invalidateResourceCacheBulk({
    resource: "categories",
    additionalTags: ["category-options", "active-categories"],
  })

  // Emit socket events và tạo bulk notification
  if (result.count > 0 && categoriesToRestore.length > 0) {
    // Emit events song song
    const emitPromises = categoriesToRestore.map((category) => 
      emitCategoryUpsert(category.id, "deleted").catch((error) => {
        resourceLogger.actionFlow({
          resource: "categories",
          action: "bulk-restore",
          step: "error",
          metadata: { categoryId: category.id, error: error instanceof Error ? error.message : String(error) },
        })
        return null
      })
    )
    await Promise.allSettled(emitPromises)

    // Tạo bulk notification với tên records
    await notifySuperAdminsOfBulkCategoryAction(
      "restore",
      ctx.actorId,
      result.count,
      categoriesToRestore
    )

    resourceLogger.actionFlow({
      resource: "categories",
      action: "bulk-restore",
      step: "success",
      duration: Date.now() - startTime,
      metadata: { requestedCount: ids.length, affectedCount: result.count },
    })
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

export async function hardDeleteCategory(ctx: AuthContext, id: string): Promise<void> {
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

  // Invalidate cache
  await invalidateResourceCache({
    resource: "categories",
    id,
    additionalTags: ["category-options", "active-categories"],
  })
}

export async function bulkHardDeleteCategories(ctx: AuthContext, ids: string[]): Promise<BulkActionResult> {
  const startTime = Date.now()
  
  resourceLogger.actionFlow({
    resource: "categories",
    action: "bulk-hard-delete",
    step: "start",
    metadata: { count: ids.length, categoryIds: ids, actorId: ctx.actorId },
  })

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
        resourceLogger.actionFlow({
          resource: "categories",
          action: "bulk-hard-delete",
          step: "error",
          metadata: { categoryId: category.id, error: error instanceof Error ? error.message : String(error) },
        })
      }
    })

    // Tạo bulk notification với tên records
    await notifySuperAdminsOfBulkCategoryAction(
      "hard-delete",
      ctx.actorId,
      result.count,
      categories
    )

    resourceLogger.actionFlow({
      resource: "categories",
      action: "bulk-hard-delete",
      step: "success",
      duration: Date.now() - startTime,
      metadata: { requestedCount: ids.length, affectedCount: result.count },
    })
  }

  // Invalidate cache cho bulk operation
  resourceLogger.cache({
    resource: "categories",
    action: "cache-invalidate",
    operation: "invalidate",
    tags: ["categories", "category-options", "active-categories"],
  })
  await invalidateResourceCacheBulk({
    resource: "categories",
    additionalTags: ["category-options", "active-categories"],
  })

  return { success: true, message: `Đã xóa vĩnh viễn ${result.count} danh mục${result.count < categories.length ? ` (${categories.length - result.count} danh mục không tồn tại)` : ""}`, affected: result.count }
}
