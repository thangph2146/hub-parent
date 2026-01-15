/**
 * Authentication Barrel Export (Client-safe)
 * Centralized exports for authentication utilities
 * Use these instead of direct imports from "next-auth/react" for consistency
 * 
 * NOTE: Server-only utilities (auth, handlers, getSession, etc.) 
 * should be imported from "@/auth/server"
 */

export {
  authApi,
  useSession,
  signIn as signInClient,
  signOut as signOutClient,
  type SignInRequest,
  type SignUpRequest,
} from "./auth-client"

// Re-export types from server-side to allow 'import type' from here if needed
// This is safe as long as it's used with 'import type'
export type { requireAuth, getPermissions, getSession } from "./auth-server"
