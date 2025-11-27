export interface AccountProfile {
  id: string
  email: string
  name: string | null
  avatar: string | null
  bio: string | null
  phone: string | null
  address: string | null
  emailVerified: string | null
  createdAt: string
  updatedAt: string
  roles: Array<{
    id: string
    name: string
    displayName: string
  }>
  [key: string]: unknown
}

// Re-export UpdateAccountInput from schemas to ensure consistency
export type { UpdateAccountInput } from "./server/schemas"

