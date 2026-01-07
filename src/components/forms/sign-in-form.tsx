"use client"

import { useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { IconBrandGoogleFilled } from "@tabler/icons-react"
import { TypographyH2, TypographyP, IconSize } from "@/components/ui/typography"
import { Flex } from "@/components/ui/flex"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import Link from "next/link"
import { PointerHighlight } from "../ui/pointer-highlight"

// Map NextAuth error codes thành thông báo tiếng Việt
const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied: "Tài khoản của bạn đã bị vô hiệu hóa hoặc đã bị xóa. Vui lòng liên hệ quản trị viên để được hỗ trợ.",
  Configuration: "Có lỗi cấu hình hệ thống. Vui lòng thử lại sau.",
  Verification: "Liên kết xác minh không hợp lệ hoặc đã hết hạn.",
  Default: "Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại.",
}

export function SignInForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  // Đọc error từ query parameter ngay khi component mount
  // Sử dụng useMemo để tránh setState trong effect
  const initialError = searchParams?.get("error") 
    ? (ERROR_MESSAGES[searchParams.get("error")!] || ERROR_MESSAGES.Default)
    : null
  
  const [error, setError] = useState<string | null>(initialError)

  // Xóa error param khỏi URL sau khi đọc (chỉ chạy 1 lần khi có error)
  useEffect(() => {
    if (!searchParams || !initialError) return
    
    // Xóa error param khỏi URL để tránh hiển thị lại khi refresh
    const newUrl = new URL(window.location.href)
    newUrl.searchParams.delete("error")
    router.replace(newUrl.pathname + newUrl.search, { scroll: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Chỉ chạy 1 lần khi mount - searchParams và router không cần trong deps

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      // Kiểm tra result có tồn tại không
      if (!result) {
        setError("Không nhận được phản hồi từ server. Vui lòng thử lại.")
        setIsLoading(false)
        return
      }

      if (result.error) {
        // Map NextAuth error codes to Vietnamese messages
        const errorMessage = ERROR_MESSAGES[result.error] || ERROR_MESSAGES.Default
        setError(errorMessage)
        setIsLoading(false)
      } else if (result.ok) {
        // Session sẽ được tạo tự động bởi useCreateLoginSession hook trong SessionProvider
        // Không cần tạo ở đây nữa để tránh duplicate

        // Sử dụng callbackUrl từ query params hoặc fallback về dashboard
        const callbackUrl = searchParams?.get("callbackUrl")
        let redirectUrl = "/admin/dashboard"
        
        if (callbackUrl) {
          try {
            const decoded = decodeURIComponent(callbackUrl)
            // Validate callbackUrl: phải bắt đầu bằng / và không phải auth route
            if (decoded.startsWith("/") && !decoded.startsWith("/auth")) {
              redirectUrl = decoded
            }
          } catch {
            // Nếu decode fail, sử dụng fallback
          }
        }
        
        router.push(redirectUrl)
        router.refresh()
      } else {
        // Trường hợp result không có error nhưng cũng không ok
        setError("Đã xảy ra lỗi không xác định. Vui lòng thử lại.")
        setIsLoading(false)
      }
    } catch (error) {
      // Xử lý lỗi network hoặc JSON parsing
      console.error("Sign in error:", error)
      
      // Kiểm tra các loại lỗi phổ biến
      let errorMessage = "Đã xảy ra lỗi. Vui lòng thử lại."
      
      if (error instanceof Error) {
        if (error.message.includes("JSON") || error.message.includes("Unexpected end")) {
          errorMessage = "Lỗi kết nối với server. Vui lòng kiểm tra kết nối và thử lại."
        } else if (error.message.includes("fetch") || error.message.includes("network")) {
          errorMessage = "Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet và thử lại."
        } else {
          errorMessage = `Lỗi: ${error.message}`
        }
      }
      
      setError(errorMessage)
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Sử dụng callbackUrl từ query params hoặc fallback về dashboard
      const callbackUrl = searchParams?.get("callbackUrl")
      let redirectUrl = "/admin/dashboard"
      
      if (callbackUrl) {
        try {
          const decoded = decodeURIComponent(callbackUrl)
          // Validate callbackUrl: phải bắt đầu bằng / và không phải auth route
          if (decoded.startsWith("/") && !decoded.startsWith("/auth")) {
            redirectUrl = decoded
          }
        } catch {
          // Nếu decode fail, sử dụng fallback
        }
      }
      
      await signIn("google", { callbackUrl: redirectUrl })
    } catch {
      setError("Đã xảy ra lỗi khi đăng nhập bằng Google. Vui lòng thử lại.")
      setIsLoading(false)
    }
  }

  return (
    <Flex direction="col" gap={6} className={className} {...props}>
      <Card overflow="hidden" padding="0">
        <CardContent grid="2" padding="none">
          <form onSubmit={handleSubmit} className="p-6 md:p-8 lg:p-10">
            <FieldGroup>
              <Flex direction="col" align="center" gap={3} textAlign="center">
                <TypographyH2 className="text-2xl md:text-3xl font-bold text-secondary">
                  Chào mừng quý phụ huynh đến với HUB
                </TypographyH2>
                <PointerHighlight>
                  <TypographyP className="text-xl md:text-2xl font-bold text-primary">
                    Đăng nhập vào hệ thống
                  </TypographyP>
                </PointerHighlight>
              </Flex>
              {error && (
                <Flex rounded="lg" bg="destructive-text" padding="md">
                  <TypographyP>
                    {error}
                  </TypographyP>
                </Flex>
              )}
              <Field>
                <FieldLabel htmlFor="email" className="text-primary font-medium">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="example@email.com"
                  required
                  disabled={isLoading}
                />
              </Field>
              <Field>
                <Flex align="center" justify="between" fullWidth>
                  <FieldLabel htmlFor="password" className="text-primary font-medium">Mật khẩu</FieldLabel>
                  <Link
                    href="/auth/forgot-password"
                    className="text-primary hover:text-primary/80 transition-colors text-sm font-medium"
                  >
                    Quên mật khẩu?
                  </Link>
                </Flex>
                <Flex position="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Nhập mật khẩu của bạn"
                    required
                    disabled={isLoading}
                    paddingRight="10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-absolute"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <IconSize size="sm">
                        <EyeOff className="text-muted-foreground" />
                      </IconSize>
                    ) : (
                      <IconSize size="sm">
                        <Eye className="text-muted-foreground" />
                      </IconSize>
                    )}
                  </Button>
                </Flex>
              </Field>
              <Field>
                <Button type="submit" variant="destructive" size="lg" disabled={isLoading}>
                 <span className="text-base font-bold">{isLoading ? "Đang đăng nhập..." : "Đăng nhập"}</span>
                </Button>
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Hoặc tiếp tục với
              </FieldSeparator>
              <Field>
                <Flex justify="center" fullWidth>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    fullWidth
                    className="border-secondary/30 hover:bg-secondary/10"
                  >
                  <IconBrandGoogleFilled className="text-secondary" />
                  <span className="text-secondary font-bold text-base">Đăng nhập bằng Google</span>
                  </Button>
                </Flex>
              </Field>
              <FieldDescription textAlign="center" className="text-sm md:text-base">
                Nếu bạn chưa có tài khoản?{" "}
                <Link href="/auth/sign-up" className="font-bold text-primary hover:text-primary/80 transition-colors">
                  Đăng ký
                </Link>
              </FieldDescription>
            </FieldGroup>
          </form>
          <Flex bg="muted" position="relative" display="hidden-md-flex">
            <Image
              src="https://hub.edu.vn/DATA/IMAGES/2024/12/31/20241231235033-1vehub.jpg"
              alt="Hình ảnh"
              width={1000}
              height={1000}
              loading="eager"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[1]"
            />    
          </Flex>
        </CardContent>
      </Card>
    </Flex>
  )
}
