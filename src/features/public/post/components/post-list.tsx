import { PostCard } from "@/components/public/post/post-card"
import { PostPagination } from "@/components/public/post/post-pagination"
import { PostEmptyState } from "./post-empty-state"
import { Flex } from "@/components/ui/flex"
import { Row, Col } from "antd"
import type { Post } from "@/features/public/post/types"
import { Skeleton } from "@/components/ui/skeleton"

interface PostListProps {
  posts: Post[]
  currentPage: number
  totalPages: number
}

export const PostList = ({ posts, currentPage, totalPages }: PostListProps) => {
  if (posts.length === 0) {
    return <PostEmptyState />
  }

  return (
    <>
      <Row gutter={[32, 32]}>
        {posts.map((post, index) => (
          <Col key={post.id} xs={24} sm={12} lg={12}>
            <PostCard 
              post={post} 
              priority={index < 3}
            />
          </Col>
        ))}
      </Row>
      
      {totalPages > 1 && (
        <Flex justify="center" padding="responsive-y" className="pt-12">
          <PostPagination currentPage={currentPage} totalPages={totalPages} />
        </Flex>
      )}
    </>
  )
}

export const PostListSkeleton = () => {
  return (
    <Row gutter={[32, 32]}>
      {Array.from({ length: 6 }).map((_, i) => (
        <Col key={i} xs={24} sm={12} lg={12}>
          <Flex direction="col" gap={4}>
            <Skeleton className="aspect-video w-full rounded-lg" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-24" />
          </Flex>
        </Col>
      ))}
    </Row>
  )
}


