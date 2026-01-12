import { prisma } from "@/lib/prisma"
import type { AccountProfile } from "../types"

export const getCurrentUserProfile = async (userId: string): Promise<AccountProfile | null> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                displayName: true,
              },
            },
          },
        },
      },
    })

    if (!user || user.deletedAt) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      bio: user.bio,
      phone: user.phone,
      address: user.address,
      emailVerified: user.emailVerified?.toISOString() || null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      roles: user.userRoles.map((ur) => ur.role),
    }
  } catch (error) {
    console.error("[getCurrentUserProfile] Error:", error)
    return null
  }
};

