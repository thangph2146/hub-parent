/**
 * Socket events emission cho users
 * Tách logic emit socket events ra khỏi mutations để code sạch hơn
 */

import { prisma } from "@/lib/database"
import { getSocketServer } from "@/lib/socket/state"
import { mapUserRecord, serializeUserForTable } from "./helpers"
import type { UserRow } from "../types"
import { logger } from "@/lib/config"

const SUPER_ADMIN_ROOM = "role:super_admin"

export type UserStatus = "active" | "deleted"

function resolveStatusFromRow(row: UserRow): UserStatus {
  return row.deletedAt ? "deleted" : "active"
}

async function fetchUserRow(userId: string): Promise<UserRow | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: {
          role: {
            select: {
              id: true,
              name: true,
              displayName: true,
            },
          },
        },
      },
    },
  })

  if (!user) {
    return null
  }

  const listed = mapUserRecord(user)
  return serializeUserForTable(listed)
}

/**
 * Emit user:upsert event
 * Được gọi khi user được tạo, cập nhật, restore
 */
export async function emitUserUpsert(
  userId: string,
  previousStatus: UserStatus | null,
): Promise<void> {
  const io = getSocketServer()
  if (!io) return

  const row = await fetchUserRow(userId)
  if (!row) {
    if (previousStatus) {
      emitUserRemove(userId, previousStatus)
    }
    return
  }

  const newStatus = resolveStatusFromRow(row)

  io.to(SUPER_ADMIN_ROOM).emit("user:upsert", {
    user: row,
    previousStatus,
    newStatus,
  })
  logger.debug("Socket user:upsert emitted", { userId, previousStatus, newStatus })
}

/**
 * Emit user:remove event
 * Được gọi khi user bị hard delete
 */
export function emitUserRemove(userId: string, previousStatus: UserStatus): void {
  const io = getSocketServer()
  if (!io) return

  io.to(SUPER_ADMIN_ROOM).emit("user:remove", {
    id: userId,
    previousStatus,
  })
  logger.debug("Socket user:remove emitted", { userId, previousStatus })
}

