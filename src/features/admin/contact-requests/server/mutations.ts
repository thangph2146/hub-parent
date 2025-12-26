"use server"

import type { Prisma } from "@prisma/client"
import { PERMISSIONS, canPerformAnyAction } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { mapContactRequestRecord, type ContactRequestWithRelations } from "./helpers"
import type { ListedContactRequest } from "../types"
import type { BulkActionResult } from "../types"
import {
  CreateContactRequestSchema,
  UpdateContactRequestSchema,
  AssignContactRequestSchema,
  type CreateContactRequestInput,
  type UpdateContactRequestInput,
  type AssignContactRequestInput,
} from "./schemas"
import {
  notifySuperAdminsOfContactRequestAction,
  notifySuperAdminsOfBulkContactRequestAction,
  notifyUserOfContactRequestAssignment,
  formatContactRequestNames,
} from "./notifications"
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
import { emitContactRequestUpsert, emitContactRequestRemove, emitContactRequestAssigned, emitContactRequestBatchUpsert } from "./events"

// Re-export for backward compatibility with API routes
export { ApplicationError, ForbiddenError, NotFoundError, type AuthContext }
export type { BulkActionResult }

const sanitizeContactRequest = (contactRequest: ContactRequestWithRelations): ListedContactRequest => {
  return mapContactRequestRecord(contactRequest)
}

export const createContactRequest = async (ctx: AuthContext, input: CreateContactRequestInput): Promise<ListedContactRequest> => {
  ensurePermission(ctx, PERMISSIONS.CONTACT_REQUESTS_UPDATE, PERMISSIONS.CONTACT_REQUESTS_MANAGE)

  const startTime = Date.now()
  logActionFlow("contact-requests", "create", "init", { actorId: ctx.actorId })

  const validatedInput = CreateContactRequestSchema.parse(input)
  logActionFlow("contact-requests", "create", "start", { subject: validatedInput.subject }, startTime)

  const contactRequest = await prisma.contactRequest.create({
    data: {
      name: validatedInput.name.trim(),
      email: validatedInput.email.trim(),
      phone: validatedInput.phone?.trim() || null,
      subject: validatedInput.subject.trim(),
      content: validatedInput.content.trim(),
      status: validatedInput.status || "NEW",
      priority: validatedInput.priority || "MEDIUM",
      userId: ctx.actorId !== "unknown" ? ctx.actorId : null,
    },
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  const sanitized = sanitizeContactRequest(contactRequest)

  await notifySuperAdminsOfContactRequestAction(
    "create",
    ctx.actorId,
    {
      id: sanitized.id,
      subject: sanitized.subject,
      name: sanitized.name,
      email: sanitized.email,
    }
  )

  return sanitized
}

export const updateContactRequest = async (ctx: AuthContext, id: string, input: UpdateContactRequestInput): Promise<ListedContactRequest> => {
  ensurePermission(ctx, PERMISSIONS.CONTACT_REQUESTS_UPDATE, PERMISSIONS.CONTACT_REQUESTS_MANAGE)

  const startTime = Date.now()
  logActionFlow("contact-requests", "update", "init", { contactRequestId: id, actorId: ctx.actorId })

  if (!id || typeof id !== "string" || id.trim() === "") {
    logActionFlow("contact-requests", "update", "error", { contactRequestId: id, error: "ID yêu cầu liên hệ không hợp lệ" }, startTime)
    throw new ApplicationError("ID yêu cầu liên hệ không hợp lệ", 400)
  }

  const validatedInput = UpdateContactRequestSchema.parse(input)
  logActionFlow("contact-requests", "update", "start", { contactRequestId: id, changes: Object.keys(validatedInput) }, startTime)

  const existing = await prisma.contactRequest.findUnique({
    where: { id },
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  if (!existing || existing.deletedAt) {
    logActionFlow("contact-requests", "update", "error", { contactRequestId: id, error: "Yêu cầu liên hệ không tồn tại" }, startTime)
    throw new NotFoundError("Yêu cầu liên hệ không tồn tại")
  }

  const changes: {
    status?: { old: string; new: string }
    priority?: { old: string; new: string }
    assignedToId?: { old: string | null; new: string | null }
  } = {}

  const updateData: Prisma.ContactRequestUpdateInput = {}

  if (validatedInput.name !== undefined) {
    const trimmedName = validatedInput.name.trim()
    if (trimmedName !== existing.name) {
      updateData.name = trimmedName
    }
  }

  if (validatedInput.email !== undefined) {
    const trimmedEmail = validatedInput.email.trim()
    if (trimmedEmail !== existing.email) {
      updateData.email = trimmedEmail
    }
  }

  if (validatedInput.phone !== undefined) {
    const trimmedPhone = validatedInput.phone?.trim() || null
    if (trimmedPhone !== existing.phone) {
      updateData.phone = trimmedPhone
    }
  }

  if (validatedInput.subject !== undefined) {
    const trimmedSubject = validatedInput.subject.trim()
    if (trimmedSubject !== existing.subject) {
      updateData.subject = trimmedSubject
    }
  }

  if (validatedInput.content !== undefined) {
    const trimmedContent = validatedInput.content.trim()
    if (trimmedContent !== existing.content) {
      updateData.content = trimmedContent
    }
  }

  if (validatedInput.status !== undefined && validatedInput.status !== existing.status) {
    changes.status = { old: existing.status, new: validatedInput.status }
    updateData.status = validatedInput.status
  }

  if (validatedInput.priority !== undefined && validatedInput.priority !== existing.priority) {
    changes.priority = { old: existing.priority, new: validatedInput.priority }
    updateData.priority = validatedInput.priority
  }

  if (validatedInput.assignedToId !== undefined) {
    if (validatedInput.assignedToId !== existing.assignedToId) {
      changes.assignedToId = { old: existing.assignedToId, new: validatedInput.assignedToId }
      if (validatedInput.assignedToId) {
        const user = await prisma.user.findUnique({
          where: { id: validatedInput.assignedToId },
        })
        if (!user) {
          logActionFlow("contact-requests", "update", "error", { contactRequestId: id, error: "Người dùng được giao không tồn tại" }, startTime)
          throw new ApplicationError("Người dùng được giao không tồn tại", 400)
        }
        updateData.assignedTo = {
          connect: { id: validatedInput.assignedToId },
        }
      } else {
        updateData.assignedTo = {
          disconnect: true,
        }
      }
    }
  }

  if (validatedInput.isRead !== undefined && validatedInput.isRead !== existing.isRead) {
    updateData.isRead = validatedInput.isRead
  }

  if (Object.keys(updateData).length === 0) {
    logActionFlow("contact-requests", "update", "success", { contactRequestId: id, message: "Không có thay đổi" }, startTime)
    return sanitizeContactRequest(existing)
  }

  const contactRequest = await prisma.contactRequest.update({
    where: { id },
    data: updateData,
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  const sanitized = sanitizeContactRequest(contactRequest)
  const previousStatus: "active" | "deleted" | null = existing.deletedAt ? "deleted" : "active"

  await emitContactRequestUpsert(sanitized.id, previousStatus)
  await notifySuperAdminsOfContactRequestAction(
    "update",
    ctx.actorId,
    {
      id: sanitized.id,
      subject: sanitized.subject,
      name: sanitized.name,
      email: sanitized.email,
    },
    Object.keys(changes).length > 0 ? changes : undefined
  )

  logActionFlow("contact-requests", "update", "success", { contactRequestId: sanitized.id, hasChanges: Object.keys(changes).length > 0 }, startTime)
  logDetailAction("contact-requests", "update", sanitized.id, { ...sanitized, changes } as unknown as Record<string, unknown>)

  return sanitized
}

export const assignContactRequest = async (ctx: AuthContext, id: string, input: AssignContactRequestInput): Promise<ListedContactRequest> => {
  ensurePermission(ctx, PERMISSIONS.CONTACT_REQUESTS_ASSIGN, PERMISSIONS.CONTACT_REQUESTS_MANAGE)

  if (!id || typeof id !== "string" || id.trim() === "") {
    throw new ApplicationError("ID yêu cầu liên hệ không hợp lệ", 400)
  }

  // Validate input với zod
  const validatedInput = AssignContactRequestSchema.parse(input)
  const assignedToId = validatedInput.assignedToId

  const existing = await prisma.contactRequest.findUnique({
    where: { id },
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  if (!existing || existing.deletedAt) {
    throw new NotFoundError("Yêu cầu liên hệ không tồn tại")
  }

  if (assignedToId) {
    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: assignedToId },
    })
    if (!user) {
      throw new ApplicationError("Người dùng được giao không tồn tại", 400)
    }
  }

  const contactRequest = await prisma.contactRequest.update({
    where: { id },
    data: {
      assignedToId: assignedToId || null,
    },
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  const sanitized = sanitizeContactRequest(contactRequest)

  // Emit socket event for assignment
  await emitContactRequestAssigned(
    sanitized.id,
    sanitized.assignedToId,
    sanitized.assignedTo?.name ?? null
  )

  // Get actor info for notification
  const actor = await prisma.user.findUnique({
    where: { id: ctx.actorId },
    select: { id: true, name: true, email: true },
  })

  // Emit notification realtime
  await notifySuperAdminsOfContactRequestAction(
    "assign",
    ctx.actorId,
    {
      id: sanitized.id,
      subject: sanitized.subject,
      name: sanitized.name,
      email: sanitized.email,
    },
    {
      assignedToId: {
        old: existing.assignedToId,
        new: assignedToId,
      },
    }
  )

  // Notify assigned user if assigned
  if (assignedToId && actor) {
    await notifyUserOfContactRequestAssignment(
      assignedToId,
      {
        id: sanitized.id,
        subject: sanitized.subject,
        name: sanitized.name,
        email: sanitized.email,
      },
      {
        id: actor.id,
        name: actor.name,
        email: actor.email,
      }
    )
  }

  return sanitized
}

export const softDeleteContactRequest = async (ctx: AuthContext, id: string): Promise<void> => {
  ensurePermission(ctx, PERMISSIONS.CONTACT_REQUESTS_MANAGE)

  const startTime = Date.now()
  logActionFlow("contact-requests", "delete", "init", { contactRequestId: id })

  const contactRequest = await prisma.contactRequest.findUnique({ where: { id } })
  if (!contactRequest || contactRequest.deletedAt) {
    logActionFlow("contact-requests", "delete", "error", { contactRequestId: id, error: "Yêu cầu liên hệ không tồn tại" }, startTime)
    throw new NotFoundError("Yêu cầu liên hệ không tồn tại")
  }

  const previousStatus: "active" | "deleted" = contactRequest.deletedAt ? "deleted" : "active"

  await prisma.contactRequest.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  })

  await logTableStatusAfterMutation({
    resource: "contact-requests",
    action: "delete",
    prismaModel: prisma.contactRequest,
    affectedIds: id,
  })

  await emitContactRequestUpsert(id, previousStatus)
  await notifySuperAdminsOfContactRequestAction(
    "delete",
    ctx.actorId,
    {
      id: contactRequest.id,
      subject: contactRequest.subject,
      name: contactRequest.name,
      email: contactRequest.email,
    }
  )

  logActionFlow("contact-requests", "delete", "success", { contactRequestId: id, subject: contactRequest.subject }, startTime)
  logDetailAction("contact-requests", "delete", id, { id: contactRequest.id, subject: contactRequest.subject, name: contactRequest.name } as unknown as Record<string, unknown>)
}

export const bulkSoftDeleteContactRequests = async (ctx: AuthContext, ids: string[]): Promise<BulkActionResult> => {
  ensurePermission(ctx, PERMISSIONS.CONTACT_REQUESTS_MANAGE)

  const startTime = Date.now()
  logActionFlow("contact-requests", "bulk-delete", "start", { count: ids.length, contactRequestIds: ids })

  if (!ids || ids.length === 0) {
    logActionFlow("contact-requests", "bulk-delete", "error", { error: "Danh sách yêu cầu liên hệ trống" }, startTime)
    throw new ApplicationError("Danh sách yêu cầu liên hệ trống", 400)
  }

  // Lấy thông tin contact requests trước khi delete để tạo notifications
  const contactRequests = await prisma.contactRequest.findMany({
    where: {
      id: { in: ids },
      deletedAt: null,
    },
    select: { id: true, subject: true, name: true, email: true },
  })

  const result = await prisma.contactRequest.updateMany({
    where: {
      id: { in: contactRequests.map((cr) => cr.id) },
      deletedAt: null,
    },
    data: {
      deletedAt: new Date(),
    },
  })

  await logTableStatusAfterMutation({
    resource: "contact-requests",
    action: "bulk-delete",
    prismaModel: prisma.contactRequest,
    affectedIds: contactRequests.map((cr) => cr.id),
    affectedCount: result.count,
  })

  if (result.count > 0) {
    try {
      await emitContactRequestBatchUpsert(contactRequests.map((cr) => cr.id), "active")
    } catch (error) {
      logActionFlow("contact-requests", "bulk-delete", "error", {
        error: error instanceof Error ? error.message : String(error),
        count: result.count,
      })
    }

    try {
      await notifySuperAdminsOfBulkContactRequestAction("delete", ctx.actorId, contactRequests)
    } catch (error) {
      logActionFlow("contact-requests", "bulk-delete", "error", {
        error: error instanceof Error ? error.message : String(error),
        notificationError: true,
      })
    }

    logActionFlow("contact-requests", "bulk-delete", "success", { requestedCount: ids.length, affectedCount: result.count }, startTime)
  }

  // Format message với tên contact requests
  const namesText = contactRequests.length > 0 ? formatContactRequestNames(contactRequests, 3) : ""
  const message = namesText
    ? `Đã xóa ${result.count} yêu cầu liên hệ: ${namesText}`
    : `Đã xóa ${result.count} yêu cầu liên hệ`
  
  return { success: true, message, affected: result.count }
}

export const restoreContactRequest = async (ctx: AuthContext, id: string): Promise<void> => {
  ensurePermission(ctx, PERMISSIONS.CONTACT_REQUESTS_UPDATE, PERMISSIONS.CONTACT_REQUESTS_MANAGE)

  const startTime = Date.now()
  logActionFlow("contact-requests", "restore", "init", { contactRequestId: id })

  const contactRequest = await prisma.contactRequest.findUnique({ where: { id } })
  if (!contactRequest || !contactRequest.deletedAt) {
    logActionFlow("contact-requests", "restore", "error", { contactRequestId: id, error: "Yêu cầu liên hệ không tồn tại hoặc chưa bị xóa" }, startTime)
    throw new NotFoundError("Yêu cầu liên hệ không tồn tại hoặc chưa bị xóa")
  }

  const previousStatus: "active" | "deleted" = contactRequest.deletedAt ? "deleted" : "active"

  await prisma.contactRequest.update({
    where: { id },
    data: {
      deletedAt: null,
    },
  })

  await logTableStatusAfterMutation({
    resource: "contact-requests",
    action: "restore",
    prismaModel: prisma.contactRequest,
    affectedIds: id,
  })

  await emitContactRequestUpsert(id, previousStatus)
  await notifySuperAdminsOfContactRequestAction(
    "restore",
    ctx.actorId,
    {
      id: contactRequest.id,
      subject: contactRequest.subject,
      name: contactRequest.name,
      email: contactRequest.email,
    }
  )

  logActionFlow("contact-requests", "restore", "success", { contactRequestId: id, subject: contactRequest.subject }, startTime)
  logDetailAction("contact-requests", "restore", id, { id: contactRequest.id, subject: contactRequest.subject, name: contactRequest.name } as unknown as Record<string, unknown>)
}

export const bulkRestoreContactRequests = async (ctx: AuthContext, ids: string[]): Promise<BulkActionResult> => {
  ensurePermission(ctx, PERMISSIONS.CONTACT_REQUESTS_UPDATE, PERMISSIONS.CONTACT_REQUESTS_MANAGE)

  const startTime = Date.now()
  logActionFlow("contact-requests", "bulk-restore", "start", { count: ids.length, contactRequestIds: ids })

  if (!ids || ids.length === 0) {
    logActionFlow("contact-requests", "bulk-restore", "error", { error: "Danh sách yêu cầu liên hệ trống" }, startTime)
    throw new ApplicationError("Danh sách yêu cầu liên hệ trống", 400)
  }

  // Lấy thông tin contact requests trước khi restore để tạo notifications
  const contactRequests = await prisma.contactRequest.findMany({
    where: {
      id: { in: ids },
      deletedAt: { not: null },
    },
    select: { id: true, subject: true, name: true, email: true },
  })

  const result = await prisma.contactRequest.updateMany({
    where: {
      id: { in: contactRequests.map((cr) => cr.id) },
      deletedAt: { not: null },
    },
    data: {
      deletedAt: null,
    },
  })

  await logTableStatusAfterMutation({
    resource: "contact-requests",
    action: "bulk-restore",
    prismaModel: prisma.contactRequest,
    affectedIds: contactRequests.map((cr) => cr.id),
    affectedCount: result.count,
  })

  if (result.count > 0) {
    try {
      await emitContactRequestBatchUpsert(contactRequests.map((cr) => cr.id), "deleted")
    } catch (error) {
      logActionFlow("contact-requests", "bulk-restore", "error", {
        error: error instanceof Error ? error.message : String(error),
        count: result.count,
      })
    }

    try {
      await notifySuperAdminsOfBulkContactRequestAction("restore", ctx.actorId, contactRequests)
    } catch (error) {
      logActionFlow("contact-requests", "bulk-restore", "error", {
        error: error instanceof Error ? error.message : String(error),
        notificationError: true,
      })
    }

    logActionFlow("contact-requests", "bulk-restore", "success", { requestedCount: ids.length, affectedCount: result.count }, startTime)
  }

  // Format message với tên contact requests
  const namesText = contactRequests.length > 0 ? formatContactRequestNames(contactRequests, 3) : ""
  const message = namesText
    ? `Đã khôi phục ${result.count} yêu cầu liên hệ: ${namesText}`
    : `Đã khôi phục ${result.count} yêu cầu liên hệ`
  
  return { success: true, message, affected: result.count }
}

export const hardDeleteContactRequest = async (ctx: AuthContext, id: string): Promise<void> => {
  if (!canPerformAnyAction(ctx.permissions, ctx.roles, [PERMISSIONS.CONTACT_REQUESTS_MANAGE])) {
    throw new ForbiddenError()
  }

  const startTime = Date.now()
  logActionFlow("contact-requests", "hard-delete", "init", { contactRequestId: id })

  const contactRequest = await prisma.contactRequest.findUnique({
    where: { id },
    select: { id: true, subject: true, name: true, email: true, deletedAt: true },
  })

  if (!contactRequest) {
    logActionFlow("contact-requests", "hard-delete", "error", { contactRequestId: id, error: "Yêu cầu liên hệ không tồn tại" }, startTime)
    throw new NotFoundError("Yêu cầu liên hệ không tồn tại")
  }

  const previousStatus: "active" | "deleted" = contactRequest.deletedAt ? "deleted" : "active"

  await prisma.contactRequest.delete({ where: { id } })
  emitContactRequestRemove(id, previousStatus)
  await notifySuperAdminsOfContactRequestAction("hard-delete", ctx.actorId, contactRequest)

  logActionFlow("contact-requests", "hard-delete", "success", { contactRequestId: id, subject: contactRequest.subject }, startTime)
  logDetailAction("contact-requests", "hard-delete", id, contactRequest as unknown as Record<string, unknown>)
}

export const bulkHardDeleteContactRequests = async (ctx: AuthContext, ids: string[]): Promise<BulkActionResult> => {
  if (!canPerformAnyAction(ctx.permissions, ctx.roles, [PERMISSIONS.CONTACT_REQUESTS_MANAGE])) {
    throw new ForbiddenError()
  }

  const startTime = Date.now()
  logActionFlow("contact-requests", "bulk-hard-delete", "start", { count: ids.length, contactRequestIds: ids })

  if (!ids || ids.length === 0) {
    logActionFlow("contact-requests", "bulk-hard-delete", "error", { error: "Danh sách yêu cầu liên hệ trống" }, startTime)
    throw new ApplicationError("Danh sách yêu cầu liên hệ trống", 400)
  }

  // Lấy thông tin contact requests trước khi delete để tạo notifications và emit socket events
  const contactRequests = await prisma.contactRequest.findMany({
    where: {
      id: { in: ids },
    },
    select: { id: true, subject: true, name: true, email: true, deletedAt: true },
  })

  const result = await prisma.contactRequest.deleteMany({
    where: {
      id: { in: contactRequests.map((cr) => cr.id) },
    },
  })

  // Emit socket events để update UI - fire and forget để tránh timeout
  // Emit song song cho tất cả contact requests đã bị hard delete
  if (result.count > 0) {
    // Emit events (emitContactRequestRemove trả về void, không phải Promise)
    contactRequests.forEach((cr) => {
      const previousStatus: "active" | "deleted" = cr.deletedAt ? "deleted" : "active"
      try {
        emitContactRequestRemove(cr.id, previousStatus)
      } catch (error) {
        logActionFlow("contact-requests", "bulk-hard-delete", "error", {
          contactRequestId: cr.id,
          error: error instanceof Error ? error.message : "Unknown error",
        }, startTime)
      }
    })

    try {
      await notifySuperAdminsOfBulkContactRequestAction("hard-delete", ctx.actorId, contactRequests)
    } catch (error) {
      logActionFlow("contact-requests", "bulk-hard-delete", "error", {
        error: error instanceof Error ? error.message : String(error),
        notificationError: true,
      }, startTime)
    }

    logActionFlow("contact-requests", "bulk-hard-delete", "success", { requestedCount: ids.length, affectedCount: result.count }, startTime)
  }

  // Format message với tên contact requests
  const namesText = contactRequests.length > 0 ? formatContactRequestNames(contactRequests, 3) : ""
  const message = namesText
    ? `Đã xóa vĩnh viễn ${result.count} yêu cầu liên hệ: ${namesText}`
    : `Đã xóa vĩnh viễn ${result.count} yêu cầu liên hệ`
  
  return { success: true, message, affected: result.count }
}

export const bulkMarkAsReadContactRequests = async (ctx: AuthContext, ids: string[]): Promise<BulkActionResult> => {
  ensurePermission(ctx, PERMISSIONS.CONTACT_REQUESTS_UPDATE, PERMISSIONS.CONTACT_REQUESTS_MANAGE)

  const startTime = Date.now()
  logActionFlow("contact-requests", "bulk-mark-read", "start", { count: ids.length, contactRequestIds: ids })

  if (!ids || ids.length === 0) {
    logActionFlow("contact-requests", "bulk-mark-read", "error", { error: "Danh sách yêu cầu liên hệ trống" }, startTime)
    throw new ApplicationError("Danh sách yêu cầu liên hệ trống", 400)
  }

  // Lấy thông tin contact requests trước khi update
  const contactRequests = await prisma.contactRequest.findMany({
    where: {
      id: { in: ids },
      deletedAt: null,
      isRead: false,
    },
    select: { id: true, subject: true, name: true, email: true },
  })

  const result = await prisma.contactRequest.updateMany({
    where: {
      id: { in: contactRequests.map((cr) => cr.id) },
      deletedAt: null,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  })

  if (result.count > 0) {
    try {
      await emitContactRequestBatchUpsert(contactRequests.map((cr) => cr.id), "active")
    } catch (error) {
      logActionFlow("contact-requests", "bulk-mark-read", "error", {
        error: error instanceof Error ? error.message : String(error),
        count: result.count,
      })
    }

    try {
      await notifySuperAdminsOfBulkContactRequestAction("mark-read", ctx.actorId, contactRequests)
    } catch (error) {
      logActionFlow("contact-requests", "bulk-mark-read", "error", {
        error: error instanceof Error ? error.message : String(error),
        notificationError: true,
      })
    }

    logActionFlow("contact-requests", "bulk-mark-read", "success", { requestedCount: ids.length, affectedCount: result.count }, startTime)
  }

  const namesText = contactRequests.length > 0 ? formatContactRequestNames(contactRequests, 3) : ""
  const message = namesText
    ? `Đã đánh dấu đã đọc ${result.count} yêu cầu liên hệ: ${namesText}`
    : `Đã đánh dấu đã đọc ${result.count} yêu cầu liên hệ`
  
  return { success: true, message, affected: result.count }
}

export const bulkMarkAsUnreadContactRequests = async (ctx: AuthContext, ids: string[]): Promise<BulkActionResult> => {
  ensurePermission(ctx, PERMISSIONS.CONTACT_REQUESTS_UPDATE, PERMISSIONS.CONTACT_REQUESTS_MANAGE)

  const startTime = Date.now()
  logActionFlow("contact-requests", "bulk-mark-unread", "start", { count: ids.length, contactRequestIds: ids })

  if (!ids || ids.length === 0) {
    logActionFlow("contact-requests", "bulk-mark-unread", "error", { error: "Danh sách yêu cầu liên hệ trống" }, startTime)
    throw new ApplicationError("Danh sách yêu cầu liên hệ trống", 400)
  }

  // Lấy thông tin contact requests trước khi update
  const contactRequests = await prisma.contactRequest.findMany({
    where: {
      id: { in: ids },
      deletedAt: null,
      isRead: true,
    },
    select: { id: true, subject: true, name: true, email: true },
  })

  const result = await prisma.contactRequest.updateMany({
    where: {
      id: { in: contactRequests.map((cr) => cr.id) },
      deletedAt: null,
      isRead: true,
    },
    data: {
      isRead: false,
    },
  })

  if (result.count > 0) {
    try {
      await emitContactRequestBatchUpsert(contactRequests.map((cr) => cr.id), "active")
    } catch (error) {
      logActionFlow("contact-requests", "bulk-mark-unread", "error", {
        error: error instanceof Error ? error.message : String(error),
        count: result.count,
      })
    }

    try {
      await notifySuperAdminsOfBulkContactRequestAction("mark-unread", ctx.actorId, contactRequests)
    } catch (error) {
      logActionFlow("contact-requests", "bulk-mark-unread", "error", {
        error: error instanceof Error ? error.message : String(error),
        notificationError: true,
      })
    }

    logActionFlow("contact-requests", "bulk-mark-unread", "success", { requestedCount: ids.length, affectedCount: result.count }, startTime)
  }

  const namesText = contactRequests.length > 0 ? formatContactRequestNames(contactRequests, 3) : ""
  const message = namesText
    ? `Đã đánh dấu chưa đọc ${result.count} yêu cầu liên hệ: ${namesText}`
    : `Đã đánh dấu chưa đọc ${result.count} yêu cầu liên hệ`
  
  return { success: true, message, affected: result.count }
}

export const bulkUpdateStatusContactRequests = async (ctx: AuthContext, ids: string[], status: "NEW" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"): Promise<BulkActionResult> => {
  ensurePermission(ctx, PERMISSIONS.CONTACT_REQUESTS_UPDATE, PERMISSIONS.CONTACT_REQUESTS_MANAGE)

  const startTime = Date.now()
  logActionFlow("contact-requests", "bulk-update-status", "start", { count: ids.length, status, contactRequestIds: ids })

  if (!ids || ids.length === 0) {
    logActionFlow("contact-requests", "bulk-update-status", "error", { error: "Danh sách yêu cầu liên hệ trống" }, startTime)
    throw new ApplicationError("Danh sách yêu cầu liên hệ trống", 400)
  }

  // Lấy thông tin contact requests trước khi update
  const contactRequests = await prisma.contactRequest.findMany({
    where: {
      id: { in: ids },
      deletedAt: null,
    },
    select: { id: true, subject: true, name: true, email: true },
  })

  const result = await prisma.contactRequest.updateMany({
    where: {
      id: { in: contactRequests.map((cr) => cr.id) },
      deletedAt: null,
    },
    data: {
      status,
    },
  })

  if (result.count > 0) {
    try {
      await emitContactRequestBatchUpsert(contactRequests.map((cr) => cr.id), "active")
    } catch (error) {
      logActionFlow("contact-requests", "bulk-update-status", "error", {
        error: error instanceof Error ? error.message : String(error),
        count: result.count,
      })
    }

    try {
      await notifySuperAdminsOfBulkContactRequestAction("update-status", ctx.actorId, contactRequests, status)
    } catch (error) {
      logActionFlow("contact-requests", "bulk-update-status", "error", {
        error: error instanceof Error ? error.message : String(error),
        notificationError: true,
      })
    }

    logActionFlow("contact-requests", "bulk-update-status", "success", { requestedCount: ids.length, affectedCount: result.count, status }, startTime)
  }

  const statusLabels: Record<string, string> = {
    NEW: "Mới",
    IN_PROGRESS: "Đang xử lý",
    RESOLVED: "Đã xử lý",
    CLOSED: "Đã đóng",
  }

  const namesText = contactRequests.length > 0 ? formatContactRequestNames(contactRequests, 3) : ""
  const message = namesText
    ? `Đã cập nhật trạng thái thành "${statusLabels[status]}" cho ${result.count} yêu cầu liên hệ: ${namesText}`
    : `Đã cập nhật trạng thái thành "${statusLabels[status]}" cho ${result.count} yêu cầu liên hệ`
  
  return { success: true, message, affected: result.count }
}

