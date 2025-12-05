/**
 * Date Utilities
 * Helper functions cho date operations
 */

/**
 * Get today's date as YYYY/MM/DD path
 */
export function getTodayDatePath(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}/${month}/${day}`
}

