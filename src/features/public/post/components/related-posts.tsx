/**
 * Related Posts Component
 * 
 * Server Component - displays posts related to the current post
 * Based on shared categories and tags
 */

import { PostCard } from "@/components/public/post/post-card"
import { FileText } from "lucide-react"
import type { Post } from "../types"

interface RelatedPostsProps {
  posts: Post[]
  title?: string
}

export function RelatedPosts({ posts, title = "Bài viết liên quan" }: RelatedPostsProps) {
  if (posts.length === 0) {
    return null
  }

  return (
    <section className="pt-12 border-t">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-primary/10 rounded-lg">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h2>
      </div>

      <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  )
}

