import { PostCard } from "@/components/public/post/post-card"
import { PostPagination } from "@/components/public/post/post-pagination"
import { PostEmptyState } from "./post-empty-state"
import { Flex } from "@/components/ui/flex"
import { Grid } from "@/components/ui/grid"
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
      <Grid cols={2} gap={8}>
        {posts.map((post, index) => (
          <PostCard 
            key={post.id} 
            post={post} 
            priority={index < 3}
          />
        ))}
      </Grid>
      
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
    <Grid cols={3} gap={8}>
      {Array.from({ length: 6 }).map((_, i) => (
        <Flex key={i} direction="col" gap={4}>
          <Skeleton className="aspect-video w-full rounded-lg" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-24" />
        </Flex>
      ))}
    </Grid>
  )
}


