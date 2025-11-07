/**
 * Server Component: Students Table
 * 
 * Fetches initial data, sau đó pass xuống client component
 * Pattern: Server Component (data fetching) → Client Component (UI/interactions)
 */

import { listStudentsCached } from "../server/cache"
import { serializeStudentsList } from "../server/helpers"
import { StudentsTableClient } from "./students-table.client"
import { getActiveUsersForSelectCached } from "@/features/admin/users/server/cache"

export interface StudentsTableProps {
  canDelete?: boolean
  canRestore?: boolean
  canManage?: boolean
  canCreate?: boolean
  actorId?: string
  isSuperAdmin?: boolean
}

export async function StudentsTable({ 
  canDelete, 
  canRestore, 
  canManage, 
  canCreate,
  actorId,
  isSuperAdmin: isSuperAdminUser = false,
}: StudentsTableProps) {
  const [studentsData, usersOptions] = await Promise.all([
    listStudentsCached({
      page: 1,
      limit: 10,
      status: "active",
      actorId,
      isSuperAdmin: isSuperAdminUser,
    }),
    getActiveUsersForSelectCached(100),
  ])

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

