/**
 * Authentication Barrel Export
 * 
 * Export tất cả authentication related utilities từ một nơi
 */

// NextAuth configuration (main export)
export { auth, handlers, signIn, signOut } from "./auth"

// Server-side auth utilities
export {
  getSession,
  requireAuth,
  getPermissions,
} from "./auth-server"

// Client-side auth utilities
export {
  authApi,
  type SignInRequest,
  type SignUpRequest,
} from "./auth-client"

