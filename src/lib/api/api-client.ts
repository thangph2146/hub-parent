/**
 * API Client Helper
 * Wrapper cho apiClient với type-safe routes từ apiRoutes
 * Đảm bảo tất cả API calls đều sử dụng routes từ @lib/api/routes
 */

import { apiClient } from "./axios"
import { apiRoutes } from "./routes"
import type { AxiosResponse } from "axios"
import type { GiftCodeValidation } from "@/features/public/checkout/types"

/**
 * Public API Client - Sử dụng routes từ apiRoutes
 */
export const publicApiClient = {
  // Cart
  getCart: async () => {
    const response = await apiClient.get(apiRoutes.publicCart.get)
    return response.data
  },

  clearCart: async () => {
    const response = await apiClient.delete(apiRoutes.publicCart.clear)
    return response.data
  },

  addCartItem: async (data: { productId: string; quantity: number }) => {
    const response = await apiClient.post(apiRoutes.publicCart.addItem, data)
    return response.data
  },

  updateCartItem: async (id: string, data: { quantity: number }) => {
    const response = await apiClient.put(apiRoutes.publicCart.updateItem(id), data)
    return response.data
  },

  removeCartItem: async (id: string) => {
    const response = await apiClient.delete(apiRoutes.publicCart.removeItem(id))
    return response.data
  },

  // Checkout
  createCheckout: async <T = unknown>(data: unknown): Promise<AxiosResponse<T>> => {
    return await apiClient.post<T>(apiRoutes.publicCheckout.create, data)
  },

  getUserInfo: async () => {
    const response = await apiClient.get(apiRoutes.publicCheckout.userInfo)
    return response.data.data
  },

  // Gift Code
  validateGiftCode: async (data: { code: string; subtotal: number }): Promise<{ success: boolean; data?: GiftCodeValidation; message?: string }> => {
    const response = await apiClient.post<{ success: boolean; data?: GiftCodeValidation; message?: string }>(
      apiRoutes.publicGiftCode.validate,
      data
    )
    return response.data
  },
}

/**
 * Export apiClient để có thể sử dụng trực tiếp nếu cần
 */
export { apiClient } from "./axios"

