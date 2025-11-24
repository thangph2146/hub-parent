import { redirect } from "next/navigation"

/**
 * Forgot Password Redirect Page
 * Redirects to /auth/forgot-password to maintain consistency with auth routes
 */
export default function ForgotPasswordRedirect() {
  redirect("/auth/forgot-password")
}

