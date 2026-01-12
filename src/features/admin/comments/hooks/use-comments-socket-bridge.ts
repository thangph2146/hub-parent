"use client"

import { useQueryClient } from "@tanstack/react-query"
import type { CommentRow } from "../types"
import { queryKeys, type AdminCommentsListParams } from "@/constants"
import type { CommentDetailData } from "../components/comment-detail.client"
import { useResourceSocketBridge } from "@/features/admin/resources/hooks/use-resource-socket-bridge"
import { matchesSearch, matchesFilters } from "../utils/socket-helpers"

interface CommentUpsertPayload {
  comment: CommentRow
  previousStatus: "active" | "deleted" | null
  newStatus: "active" | "deleted"
}

interface CommentRemovePayload {
  id: string
  previousStatus: "active" | "deleted"
}

interface CommentBatchUpsertPayload {
  comments: CommentRow[]
  previousStatus: "active" | "deleted" | null
}

export const useCommentsSocketBridge = () => {
  const queryClient = useQueryClient()

  return useResourceSocketBridge<CommentRow, AdminCommentsListParams>({
    resourceName: "comments",
    queryKey: queryKeys.adminComments.all() as unknown[],
    eventNames: {
      upsert: "comment:upsert",
      batchUpsert: "comment:batch-upsert",
      remove: "comment:remove",
    },
    getRowFromPayload: (payload) => {
      const p = payload as CommentUpsertPayload
      return p.comment
    },
    getRowIdFromPayload: (payload) => {
      const p = payload as CommentRemovePayload
      return p.id
    },
    getBatchRowsFromPayload: (payload) => {
      const p = payload as CommentBatchUpsertPayload
      return p.comments
    },
    getRowStatus: (row) => (row.deletedAt ? "deleted" : "active"),
    matchesSearch,
    matchesFilters,
    onRowUpserted: (row) => {
      // Update detail query cache nếu có
      const detailQueryKey = queryKeys.adminComments.detail(row.id)
      const detailData = queryClient.getQueryData<{ data: CommentDetailData }>(detailQueryKey)
      if (detailData) {
        queryClient.setQueryData(detailQueryKey, {
          data: {
            ...detailData.data,
            ...row,
            approved: row.approved,
            authorName: row.authorName,
            authorEmail: row.authorEmail,
            postTitle: row.postTitle,
            updatedAt: row.updatedAt,
            deletedAt: row.deletedAt,
          },
        })
      }
    },
    onRowRemoved: (id) => {
      // Invalidate detail query cache
      queryClient.invalidateQueries({ queryKey: queryKeys.adminComments.detail(id) })
    },
  })
}
