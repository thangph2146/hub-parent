/**
 * Server Component: Help Page
 * 
 * Fetches data và pass xuống client component
 * Pattern: Server Component (data fetching) → Client Component (UI/interactions)
 */

import { HelpClient } from "./help-client"

export type HelpProps = Record<string, never>

export async function Help({}: HelpProps) {
  // Nếu cần fetch data, thêm vào đây
  // const data = await getHelpDataCached()

  return <HelpClient />
}

