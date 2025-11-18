/**
 * Helper function để tạo Session record khi user đăng nhập
 * Được gọi từ API route sau khi đăng nhập thành công
 */

import { randomBytes } from "crypto"
import { prisma } from "@/lib/database"
import { emitSessionUpsert } from "./events"
import { logger } from "@/lib/config"

interface CreateLoginSessionParams {
  userId: string
  userAgent?: string | null
  ipAddress?: string | null
}

/**
 * Tạo Session record khi user đăng nhập
 * Tự động generate accessToken và refreshToken
 */
export async function createLoginSession({
  userId,
  userAgent,
  ipAddress,
}: CreateLoginSessionParams) {
  try {
    // Generate random tokens
    const accessToken = `at_${randomBytes(32).toString("hex")}`
    const refreshToken = `rt_${randomBytes(32).toString("hex")}`

    // Session expires sau 7 ngày (giống NextAuth config)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    // Tạo Session record
    const session = await prisma.session.create({
      data: {
        userId,
        accessToken,
        refreshToken,
        userAgent: userAgent?.trim() || null,
        ipAddress: ipAddress?.trim() || null,
        isActive: true,
        expiresAt,
        lastActivity: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    logger.debug("Session created for login", {
      sessionId: session.id,
      userId,
      userAgent,
      ipAddress,
    })

    // Emit socket event để realtime update
    await emitSessionUpsert(session.id, null)

    return {
      id: session.id,
      userId: session.userId,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      isActive: session.isActive,
      expiresAt: session.expiresAt.toISOString(),
      lastActivity: session.lastActivity.toISOString(),
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
    }
  } catch (error) {
    logger.error("Error creating login session", error instanceof Error ? error : new Error(String(error)))
    throw error
  }
}

