/**
 * Server Component: Students Table
 * 
 * Fetches initial data, sau đó pass xuống client component
 * Pattern: Server Component (data fetching) → Client Component (UI/interactions)
 */

import { listStudents } from "../server/queries"
import { serializeStudentsList } from "../server/helpers"
import { StudentsTableClient } from "./students-table.client"

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
  // Sử dụng listStudents (non-cached) để đảm bảo data luôn fresh
  // Theo chuẩn Next.js 16: không cache admin data
  const studentsData = await listStudents({
    page: 1,
    limit: 10,
    status: "active",
    actorId,
    isSuperAdmin: isSuperAdminUser,
  })

  return (
    <StudentsTableClient
      canDelete={canDelete}
      canRestore={canRestore}
      canManage={canManage}
      canCreate={canCreate}
      initialData={serializeStudentsList(studentsData)}
    />
  )
}

