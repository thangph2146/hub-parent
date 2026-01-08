/**
 * Date formatting utilities for posts
 */

export const formatPostDate = (date: Date | null): string => {
  if (!date) return ""
  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date))
}

export const formatPostDateLong = (date: Date | null): string => {
  if (!date) return ""
  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date))
}

export const formatPostTime = (date: Date | null): string => {
  if (!date) return ""
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date))
  } catch {
    return ""
  }
}

