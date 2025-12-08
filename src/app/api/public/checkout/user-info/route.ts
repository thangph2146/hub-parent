/**
 * Public API Route: GET /api/public/checkout/user-info
 * 
 * Get user information for checkout form pre-fill
 */
import { NextRequest } from "next/server"
import { auth } from "@/lib/auth/auth"
import { getCurrentUserProfile } from "@/features/admin/accounts/server/queries"
import { createErrorResponse, createSuccessResponse } from "@/lib/config/api-response"

export async function GET(_request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return createSuccessResponse(null, { message: "User not authenticated" })
    }

    const userProfile = await getCurrentUserProfile(session.user.id)

    if (!userProfile) {
      return createErrorResponse("Không tìm thấy thông tin người dùng", { status: 404 })
    }

    // Parse address if it's a JSON string (for future structured address support)
    let shippingAddress = null
    if (userProfile.address) {
      try {
        const parsed = JSON.parse(userProfile.address)
        if (typeof parsed === "object" && parsed !== null) {
          shippingAddress = parsed
        }
      } catch {
        // If not JSON, treat as simple string address
        // For now, we'll just use the address as-is in the address field
      }
    }

    return createSuccessResponse({
      name: userProfile.name || "",
      email: userProfile.email,
      phone: userProfile.phone || "",
      address: userProfile.address || "",
      shippingAddress,
    })
  } catch {
    return createErrorResponse("Không thể lấy thông tin người dùng", { status: 500 })
  }
}

