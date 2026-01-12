import type { ResourceMapEntry } from "@/types/resource"

export const prismaResourceMap: ReadonlyArray<ResourceMapEntry> = [
  { key: "users", resourceName: "users" },
  { key: "roles", resourceName: "roles" },
  { key: "sessions", resourceName: "sessions" },
  { key: "students", resourceName: "students" },
  { key: "posts", resourceName: "posts" },
  { key: "categories", resourceName: "categories" },
  { key: "tags", resourceName: "tags" },
  { key: "comments", resourceName: "comments" },
  { key: "groups", resourceName: "groups" },
  { key: "messages", resourceName: "messages" },
  { key: "contactRequests", resourceName: "contact-requests" },
  { key: "notifications", resourceName: "notifications" },
] as const
