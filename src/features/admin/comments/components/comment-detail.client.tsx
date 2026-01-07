"use client"

import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { MessageSquare, ExternalLink } from "lucide-react"
import { ResourceForm } from "@/features/admin/resources/components"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { formatDateVi } from "../utils"
import { apiClient } from "@/lib/api/axios"
import { apiRoutes } from "@/lib/api/routes"
import { useResourceNavigation, useResourceDetailData, useResourceDetailLogger } from "@/features/admin/resources/hooks"
import { queryKeys } from "@/lib/query-keys"
import { resourceLogger } from "@/lib/config/resource-logger"
import { getErrorMessage } from "@/lib/utils"
import { TypographyP, TypographyPSmallMuted, IconSize } from "@/components/ui/typography"
import { Flex } from "@/components/ui/flex"
import { Grid } from "@/components/ui/grid"
import { getBaseCommentFields, getCommentFormSections, type CommentFormData } from "../form-fields"

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
    <Flex align="center" gap={3}>
      <Flex align="center" className="h-9 w-9 shrink-0 rounded-lg bg-muted">
        <IconSize size="sm">
          <MessageSquare />
        </IconSize>
      </Flex>
      <Flex direction="col" gap={1} className="flex-1 min-w-0">
        <TypographyPSmallMuted>Trạng thái duyệt</TypographyPSmallMuted>
        <Flex align="center" gap={2}>
          <Switch
            checked={approved}
            disabled={isToggling || !canApprove}
            onCheckedChange={onToggle}
            aria-label={approved ? "Hủy duyệt bình luận" : "Duyệt bình luận"}
          />
          <TypographyP>
            {approved ? "Đã duyệt" : "Chờ duyệt"}
          </TypographyP>
        </Flex>
      </Flex>
    </Flex>
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
        
        // Chỉ invalidate queries - table sẽ tự động refresh qua query cache events
        // Detail query cần refetch ngay để cập nhật UI
        await queryClient.invalidateQueries({ queryKey: queryKeys.adminComments.all(), refetchType: "active" })
        await queryClient.invalidateQueries({ queryKey: queryKeys.adminComments.detail(commentId), refetchType: "all" })
        await queryClient.refetchQueries({ queryKey: queryKeys.adminComments.detail(commentId), type: "all" })
        
        setApproved(newStatus)
      } catch (error) {
        resourceLogger.detailAction({
          resource: "comments",
          action: newStatus ? "approve" : "unapprove",
          resourceId: commentId,
          recordData: detailData as Record<string, unknown>,
          error: getErrorMessage(error) || "Unknown error",
        })
        
        // Chỉ invalidate queries trong trường hợp lỗi - table sẽ tự động refresh qua query cache events
        // Detail query cần refetch ngay để đảm bảo UI hiển thị đúng state
        await queryClient.invalidateQueries({ queryKey: queryKeys.adminComments.all(), refetchType: "active" })
        await queryClient.invalidateQueries({ queryKey: queryKeys.adminComments.detail(commentId), refetchType: "all" })
        await queryClient.refetchQueries({ queryKey: queryKeys.adminComments.detail(commentId), type: "all" })
      } finally {
        setIsToggling(false)
      }
    },
    [canApprove, commentId, isToggling, detailData, queryClient, isDeleted],
  )

  const fields = getBaseCommentFields()
  const sections = getCommentFormSections()

  return (
    <ResourceForm<CommentFormData>
      data={detailData as CommentFormData}
      fields={fields}
      sections={sections}
      title={`Bình luận từ ${detailData.authorName || detailData.authorEmail}`}
      description={`Chi tiết bình luận trong bài viết "${detailData.postTitle}"`}
      backUrl={backUrl}
      backLabel="Quay lại danh sách"
      readOnly={true}
      showCard={false}
      onSubmit={async () => ({ success: false, error: "Read-only mode" })}
      suffixContent={
        <>
          {/* Custom Toggle Approve Status */}
          <Card className="border border-border/50 mt-4" padding="lg">
            <StatusField 
              approved={approved} 
              canApprove={canApprove && !isDeleted}
              onToggle={handleToggleApprove}
              isToggling={isToggling}
            />
          </Card>

          {/* Post Link & Timestamps */}
          <Card className="border border-border/50 mt-4" padding="lg">
            <Grid cols="responsive-2" fullWidth gap="responsive">
              <Flex direction="col" gap={1}>
                <TypographyP className="text-sm font-medium text-muted-foreground mb-2">Bài viết</TypographyP>
                {detailData.postId ? (
                  <a
                    href={`/admin/posts/${detailData.postId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-1.5 hover:underline transition-colors"
                  >
                    <TypographyP className="truncate text-primary hover:text-primary/80">{detailData.postTitle || "—"}</TypographyP>
                    <IconSize size="xs" className="shrink-0 opacity-50 group-hover:opacity-100 transition-opacity">
                      <ExternalLink />
                    </IconSize>
                  </a>
                ) : (
                  <TypographyP className="truncate">{detailData.postTitle || "—"}</TypographyP>
                )}
              </Flex>

              <Flex direction="col" gap={1}>
                <TypographyP className="text-sm font-medium text-muted-foreground mb-2">Ngày tạo</TypographyP>
                <TypographyP>
                  {detailData.createdAt ? formatDateVi(detailData.createdAt) : "—"}
                </TypographyP>
              </Flex>

              <Flex direction="col" gap={1}>
                <TypographyP className="text-sm font-medium text-muted-foreground mb-2">Cập nhật lần cuối</TypographyP>
                <TypographyP>
                  {detailData.updatedAt ? formatDateVi(detailData.updatedAt) : "—"}
                </TypographyP>
              </Flex>
            </Grid>
          </Card>
        </>
      }
      resourceName="comments"
      resourceId={commentId}
      action="update"
    />
  )
}
