/**
 * Types for Accounts Feature
 * Quản lý thông tin cá nhân của user hiện tại
 */

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

export interface UpdateAccountInput {
  name?: string | null
  bio?: string | null
  phone?: string | null
  address?: string | null
  password?: string
  avatar?: string | null
}

