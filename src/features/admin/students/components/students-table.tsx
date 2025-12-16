import { listStudents } from "../server/queries"
import { serializeStudentsList } from "../server/helpers"
import { StudentsTableClient } from "./students-table.client"

export interface StudentsTableProps {
  canDelete?: boolean
  canRestore?: boolean
  canManage?: boolean
  canCreate?: boolean
  canUpdate?: boolean
  canActivate?: boolean
  actorId?: string
  isSuperAdmin?: boolean
  isParent?: boolean
}

export async function StudentsTable({ 
  canDelete, 
  canRestore, 
  canManage, 
  canCreate,
  canUpdate,
  canActivate,
  actorId,
  isSuperAdmin: isSuperAdminUser = false,
  isParent = false,
}: StudentsTableProps) {
  // Parent xem tất cả students (kể cả inactive), default status = "all"
  // Admin/SuperAdmin xem active students, default status = "active"
  const defaultStatus = isParent ? "all" : "active"
  
  const studentsData = await listStudents({
    page: 1,
    limit: 10,
    status: defaultStatus,
    actorId,
    isSuperAdmin: isSuperAdminUser,
  })

  return (
    <StudentsTableClient
      canDelete={canDelete}
      canRestore={canRestore}
      canManage={canManage}
      canCreate={canCreate}
      canUpdate={canUpdate}
      canActivate={canActivate}
      isParent={isParent}
      initialData={serializeStudentsList(studentsData)}
    />
  )
}
