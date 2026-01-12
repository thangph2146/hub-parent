/**
 * Non-cached Database Queries for Public Posts
 * 
 * Chứa các database queries không có cache wrapper
 * Sử dụng cho các trường hợp cần fresh data hoặc trong API routes
 * Để sử dụng trong Server Components, dùng cache() wrapper từ cache.ts
 */
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { validatePagination } from "@/lib/api/validation"
import { buildPagination, type ResourcePagination } from "@/features/admin/resources/server"
import { mapPostRecord, mapPostDetailRecord, buildPublicPostWhereClause, buildPublicPostOrderBy } from "./helpers"
import type { Post, PostDetail } from "../types"

export interface GetPostsParams {
  page?: number
  limit?: number
  search?: string
  categories?: string[]
  tags?: string[]
  sort?: "newest" | "oldest"
  dateFrom?: string
  dateTo?: string
}

export interface PostsResult {
  data: Post[]
  pagination: ResourcePagination
}

export const getPosts = async (params: GetPostsParams = {}): Promise<PostsResult> => {
  const paginationResult = validatePagination({
    page: params.page?.toString(),
    limit: params.limit?.toString(),
  })
  
  if (!paginationResult.valid) {
    throw new Error(paginationResult.error || "Invalid pagination")
  }
  
  const page = paginationResult.page!
  const limit = paginationResult.limit!

  // Build where clause using helper
  const where = buildPublicPostWhereClause({
    search: params.search,
    categories: params.categories,
    tags: params.tags,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  })

  // Build orderBy using helper
  const orderBy = buildPublicPostOrderBy(params.sort)

  try {
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          categories: {
            select: {
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
          tags: {
            select: {
              tag: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
      }),
      prisma.post.count({ where }),
    ])

    // Map posts using helper
    const mappedPosts: Post[] = posts.map(mapPostRecord)

    return {
      data: mappedPosts,
      pagination: buildPagination(page, limit, total),
    }
  } catch (error) {
    console.error("Error fetching posts:", error)
    return {
      data: [],
      pagination: buildPagination(page, limit, 0),
    }
  }
};

export const getPostBySlug = async (slug: string): Promise<PostDetail | null> => {
  try {
    const post = await prisma.post.findUnique({
      where: {
        slug,
        published: true,
        deletedAt: null,
        publishedAt: {
          lte: new Date(),
        },
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        categories: {
          select: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        tags: {
          select: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    })

    if (!post) return null

    // Map post detail using helper
    return mapPostDetailRecord(post)
  } catch (error) {
    console.error(`Error fetching post by slug (${slug}):`, error)
    return null
  }
}

/**
 * Get related posts based on categories and tags
 * 
 * @param postId - Current post ID to exclude
 * @param categoryIds - Array of category IDs
 * @param tagIds - Array of tag IDs
 * @param limit - Maximum number of related posts to return (default: 4)
 * @returns Array of related posts
 */
export const getRelatedPosts = async (
  postId: string,
  categoryIds: string[],
  tagIds: string[],
  limit: number = 4
): Promise<Post[]> => {
  if (categoryIds.length === 0 && tagIds.length === 0) {
    return []
  }

  try {
    // Build where clause for related posts
    const where: Prisma.PostWhereInput = {
      id: { not: postId }, // Exclude current post
      published: true,
      deletedAt: null,
      publishedAt: {
        lte: new Date(),
      },
      OR: [],
    }

    // Add category filter
    if (categoryIds.length > 0) {
      where.OR!.push({
        categories: {
          some: {
            categoryId: { in: categoryIds },
          },
        },
      })
    }

    // Add tag filter
    if (tagIds.length > 0) {
      where.OR!.push({
        tags: {
          some: {
            tagId: { in: tagIds },
          },
        },
      })
    }

    const posts = await prisma.post.findMany({
      where,
      take: limit,
      orderBy: { publishedAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        categories: {
          select: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        tags: {
          select: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    })

    return posts.map(mapPostRecord)
  } catch (error) {
    console.error("Error fetching related posts:", error)
    return []
  }
};

/**
 * Get all categories that have published posts
 */
export const getCategories = async () => {
  try {
    return await prisma.category.findMany({
      where: {
        deletedAt: null,
        posts: {
          some: {
            post: {
              published: true,
              deletedAt: null,
              publishedAt: {
                lte: new Date(),
              },
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: {
        name: "asc",
      },
    })
  } catch (error) {
    console.error("Error fetching categories:", error)
    return []
  }
};

/**
 * Get all tags that have published posts
 */
export const getTags = async () => {
  try {
    return await prisma.tag.findMany({
      where: {
        deletedAt: null,
        posts: {
          some: {
            post: {
              published: true,
              deletedAt: null,
              publishedAt: {
                lte: new Date(),
              },
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: {
        name: "asc",
      },
    })
  } catch (error) {
    console.error("Error fetching tags:", error)
    return []
  }
}