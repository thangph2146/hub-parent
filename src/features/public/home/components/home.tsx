/**
 * Server Component: Home Page
 * 
 * Fetches data và pass xuống client component
 * Pattern: Server Component (data fetching) → Client Component (UI/interactions)
 */

import { HomeClient } from "./home-client"

export type HomeProps = Record<string, never>

export async function Home({}: HomeProps) {
  // Nếu cần fetch data, thêm vào đây
  // const data = await getHomeDataCached()

  return <HomeClient />
}

