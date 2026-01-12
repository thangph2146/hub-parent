import { prisma } from "@/services/prisma"
import { getSocketServer } from "@/services/socket/state"
import { mapUserRecord, serializeUserForTable } from "./helpers"
import type { UserRow } from "../types"
import { resourceLogger } from "@/utils"

const SUPER_ADMIN_ROOM = "role:super_admin"

export type UserStatus = "active" | "deleted"

const resolveStatusFromRow = (row: UserRow): UserStatus => {
  return row.deletedAt ? "deleted" : "active"
}

const fetchUserRow = async (userId: string): Promise<UserRow | null> => {
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

export const emitUserUpsert = async (
  userId: string,
  previousStatus: UserStatus | null,
): Promise<void> => {
  const io = getSocketServer()
  
  if (!io) {
    resourceLogger.logFlow({
      resource: "users",
      action: "socket-update",
      step: "error",
      details: { userId, error: "Socket server not available", type: "single" },
    })
    return
  }

  const row = await fetchUserRow(userId)
  if (!row) {
    resourceLogger.logFlow({
      resource: "users",
      action: "socket-update",
      step: "error",
      details: { userId, error: "User not found", type: "single" },
    })
    if (previousStatus) {
      emitUserRemove(userId, previousStatus)
    }
    return
  }

  const newStatus = resolveStatusFromRow(row)

  // Log trước khi emit với chi tiết đầy đủ
  resourceLogger.logFlow({
    resource: "users",
    action: "socket-update",
    step: "start",
    details: { 
      userId, 
      previousStatus, 
      newStatus, 
      userName: row.name,
      userEmail: row.email,
      type: "single" 
    },
  })

  io.to(SUPER_ADMIN_ROOM).emit("user:upsert", {
    user: row,
    previousStatus,
    newStatus,
  })

  // Log sau khi emit thành công
  resourceLogger.logFlow({
    resource: "users",
    action: "socket-update",
    step: "success",
    details: { userId, userName: row.name, type: "single" },
  })
}

export const emitBatchUserUpsert = async (
  userIds: string[],
  previousStatus: UserStatus | null,
): Promise<void> => {
  const io = getSocketServer()
  if (!io || userIds.length === 0) return

  const startTime = Date.now()
  resourceLogger.logFlow({
    resource: "users",
    action: "socket-update",
    step: "start",
    details: { count: userIds.length, previousStatus, type: "batch" },
  })

  try {
    // Fetch all users in parallel với error handling
    const userPromises = userIds.map((id) => 
      fetchUserRow(id).catch((error) => {
        resourceLogger.logFlow({
          resource: "users",
          action: "socket-update",
          step: "error",
          details: { userId: id, error: error instanceof Error ? error.message : String(error) },
        })
        return null
      })
    )
    const rows = await Promise.all(userPromises)

    // Filter out nulls and emit events
    const validRows = rows.filter((row): row is UserRow => row !== null)
    
    if (validRows.length > 0) {
      // Emit batch event với tất cả rows
      io.to(SUPER_ADMIN_ROOM).emit("user:batch-upsert", {
        users: validRows.map((row) => ({
          user: row,
          previousStatus,
          newStatus: resolveStatusFromRow(row),
        })),
  })

      resourceLogger.logFlow({
        resource: "users",
        action: "socket-update",
        step: "success",
        durationMs: Date.now() - startTime,
        details: { count: validRows.length, emitted: validRows.length, type: "batch" },
      })
    }
  } catch (error) {
    resourceLogger.logFlow({
      resource: "users",
      action: "socket-update",
      step: "error",
      details: { 
        count: userIds.length, 
        error: error instanceof Error ? error.message : String(error) 
      },
    })
    // Không throw để không làm fail bulk operation
  }
}

export const emitUserRemove = (userId: string, previousStatus: UserStatus): void => {
  const io = getSocketServer()
  if (!io) return

  io.to(SUPER_ADMIN_ROOM).emit("user:remove", {
    id: userId,
    previousStatus,
  })
}

