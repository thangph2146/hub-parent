"use client"

import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api/axios"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useCart } from "@/features/public/cart/hooks"
import type { CartItem } from "@/features/public/cart/types"
import Link from "next/link"
import Image from "next/image"
import { Loader2 } from "lucide-react"

const CART_QUERY_KEY = ["cart"]

async function getCart() {
  const response = await apiClient.get("/public/cart")
  return response.data
}

// Note: Metadata không thể export từ client component
// Metadata sẽ được lấy từ layout.tsx hoặc có thể thêm vào layout riêng

export default function CartPage() {
  const { data: cart, isLoading } = useQuery({
    queryKey: CART_QUERY_KEY,
    queryFn: getCart,
  })

  const { 
    updateCartItem, 
    removeCartItem, 
    clearCart,
    isClearingCart,
    updatingItemId,
    removingItemId,
  } = useCart()

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 max-w-6xl py-8">
        <p>Đang tải...</p>
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 max-w-6xl py-8">
        <h1 className="text-3xl font-bold mb-8">Giỏ hàng</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">Giỏ hàng của bạn đang trống</p>
            <Button asChild>
              <Link href="/san-pham">Tiếp tục mua sắm</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 max-w-6xl py-4 md:py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Giỏ hàng</h1>
        <Button 
          variant="outline" 
          onClick={() => clearCart()} 
          disabled={isClearingCart}
          className="w-full sm:w-auto"
        >
          {isClearingCart ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang xóa...
            </>
          ) : (
            "Xóa tất cả"
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item: CartItem) => (
            <Card key={item.id} className="py-0 border transition-shadow hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {item.productImage && (
                    <div className="relative w-24 h-24 flex-shrink-0">
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold mb-2 text-sm md:text-base">
                      <Link href={`/san-pham/${item.productSlug}`} className="hover:text-primary line-clamp-2">
                        {item.productName}
                      </Link>
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground mb-2">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(parseFloat(item.price))}
                    </p>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateCartItem(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1 || updatingItemId === item.id}
                        >
                          {updatingItemId === item.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "-"
                          )}
                        </Button>
                        <span className="w-12 text-center text-sm md:text-base">
                          {updatingItemId === item.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                          ) : (
                            item.quantity
                          )}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateCartItem(item.id, item.quantity + 1)}
                          disabled={updatingItemId === item.id}
                        >
                          {updatingItemId === item.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "+"
                          )}
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCartItem(item.id)}
                        disabled={removingItemId === item.id}
                        className="text-xs md:text-sm"
                      >
                        {removingItemId === item.id ? (
                          <>
                            <Loader2 className="mr-1 h-3 w-3 animate-spin inline" />
                            Đang xóa...
                          </>
                        ) : (
                          "Xóa"
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(parseFloat(item.total))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Tổng cộng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Tạm tính:</span>
                <span>
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(parseFloat(cart.subtotal))}
                </span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Tổng cộng:</span>
                <span>
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(parseFloat(cart.total))}
                </span>
              </div>
              <Button asChild className="w-full" size="lg">
                <Link href="/checkout">Thanh toán</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/san-pham">Tiếp tục mua sắm</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
