"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Field,
  FieldLabel,
  FieldError,
  FieldContent,
} from "@/components/ui/field"
import { publicApiClient } from "@/lib/api/api-client"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import Link from "next/link"
import { Loader2, X } from "lucide-react"
import type { CheckoutFormData, CheckoutResult, GiftCodeValidation } from "../types"
import type { CartItem } from "@/features/public/cart/types"

const CART_QUERY_KEY = ["cart"]
const USER_INFO_QUERY_KEY = ["checkout", "user-info"]

async function getCart() {
  return await publicApiClient.getCart()
}

async function getUserInfo() {
  return await publicApiClient.getUserInfo()
}

const checkoutSchema = z.object({
  customerName: z.string().min(1, "Tên khách hàng là bắt buộc").max(255, "Tên khách hàng quá dài"),
  customerEmail: z.string().email("Email không hợp lệ").max(255, "Email quá dài"),
  customerPhone: z
    .string()
    .min(1, "Số điện thoại là bắt buộc")
    .regex(/^[0-9]{10,11}$/, "Số điện thoại phải có 10-11 chữ số"),
  shippingAddress: z.object({
    address: z.string().min(1, "Địa chỉ là bắt buộc"),
    city: z.string().min(1, "Thành phố là bắt buộc"),
    district: z.string().min(1, "Quận/Huyện là bắt buộc"),
    ward: z.string().min(1, "Phường/Xã là bắt buộc"),
    postalCode: z.string().optional(),
  }),
  billingAddress: z.object({
    address: z.string().min(1, "Địa chỉ là bắt buộc"),
    city: z.string().min(1, "Thành phố là bắt buộc"),
    district: z.string().min(1, "Quận/Huyện là bắt buộc"),
    ward: z.string().min(1, "Phường/Xã là bắt buộc"),
    postalCode: z.string().optional(),
  }).optional(),
  paymentMethod: z.string().min(1, "Phương thức thanh toán là bắt buộc"),
  giftCode: z.string().optional(),
  notes: z.string().optional(),
})

export function CheckoutForm() {
  const router = useRouter()
  const { toast } = useToast()
  const { data: session } = useSession()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [useSameAddress, setUseSameAddress] = useState(true)
  const [giftCode, setGiftCode] = useState("")
  const [giftCodeValidation, setGiftCodeValidation] = useState<GiftCodeValidation | null>(null)
  const [isValidatingGiftCode, setIsValidatingGiftCode] = useState(false)
  const [appliedDiscount, setAppliedDiscount] = useState(0)

  const { data: cart, isLoading: cartLoading } = useQuery({
    queryKey: CART_QUERY_KEY,
    queryFn: getCart,
  })

  const { data: userInfo } = useQuery({
    queryKey: USER_INFO_QUERY_KEY,
    queryFn: getUserInfo,
    enabled: !!session?.user?.id,
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      paymentMethod: "cod", // Cash on delivery
    },
  })

  // Pre-fill form with user info when available
  useEffect(() => {
    if (userInfo) {
      if (userInfo.name) setValue("customerName", userInfo.name)
      if (userInfo.email) setValue("customerEmail", userInfo.email)
      if (userInfo.phone) setValue("customerPhone", userInfo.phone)
      
      // If user has structured shipping address, use it
      if (userInfo.shippingAddress && typeof userInfo.shippingAddress === "object") {
        const addr = userInfo.shippingAddress as {
          address?: string
          city?: string
          district?: string
          ward?: string
          postalCode?: string
        }
        if (addr.address) setValue("shippingAddress.address", addr.address)
        if (addr.city) setValue("shippingAddress.city", addr.city)
        if (addr.district) setValue("shippingAddress.district", addr.district)
        if (addr.ward) setValue("shippingAddress.ward", addr.ward)
        if (addr.postalCode) setValue("shippingAddress.postalCode", addr.postalCode)
      } else if (userInfo.address) {
        // If user has simple address string, use it in address field
        setValue("shippingAddress.address", userInfo.address)
      }
    }
  }, [userInfo, setValue])

  // Watch subtotal for gift code validation
  const subtotal = cart?.subtotal ? parseFloat(cart.subtotal.toString()) : 0

  const handleValidateGiftCode = async () => {
    if (!giftCode.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập mã giảm giá",
        variant: "destructive",
      })
      return
    }

    setIsValidatingGiftCode(true)
    try {
      const response = await publicApiClient.validateGiftCode({
        code: giftCode.trim().toUpperCase(),
        subtotal,
      })

      if (response.success && response.data) {
        const giftCodeData = response.data as GiftCodeValidation
        setGiftCodeValidation(giftCodeData)
        setAppliedDiscount(giftCodeData.discount)
        setValue("giftCode", giftCode.trim().toUpperCase())
        toast({
          title: "Thành công",
          description: `Áp dụng mã giảm giá thành công. Giảm ${new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
          }).format(giftCodeData.discount)}`,
          variant: "success",
        })
      } else {
        setGiftCodeValidation(null)
        setAppliedDiscount(0)
        toast({
          title: "Lỗi",
          description: response.message || "Mã giảm giá không hợp lệ",
          variant: "destructive",
        })
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error && "response" in error && typeof error.response === "object" && error.response !== null && "data" in error.response && typeof error.response.data === "object" && error.response.data !== null && "message" in error.response.data && typeof error.response.data.message === "string"
          ? error.response.data.message
          : "Không thể xác thực mã giảm giá"
      setGiftCodeValidation(null)
      setAppliedDiscount(0)
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsValidatingGiftCode(false)
    }
  }

  const handleRemoveGiftCode = () => {
    setGiftCode("")
    setGiftCodeValidation(null)
    setAppliedDiscount(0)
    setValue("giftCode", undefined)
  }


  if (cartLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Đang tải giỏ hàng...</p>
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground mb-4">Giỏ hàng của bạn đang trống</p>
          <Button asChild>
            <Link href="/san-pham">Tiếp tục mua sắm</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const onSubmit = async (data: CheckoutFormData) => {
    setIsSubmitting(true)

    try {
      // If use same address, copy shipping to billing
      const checkoutData = {
        ...data,
        billingAddress: useSameAddress ? data.shippingAddress : data.billingAddress,
        giftCode: giftCodeValidation?.code || data.giftCode,
      }

      const response = await publicApiClient.createCheckout<CheckoutResult>(checkoutData)

      if (response.data.success) {
        toast({
          title: "Đặt hàng thành công",
          description: `Mã đơn hàng: ${response.data.orderNumber}`,
        })
        router.push(`/dat-hang-thanh-cong/${response.data.orderNumber}`)
      } else {
        toast({
          title: "Lỗi",
          description: response.data.message || "Không thể đặt hàng",
          variant: "destructive",
        })
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error && "response" in error && typeof error.response === "object" && error.response !== null && "data" in error.response && typeof error.response.data === "object" && error.response.data !== null && "message" in error.response.data && typeof error.response.data.message === "string"
          ? error.response.data.message
          : error instanceof Error
            ? error.message
            : "Đã xảy ra lỗi khi đặt hàng"
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
      <div className="lg:col-span-2">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
      {/* Customer Information */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin khách hàng</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field>
            <FieldLabel htmlFor="customerName">
              Họ và tên <span className="text-destructive">*</span>
            </FieldLabel>
            <FieldContent>
              <Input
                id="customerName"
                {...register("customerName")}
                aria-invalid={errors.customerName ? "true" : "false"}
              />
              <FieldError errors={errors.customerName ? [errors.customerName] : undefined} />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel htmlFor="customerEmail">
              Email <span className="text-destructive">*</span>
            </FieldLabel>
            <FieldContent>
              <Input
                id="customerEmail"
                type="email"
                {...register("customerEmail")}
                aria-invalid={errors.customerEmail ? "true" : "false"}
              />
              <FieldError errors={errors.customerEmail ? [errors.customerEmail] : undefined} />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel htmlFor="customerPhone">
              Số điện thoại <span className="text-destructive">*</span>
            </FieldLabel>
            <FieldContent>
              <Input
                id="customerPhone"
                {...register("customerPhone")}
                aria-invalid={errors.customerPhone ? "true" : "false"}
              />
              <FieldError errors={errors.customerPhone ? [errors.customerPhone] : undefined} />
            </FieldContent>
          </Field>
        </CardContent>
      </Card>

      {/* Shipping Address */}
      <Card>
        <CardHeader>
          <CardTitle>Địa chỉ giao hàng</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field>
            <FieldLabel htmlFor="shippingAddress.address">
              Địa chỉ <span className="text-destructive">*</span>
            </FieldLabel>
            <FieldContent>
              <Input
                id="shippingAddress.address"
                {...register("shippingAddress.address")}
                aria-invalid={errors.shippingAddress?.address ? "true" : "false"}
              />
              <FieldError errors={errors.shippingAddress?.address ? [errors.shippingAddress.address] : undefined} />
            </FieldContent>
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="shippingAddress.city">
                Thành phố <span className="text-destructive">*</span>
              </FieldLabel>
              <FieldContent>
                <Input
                  id="shippingAddress.city"
                  {...register("shippingAddress.city")}
                  aria-invalid={errors.shippingAddress?.city ? "true" : "false"}
                />
                <FieldError errors={errors.shippingAddress?.city ? [errors.shippingAddress.city] : undefined} />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="shippingAddress.district">
                Quận/Huyện <span className="text-destructive">*</span>
              </FieldLabel>
              <FieldContent>
                <Input
                  id="shippingAddress.district"
                  {...register("shippingAddress.district")}
                  aria-invalid={errors.shippingAddress?.district ? "true" : "false"}
                />
                <FieldError errors={errors.shippingAddress?.district ? [errors.shippingAddress.district] : undefined} />
              </FieldContent>
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="shippingAddress.ward">
                Phường/Xã <span className="text-destructive">*</span>
              </FieldLabel>
              <FieldContent>
                <Input
                  id="shippingAddress.ward"
                  {...register("shippingAddress.ward")}
                  aria-invalid={errors.shippingAddress?.ward ? "true" : "false"}
                />
                <FieldError errors={errors.shippingAddress?.ward ? [errors.shippingAddress.ward] : undefined} />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="shippingAddress.postalCode">Mã bưu điện</FieldLabel>
              <FieldContent>
                <Input
                  id="shippingAddress.postalCode"
                  {...register("shippingAddress.postalCode")}
                  aria-invalid={errors.shippingAddress?.postalCode ? "true" : "false"}
                />
                <FieldError errors={errors.shippingAddress?.postalCode ? [errors.shippingAddress.postalCode] : undefined} />
              </FieldContent>
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* Billing Address */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Địa chỉ thanh toán</CardTitle>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="useSameAddress"
                checked={useSameAddress}
                onChange={(e) => setUseSameAddress(e.target.checked)}
                className="rounded"
              />
              <FieldLabel htmlFor="useSameAddress" className="font-normal cursor-pointer">
                Giống địa chỉ giao hàng
              </FieldLabel>
            </div>
          </div>
        </CardHeader>
        {!useSameAddress && (
          <CardContent className="space-y-4">
            <Field>
              <FieldLabel htmlFor="billingAddress.address">
                Địa chỉ <span className="text-destructive">*</span>
              </FieldLabel>
              <FieldContent>
                <Input
                  id="billingAddress.address"
                  {...register("billingAddress.address")}
                  aria-invalid={errors.billingAddress?.address ? "true" : "false"}
                />
                <FieldError errors={errors.billingAddress?.address ? [errors.billingAddress.address] : undefined} />
              </FieldContent>
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="billingAddress.city">
                  Thành phố <span className="text-destructive">*</span>
                </FieldLabel>
                <FieldContent>
                  <Input
                    id="billingAddress.city"
                    {...register("billingAddress.city")}
                    aria-invalid={errors.billingAddress?.city ? "true" : "false"}
                  />
                  <FieldError errors={errors.billingAddress?.city ? [errors.billingAddress.city] : undefined} />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel htmlFor="billingAddress.district">
                  Quận/Huyện <span className="text-destructive">*</span>
                </FieldLabel>
                <FieldContent>
                  <Input
                    id="billingAddress.district"
                    {...register("billingAddress.district")}
                    aria-invalid={errors.billingAddress?.district ? "true" : "false"}
                  />
                  <FieldError errors={errors.billingAddress?.district ? [errors.billingAddress.district] : undefined} />
                </FieldContent>
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="billingAddress.ward">
                  Phường/Xã <span className="text-destructive">*</span>
                </FieldLabel>
                <FieldContent>
                  <Input
                    id="billingAddress.ward"
                    {...register("billingAddress.ward")}
                    aria-invalid={errors.billingAddress?.ward ? "true" : "false"}
                  />
                  <FieldError errors={errors.billingAddress?.ward ? [errors.billingAddress.ward] : undefined} />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel htmlFor="billingAddress.postalCode">Mã bưu điện</FieldLabel>
                <FieldContent>
                  <Input
                    id="billingAddress.postalCode"
                    {...register("billingAddress.postalCode")}
                    aria-invalid={errors.billingAddress?.postalCode ? "true" : "false"}
                  />
                  <FieldError errors={errors.billingAddress?.postalCode ? [errors.billingAddress.postalCode] : undefined} />
                </FieldContent>
              </Field>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle>Phương thức thanh toán</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field>
            <FieldContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="paymentCod"
                    value="cod"
                    {...register("paymentMethod")}
                    className="rounded"
                  />
                  <FieldLabel htmlFor="paymentCod" className="font-normal cursor-pointer">
                    Thanh toán khi nhận hàng (COD)
                  </FieldLabel>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="paymentBank"
                    value="bank_transfer"
                    {...register("paymentMethod")}
                    className="rounded"
                  />
                  <FieldLabel htmlFor="paymentBank" className="font-normal cursor-pointer">
                    Chuyển khoản ngân hàng
                  </FieldLabel>
                </div>
              </div>
              <FieldError errors={errors.paymentMethod ? [errors.paymentMethod] : undefined} />
            </FieldContent>
          </Field>
        </CardContent>
      </Card>

      {/* Gift Code */}
      <Card>
        <CardHeader>
          <CardTitle>Mã giảm giá</CardTitle>
        </CardHeader>
        <CardContent>
          <Field>
            <FieldLabel htmlFor="giftCode">Nhập mã giảm giá</FieldLabel>
            <FieldContent>
              <div className="flex gap-2">
                <Input
                  id="giftCode"
                  value={giftCode}
                  onChange={(e) => setGiftCode(e.target.value.toUpperCase())}
                  placeholder="Nhập mã giảm giá"
                  disabled={isValidatingGiftCode || !!giftCodeValidation}
                  className="flex-1"
                />
                {giftCodeValidation ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRemoveGiftCode}
                    disabled={isSubmitting}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Xóa
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleValidateGiftCode}
                    disabled={isValidatingGiftCode || !giftCode.trim() || isSubmitting}
                  >
                    {isValidatingGiftCode ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Đang kiểm tra
                      </>
                    ) : (
                      "Áp dụng"
                    )}
                  </Button>
                )}
              </div>
              {giftCodeValidation && (
                <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Mã giảm giá: {giftCodeValidation.code}
                  </p>
                  {giftCodeValidation.description && (
                    <p className="text-xs text-green-600 dark:text-green-300 mt-1">
                      {giftCodeValidation.description}
                    </p>
                  )}
                  <p className="text-sm font-semibold text-green-800 dark:text-green-200 mt-1">
                    Giảm: {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(giftCodeValidation.discount)}
                  </p>
                </div>
              )}
            </FieldContent>
          </Field>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Ghi chú</CardTitle>
        </CardHeader>
        <CardContent>
          <Field>
            <FieldLabel htmlFor="notes">Ghi chú</FieldLabel>
            <FieldContent>
              <Textarea
                id="notes"
                {...register("notes")}
                placeholder="Ghi chú cho đơn hàng (tùy chọn)"
                rows={4}
                aria-invalid={errors.notes ? "true" : "false"}
              />
              <FieldError errors={errors.notes ? [errors.notes] : undefined} />
            </FieldContent>
          </Field>
        </CardContent>
      </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? "Đang xử lý..." : "Đặt hàng"}
            </Button>
          </div>
        </form>
      </div>

      {/* Cart Summary */}
      <div className="lg:col-span-1">
        <Card className="sticky top-4">
          <CardHeader>
            <CardTitle>Đơn hàng của bạn</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {cart.items.map((item: CartItem) => (
                <div key={item.id} className="flex gap-3 pb-3 border-b last:border-0">
                  {item.productImage && (
                    <div className="relative w-16 h-16 flex-shrink-0">
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium line-clamp-2">{item.productName}</h4>
                    <p className="text-xs text-muted-foreground">Số lượng: {item.quantity}</p>
                    <p className="text-sm font-semibold mt-1">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(parseFloat(item.total))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-2 pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tạm tính:</span>
                <span>
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(parseFloat(cart.subtotal))}
                </span>
              </div>
              {appliedDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                  <span>Giảm giá:</span>
                  <span>
                    -{new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(appliedDiscount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Phí vận chuyển:</span>
                <span>Miễn phí</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Tổng cộng:</span>
                <span>
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(Math.max(0, parseFloat(cart.subtotal) - appliedDiscount))}
                </span>
              </div>
            </div>
            <Button asChild variant="outline" className="w-full mt-4">
              <Link href="/gio-hang">Chỉnh sửa giỏ hàng</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

