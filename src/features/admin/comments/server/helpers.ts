import type { Prisma } from "@prisma/client"
import type { DataTableResult } from "@/components/tables"
import { applyStatusFilter, applyRelationFilters } from "@/features/admin/resources/server"
import type { ListCommentsInput, ListedComment, CommentDetail, ListCommentsResult, CommentRow } from "../types"

type CommentWithRelations = Prisma.CommentGetPayload<{
  include: {
    author: {
      select: {
        id: true
        name: true
        email: true
      }
    }
    post: {
      select: {
        id: true
        title: true
      }
    }
  }
}>

export const mapCommentRecord = (comment: CommentWithRelations): ListedComment => {
  return {
    id: comment.id,
    content: comment.content,
    approved: comment.approved,
    authorId: comment.authorId,
    authorName: comment.author.name,
    authorEmail: comment.author.email,
    postId: comment.postId,
    postTitle: comment.post.title,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    deletedAt: comment.deletedAt?.toISOString() || null,
  }
}

const RELATION_CONFIGS = {
  author: { idField: "authorId", fieldMap: { authorName: "name", authorEmail: "email" }, operators: { name: "contains", email: "contains" } },
  post: { idField: "postId", fieldMap: { postTitle: "title" }, operators: { title: "contains" } },
} as const

export const buildWhereClause = (params: ListCommentsInput): Prisma.CommentWhereInput => {
  const where: Prisma.CommentWhereInput = {}
  const filters = params.filters || {}

  applyStatusFilter(where, filters.deleted === true ? "deleted" : "active")

  if (params.search?.trim()) {
    const s = params.search.trim()
    where.OR = [
      { content: { contains: s, mode: "insensitive" } },
      { author: { name: { contains: s, mode: "insensitive" } } },
      { author: { email: { contains: s, mode: "insensitive" } } },
      { post: { title: { contains: s, mode: "insensitive" } } },
    ]
  }

  Object.assign(where, {
    ...(filters.approved !== undefined && { approved: filters.approved }),
    ...(filters.authorId && { authorId: filters.authorId }),
    ...(filters.postId && { postId: filters.postId }),
  })

  applyRelationFilters(where, filters, RELATION_CONFIGS)
  return where
}

export const serializeCommentForTable = (comment: ListedComment): CommentRow => {
  return {
    id: comment.id,
    content: comment.content,
    approved: comment.approved,
    authorName: comment.authorName,
    authorEmail: comment.authorEmail,
    postTitle: comment.postTitle,
    postId: comment.postId,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    deletedAt: comment.deletedAt,
  }
}

export const serializeCommentsList = (data: ListCommentsResult): DataTableResult<CommentRow> => {
  return {
    page: data.pagination.page,
    limit: data.pagination.limit,
    total: data.pagination.total,
    totalPages: data.pagination.totalPages,
    rows: data.data.map(serializeCommentForTable),
  }
}

export const serializeCommentDetail = (comment: CommentDetail): CommentDetail => {
  return comment
}

export type { CommentWithRelations }

