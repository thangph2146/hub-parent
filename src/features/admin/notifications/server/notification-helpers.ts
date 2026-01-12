import { prisma } from "@/services/prisma"
import { resourceLogger } from "@/utils"

/**
 * Helper functions chung cho notification files
 * Loại bỏ code trùng lặp trong các notification files
 */

export const getActorInfo = async (actorId: string) => {
  const actor = await prisma.user.findUnique({
    where: { id: actorId },
    select: { id: true, email: true, name: true },
  })
  return actor
}

export const getErrorMessage = (error: unknown): string => 
  error instanceof Error ? error.message : "Unknown error"

export const logNotificationError = (
  resource: string,
  action: string,
  metadata: Record<string, unknown>,
  error: unknown
) => {
  resourceLogger.logFlow({
    resource,
    action: "error",
    step: "error",
    details: { action, ...metadata, error: getErrorMessage(error) },
  })
}

/**
 * Generic helper để format danh sách tên items cho notifications
 * Loại bỏ code trùng lặp trong các formatXXXNames functions
 */
export const formatItemNames = <T>(
  items: T[],
  getName: (item: T) => string,
  maxDisplay: number = 3,
  itemType: string = "item"
): string => {
  if (items.length === 0) return ""

  const names = items.slice(0, maxDisplay).map(getName)

  if (items.length <= maxDisplay) {
    return names.join(", ")
  }

  const remaining = items.length - maxDisplay
  return `${names.join(", ")} và ${remaining} ${itemType} khác`
}

