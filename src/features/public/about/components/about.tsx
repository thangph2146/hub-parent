/**
 * Server Component: About Page
 * 
 * Fetches data và pass xuống client component
 * Pattern: Server Component (data fetching) → Client Component (UI/interactions)
 */

import { AboutClient } from "./about-client"

export type AboutProps = Record<string, never>

export async function About({}: AboutProps) {
  // Nếu cần fetch data, thêm vào đây

  return <AboutClient />
}

