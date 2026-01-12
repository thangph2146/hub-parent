"use client"

import { useSession } from "next-auth/react"
import { useQueryClient } from "@tanstack/react-query"
import { ResourceForm, type ResourceFormField } from "@/features/admin/resources/components"
import {
  getBasePostFields,
  getPostFormSections,
  getPostContentField,
  getPostAuthorField,
  getPostCategoriesField,
  getPostTagsField,
} from "../form-fields"
import { useResourceFormSubmit } from "@/features/admin/resources/hooks"
import { apiRoutes } from "@/constants"
import { isSuperAdmin } from "@/permissions"
import { queryKeys } from "@/constants"
import type { Prisma } from "@prisma/client"

export interface PostCreateData {
  title: string
  slug: string
  content: Prisma.JsonValue
  excerpt?: string | null
  image?: string | null
  published?: boolean
  publishedAt?: string | null
  authorId?: string
  categoryIds?: string[] | string
  tagIds?: string[] | string
  [key: string]: unknown
}

export interface PostCreateClientProps {
  backUrl?: string
  users?: Array<{ label: string; value: string }>
  categories?: Array<{ label: string; value: string }>
  tags?: Array<{ label: string; value: string }>
  isSuperAdmin?: boolean
}

export const PostCreateClient = ({
  backUrl = "/admin/posts",
  users = [],
  categories = [],
  tags = [],
  isSuperAdmin: isSuperAdminProp = false,
}: PostCreateClientProps) => {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const userRoles = session?.roles || []
  const isSuperAdminUser = isSuperAdminProp || isSuperAdmin(userRoles)
  const currentUserId = session?.user?.id

  const handleBack = async () => {
    // Chỉ invalidate queries - table sẽ tự động refresh qua query cache events
    await queryClient.invalidateQueries({ queryKey: queryKeys.adminPosts.all(), refetchType: "active" })
  }

  const { handleSubmit } = useResourceFormSubmit({
    apiRoute: apiRoutes.posts.create,
    method: "POST",
    messages: {
      successTitle: "Tạo bài viết thành công",
      successDescription: "Bài viết mới đã được tạo thành công.",
      errorTitle: "Lỗi tạo bài viết",
    },
    navigation: {
      toDetail: (response) =>
        response.data?.data?.id ? `/admin/posts/${response.data.data.id}` : backUrl,
      fallback: backUrl,
    },
    transformData: (data) => {
      const submitData: Record<string, unknown> = {
        ...data,
      }
      // Handle publishedAt
      if (data.published === false) {
        // Nếu không xuất bản, set publishedAt = null
        submitData.publishedAt = null
      } else if (data.published === true) {
        // Nếu xuất bản, sử dụng publishedAt từ form hoặc tự động set
        if (data.publishedAt && typeof data.publishedAt === "string") {
          submitData.publishedAt = data.publishedAt
        } else {
          submitData.publishedAt = new Date().toISOString()
        }
      }
      if (!isSuperAdminUser && currentUserId) {
        submitData.authorId = currentUserId
      }
      return submitData
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminPosts.all() })
    },
  })

  const createFields: ResourceFormField<PostCreateData>[] = [
    ...(getBasePostFields() as unknown as ResourceFormField<PostCreateData>[]),
    ...(isSuperAdminUser && users.length > 0
      ? [getPostAuthorField<PostCreateData>(users)]
      : []),
    getPostCategoriesField<PostCreateData>(categories),
    getPostTagsField<PostCreateData>(tags),
    getPostContentField<PostCreateData>(),
  ]

  return (
    <ResourceForm<PostCreateData>
      data={null}
      fields={createFields}
      sections={getPostFormSections()}
      onSubmit={handleSubmit}
      title="Tạo bài viết mới"
      description="Nhập thông tin để tạo bài viết mới"
      submitLabel="Tạo bài viết"
      cancelLabel="Hủy"
      backUrl={backUrl}
      backLabel="Quay lại danh sách"
      onBack={handleBack}
      variant="page"
      showCard={false}
      className="w-full"
      resourceName="posts"
      action="create"
    />
  )
}

