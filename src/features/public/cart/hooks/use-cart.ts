"use client"

import { useCallback } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { publicApiClient } from "@/lib/api/api-client"
import { useToast } from "@/hooks/use-toast"

const CART_QUERY_KEY = ["cart"]

export function useCart() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const router = useRouter()

  const handleAuthError = useCallback((error: unknown) => {
    if (
      error &&
      typeof error === "object" &&
      "response" in error &&
      error.response &&
      typeof error.response === "object" &&
      "status" in error.response &&
      error.response.status === 401
    ) {
      toast({
        title: "Yêu cầu đăng nhập",
        description: "Vui lòng đăng nhập để sử dụng giỏ hàng",
        variant: "warning",
      })
      router.push("/auth/sign-in?callbackUrl=" + encodeURIComponent(window.location.pathname))
      return true
    }
    return false
  }, [toast, router])

  // Add to cart mutation with loading state
  const addToCartMutation = useMutation({
    mutationFn: async (data: { productId: string; quantity: number }) => {
      return await publicApiClient.addCartItem(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY })
      toast({
        title: "Thành công",
        description: "Đã thêm sản phẩm vào giỏ hàng",
        variant: "success",
      })
    },
    onError: (error) => {
      if (handleAuthError(error)) return
      toast({
        title: "Lỗi",
        description: "Không thể thêm sản phẩm vào giỏ hàng",
        variant: "destructive",
      })
    },
  })

  // Update cart item mutation with loading state
  const updateCartItemMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      return await publicApiClient.updateCartItem(itemId, { quantity })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY })
      toast({
        title: "Thành công",
        description: "Đã cập nhật giỏ hàng",
        variant: "success",
      })
    },
    onError: (error) => {
      if (handleAuthError(error)) return
      const errorMessage = 
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "data" in error.response &&
        error.response.data &&
        typeof error.response.data === "object" &&
        "error" in error.response.data
          ? String(error.response.data.error)
          : "Không thể cập nhật giỏ hàng"
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      })
    },
  })

  // Remove cart item mutation with loading state
  const removeCartItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return await publicApiClient.removeCartItem(itemId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY })
      toast({
        title: "Thành công",
        description: "Đã xóa sản phẩm khỏi giỏ hàng",
        variant: "success",
      })
    },
    onError: (error) => {
      if (handleAuthError(error)) return
      toast({
        title: "Lỗi",
        description: "Không thể xóa sản phẩm khỏi giỏ hàng",
        variant: "destructive",
      })
    },
  })

  // Clear cart mutation with loading state
  const clearCartMutation = useMutation({
    mutationFn: async () => {
      return await publicApiClient.clearCart()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY })
      toast({
        title: "Thành công",
        description: "Đã xóa tất cả sản phẩm khỏi giỏ hàng",
        variant: "success",
      })
    },
    onError: (error) => {
      if (handleAuthError(error)) return
      toast({
        title: "Lỗi",
        description: "Không thể xóa giỏ hàng",
        variant: "destructive",
      })
    },
  })

  return {
    // Actions
    addToCart: addToCartMutation.mutate,
    updateCartItem: (itemId: string, quantity: number) => 
      updateCartItemMutation.mutate({ itemId, quantity }),
    removeCartItem: removeCartItemMutation.mutate,
    clearCart: clearCartMutation.mutate,
    
    // Loading states
    isAddingToCart: addToCartMutation.isPending,
    isUpdatingCartItem: updateCartItemMutation.isPending,
    isRemovingCartItem: removeCartItemMutation.isPending,
    isClearingCart: clearCartMutation.isPending,
    
    // Individual item loading states (for tracking which item is being updated/removed)
    updatingItemId: updateCartItemMutation.isPending 
      ? (updateCartItemMutation.variables as { itemId: string } | undefined)?.itemId 
      : undefined,
    removingItemId: removeCartItemMutation.isPending 
      ? removeCartItemMutation.variables 
      : undefined,
  }
}

