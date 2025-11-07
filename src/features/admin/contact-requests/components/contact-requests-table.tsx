/**
 * Server Component: Contact Requests Table
 * 
 * Fetches initial data và users options, sau đó pass xuống client component
 * Pattern: Server Component (data fetching) → Client Component (UI/interactions)
 */

import { listContactRequestsCached } from "../server/cache"
import { serializeContactRequestsList } from "../server/helpers"
import { ContactRequestsTableClient } from "./contact-requests-table.client"
import { getActiveUsersForSelectCached } from "@/features/admin/users/server/cache"

export interface ContactRequestsTableProps {
  canDelete?: boolean
  canRestore?: boolean
  canManage?: boolean
  canUpdate?: boolean
  canAssign?: boolean
}

export async function ContactRequestsTable({ canDelete, canRestore, canManage, canUpdate, canAssign }: ContactRequestsTableProps) {
  const [contactRequestsData, usersOptions] = await Promise.all([
    listContactRequestsCached({
      page: 1,
      limit: 10,
      status: "active",
    }),
    getActiveUsersForSelectCached(100),
  ])

  return (
    <ContactRequestsTableClient
      canDelete={canDelete}
      canRestore={canRestore}
      canManage={canManage}
      canUpdate={canUpdate}
      canAssign={canAssign}
      initialData={serializeContactRequestsList(contactRequestsData)}
      initialUsersOptions={usersOptions}
    />
  )
}

