/**
 * Client Component: Category Create Form
 * 
 * Handles form interactions, validation, và API calls
 * Pattern: Server Component → Client Component (UI/interactions)
 */

"use client"

import { useRouter } from "next/navigation"
import { ResourceForm } from "@/features/admin/resources/components"
import { apiClient } from "@/lib/api/axios"
import { apiRoutes } from "@/lib/api/routes"
import { useToast } from "@/hooks/use-toast"
import { extractAxiosErrorMessage } from "@/lib/utils/api-utils"
import { getBaseCategoryFields, type CategoryFormData } from "../form-fields"
import { generateSlug } from "../utils"

export interface CategoryCreateClientProps {
  backUrl?: string
}

export function CategoryCreateClient({ backUrl = "/admin/categories" }: CategoryCreateClientProps) {
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (data: Partial<CategoryFormData>) => {
    try {
      const submitData: Record<string, unknown> = {
        ...data,
        // Auto-generate slug if not provided
        slug: data.slug?.trim() || (data.name ? generateSlug(data.name) : ""),
      }

      if (!submitData.name || !submitData.slug) {
        toast({
          variant: "destructive",
          title: "Thiếu thông tin",
          description: "Tên danh mục là bắt buộc.",
        })
        return { success: false, error: "Tên danh mục là bắt buộc" }
      }

      const response = await apiClient.post(apiRoutes.categories.create, submitData)

      if (response.status === 201) {
        toast({
          variant: "success",
          title: "Tạo danh mục thành công",
          description: "Danh mục mới đã được tạo thành công.",
        })

        if (response.data?.data?.id) {
          router.push(`/admin/categories/${response.data.data.id}`)
        } else {
          router.push("/admin/categories")
        }

        return { success: true }
      }

      toast({
        variant: "destructive",
        title: "Tạo danh mục thất bại",
        description: "Không thể tạo danh mục. Vui lòng thử lại.",
      })
      return { success: false, error: "Không thể tạo danh mục" }
    } catch (error: unknown) {
      const errorMessage = extractAxiosErrorMessage(error, "Đã xảy ra lỗi khi tạo danh mục")

      toast({
        variant: "destructive",
        title: "Lỗi tạo danh mục",
        description: errorMessage,
      })

      return { success: false, error: errorMessage }
    }
  }

  const createFields = getBaseCategoryFields()

  return (
    <ResourceForm<CategoryFormData>
      data={null}
      fields={createFields}
      onSubmit={handleSubmit}
      title="Tạo danh mục mới"
      description="Nhập thông tin để tạo danh mục mới"
      submitLabel="Tạo danh mục"
      cancelLabel="Hủy"
      backUrl={backUrl}
      backLabel="Quay lại danh sách"
      variant="page"
      showCard={false}
      className="max-w-[100%]"
    />
  )
}

