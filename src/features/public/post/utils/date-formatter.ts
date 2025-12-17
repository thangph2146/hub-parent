/**
 * Date formatting utilities for posts
 */

export const formatPostDate = (date: Date | null): string => {
  if (!date) return ""
  return new Intl.DateTimeFormat("en-US", {
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

