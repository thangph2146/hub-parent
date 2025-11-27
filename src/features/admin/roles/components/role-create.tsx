import { getAllPermissionsOptions } from "../server/queries"
import { RoleCreateClient } from "./role-create.client"

export interface RoleCreateProps {
  backUrl?: string
}

export async function RoleCreate({ backUrl = "/admin/roles" }: RoleCreateProps) {
  const permissions = await getAllPermissionsOptions()

  return <RoleCreateClient backUrl={backUrl} permissions={permissions} />
}

