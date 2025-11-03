/**
 * NextAuth.js Type Definitions
 */
import "next-auth"
import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
    } & DefaultSession["user"]
    permissions?: string[]
    roles?: Array<{
      id: string
      name: string
      displayName: string
    }>
  }

  interface User {
    id: string
    permissions?: string[]
    roles?: Array<{
      id: string
      name: string
      displayName: string
    }>
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    email?: string
    name?: string | null
    picture?: string | null
    permissions?: string[]
    roles?: Array<{
      id: string
      name: string
      displayName: string
    }>
    // Standard JWT claims
    iat?: number // Issued at timestamp
    exp?: number // Expiration timestamp
    sub?: string // Subject (user ID)
  }
}

