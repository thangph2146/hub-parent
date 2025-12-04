/**
 * Hook để check permissions của user với NextAuth
 */
"use client"

import { useCallback, useEffect, useMemo, useRef } from "react"
import { useSession } from "next-auth/react"
import type { Permission } from "@/lib/permissions"
import { hasAnyPermission } from "@/lib/permissions"
import { logger } from "@/lib/config"

export function usePermissions() {
  const { data: session, status } = useSession()
  const loggedPermissionsRef = useRef<string | null>(null)

  const permissions = useMemo(
    () => (session?.permissions ?? []) as Permission[],
    [session?.permissions],
  )

  // Log permissions khi session được load hoặc permissions thay đổi
  useEffect(() => {
    if (status === "loading" || !session?.user) {
      return
    }

    const permissionsKey = JSON.stringify(permissions.sort())
    
    // Chỉ log một lần khi permissions thay đổi
    if (loggedPermissionsRef.current === permissionsKey) {
      return
    }

    loggedPermissionsRef.current = permissionsKey

    logger.info("[usePermissions] Loaded permissions from session", {
      action: "permissions_loaded",
      email: session.user.email,
      userId: session.user.id,
      roles: session.roles?.map((r) => r.name) ?? [],
      permissionsCount: permissions.length,
      permissions: permissions, // Log tất cả permissions
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

