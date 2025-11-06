/**
 * Server Component: Student Create
 * 
 * Pass props xuống client component
 * Pattern: Server Component → Client Component (UI/interactions)
 */

import { StudentCreateClient } from "./student-create.client"
import { prisma } from "@/lib/database"

export interface StudentCreateProps {
  backUrl?: string
}

export async function StudentCreate({ backUrl = "/admin/students" }: StudentCreateProps) {
  // Fetch users for userId select field
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: {
      name: "asc",
    },
    take: 100, // Limit to 100 users
  })

  const usersOptions = users.map((user) => ({
    label: user.name ? `${user.name} (${user.email})` : user.email || user.id,
    value: user.id,
  }))

  return <StudentCreateClient backUrl={backUrl} users={usersOptions} />
}

