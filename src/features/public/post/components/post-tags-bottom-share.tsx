"use client"

import { Tag, Share2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Flex } from "@/components/ui/flex"
import { IconSize, TypographySpanSmallMuted } from "@/components/ui/typography"
import { PostShare } from "./post-share"
import type { PostDetail } from "../types"

export interface PostTagsAndBottomShareProps {
  post: PostDetail
  postUrl: string
}

export const PostTagsAndBottomShare = ({ post, postUrl }: PostTagsAndBottomShareProps) => {
  return (
    <div>
      {/* Tags */}
      {post.tags.length > 0 && (
        <Flex as="section" direction="row" align="center" justify="start" gap={3} wrap className="py-10 border-t" aria-label="Thẻ bài viết">
          <Flex align="center" justify="center" className="shrink-0 text-muted-foreground">
            <IconSize size="md">
              <Tag aria-hidden="true" />
            </IconSize>
          </Flex>
          <Flex align="center" gap={2} wrap>
            {post.tags.map((tag) => (
              <Badge key={tag.id} variant="outline" className="px-3 py-1 text-sm font-medium hover:bg-primary/5 transition-colors">
                {tag.name}
              </Badge>
            ))}
          </Flex>
        </Flex>
      )}

      {/* Bottom Share */}
      <Flex as="section" direction="col" align="center" gap={4} className="py-10 bg-muted/30 rounded-lg px-6" aria-label="Chia sẻ bài viết">
        <Flex align="center" gap={2}>
          <IconSize size="md" className="text-primary">
            <Share2 aria-hidden="true" />
          </IconSize>
          <TypographySpanSmallMuted className="font-semibold text-foreground text-base">
            Chia sẻ bài viết này
          </TypographySpanSmallMuted>
        </Flex>
        <PostShare title={post.title} url={postUrl} variant="default" />
      </Flex>
    </div>
  )
}

export default PostTagsAndBottomShare;
