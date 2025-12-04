/**
 * Hook để check permissions của user với NextAuth
 */
"use client"

import { useCallback, useEffect, useMemo } from "react"
import { useSession } from "next-auth/react"
import type { Permission } from "@/lib/permissions"
import { hasAnyPermission } from "@/lib/permissions"
import { logger } from "@/lib/config"

// Module-level ref để đảm bảo chỉ log một lần cho toàn bộ app
const globalLoggedPermissionsRef: Map<string, string> = new Map()

export function usePermissions() {
  const { data: session, status } = useSession()

  // Loại bỏ duplicate permissions và sort
  const permissions = useMemo(() => {
    const perms = (session?.permissions ?? []) as Permission[]
    // Loại bỏ duplicates bằng cách convert sang Set rồi quay lại Array
    return Array.from(new Set(perms)).sort()
  }, [session?.permissions])

  // Log permissions khi session được load hoặc permissions thay đổi
  useEffect(() => {
    if (status === "loading" || !session?.user) {
      return
    }

    const userId = session.user.id
    const permissionsKey = JSON.stringify(permissions)
    
    // Chỉ log một lần cho mỗi user khi permissions thay đổi (sử dụng module-level ref)
    const lastLoggedKey = globalLoggedPermissionsRef.get(userId)
    if (lastLoggedKey === permissionsKey) {
      return
    }

    globalLoggedPermissionsRef.set(userId, permissionsKey)

    logger.info("[usePermissions] Loaded permissions from session", {
      action: "permissions_loaded",
      email: session.user.email,
      userId: session.user.id,
      roles: session.roles?.map((r) => r.name) ?? [],
      permissionsCount: permissions.length,
      permissions: permissions, // Log tất cả permissions (đã loại bỏ duplicates)
    })
  }, [session, status, permissions])

  const hasPermission = useCallback(
    (permission: Permission) => permissions.includes(permission),
    [permissions],
  )

  const hasAny = useCallback(
    (requiredPermissions: Permission[]) =>
      hasAnyPermission(permissions, requiredPermissions),
    [permissions],
  )

  return useMemo(
    () => ({
      permissions,
      isLoading: status === "loading",
      error: null,
      hasPermission,
      hasAnyPermission: hasAny,
    }),
    [permissions, status, hasPermission, hasAny],
  )
}

