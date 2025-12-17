/**
 * Date Utilities
 * Helper functions cho date operations
 */

export const getTodayDatePath = (): string => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}/${month}/${day}`
}

