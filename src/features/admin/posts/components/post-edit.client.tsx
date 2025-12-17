"use client"

import { useMemo } from "react"
import { useSession } from "next-auth/react"
import { useQueryClient } from "@tanstack/react-query"
import { ResourceForm, type ResourceFormField, type ResourceFormSection } from "@/features/admin/resources/components"
import { useResourceFormSubmit, useResourceDetailData } from "@/features/admin/resources/hooks"
import { createResourceEditOnSuccess } from "@/features/admin/resources/utils"
import { apiRoutes } from "@/lib/api/routes"
import { queryKeys } from "@/lib/query-keys"
import type { Prisma } from "@prisma/client"
import { isSuperAdmin } from "@/lib/permissions"

export interface PostEditData {
    id: string
    title: string
    slug: string
    content: Prisma.JsonValue
    excerpt: string | null
    image: string | null
    published: boolean
    publishedAt: string | null
    authorId: string
    categoryIds?: string[] | string
    tagIds?: string[] | string
    deletedAt?: string | null
    [key: string]: unknown
}

type PostRecord = Record<string, unknown>

const toIdString = (value: unknown): string => {
    if (value === null || value === undefined) return ""
    if (typeof value === "object" && "id" in (value as PostRecord)) {
        const idValue = (value as PostRecord).id
        return idValue === undefined || idValue === null ? "" : String(idValue)
    }
    return typeof value === "string" || typeof value === "number" ? String(value) : ""
}

const normalizeRelationIds = (value: unknown): string[] => {
    if (Array.isArray(value)) {
        return value.map(toIdString).filter(Boolean)
    }
    const singleId = toIdString(value)
    return singleId ? [singleId] : []
}

const transformPostData = (data: unknown): PostEditData | null => {
    if (!data || typeof data !== "object") return null

    const post = data as PostRecord
    return {
        ...(post as PostEditData),
        authorId: toIdString(post.author ?? post.authorId),
        categoryIds: normalizeRelationIds(post.categories ?? post.categoryIds),
        tagIds: normalizeRelationIds(post.tags ?? post.tagIds),
    }
}

export interface PostEditClientProps {
    post: PostEditData | null
    open?: boolean
    onOpenChange?: (open: boolean) => void
    onSuccess?: () => void
    variant?: "dialog" | "sheet" | "page"
    backUrl?: string
    backLabel?: string
    postId?: string
    users?: Array<{ label: string; value: string }>
    categories?: Array<{ label: string; value: string }>
    tags?: Array<{ label: string; value: string }>
    isSuperAdmin?: boolean
}

export const PostEditClient = ({
    post: initialPost,
    open = true,
    onOpenChange,
    onSuccess,
    variant = "dialog",
    backUrl,
    backLabel = "Quay lại",
    postId,
    users = [],
    categories = [],
    tags = [],
    isSuperAdmin: isSuperAdminProp = false,
}: PostEditClientProps) => {
    const { data: session } = useSession()
    const queryClient = useQueryClient()
    const userRoles = session?.roles || []
    const isSuperAdminUser = isSuperAdminProp || isSuperAdmin(userRoles)

    const resourceId = postId || initialPost?.id
    const { data: postData } = useResourceDetailData({
        initialData: initialPost || ({} as PostEditData),
        resourceId: resourceId || "",
        detailQueryKey: queryKeys.adminPosts.detail,
        resourceName: "posts",
        fetchOnMount: !!resourceId,
    })

    const post = useMemo(() => {
        if (postData) {
            return transformPostData(postData)
        }
        return initialPost || null
    }, [postData, initialPost])

    const currentResourceId = postId || post?.id

    const handleBack = async () => {
        await queryClient.invalidateQueries({ queryKey: queryKeys.adminPosts.all(), refetchType: "all" })
        await queryClient.refetchQueries({ queryKey: queryKeys.adminPosts.all(), type: "all" })
    }

    const { handleSubmit } = useResourceFormSubmit({
        apiRoute: (id) => apiRoutes.posts.update(id),
        method: "PUT",
        resourceId: currentResourceId,
        messages: {
            successTitle: "Cập nhật thành công",
            successDescription: "Bài viết đã được cập nhật.",
            errorTitle: "Lỗi cập nhật",
        },
        navigation: {
            toDetail: variant === "page" && currentResourceId ? `/admin/posts/${currentResourceId}` : undefined,
            fallback: backUrl,
        },
        transformData: (data) => {
            const submitData: Record<string, unknown> = {
                ...data,
            }
            if (data.published === true && !data.publishedAt && !post?.publishedAt) {
                submitData.publishedAt = new Date().toISOString()
            } else if (data.published === false) {
                submitData.publishedAt = null
            }
            if (!isSuperAdminUser && "authorId" in submitData) {
                delete submitData.authorId
            }
            return submitData
        },
        onSuccess: createResourceEditOnSuccess({
            queryClient,
            resourceId: currentResourceId,
            allQueryKey: queryKeys.adminPosts.all(),
            detailQueryKey: queryKeys.adminPosts.detail,
            resourceName: "posts",
            getRecordName: (data) => data.title as string | undefined,
            onSuccess,
        }),
    })

    if (!post?.id) {
        return null
    }

    const isDeleted = post.deletedAt !== null && post.deletedAt !== undefined
    const formDisabled = isDeleted && variant !== "page"
    const deletedRecordMessage = "Bản ghi đã bị xóa, không thể chỉnh sửa"
    
    const handleSubmitWrapper = async (data: Partial<PostEditData>) => {
        if (isDeleted) {
            return { success: false, error: deletedRecordMessage }
        }
        return handleSubmit(data)
    }

    const editFields: ResourceFormField<PostEditData>[] = [
        {
            name: "title",
            label: "Tiêu đề",
            type: "text",
            required: true,
            placeholder: "Nhập tiêu đề bài viết",
            description: "Tiêu đề của bài viết",
            section: "basic",
        },
        {
            name: "slug",
            label: "Slug",
            type: "slug",
            sourceField: "title",
            required: true,
            placeholder: "bai-viet-slug",
            description: "URL-friendly version của tiêu đề (tự động tạo từ tiêu đề)",
            section: "basic",
        },
        {
            name: "excerpt",
            label: "Tóm tắt",
            type: "textarea",
            placeholder: "Nhập tóm tắt bài viết",
            description: "Mô tả ngắn gọn về nội dung bài viết",
            section: "basic",
        },
        ...(isSuperAdminUser && users.length > 0 ? [{
            name: "authorId",
            label: "Tác giả",
            type: "select",
            options: users,
            required: true,
            description: "Chọn tác giả của bài viết",
            section: "basic",
        } as ResourceFormField<PostEditData>] : []),
        ...(categories.length > 0 ? [{
            name: "categoryIds",
            label: "Danh mục",
            type: "multiple-select",
            options: categories,
            description: "Chọn danh mục cho bài viết (có thể chọn nhiều)",
            section: "basic",
        } as ResourceFormField<PostEditData>] : []),
        ...(tags.length > 0 ? [{
            name: "tagIds",
            label: "Thẻ tag",
            type: "multiple-select",
            options: tags,
            description: "Chọn thẻ tag cho bài viết (có thể chọn nhiều)",
            section: "basic",
        } as ResourceFormField<PostEditData>] : []),
        {
            name: "image",
            label: "Hình ảnh",
            type: "image",
            placeholder: "https://example.com/image.jpg",
            description: "URL hình ảnh đại diện cho bài viết",
            section: "basic",
        },
        {
            name: "published",
            label: "Trạng thái xuất bản",
            type: "switch",
            description: "Trạng thái xuất bản của bài viết",
            section: "basic",
        },
        {
            name: "content",
            label: "",
            type: "editor",
            section: "content",
            className: "w-full max-w-5xl mx-auto",
        }
    ]

    const editSections: ResourceFormSection[] = [
        {
            id: "basic",
            title: "Thông tin cơ bản",
            description: "Tiêu đề, slug, tóm tắt và hình ảnh",
        },
        {
            id: "content",
            title: "Nội dung",
            description: "Nội dung chính của bài viết",
        },
        {
            id: "metadata",
            title: "Thông tin bổ sung",
            description: "Trạng thái xuất bản",
        },
    ]

    return (
        <ResourceForm<PostEditData>
            data={post}
            fields={editFields.map(field => ({ ...field, disabled: formDisabled || field.disabled }))}
            sections={editSections}
            onSubmit={handleSubmitWrapper}
            open={open}
            onOpenChange={onOpenChange}
            variant={variant}
            title="Chỉnh sửa bài viết"
            description={isDeleted ? deletedRecordMessage : "Cập nhật thông tin bài viết"}
            submitLabel="Lưu thay đổi"
            cancelLabel="Hủy"
            backUrl={backUrl}
            backLabel={backLabel}
            onBack={handleBack}
            onSuccess={onSuccess}
            showCard={false}
            className="max-w-[100%]"
            resourceName="posts"
            resourceId={currentResourceId}
            action="update"
        />
    )
}
