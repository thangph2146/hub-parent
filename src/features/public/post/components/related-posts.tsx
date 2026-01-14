/**
 * Related Posts Component
 * 
 * Server Component - displays posts related to the current post
 * Based on shared categories and tags
 */

import { PostCard } from "./post-card"
import { FileText } from "lucide-react"
import { TypographyH2, IconSize } from "@/components/ui/typography"
import { Flex } from "@/components/ui/flex"
import { Grid } from "@/components/ui/grid"
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
      <Flex align="center" gap={3} className="mb-8">
        <Flex align="center" justify="center" className="p-2 bg-primary/10 rounded-lg">
          <IconSize size="md">
            <FileText />
          </IconSize>
        </Flex>
        <TypographyH2>{title}</TypographyH2>
      </Flex>

      <Grid cols={3} gap={8}>
        {posts.map((post) => (
          <PostCard key={post.id} post={post} headingLevel="h3" />
        ))}
      </Grid>
    </section>
  )
}

