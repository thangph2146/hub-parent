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
    <div className="mt-8">
      {/* Tags */}
      {post.tags.length > 0 && (
        <Flex align="center" justify="start" gap={3} wrap className="py-8 border-t">
          <Flex align="center" justify="center" className="shrink-0">
            <IconSize size="md">
              <Tag />
            </IconSize>
          </Flex>
          <Flex align="center" gap={2} wrap>
            {post.tags.map((tag) => (
              <Badge key={tag.id} variant="outline" className="px-3 py-1 text-sm">
                {tag.name}
              </Badge>
            ))}
          </Flex>
        </Flex>
      )}

      {/* Bottom Share */}
      <Flex direction="col" align="center" gap={4} className="py-12 border-t border-b bg-muted/30 rounded-lg px-6">
        <Flex align="center" gap={2}>
          <IconSize size="md">
            <Share2 />
          </IconSize>
          <TypographySpanSmallMuted className="font-semibold text-foreground">
            Chia sẻ bài viết này
          </TypographySpanSmallMuted>
        </Flex>
        <PostShare title={post.title} url={postUrl} variant="default" />
      </Flex>
    </div>
  )
}

export default PostTagsAndBottomShare;
