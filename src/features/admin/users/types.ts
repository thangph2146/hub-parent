import type { Role } from "./utils"
import type { ResourceResponse, BaseResourceTableClientProps } from "@/features/admin/resources/types"
import type { ApiResponsePayload } from "@/types"

export type UserRole = Role

export interface UserRow {
  id: string
  email: string
  name: string | null
  isActive: boolean
  createdAt: string
  deletedAt: string | null
  roles: UserRole[]
}

export interface UsersTableClientProps extends BaseResourceTableClientProps<UserRow> {
  initialRolesOptions?: Array<{ label: string; value: string }>
}

// API response structure: { success: true, data: { data: UserRow[], pagination: {...} } }
export type UsersResponse = ApiResponsePayload<ResourceResponse<UserRow>>

