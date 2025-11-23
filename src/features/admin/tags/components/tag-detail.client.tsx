"use client"

import { useEffect } from "react"
import { Tag, Hash, Calendar, Clock, Edit } from "lucide-react"
import { 
  ResourceDetailPage, 
  FieldItem,
  type ResourceDetailField, 
  type ResourceDetailSection 
} from "@/features/admin/resources/components"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { queryKeys } from "@/lib/query-keys"
import { resourceLogger } from "@/lib/config"
import { formatDateVi } from "../utils"
import { useResourceNavigation, useResourceDetailData } from "@/features/admin/resources/hooks"

export interface TagDetailData {
  id: string
  name: string
  slug: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  [key: string]: unknown
}

export interface TagDetailClientProps {
  tagId: string
  tag: TagDetailData
  backUrl?: string
}

// Module-level Set để track các tagId đã log (tránh duplicate trong React Strict Mode)
const loggedTagIds = new Set<string>()

export function TagDetailClient({ tagId, tag, backUrl = "/admin/tags" }: TagDetailClientProps) {
  const { navigateBack, router } = useResourceNavigation({
    invalidateQueryKey: queryKeys.adminTags.all(),
  })

  // Ưu tiên sử dụng React Query cache nếu có (dữ liệu mới nhất sau khi edit), fallback về props
  // Chỉ log sau khi fetch từ API xong để đảm bảo data mới nhất
  const { data: detailData, isFetched, isFromApi, fetchedData } = useResourceDetailData({
    initialData: tag,
    resourceId: tagId,
    detailQueryKey: queryKeys.adminTags.detail,
    resourceName: "tags",
  })

  // Log detail load một lần cho mỗi tagId (chỉ log sau khi fetch từ API xong)
  // Sử dụng fetchedData (data từ API) thay vì detailData để đảm bảo log data mới nhất
  useEffect(() => {
    const logKey = `tags-detail-${tagId}`
    // Chỉ log khi đã fetch xong, data từ API (isFromApi = true), và chưa log
    // Sử dụng fetchedData (data từ API) để đảm bảo log data mới nhất
    if (!isFetched || !isFromApi || loggedTagIds.has(logKey) || !fetchedData) return
    loggedTagIds.add(logKey)
    
    resourceLogger.detailAction({
      resource: "tags",
      action: "load-detail",
      resourceId: tagId,
      recordData: fetchedData as Record<string, unknown>,
    })

    resourceLogger.dataStructure({
      resource: "tags",
      dataType: "detail",
      structure: {
        fields: fetchedData as Record<string, unknown>,
      },
    })

    // Cleanup khi component unmount hoặc tagId thay đổi
    return () => {
      setTimeout(() => {
        loggedTagIds.delete(logKey)
      }, 1000)
    }
  }, [tagId, isFetched, isFromApi, fetchedData])

  const detailFields: ResourceDetailField<TagDetailData>[] = []

  const detailSections: ResourceDetailSection<TagDetailData>[] = [
    {
      id: "basic",
      title: "Thông tin cơ bản",
      description: "Thông tin chính về thẻ tag và thời gian",
      fieldsContent: (_fields, data) => {
        const tagData = data as TagDetailData
        
        return (
          <div className="space-y-6">
            {/* Name & Slug */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldItem icon={Tag} label="Tên thẻ tag">
                <div className="text-sm font-medium text-foreground">
                  {tagData.name || "—"}
                </div>
              </FieldItem>

              <FieldItem icon={Hash} label="Slug">
                <div className="text-sm font-medium text-foreground font-mono">
                  {tagData.slug || "—"}
                </div>
              </FieldItem>
            </div>

            <Separator />

            {/* Timestamps */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldItem icon={Calendar} label="Ngày tạo">
                <div className="text-sm font-medium text-foreground">
                  {tagData.createdAt ? formatDateVi(tagData.createdAt) : "—"}
                </div>
              </FieldItem>

              <FieldItem icon={Clock} label="Cập nhật lần cuối">
                <div className="text-sm font-medium text-foreground">
                  {tagData.updatedAt ? formatDateVi(tagData.updatedAt) : "—"}
                </div>
              </FieldItem>
            </div>
          </div>
        )
      },
    },
  ]

  return (
    <ResourceDetailPage<TagDetailData>
      data={detailData}
      fields={detailFields}
      detailSections={detailSections}
      title={detailData.name}
      description={`Chi tiết thẻ tag ${detailData.slug}`}
      backUrl={backUrl}
      backLabel="Quay lại danh sách"
      onBack={() => navigateBack(backUrl)}
      actions={
        <Button
          variant="outline"
          onClick={() => router.push(`/admin/tags/${tagId}/edit`)}
          className="gap-2"
        >
          <Edit className="h-4 w-4" />
          Chỉnh sửa
        </Button>
      }
    />
  )
}

