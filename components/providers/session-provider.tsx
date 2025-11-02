/**
 * Session Provider (NextAuth.js)
 * Cung cấp authentication state cho toàn bộ app
 */
"use client"

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react"
import type { SessionProviderProps } from "next-auth/react"

export function SessionProvider({
  children,
  ...props
}: SessionProviderProps) {
  return (
    <NextAuthSessionProvider {...props}>{children}</NextAuthSessionProvider>
  )
}

