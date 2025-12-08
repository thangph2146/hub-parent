export interface CheckoutFormData {
  customerName: string
  customerEmail: string
  customerPhone: string
  shippingAddress: {
    address: string
    city: string
    district: string
    ward: string
    postalCode?: string
  }
  billingAddress?: {
    address: string
    city: string
    district: string
    ward: string
    postalCode?: string
  }
  paymentMethod: string
  giftCode?: string
  notes?: string
}

export interface GiftCodeValidation {
  code: string
  discountType: "PERCENTAGE" | "FIXED_AMOUNT"
  discountValue: number
  discount: number
  description?: string | null
}

export interface CheckoutResult {
  orderId: string
  orderNumber: string
  success: boolean
  message?: string
}

