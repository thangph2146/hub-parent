/**
 * Server Component: Students Table
 * 
 * Fetches initial data, sau đó pass xuống client component
 * Pattern: Server Component (data fetching) → Client Component (UI/interactions)
 */

import { listStudentsCached } from "../server/cache"
import { serializeStudentsList } from "../server/helpers"
import { StudentsTableClient } from "./students-table.client"
import { prisma } from "@/lib/database"

export interface StudentsTableProps {
  canDelete?: boolean
  canRestore?: boolean
  canManage?: boolean
  canCreate?: boolean
}

export async function StudentsTable({ canDelete, canRestore, canManage, canCreate }: StudentsTableProps) {
  const studentsData = await listStudentsCached({
    page: 1,
    limit: 10,
    status: "active",
  })

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

  return (
    <StudentsTableClient
      canDelete={canDelete}
      canRestore={canRestore}
      canManage={canManage}
      canCreate={canCreate}
      initialData={serializeStudentsList(studentsData)}
      initialUsersOptions={usersOptions}
    />
  )
}

