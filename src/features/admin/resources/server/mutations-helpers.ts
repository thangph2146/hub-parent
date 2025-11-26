import type { Permission } from "@/lib/permissions"
import { canPerformAction } from "@/lib/permissions"
import { ForbiddenError } from "./errors"

export interface AuthContext {
  actorId: string
  permissions: Permission[]
  roles: Array<{ name: string }>
}

export function ensurePermission(ctx: AuthContext, ...required: Permission[]): void {
  if (!required.some((perm) => canPerformAction(ctx.permissions, ctx.roles, perm))) {
    throw new ForbiddenError()
  }
}

