/**
 * Server Component: Role Detail
 * 
 * Fetches role data và pass xuống client component
 * Pattern: Server Component (data fetching) → Client Component (UI/interactions)
 */

import { getRoleDetailById } from "../server/cache"
import { serializeRoleDetail } from "../server/helpers"
import { RoleDetailClient } from "./role-detail.client"
import type { RoleDetailData } from "./role-detail.client"

export interface RoleDetailProps {
  roleId: string
  backUrl?: string
}

export async function RoleDetail({ roleId, backUrl = "/admin/roles" }: RoleDetailProps) {
  const role = await getRoleDetailById(roleId)

  if (!role) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4 md:p-6 lg:p-8">
        <div className="text-center">
          <p className="text-muted-foreground">Không tìm thấy vai trò</p>
        </div>
      </div>
    )
  }

  return (
    <RoleDetailClient
      roleId={roleId}
      role={serializeRoleDetail(role) as RoleDetailData}
      backUrl={backUrl}
    />
  )
}

