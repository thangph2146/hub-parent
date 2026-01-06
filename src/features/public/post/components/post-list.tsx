"use client"

import { PostCard } from "@/components/public/post/post-card"
import { PostPagination } from "@/components/public/post/post-pagination"
import { PostEmptyState } from "./post-empty-state"
import { Flex } from "@/components/ui/flex"
import { Grid } from "@/components/ui/grid"
import type { Post } from "@/features/public/post/types"
import { Skeleton } from "@/components/ui/skeleton"

import { motion, Variants } from "framer-motion"

interface PostListProps {
  posts: Post[]
  currentPage: number
  totalPages: number
}

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] // Custom bezier for smooth easeOut
    }
  }
}

export const PostList = ({ posts, currentPage, totalPages }: PostListProps) => {
  if (posts.length === 0) {
    return <PostEmptyState />
  }

  return (
    <>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
      >
        <Grid cols="responsive-3" gap={8} className="pb-8">
          {posts.map((post, index) => (
            <motion.div key={post.id} variants={item} className="h-full">
              <PostCard
                post={post}
                priority={index < 3}
              />
            </motion.div>
          ))}
        </Grid>
      </motion.div>

      {totalPages > 1 && (
        <Flex justify="center" padding="responsive-y" className="pt-4 border-t border-border/50">
          <PostPagination currentPage={currentPage} totalPages={totalPages} />
        </Flex>
      )}
    </>
  )
}

export const PostListSkeleton = () => {
  return (
    <Grid cols="responsive-3" gap={8}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i}>
          <Flex direction="col" gap={4}>
            <Skeleton className="aspect-video w-full rounded-lg" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-24" />
          </Flex>
        </div>
      ))}
    </Grid>
  )
}


