import { prisma } from "@/lib/prisma"
import { cache } from "react"

export const getTotalUnreadMessagesCount = async (userId: string): Promise<number> => {
  const personalUnreadCount = await prisma.message.count({
    where: {
      receiverId: userId,
      isRead: false,
      deletedAt: null,
      groupId: null,
    },
  })

  const userGroupMemberships = await prisma.groupMember.findMany({
    where: {
      userId,
      leftAt: null,
    },
    select: {
      groupId: true,
    },
  })

  const groupIds = userGroupMemberships.map((gm) => gm.groupId)

  let groupUnreadCount = 0
  if (groupIds.length > 0) {
    groupUnreadCount = await prisma.message.count({
      where: {
        groupId: { in: groupIds },
        senderId: { not: userId },
        deletedAt: null,
        reads: {
          none: {
            userId,
          },
        },
      },
    })
  }

  return personalUnreadCount + groupUnreadCount
};

export const getTotalUnreadMessagesCountCached = cache(getTotalUnreadMessagesCount)

