"use client"

import { useMemo } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { usePageLoadLogger } from "@/hooks/use-page-load-logger"
import { ResourceForm, type ResourceFormField } from "@/features/admin/resources/components"
import { useResourceFormSubmit, useResourceDetailData } from "@/features/admin/resources/hooks"
import { createResourceEditOnSuccess } from "@/features/admin/resources/utils"
import { apiRoutes } from "@/lib/api/routes"
import { queryKeys } from "@/lib/query-keys"
import { getBaseOrderFields, getOrderFormSections, type OrderFormData } from "../form-fields"

interface OrderEditData extends OrderFormData {
  id: string
  deletedAt?: string | null
  [key: string]: unknown
}

export interface OrderEditClientProps {
  order: OrderEditData | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
  variant?: "dialog" | "sheet" | "page"
  backUrl?: string
  backLabel?: string
  orderId?: string
}

export function OrderEditClient({
  order: initialOrder,
  open = true,
  onOpenChange,
  onSuccess,
  variant = "dialog",
  backUrl,
  backLabel = "Quay lại",
  orderId,
}: OrderEditClientProps) {
  // Log page load (chỉ khi variant là "page")
  usePageLoadLogger(variant === "page" ? "edit" : undefined)
  const queryClient = useQueryClient()

  const resourceId = orderId || initialOrder?.id
  const { data: orderData } = useResourceDetailData({
    initialData: initialOrder || ({} as OrderEditData),
    resourceId: resourceId || "",
    detailQueryKey: queryKeys.adminOrders.detail,
    resourceName: "orders",
    fetchOnMount: !!resourceId,
  })
  const order = useMemo(() => {
    return orderData || initialOrder || null
  }, [orderData, initialOrder])

  const { handleSubmit } = useResourceFormSubmit({
    apiRoute: (id) => apiRoutes.orders.update(id),
    method: "PUT",
    resourceId: order?.id,
    messages: {
      successTitle: "Cập nhật thành công",
      successDescription: "Thông tin đơn hàng đã được cập nhật.",
      errorTitle: "Lỗi cập nhật",
    },
    navigation: {
      toDetail: variant === "page" && orderId ? `/admin/orders/${orderId}` : undefined,
      fallback: backUrl,
    },
    transformData: (data) => {
      const submitData: Record<string, unknown> = {
        ...data,
      }
      return submitData
    },
    onSuccess: createResourceEditOnSuccess({
      queryClient,
      resourceId: orderId || order?.id,
      allQueryKey: queryKeys.adminOrders.all(),
      detailQueryKey: queryKeys.adminOrders.detail,
      resourceName: "orders",
      getRecordName: (responseData) => (responseData?.orderNumber as string | undefined) || "Đơn hàng",
      onSuccess,
    }),
  })

  if (!order?.id) {
    return null
  }

  const isDeleted = order.deletedAt !== null && order.deletedAt !== undefined
  const formDisabled = isDeleted && variant !== "page"

  const handleSubmitWrapper = async (data: Partial<OrderEditData>) => {
    if (isDeleted) {
      return { success: false, error: "Bản ghi đã bị xóa, không thể chỉnh sửa" }
    }
    return handleSubmit(data)
  }

  const baseFields = getBaseOrderFields() as unknown as ResourceFormField<OrderEditData>[]
  const editFields = baseFields.map((field) => {
    if (formDisabled) {
      return { ...field, disabled: true }
    }
    return field
  })

  return (
    <ResourceForm<OrderEditData>
      data={order}
      fields={editFields}
      sections={getOrderFormSections()}
      onSubmit={handleSubmitWrapper}
      open={open}
      onOpenChange={onOpenChange}
      variant={variant}
      title="Chỉnh sửa đơn hàng"
      description={isDeleted ? "Bản ghi đã bị xóa, không thể chỉnh sửa" : "Cập nhật thông tin đơn hàng"}
      submitLabel="Lưu thay đổi"
      cancelLabel="Hủy"
      backUrl={backUrl}
      backLabel={backLabel}
      onSuccess={onSuccess}
      showCard={false}
      className="max-w-[100%]"
      resourceName="orders"
      resourceId={order?.id}
      action="update"
    />
  )
}

