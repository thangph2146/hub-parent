import { prisma } from "@/services/prisma"
import { getSocketServer } from "@/services/socket/state"
import { mapCategoryRecord, serializeCategoryForTable } from "./helpers"
import type { CategoryRow } from "../types"
import { resourceLogger } from "@/utils"

const SUPER_ADMIN_ROOM = "role:super_admin"

export type CategoryStatus = "active" | "deleted"

const resolveStatusFromRow = (row: CategoryRow): CategoryStatus => {
  return row.deletedAt ? "deleted" : "active"
}

const fetchCategoryRow = async (categoryId: string): Promise<CategoryRow | null> => {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  })

  if (!category) {
    return null
  }

  const listed = mapCategoryRecord(category)
  return serializeCategoryForTable(listed)
}

export const emitCategoryUpsert = async (
  categoryId: string,
  previousStatus: CategoryStatus | null,
): Promise<void> => {
  const io = getSocketServer()
  if (!io) return

  const row = await fetchCategoryRow(categoryId)
  if (!row) {
    if (previousStatus) {
      emitCategoryRemove(categoryId, previousStatus)
    }
    return
  }

  const newStatus = resolveStatusFromRow(row)

  io.to(SUPER_ADMIN_ROOM).emit("category:upsert", {
    category: row,
    previousStatus,
    newStatus,
  })
  resourceLogger.logAction({
    resource: "categories",
    action: "socket-update",
    resourceId: categoryId,
    details: { event: "category:upsert", previousStatus, newStatus },
  })
}

export const emitCategoryRemove = (categoryId: string, previousStatus: CategoryStatus): void => {
  const io = getSocketServer()
  if (!io) return

  io.to(SUPER_ADMIN_ROOM).emit("category:remove", {
    id: categoryId,
    previousStatus,
  })
  resourceLogger.logAction({
    resource: "categories",
    action: "socket-update",
    resourceId: categoryId,
    details: { event: "category:remove", previousStatus },
  })
}

