import { ApplicationError } from "./errors"

/**
 * Validate bulk IDs array
 */
export const validateBulkIds = (ids: string[] | null | undefined, resourceName: string): void => {
  if (!ids?.length) {
    throw new ApplicationError(`Danh sách ${resourceName} trống`, 400)
  }
}

/**
 * Build error message for bulk operations when no items can be processed
 */
export const buildBulkError = (
  allItems: Array<{ deletedAt?: Date | null; [key: string]: unknown }>,
  ids: string[],
  itemName: string,
  options?: {
    getName?: (item: { [key: string]: unknown }) => string
    getPreview?: (item: { [key: string]: unknown }) => string
  }
): string => {
  const alreadyDeleted = allItems.filter((item) => item.deletedAt !== null && item.deletedAt !== undefined)
  const notFoundCount = ids.length - allItems.length
  const parts: string[] = []

  if (alreadyDeleted.length > 0) {
    const getName = options?.getName || ((item) => (item.name as string) || (item.displayName as string) || "")
    const getPreview = options?.getPreview || ((item) => {
      const name = getName(item)
      const content = item.content as string | undefined
      if (content && content.length > 30) {
        return `"${content.substring(0, 30)}..."`
      }
      return name ? `"${name}"` : ""
    })

    const previews = alreadyDeleted.slice(0, 3).map(getPreview).filter(Boolean).join(", ")
    const moreCount = alreadyDeleted.length > 3 ? ` và ${alreadyDeleted.length - 3} ${itemName.split(" ")[0]} khác` : ""
    parts.push(`${alreadyDeleted.length} ${itemName} đã bị xóa trước đó${previews ? `: ${previews}` : ""}${moreCount}`)
  }

  if (notFoundCount > 0) {
    parts.push(`${notFoundCount} ${itemName} không tồn tại`)
  }

  return parts.length > 0
    ? `Không có ${itemName} nào có thể xóa (${parts.join(", ")})`
    : `Không có ${itemName} nào có thể xóa`
}

