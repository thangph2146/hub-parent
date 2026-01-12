"use client"

import { useScrollToTop } from "@/hooks"
import { PostList } from "./post-list"
import type { Post } from "@/features/public/post/types"

interface PostPageClientProps {
  posts: Post[]
  currentPage: number
  totalPages: number
}

export function PostPageClient({ posts, currentPage, totalPages }: PostPageClientProps) {
  // Scroll to top when route or search params change (page, filters, etc.)
  useScrollToTop()

  return (
    <PostList
      posts={posts}
      currentPage={currentPage}
      totalPages={totalPages}
    />
  )
}

