/**
 * Shared types for API routes
 */

import type { requireAuth } from "@/lib/auth"
import type { Permission } from "@/lib/permissions"

export type ApiRouteContext = {
  session: Awaited<ReturnType<typeof requireAuth>>
  permissions: Permission[]
  roles: Array<{ name: string }>
}
