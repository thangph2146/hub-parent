import type { requireAuth } from "@/auth"
import type { Permission } from "@/permissions"

export type ApiRouteContext = {
  session: Awaited<ReturnType<typeof requireAuth>>
  permissions: Permission[]
  roles: Array<{ name: string }>
}

export interface ApiResponsePayload<T = unknown> {
  success: boolean
  message?: string
  error?: string | null
  data?: T
}
