/**
 * Server Component: Home Page
 * 
 * Fetches data và pass xuống client component
 * Pattern: Server Component (data fetching) → Client Component (UI/interactions)
 */

import { HomeClient } from "./home-client"
import { getPosts } from "@/features/public/post/server/queries"

export type HomeProps = Record<string, never>

export async function Home({}: HomeProps) {
  // Fetch bài viết nổi bật (6 bài mới nhất)
  const featuredPostsResult = await getPosts({
    page: 1,
    limit: 6,
    sort: "newest",
  })

  return <HomeClient featuredPosts={featuredPostsResult.data} />
}

