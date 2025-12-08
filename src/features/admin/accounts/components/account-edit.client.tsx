"use client"

import { ResourceForm, type ResourceFormField } from "@/features/admin/resources/components"
import { useResourceFormSubmit } from "@/features/admin/resources/hooks"
import { apiRoutes } from "@/lib/api/routes"
import { getAccountFields, getAccountFormSections, type AccountFormData } from "../form-fields"
import type { AccountProfile } from "../types"
import { UpdateAccountSchema } from "../server/schemas"
import { useToast } from "@/hooks/use-toast"
import { ZodError } from "zod"

export interface AccountEditClientProps {
  account: AccountProfile | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
  onCancel?: () => void
  variant?: "dialog" | "sheet" | "page"
  backUrl?: string
  backLabel?: string
}

export function AccountEditClient({
  account,
  open = true,
  onOpenChange,
  onSuccess,
  onCancel,
  variant = "dialog",
  backUrl,
  backLabel = "Quay lại",
}: AccountEditClientProps) {
  const { toast } = useToast()
  const { handleSubmit } = useResourceFormSubmit({
    apiRoute: apiRoutes.accounts.update,
    method: "PUT",
    resourceId: account?.id,
    messages: {
      successTitle: "Cập nhật thành công",
      successDescription: "Thông tin tài khoản đã được cập nhật.",
      errorTitle: "Lỗi cập nhật",
    },
    navigation: {
      fallback: backUrl,
    },
    transformData: (data) => {
      const submitData: Record<string, unknown> = {
        ...data,
      }
      
      // Trim và validate required field: name
      if (submitData.name !== undefined && submitData.name !== null) {
        submitData.name = String(submitData.name).trim()
        // Nếu sau khi trim mà rỗng, giữ nguyên để Zod validation bắt lỗi
        if (submitData.name === "") {
          // Không xóa, để Zod validation bắt lỗi "Tên là bắt buộc"
        }
      }
      
      // Remove password if empty
      if (!submitData.password || submitData.password === "") {
        delete submitData.password
      }
      
      // Convert structured address fields to JSON string
      const addressFields = ["addressStreet", "addressWard", "addressDistrict", "addressCity", "addressPostalCode"]
      const hasStructuredAddress = addressFields.some((field) => submitData[field] && submitData[field] !== "")
      
      if (hasStructuredAddress) {
        const structuredAddress: {
          address?: string
          ward?: string
          district?: string
          city?: string
          postalCode?: string
        } = {}
        
        if (submitData.addressStreet && submitData.addressStreet !== "") {
          structuredAddress.address = String(submitData.addressStreet).trim()
        }
        if (submitData.addressWard && submitData.addressWard !== "") {
          structuredAddress.ward = String(submitData.addressWard).trim()
        }
        if (submitData.addressDistrict && submitData.addressDistrict !== "") {
          structuredAddress.district = String(submitData.addressDistrict).trim()
        }
        if (submitData.addressCity && submitData.addressCity !== "") {
          structuredAddress.city = String(submitData.addressCity).trim()
        }
        if (submitData.addressPostalCode && submitData.addressPostalCode !== "") {
          structuredAddress.postalCode = String(submitData.addressPostalCode).trim()
        }
        
        // Convert to JSON string
        submitData.address = Object.keys(structuredAddress).length > 0 
          ? JSON.stringify(structuredAddress) 
          : null
        
        // Remove structured address fields from submit data
        addressFields.forEach((field) => {
          delete submitData[field]
        })
      } else {
        // If no structured address, keep address as-is or set to null if empty
        if (submitData.address === "") {
          submitData.address = null
        }
      }
      
      // Convert empty strings to null for nullable fields
      const nullableFields = ["bio", "phone", "avatar"]
      nullableFields.forEach((field) => {
        if (submitData[field] === "") {
          submitData[field] = null
        }
      })

      // Validate với Zod schema trước khi submit (giống như posts)
      try {
        UpdateAccountSchema.parse(submitData)
      } catch (error) {
        if (error instanceof ZodError) {
          // Lấy message từ error đầu tiên
          const firstError = error.issues[0]
          if (firstError) {
            const fieldName = firstError.path[0] || "dữ liệu"
            const fieldLabel: Record<string, string> = {
              name: "Tên",
              bio: "Tiểu sử",
              phone: "Số điện thoại",
              address: "Địa chỉ",
              password: "Mật khẩu",
              avatar: "Ảnh đại diện",
            }
            const label = fieldLabel[String(fieldName)] || String(fieldName)
            toast({
              variant: "destructive",
              title: "Lỗi validation",
              description: `${label}: ${firstError.message}`,
            })
            throw new Error(`Validation error: ${firstError.message}`)
          }
        }
        toast({
          variant: "destructive",
          title: "Lỗi validation",
          description: "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.",
        })
        throw error
      }

      return submitData
    },
    onSuccess: async () => {
      if (onSuccess) {
        onSuccess()
      }
    },
  })

  if (!account?.id) {
    return null
  }

  // Parse address from JSON string if available
  let addressStreet: string | null = null
  let addressWard: string | null = null
  let addressDistrict: string | null = null
  let addressCity: string | null = null
  let addressPostalCode: string | null = null

  if (account.address) {
    try {
      const parsed = typeof account.address === "string" 
        ? JSON.parse(account.address) 
        : account.address
      
      if (parsed && typeof parsed === "object" && parsed !== null) {
        addressStreet = parsed.address || null
        addressWard = parsed.ward || null
        addressDistrict = parsed.district || null
        addressCity = parsed.city || null
        addressPostalCode = parsed.postalCode || null
      }
    } catch {
      // If not JSON, keep as simple string (legacy support)
      // In this case, we'll leave structured fields empty
    }
  }

  const accountForEdit: AccountFormData = {
    name: account.name,
    bio: account.bio,
    phone: account.phone,
    address: account.address, // Keep original for backward compatibility
    addressStreet,
    addressWard,
    addressDistrict,
    addressCity,
    addressPostalCode,
    avatar: account.avatar,
  }

  const editFields = getAccountFields() as ResourceFormField<AccountFormData>[]
  const formSections = getAccountFormSections()

  return (
    <ResourceForm<AccountFormData>
      data={accountForEdit}
      fields={editFields}
      sections={formSections}
      onSubmit={handleSubmit}
      title="Chỉnh sửa thông tin tài khoản"
      description="Cập nhật thông tin cá nhân của bạn"
      submitLabel="Lưu thay đổi"
      cancelLabel="Hủy"
      backUrl={backUrl}
      backLabel={backLabel}
      variant={variant}
      open={open}
      onOpenChange={onOpenChange}
      onCancel={onCancel}
      showCard={variant === "page" ? false : true}
      className={variant === "page" ? "max-w-[100%]" : undefined}
    />
  )
}

