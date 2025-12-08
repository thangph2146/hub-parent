import type { ResourceFormField, ResourceFormSection } from "@/features/admin/resources/components"
import React from "react"
import { CreditCard, FileText, Truck } from "lucide-react"

export interface OrderFormData {
  status?: "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED"
  paymentStatus?: "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED"
  paymentMethod?: string | null
  shippingAddress?: {
    address?: string
    city?: string
    district?: string
    ward?: string
    postalCode?: string
  } | null
  billingAddress?: {
    address?: string
    city?: string
    district?: string
    ward?: string
    postalCode?: string
  } | null
  notes?: string | null
  [key: string]: unknown
}

export function getOrderFormSections(): ResourceFormSection[] {
  return [
    {
      id: "status",
      title: "Trạng thái đơn hàng",
      description: "Cập nhật trạng thái đơn hàng và thanh toán",
    },
    {
      id: "addresses",
      title: "Địa chỉ",
      description: "Địa chỉ giao hàng và thanh toán",
    },
    {
      id: "notes",
      title: "Ghi chú",
      description: "Ghi chú về đơn hàng",
    },
  ]
}

export function getBaseOrderFields(): ResourceFormField<OrderFormData>[] {
  return [
    {
      name: "status",
      label: "Trạng thái đơn hàng",
      type: "select",
      options: [
        { label: "Chờ xử lý", value: "PENDING" },
        { label: "Đã xác nhận", value: "CONFIRMED" },
        { label: "Đang xử lý", value: "PROCESSING" },
        { label: "Đã giao hàng", value: "SHIPPED" },
        { label: "Đã nhận hàng", value: "DELIVERED" },
        { label: "Đã hủy", value: "CANCELLED" },
        { label: "Đã hoàn tiền", value: "REFUNDED" },
      ],
      description: "Trạng thái hiện tại của đơn hàng",
      icon: React.createElement(Truck, { className: "h-4 w-4" }),
      section: "status",
    },
    {
      name: "paymentStatus",
      label: "Trạng thái thanh toán",
      type: "select",
      options: [
        { label: "Chờ thanh toán", value: "PENDING" },
        { label: "Đã thanh toán", value: "PAID" },
        { label: "Thanh toán thất bại", value: "FAILED" },
        { label: "Đã hoàn tiền", value: "REFUNDED" },
        { label: "Hoàn tiền một phần", value: "PARTIALLY_REFUNDED" },
      ],
      description: "Trạng thái thanh toán của đơn hàng",
      icon: React.createElement(CreditCard, { className: "h-4 w-4" }),
      section: "status",
    },
    {
      name: "paymentMethod",
      label: "Phương thức thanh toán",
      type: "text",
      placeholder: "VD: COD, Bank Transfer, Credit Card",
      description: "Phương thức thanh toán được sử dụng",
      icon: React.createElement(CreditCard, { className: "h-4 w-4" }),
      section: "status",
    },
    {
      name: "notes",
      label: "Ghi chú",
      type: "textarea",
      placeholder: "Nhập ghi chú về đơn hàng",
      description: "Ghi chú nội bộ hoặc ghi chú cho khách hàng",
      icon: React.createElement(FileText, { className: "h-4 w-4" }),
      section: "notes",
    },
  ]
}

