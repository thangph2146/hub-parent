/**
 * API Routes Configuration
 * 
 * Tập trung quản lý tất cả API routes cho toàn hệ thống
 * Theo chuẩn Next.js 16: type-safe và dễ maintain
 * 
 * LƯU Ý: Không include `/api` prefix vì `apiClient` đã có `baseURL: "/api"`
 * Nếu sử dụng trực tiếp với fetch/axios khác, cần thêm `/api` prefix
 * 
 * Admin resources sử dụng routes từ route-config.ts để đảm bảo consistency
 */

import { appFeatures } from "./features"
import { prismaResourceMap } from "./resource-map"
import { stripApiBase, withQuery } from "@/utils"
import { generateResourceApiRoutes, getResourceApiRoute, getResourceAdminApiRoutes, type RoutePermissionConfig } from "@/permissions"

type ResourceRouteBuilder = ReturnType<typeof generateResourceApiRoutes>

/**
 * Helper to build resource action route with fallback
 */
const buildResourceActionRoute = (
  resourceName: string,
  method: "POST" | "GET" | "PUT" | "DELETE",
  action: string,
  id: string,
  fallback: string
): string => getResourceApiRoute(resourceName, method, action as never)?.replace("[id]", id) || fallback

/**
 * Helper to get admin route with fallback
 */
const getAdminRoute = (
  resourceName: string,
  finder: (routes: RoutePermissionConfig[]) => string | undefined,
  fallback: string
): string => {
  const routes = getResourceAdminApiRoutes(resourceName)
  const route = finder(routes)
  return route ? stripApiBase(route) : fallback
}

const featureResourceRoutes = appFeatures.reduce<Record<string, ResourceRouteBuilder>>(
  (acc, feature) => {
    if (feature.api?.type === "resource") {
      const resourceName = feature.api.resourceName ?? feature.key
      const alias = feature.api.alias ?? feature.key
      acc[alias] = generateResourceApiRoutes(resourceName)
    }
    return acc
  },
  {}
)

const getResourceRoutesOrFallback = (key: string, resourceName: string): ResourceRouteBuilder =>
  featureResourceRoutes[key] ?? generateResourceApiRoutes(resourceName)

const prismaResourceRoutes = prismaResourceMap.reduce<Record<string, ResourceRouteBuilder>>(
  (acc, resource) => {
    if (resource.enabled !== false) {
      acc[resource.key] = getResourceRoutesOrFallback(resource.key, resource.resourceName)
    }
    return acc
  },
  {}
)

/**
 * API Routes cho từng feature
 * Không include `/api` prefix vì apiClient đã có baseURL
 * Admin resources được generate từ route-config.ts
 */
export const apiRoutes = {
  // Resource routes driven by Prisma schema + route-config
  ...featureResourceRoutes,
  ...prismaResourceRoutes,
  
  // Explicitly add resource routes to ensure TypeScript recognizes them
  categories: getResourceRoutesOrFallback("categories", "categories"),
  posts: getResourceRoutesOrFallback("posts", "posts"),
  roles: getResourceRoutesOrFallback("roles", "roles"),
  sessions: getResourceRoutesOrFallback("sessions", "sessions"),
  users: getResourceRoutesOrFallback("users", "users"),
  students: getResourceRoutesOrFallback("students", "students"),
  tags: getResourceRoutesOrFallback("tags", "tags"),
  
  // Accounts - Personal account management
  accounts: {
    get: "/admin/accounts",
    update: "/admin/accounts",
  },

  // Unread counts
  unreadCounts: {
    get: "/admin/unread-counts",
  },

  // Auth
  auth: {
    signIn: "/auth/sign-in",
    signUp: "/auth/signup",
    signOut: "/auth/sign-out",
    session: "/auth/session", // NextAuth.js built-in endpoint
    createSession: "/auth/create-session", // Custom endpoint để tạo Session record
  },

  // Notifications
  notifications: {
    // User notifications
    list: (params?: { limit?: number; offset?: number; unreadOnly?: boolean }) =>
      withQuery("/notifications", {
        limit: params?.limit,
        offset: params?.offset,
        unreadOnly: params?.unreadOnly,
      }),
    detail: (id: string) => `/notifications/${id}`,
    markRead: (id: string) => `/notifications/${id}`,
    markAllRead: "/notifications/mark-all-read",
    bulk: "/notifications/bulk",
    delete: (id: string) => `/notifications/${id}`,
    deleteAll: "/notifications",
  },

  // Admin Notifications
  adminNotifications: {
    list: (params?: { page?: number; limit?: number; search?: string }) =>
      withQuery("/admin/notifications", params),
    options: (params?: { column: string; search?: string; limit?: number }) =>
      withQuery("/admin/notifications/options", params),
  },

  // Contact Requests - thêm custom actions
  contactRequests: {
    ...getResourceRoutesOrFallback("contactRequests", "contact-requests"),
    assign: (id: string) =>
      buildResourceActionRoute("contact-requests", "POST", "assign", id, `/admin/contact-requests/${id}/assign`),
  },

  // Comments - thêm approve/unapprove
  comments: {
    ...getResourceRoutesOrFallback("comments", "comments"),
    approve: (id: string) =>
      buildResourceActionRoute("comments", "POST", "approve", id, `/admin/comments/${id}/approve`),
    unapprove: (id: string) =>
      buildResourceActionRoute("comments", "POST", "unapprove", id, `/admin/comments/${id}/unapprove`),
  },

  // Socket
  socket: "/socket",

  // Chat/Messages - Admin routes (sử dụng routes từ route-config)
  adminMessages: {
    send: getResourceApiRoute("messages", "POST", "send") || "/admin/messages",
    markRead: (id: string) => `/admin/messages/${id}`,
    softDelete: (id: string) => `/admin/messages/${id}/soft-delete`,
    hardDelete: (id: string) => `/admin/messages/${id}/hard-delete`,
    restore: (id: string) => `/admin/messages/${id}/restore`,
  },
  adminConversations: {
    list: (params?: { page?: number; limit?: number; search?: string; otherUserId?: string }) => {
      const route = getAdminRoute(
        "conversations",
        (routes) => routes.find((r) => r.method === "GET")?.path,
        "/admin/conversations"
      )
      return withQuery(route, params)
    },
    markRead: (otherUserId: string) => `/admin/conversations/${otherUserId}/mark-read`,
  },
  adminUsers: {
    ...generateResourceApiRoutes("users"),
    search: (query: string) => {
      const route = getAdminRoute(
        "users",
        (routes) => routes.find((r) => r.path.includes("/search"))?.path,
        "/admin/users/search"
      )
      return withQuery(route, { q: query })
    },
  },
  // Groups - Chat groups
  adminGroups: {
    create: "/admin/groups",
    list: (params?: { page?: number; limit?: number; search?: string }) =>
      withQuery("/admin/groups", params),
    detail: (id: string) => `/admin/groups/${id}`,
    update: (id: string) => `/admin/groups/${id}`,
    delete: (id: string) => `/admin/groups/${id}`,
    hardDelete: (id: string) => `/admin/groups/${id}/hard-delete`,
    restore: (id: string) => `/admin/groups/${id}/restore`,
    addMembers: (id: string) => `/admin/groups/${id}/members`,
    removeMember: (id: string, userId: string) => `/admin/groups/${id}/members/${userId}`,
    updateMemberRole: (id: string, userId: string) => `/admin/groups/${id}/members/${userId}/role`,
    markRead: (id: string) => `/admin/groups/${id}/mark-read`,
  },

  // Uploads
  uploads: {
    upload: "/admin/uploads",
    list: "/admin/uploads",
    delete: "/admin/uploads",
    deleteFolder: "/admin/uploads",
    createFolder: "/admin/uploads",
  },

  // Student Scores & Averages - External API proxies
  studentScores: {
    detailed: (studentId: string) => `/students/${studentId}/scores/detailed`,
  },
  studentAverages: {
    year: (studentId: string) => `/students/${studentId}/averages/year`,
    terms: (studentId: string) => `/students/${studentId}/averages/terms`,
    overall: (studentId: string) => `/students/${studentId}/averages/overall`,
  },


} as const
