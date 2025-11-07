/**
 * Server Component: Student Create
 * 
 * Fetches users options với cached query, sau đó pass xuống client component
 * Pattern: Server Component (data fetching với cache) → Client Component (UI/interactions)
 */

import { StudentCreateClient } from "./student-create.client"
import { getActiveUsersForSelectCached } from "@/features/admin/users/server/cache"
import { getAuthInfo } from "@/features/admin/resources/server"

export interface StudentCreateProps {
  backUrl?: string
}

export async function StudentCreate({ backUrl = "/admin/students" }: StudentCreateProps) {
  const { isSuperAdminUser } = await getAuthInfo()

  // Chỉ fetch users options nếu là super admin
  const usersOptions = isSuperAdminUser ? await getActiveUsersForSelectCached(100) : []

  return <StudentCreateClient backUrl={backUrl} users={usersOptions} isSuperAdmin={isSuperAdminUser} />
}

