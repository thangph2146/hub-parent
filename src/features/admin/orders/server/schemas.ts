import { z } from "zod"

const addressSchema = z.object({
  address: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  ward: z.string().optional(),
  postalCode: z.string().optional(),
}).passthrough() // Allow additional fields

export const createOrderSchema = z.object({
  customerId: z.string().optional().nullable(),
  customerEmail: z.string().email("Email không hợp lệ"),
  customerName: z.string().min(1, "Tên khách hàng là bắt buộc"),
  customerPhone: z.string().optional().nullable(),
  status: z.enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]).optional().default("PENDING"),
  paymentStatus: z.enum(["PENDING", "PAID", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"]).optional().default("PENDING"),
  paymentMethod: z.string().optional().nullable(),
  shippingAddress: addressSchema.optional().nullable(),
  billingAddress: addressSchema.optional().nullable(),
  subtotal: z.string().or(z.number()).transform((val) => {
    if (typeof val === "string") return parseFloat(val)
    return val
  }),
  tax: z.string().or(z.number()).optional().default(0).transform((val) => {
    if (typeof val === "string") return parseFloat(val)
    return val
  }),
  shipping: z.string().or(z.number()).optional().default(0).transform((val) => {
    if (typeof val === "string") return parseFloat(val)
    return val
  }),
  discount: z.string().or(z.number()).optional().default(0).transform((val) => {
    if (typeof val === "string") return parseFloat(val)
    return val
  }),
  total: z.string().or(z.number()).transform((val) => {
    if (typeof val === "string") return parseFloat(val)
    return val
  }),
  notes: z.string().optional().nullable(),
  items: z.array(z.object({
    productId: z.string(),
    productName: z.string(),
    productSku: z.string(),
    quantity: z.number().int().min(1),
    price: z.string().or(z.number()).transform((val) => {
      if (typeof val === "string") return parseFloat(val)
      return val
    }),
    total: z.string().or(z.number()).transform((val) => {
      if (typeof val === "string") return parseFloat(val)
      return val
    }),
  })).min(1, "Đơn hàng phải có ít nhất 1 sản phẩm"),
})

export const updateOrderSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]).optional(),
  paymentStatus: z.enum(["PENDING", "PAID", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"]).optional(),
  paymentMethod: z.string().optional().nullable(),
  shippingAddress: addressSchema.optional().nullable(),
  billingAddress: addressSchema.optional().nullable(),
  notes: z.string().optional().nullable(),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>

