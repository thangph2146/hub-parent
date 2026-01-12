import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { validatePagination, buildPagination, type ResourcePagination } from "@/features/admin/resources/server"
import { mapPostRecord, buildWhereClause } from "./helpers"
import { logger } from "@/lib/config/logger"

export interface ListPostsInput {
  page?: number
  limit?: number
  search?: string
  filters?: Record<string, string>
  status?: "active" | "deleted" | "all"
}

export interface ListedPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  image: string | null
  published: boolean
  publishedAt: Date | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
  author: {
    id: string
    name: string | null
    email: string
  }
  categories?: Array<{
    id: string
    name: string
  }>
  tags?: Array<{
    id: string
    name: string
  }>
}

export interface PostDetail extends ListedPost {
  content: Prisma.JsonValue
  categories?: Array<{
    id: string
    name: string
  }>
  tags?: Array<{
    id: string
    name: string
  }>
}

export interface ListPostsResult {
  data: ListedPost[]
  pagination: ResourcePagination
}

const POST_INCLUDE = {
  author: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  categories: {
    include: {
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
  tags: {
    include: {
      tag: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
} satisfies Prisma.PostInclude

export const listPosts = async (params: ListPostsInput = {}): Promise<ListPostsResult> => {
  const { page, limit } = validatePagination(params.page, params.limit, 100)
  const where = buildWhereClause(params)

  logger.debug("[Posts Query] Executing listPosts", {
    page,
    limit,
    hasFilters: !!params.filters,
    filters: params.filters,
  })

  try {
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updatedAt: "desc" },
        include: POST_INCLUDE,
      }),
      prisma.post.count({ where }),
    ])

    const result = {
      data: posts.map(mapPostRecord),
      pagination: buildPagination(page, limit, total),
    }

    logger.info("[Posts Query] listPosts result", {
      postsCount: result.data.length,
      total,
      authorIds: result.data.map((p) => p.author.id),
      uniqueAuthors: [...new Set(result.data.map((p) => p.author.id))],
      hasAuthorIdFilter: !!where.authorId,
    })

    return result
  } catch (error) {
    logger.error("[Posts Query] Error in listPosts:", error)
    return {
      data: [],
      pagination: buildPagination(page, limit, 0),
    }
  }
};

export const getPostColumnOptions = async (
  column: string,
  search?: string,
  limit: number = 50
): Promise<Array<{ label: string; value: string }>> => {
  const where: Prisma.PostWhereInput = {
    deletedAt: null, // Only active posts
  }

  // Add search filter if provided
  if (search && search.trim()) {
    const searchValue = search.trim()
    switch (column) {
      case "title":
        where.title = { contains: searchValue, mode: "insensitive" }
        break
      case "slug":
        where.slug = { contains: searchValue, mode: "insensitive" }
        break
      default:
        where.title = { contains: searchValue, mode: "insensitive" }
    }
  }

  // Build select based on column
  let selectField: Prisma.PostSelect
  switch (column) {
    case "title":
      selectField = { title: true }
      break
    case "slug":
      selectField = { slug: true }
      break
    default:
      selectField = { title: true }
  }

  try {
    const results = await prisma.post.findMany({
      where,
      select: selectField,
      orderBy: { [column]: "asc" },
      take: limit,
    })

    // Map results to options format
    return results
      .map((item) => {
        const value = item[column as keyof typeof item]
        if (typeof value === "string" && value.trim()) {
          return {
            label: value,
            value: value,
          }
        }
        return null
      })
      .filter((item): item is { label: string; value: string } => item !== null)
  } catch (error) {
    logger.error("[Posts Query] Error in getPostColumnOptions:", error)
    return []
  }
}

/**
 * Get list of dates that have published posts
 * Returns array of date strings in format "yyyy-MM-dd"
 */
export const getDatesWithPosts = async (authorId?: string): Promise<string[]> => {
  const where: Prisma.PostWhereInput = {
    published: true,
    publishedAt: { not: null },
    deletedAt: null,
  }

  // Apply authorId filter if provided (for users with POSTS_VIEW_OWN permission)
  if (authorId) {
    where.authorId = authorId
  }

  try {
    const posts = await prisma.post.findMany({
      where,
      select: {
        publishedAt: true,
      },
      distinct: ["publishedAt"],
    })

    // Extract unique dates (format: yyyy-MM-dd)
    const dates = new Set<string>()
    posts.forEach((post) => {
      if (post.publishedAt) {
        const date = new Date(post.publishedAt)
        const dateStr = date.toISOString().split("T")[0] // Format: yyyy-MM-dd
        dates.add(dateStr)
      }
    })

    return Array.from(dates).sort()
  } catch (error) {
    logger.error("[Posts Query] Error in getDatesWithPosts:", error)
    return []
  }
}

export const getPostById = async (id: string): Promise<PostDetail | null> => {
  try {
    const post = await prisma.post.findUnique({
      where: { id },
      include: POST_INCLUDE,
    })

    if (!post) {
      return null
    }

    return {
      ...mapPostRecord(post),
      content: post.content,
    }
  } catch (error) {
    logger.error("[Posts Query] Error in getPostById:", error)
    return null
  }
};

// Re-export helpers for convenience
export { mapPostRecord, type PostWithAuthor } from "./helpers"
