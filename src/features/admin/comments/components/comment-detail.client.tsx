"use client"

import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { MessageSquare, User, Mail, FileText, Calendar, Clock, ExternalLink } from "lucide-react"
import { 
  ResourceDetailClient, 
  FieldItem,
  type ResourceDetailField, 
  type ResourceDetailSection 
} from "@/features/admin/resources/components"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { formatDateVi } from "../utils"
import { apiClient } from "@/lib/api/axios"
import { apiRoutes } from "@/lib/api/routes"
import { useResourceNavigation, useResourceDetailData, useResourceDetailLogger } from "@/features/admin/resources/hooks"
import { queryKeys } from "@/lib/query-keys"
import { resourceLogger } from "@/lib/config/resource-logger"
import { TypographyP, TypographyPSmallMuted, IconSize } from "@/components/ui/typography"

export interface CommentDetailData {
  id: string
  content: string
  approved: boolean
  authorId: string
  authorName: string | null
  authorEmail: string
  postId: string
  postTitle: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  [key: string]: unknown
}

export interface CommentDetailClientProps {
  commentId: string
  comment: CommentDetailData
  backUrl?: string
  canApprove?: boolean
}

interface StatusFieldProps {
  approved: boolean
  canApprove: boolean
  onToggle: (newStatus: boolean) => void
  isToggling: boolean
}

const StatusField = ({ approved, canApprove, onToggle, isToggling }: StatusFieldProps) => {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        <IconSize size="sm" className="text-muted-foreground">
          <MessageSquare />
        </IconSize>
      </div>
      <div className="flex-1 min-w-0">
        <TypographyPSmallMuted className="mb-1.5">Trạng thái duyệt</TypographyPSmallMuted>
        <div className="flex items-center gap-2">
          <Switch
            checked={approved}
            disabled={isToggling || !canApprove}
            onCheckedChange={onToggle}
            aria-label={approved ? "Hủy duyệt bình luận" : "Duyệt bình luận"}
          />
          <TypographyP>
            {approved ? "Đã duyệt" : "Chờ duyệt"}
          </TypographyP>
        </div>
      </div>
    </div>
  )
}

export const CommentDetailClient = ({ commentId, comment, backUrl = "/admin/comments", canApprove = false }: CommentDetailClientProps) => {
  const queryClient = useQueryClient()
  useResourceNavigation({
    queryClient,
    invalidateQueryKey: queryKeys.adminComments.all(),
  })

  const { data: detailData, isFetched, isFromApi, fetchedData } = useResourceDetailData({
    initialData: comment,
    resourceId: commentId,
    detailQueryKey: queryKeys.adminComments.detail,
    resourceName: "comments",
    fetchOnMount: true,
  })

  useResourceDetailLogger({
    resourceName: "comments",
    resourceId: commentId,
    data: detailData,
    isFetched,
    isFromApi,
    fetchedData,
  })

  const isDeleted = detailData.deletedAt !== null && detailData.deletedAt !== undefined
  const [isToggling, setIsToggling] = React.useState(false)
  const [approved, setApproved] = React.useState(detailData.approved)
  React.useEffect(() => {
    setApproved(detailData.approved)
  }, [detailData.approved])

  const handleToggleApprove = React.useCallback(
    async (newStatus: boolean) => {
      if (!canApprove || isToggling || isDeleted) return

      resourceLogger.detailAction({
        resource: "comments",
        action: newStatus ? "approve" : "unapprove",
        resourceId: commentId,
        recordData: detailData as Record<string, unknown>,
        authorName: detailData.authorName,
      })

      setIsToggling(true)
      
      // Socket events sẽ tự động update cache nếu có

      try {
        if (newStatus) {
          await apiClient.post(apiRoutes.comments.approve(commentId))
        } else {
          await apiClient.post(apiRoutes.comments.unapprove(commentId))
        }
        
        // Socket events sẽ tự động update cache nếu có
        await queryClient.invalidateQueries({ queryKey: queryKeys.adminComments.all() })
        await queryClient.invalidateQueries({ queryKey: queryKeys.adminComments.detail(commentId) })
        
        setApproved(newStatus)
      } catch (error) {
        resourceLogger.detailAction({
          resource: "comments",
          action: newStatus ? "approve" : "unapprove",
          resourceId: commentId,
          recordData: detailData as Record<string, unknown>,
          error: error instanceof Error ? error.message : "Unknown error",
        })
        
        await queryClient.invalidateQueries({ queryKey: queryKeys.adminComments.all() })
        await queryClient.invalidateQueries({ queryKey: queryKeys.adminComments.detail(commentId) })
      } finally {
        setIsToggling(false)
      }
    },
    [canApprove, commentId, isToggling, detailData, queryClient, isDeleted],
  )

  const detailFields: ResourceDetailField<CommentDetailData>[] = []

  const detailSections: ResourceDetailSection<CommentDetailData>[] = [
    {
      id: "basic",
      title: "Thông tin cơ bản",
      description: "Thông tin về bình luận, người bình luận, bài viết và thời gian",
      fieldsContent: (_fields, data) => {
        const commentData = (data || detailData) as CommentDetailData
        
        return (
          <div className="space-y-6">
            {/* Content Card */}
            <Card className="border border-border/50 bg-card p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <IconSize size="sm" className="text-muted-foreground">
          <MessageSquare />
        </IconSize>
                </div>
                <div className="flex-1 min-w-0">
                  <TypographyP className="text-foreground mb-2">Nội dung</TypographyP>
                  <TypographyP className="leading-relaxed whitespace-pre-wrap text-foreground break-words">
                    {commentData.content || "—"}
                  </TypographyP>
                </div>
              </div>
            </Card>

            {/* Status */}
            <StatusField 
              approved={approved} 
              canApprove={canApprove && !isDeleted}
              onToggle={handleToggleApprove}
              isToggling={isToggling}
            />

            {/* Author Info */}
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
              <FieldItem icon={User} label="Người bình luận">
                <TypographyP className="text-foreground truncate">
                  {commentData.authorName || commentData.authorEmail || "—"}
                </TypographyP>
              </FieldItem>

              <FieldItem icon={Mail} label="Email">
                <a
                  href={`mailto:${commentData.authorEmail}`}
                  className="text-primary hover:underline truncate block transition-colors"
                >
                  <TypographyP>{commentData.authorEmail || "—"}</TypographyP>
                </a>
              </FieldItem>
            </div>

            {/* Post Info */}
            <FieldItem icon={FileText} label="Bài viết">
              {commentData.postId ? (
                <a
                  href={`/admin/posts/${commentData.postId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1.5 hover:underline transition-colors"
                >
                  <TypographyP className="truncate text-primary hover:text-primary/80">{commentData.postTitle || "—"}</TypographyP>
                  <IconSize size="xs" className="shrink-0 opacity-50 group-hover:opacity-100 transition-opacity">
                    <ExternalLink />
                  </IconSize>
                </a>
              ) : (
                <TypographyP className="text-foreground truncate">{commentData.postTitle || "—"}</TypographyP>
              )}
            </FieldItem>

            {/* Timestamps */}
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
              <FieldItem icon={Calendar} label="Ngày tạo">
                <TypographyP className="text-foreground">
                  {commentData.createdAt ? formatDateVi(commentData.createdAt) : "—"}
                </TypographyP>
              </FieldItem>

              <FieldItem icon={Clock} label="Cập nhật lần cuối">
                <TypographyP className="text-foreground">
                  {commentData.updatedAt ? formatDateVi(commentData.updatedAt) : "—"}
                </TypographyP>
              </FieldItem>
            </div>
          </div>
        )
      },
    },
  ]

  return (
    <ResourceDetailClient<CommentDetailData>
      data={detailData}
      fields={detailFields}
      detailSections={detailSections}
      title={`Bình luận từ ${detailData.authorName || detailData.authorEmail}`}
      description={`Chi tiết bình luận trong bài viết "${detailData.postTitle}"`}
      backUrl={backUrl}
      backLabel="Quay lại danh sách"
    />
  )
}
