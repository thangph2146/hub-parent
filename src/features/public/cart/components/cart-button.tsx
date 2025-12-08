"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { ShoppingCart, Plus, Minus, Trash2, ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetDescription,
} from "@/components/ui/sheet"
import { publicApiClient } from "@/lib/api/api-client"
import { useCart } from "../hooks/use-cart"
import type { CartItem } from "../types"
import Image from "next/image"
import Link from "next/link"

const CART_QUERY_KEY = ["cart"]

async function getCart() {
  return await publicApiClient.getCart()
}

export function CartButton() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { data: session } = useSession()
  const { 
    updateCartItem, 
    removeCartItem,
    updatingItemId,
    removingItemId,
  } = useCart()

  const { data: cart, isLoading, error } = useQuery({
    queryKey: CART_QUERY_KEY,
    queryFn: getCart,
    enabled: !!session?.user, // Only fetch cart if user is authenticated
    retry: (failureCount, error) => {
      // Don't retry on 401 errors
      if (
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "status" in error.response &&
        error.response.status === 401
      ) {
        return false
      }
      return failureCount < 2
    },
  })

  // Redirect to login if 401 error
  useEffect(() => {
    if (
      error &&
      typeof error === "object" &&
      "response" in error &&
      error.response &&
      typeof error.response === "object" &&
      "status" in error.response &&
      error.response.status === 401
    ) {
      router.push("/auth/sign-in?callbackUrl=" + encodeURIComponent(window.location.pathname))
    }
  }, [error, router])

  const itemCount = cart?.itemCount || 0
  const hasItems = itemCount > 0

  const handleOpenCart = () => {
    if (!session?.user) {
      router.push("/auth/sign-in?callbackUrl=" + encodeURIComponent(window.location.pathname))
      return
    }
    setOpen(true)
  }

  const handleGoToCart = () => {
    setOpen(false)
    router.push("/gio-hang")
  }

  const handleGoToCheckout = () => {
    setOpen(false)
    router.push("/checkout")
  }

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="relative"
        onClick={handleOpenCart}
        aria-label="Giỏ hàng"
      >
        <ShoppingCart className="h-5 w-5" />
        {hasItems && (
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {itemCount > 99 ? "99+" : itemCount}
          </Badge>
        )}
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
          <SheetHeader className="px-6 pt-6 pb-4 border-b">
            <SheetTitle className="text-xl font-semibold">Giỏ hàng</SheetTitle>
            <SheetDescription className="text-sm">
              {hasItems ? `${itemCount} sản phẩm trong giỏ hàng` : "Giỏ hàng của bạn đang trống"}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="border">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <Skeleton className="h-24 w-24 rounded-lg flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                          <Skeleton className="h-8 w-24" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : !hasItems ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="rounded-full bg-muted p-6 mb-4">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Giỏ hàng trống</h3>
                <p className="text-sm text-muted-foreground text-center mb-6 max-w-sm">
                  Bạn chưa có sản phẩm nào trong giỏ hàng. Hãy thêm sản phẩm để tiếp tục mua sắm.
                </p>
                <Button onClick={() => setOpen(false)} asChild size="lg" className="w-full sm:w-auto">
                  <Link href="/san-pham" className="flex items-center gap-2">
                    Tiếp tục mua sắm
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.items.map((item: CartItem) => (
                  <Card key={item.id} className="py-0 border transition-shadow hover:shadow-md">
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-4">
                        {item.productImage && (
                          <Link
                            href={`/san-pham/${item.productSlug}`}
                            onClick={() => setOpen(false)}
                            className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden border bg-muted"
                          >
                            <Image
                              src={item.productImage}
                              alt={item.productName}
                              fill
                              className="object-cover transition-transform hover:scale-105"
                            />
                          </Link>
                        )}
                        <div className="flex-1 min-w-0 space-y-2">
                          <div>
                            <h4 className="font-medium text-sm mb-1 line-clamp-2 leading-tight">
                              <Link
                                href={`/san-pham/${item.productSlug}`}
                                className="hover:text-primary transition-colors"
                                onClick={() => setOpen(false)}
                              >
                                {item.productName}
                              </Link>
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {new Intl.NumberFormat("vi-VN", {
                                style: "currency",
                                currency: "VND",
                              }).format(parseFloat(item.price))}
                            </p>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => updateCartItem(item.id, item.quantity - 1)}
                                disabled={item.quantity <= 1 || updatingItemId === item.id}
                                aria-label="Giảm số lượng"
                              >
                                {updatingItemId === item.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Minus className="h-4 w-4" />
                                )}
                              </Button>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 1
                                  const newQuantity = Math.max(1, val)
                                  updateCartItem(item.id, newQuantity)
                                }}
                                disabled={updatingItemId === item.id}
                                className="w-16 text-center border rounded-md px-2 py-1"
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => updateCartItem(item.id, item.quantity + 1)}
                                disabled={updatingItemId === item.id}
                                aria-label="Tăng số lượng"
                              >
                                {updatingItemId === item.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Plus className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => removeCartItem(item.id)}
                              disabled={removingItemId === item.id}
                              aria-label="Xóa sản phẩm"
                            >
                              {removingItemId === item.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                         <span className="text-muted-foreground">Tổng tiền:</span>
                          <p className="font-semibold text-sm whitespace-nowrap">
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
            )}
          </div>

          {hasItems && (
            <div className="border-t bg-background">
              <SheetFooter className="flex-col gap-0 p-0">
                <div className="w-full px-6 py-4 space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tạm tính:</span>
                      <span className="font-medium">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(parseFloat(cart.subtotal))}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-base font-bold">
                      <span>Tổng cộng:</span>
                      <span className="text-primary">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(parseFloat(cart.total))}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 pt-2">
                    <Button 
                      onClick={handleGoToCheckout} 
                      className="w-full" 
                      size="lg"
                      variant="default"
                    >
                      Thanh toán
                    </Button>
                    <Button 
                      onClick={handleGoToCart} 
                      variant="outline" 
                      className="w-full"
                      size="default"
                    >
                      Xem giỏ hàng đầy đủ
                    </Button>
                  </div>
                </div>
              </SheetFooter>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}

