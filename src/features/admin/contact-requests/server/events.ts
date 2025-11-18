/**
 * Socket events emission cho contact requests
 * Tách logic emit socket events ra khỏi mutations để code sạch hơn
 */

import { prisma } from "@/lib/database"
import { getSocketServer } from "@/lib/socket/state"
import { mapContactRequestRecord, serializeContactRequestForTable } from "./helpers"
import type { ContactRequestRow } from "../types"
import type { ListedContactRequest } from "../types"

const SUPER_ADMIN_ROOM = "role:super_admin"

export type ContactRequestStatus = "active" | "deleted"

function resolveStatusFromRow(row: ContactRequestRow): ContactRequestStatus {
  return row.deletedAt ? "deleted" : "active"
}

async function fetchContactRequestRow(contactRequestId: string): Promise<ContactRequestRow | null> {
  const contactRequest = await prisma.contactRequest.findUnique({
    where: { id: contactRequestId },
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

  if (!contactRequest) {
    return null
  }

  const listed = mapContactRequestRecord(contactRequest)
  return serializeContactRequestForTable(listed)
}

/**
 * Emit contact-request:upsert event
 * Được gọi khi contact request được tạo, cập nhật, restore
 */
export async function emitContactRequestUpsert(
  contactRequestId: string,
  previousStatus: ContactRequestStatus | null,
): Promise<void> {
  const io = getSocketServer()
  if (!io) return

  const row = await fetchContactRequestRow(contactRequestId)
  if (!row) {
    if (previousStatus) {
      emitContactRequestRemove(contactRequestId, previousStatus)
    }
    return
  }

  const newStatus = resolveStatusFromRow(row)

  const upsertPayload = {
    contactRequest: row,
    previousStatus,
    newStatus,
  }

  // Emit to all super admins (contact requests are visible to all super admins)
  const superAdmins = await prisma.user.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      userRoles: {
        some: {
          role: {
            name: "super_admin",
            isActive: true,
            deletedAt: null,
          },
        },
      },
    },
    select: { id: true },
  })

  // Emit to each super admin user room
  for (const admin of superAdmins) {
    io.to(`user:${admin.id}`).emit("contact-request:upsert", upsertPayload)
  }

  // Also emit to role room for broadcast
  io.to(SUPER_ADMIN_ROOM).emit("contact-request:upsert", upsertPayload)
}

/**
 * Emit contact-request:remove event
 * Được gọi khi contact request bị hard delete
 */
export function emitContactRequestRemove(contactRequestId: string, previousStatus: ContactRequestStatus): void {
  const io = getSocketServer()
  if (!io) return

  io.to(SUPER_ADMIN_ROOM).emit("contact-request:remove", {
    id: contactRequestId,
    previousStatus,
  })
}

/**
 * Emit contact-request:assigned event
 * Được gọi khi contact request được assign cho user
 */
export async function emitContactRequestAssigned(
  contactRequestId: string,
  assignedToId: string | null,
  assignedToName: string | null,
): Promise<void> {
  const io = getSocketServer()
  if (!io) return

  const payload = {
    id: contactRequestId,
    assignedToId,
    assignedToName,
  }

  // Emit to all super admins
  io.to(SUPER_ADMIN_ROOM).emit("contact-request:assigned", payload)

  // Also emit to assigned user if exists
  if (assignedToId) {
    io.to(`user:${assignedToId}`).emit("contact-request:assigned", payload)
  }
}

/**
 * Emit contact-request:new event
 * Được gọi khi contact request mới được tạo (từ public form)
 */
export async function emitContactRequestNew(contactRequest: ListedContactRequest): Promise<void> {
  const io = getSocketServer()
  if (!io) return

  const row = serializeContactRequestForTable(contactRequest)

  const payload = {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    subject: row.subject,
    status: row.status,
    priority: row.priority,
    createdAt: row.createdAt,
    assignedToId: contactRequest.assignedToId ?? null,
    assignedToName: contactRequest.assignedTo?.name ?? null,
  }

  // Emit to all super admins
  const superAdmins = await prisma.user.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      userRoles: {
        some: {
          role: {
            name: "super_admin",
            isActive: true,
            deletedAt: null,
          },
        },
      },
    },
    select: { id: true },
  })

  // Emit to each super admin user room
  for (const admin of superAdmins) {
    io.to(`user:${admin.id}`).emit("contact-request:new", payload)
  }

  // Also emit to role room for broadcast
  io.to(SUPER_ADMIN_ROOM).emit("contact-request:new", payload)
}

