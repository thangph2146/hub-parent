/**
 * Server Component: Student Create
 * 
 * Fetches users options với cached query, sau đó pass xuống client component
 * Pattern: Server Component (data fetching với cache) → Client Component (UI/interactions)
 */

import { StudentCreateClient } from "./student-create.client"
import { getActiveUsersForSelectCached } from "@/features/admin/users/server/cache"

export interface StudentCreateProps {
  backUrl?: string
}

export async function StudentCreate({ backUrl = "/admin/students" }: StudentCreateProps) {
  // Fetch users for userId select field using cached query
  const usersOptions = await getActiveUsersForSelectCached(100)

  return <StudentCreateClient backUrl={backUrl} users={usersOptions} />
}

