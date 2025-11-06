/**
 * Client Component: Role Create Form
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
import { getBaseRoleFields, type RoleFormData } from "../form-fields"

export interface RoleCreateClientProps {
  backUrl?: string
  permissions?: Array<{ label: string; value: string }>
}

export function RoleCreateClient({ backUrl = "/admin/roles", permissions: permissionsFromServer = [] }: RoleCreateClientProps) {
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (data: Partial<RoleFormData>) => {
    try {
      const submitData: Record<string, unknown> = {
        ...data,
        permissions: Array.isArray(data.permissions) ? data.permissions : [],
      }

      if (!submitData.name || !submitData.displayName) {
        toast({
          variant: "destructive",
          title: "Thiếu thông tin",
          description: "Tên vai trò và tên hiển thị là bắt buộc.",
        })
        return { success: false, error: "Tên vai trò và tên hiển thị là bắt buộc" }
      }

      const response = await apiClient.post(apiRoutes.roles.create, submitData)

      if (response.status === 201) {
        toast({
          variant: "success",
          title: "Tạo vai trò thành công",
          description: "Vai trò mới đã được tạo thành công.",
        })

        if (response.data?.data?.id) {
          router.push(`/admin/roles/${response.data.data.id}`)
        } else {
          router.push("/admin/roles")
        }

        return { success: true }
      }

      toast({
        variant: "destructive",
        title: "Tạo vai trò thất bại",
        description: "Không thể tạo vai trò. Vui lòng thử lại.",
      })
      return { success: false, error: "Không thể tạo vai trò" }
    } catch (error: unknown) {
      const errorMessage = extractAxiosErrorMessage(error, "Đã xảy ra lỗi khi tạo vai trò")

      toast({
        variant: "destructive",
        title: "Lỗi tạo vai trò",
        description: errorMessage,
      })

      return { success: false, error: errorMessage }
    }
  }

  const createFields = getBaseRoleFields(permissionsFromServer)

  return (
    <ResourceForm<RoleFormData>
      data={null}
      fields={createFields}
      onSubmit={handleSubmit}
      title="Tạo vai trò mới"
      description="Nhập thông tin để tạo vai trò mới"
      submitLabel="Tạo vai trò"
      cancelLabel="Hủy"
      backUrl={backUrl}
      backLabel="Quay lại danh sách"
      variant="page"
      showCard={false}
      className="max-w-[100%]"
    />
  )
}

