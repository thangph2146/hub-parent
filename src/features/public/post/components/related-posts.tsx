/**
 * Related Posts Component
 * 
 * Server Component - displays posts related to the current post
 * Based on shared categories and tags
 */

import { PostCard } from "@/components/public/post/post-card"
import { FileText } from "lucide-react"
import { headerConfig, iconSizes } from "@/lib/typography"
import type { Post } from "../types"

interface RelatedPostsProps {
  posts: Post[]
  title?: string
}

export const RelatedPosts = ({ posts, title = "Bài viết liên quan" }: RelatedPostsProps) => {
  if (posts.length === 0) {
    return null
  }

  return (
    <section className="pt-12 border-t">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-primary/10 rounded-lg">
          <FileText className={`${iconSizes.md} text-primary`} />
        </div>
        <h2 className={headerConfig.section.className}>{title}</h2>
      </div>

      <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  )
}

