/**
 * Server Component: Post Detail
 * 
 * Fetches post data và related posts, pass xuống client component
 * Pattern: Server Component (data fetching) → Client Component (UI/interactions)
 */

import { getPostBySlug, getRelatedPosts } from "../server/queries"
import { PostDetailClient } from "./post-detail.client"
import { RelatedPosts } from "./related-posts"
import { PostBreadcrumb } from "@/components/public/post/post-breadcrumb"
import { notFound } from "next/navigation"

export interface PostDetailProps {
  slug: string
}

export async function PostDetail({ slug }: PostDetailProps) {
  const post = await getPostBySlug(slug)

  if (!post) {
    notFound()
  }

  // Get related posts based on categories and tags
  const categoryIds = post.categories.map((cat) => cat.id)
  const tagIds = post.tags.map((tag) => tag.id)
  const relatedPosts = await getRelatedPosts(post.id, categoryIds, tagIds, 4)

  // Get first category and tag for breadcrumb
  const firstCategory = post.categories[0]
  const firstTag = post.tags[0]

  return (
    <div className="container mx-auto px-4 max-w-5xl pb-12">
      {/* Breadcrumb */}
      <div className="container mx-auto px-8 max-w-5xl mt-6">
        <PostBreadcrumb
          postTitle={post.title}
          categoryName={firstCategory?.name}
          categorySlug={firstCategory?.slug}
          tagName={firstTag?.name}
          tagSlug={firstTag?.slug}
          isListPage={false}
        />
      </div>

      <PostDetailClient post={post} />
      <RelatedPosts posts={relatedPosts} />
    </div>
  )
}

