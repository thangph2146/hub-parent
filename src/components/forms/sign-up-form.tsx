"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"
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
import { TypographyH2, TypographyP, TypographyPMuted, IconSize } from "@/components/ui/typography"
import { IconBrandGoogleFilled } from "@tabler/icons-react"

export function SignUpForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirm-password") as string

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp")
      setIsLoading(false)
      return
    }

    try {
      // Tạo user mới - sử dụng apiClient và apiRoutes
      const { apiClient } = await import("@/lib/api/axios")
      const { apiRoutes } = await import("@/lib/api/routes")
      
      await apiClient.post<{ message: string }>(
        apiRoutes.auth.signUp,
        { name, email, password }
      )

      // Axios tự động throw error cho status >= 400, nên nếu đến đây thì đã thành công

      // Auto sign in sau khi đăng ký
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Đăng ký thành công nhưng đăng nhập thất bại")
        setIsLoading(false)
      } else {
        router.push("/admin/dashboard")
        router.refresh()
      }
    } catch {
      setError("Đã xảy ra lỗi. Vui lòng thử lại.")
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError(null)
    try {
      await signIn("google", { callbackUrl: "/admin/dashboard" })
    } catch {
      setError("Đã xảy ra lỗi khi đăng nhập bằng Google. Vui lòng thử lại.")
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form onSubmit={handleSubmit} className="p-6 md:p-8">
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <TypographyH2>Tạo tài khoản</TypographyH2>
                <TypographyPMuted className="text-balance">
                  Đăng ký tài khoản của bạn
                </TypographyPMuted>
              </div>
              {error && (
                <TypographyP className="rounded-lg bg-destructive/10 p-3 text-destructive">
                  {error}
                </TypographyP>
              )}
              <Field>
                <FieldLabel htmlFor="name">Tên</FieldLabel>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Họ và tên"
                  required
                  disabled={isLoading}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
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
                <FieldLabel htmlFor="password">Mật khẩu</FieldLabel>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Tạo mật khẩu"
                    required
                    disabled={isLoading}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
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
                </div>
              </Field>
              <Field>
                <FieldLabel htmlFor="confirm-password">Xác nhận mật khẩu</FieldLabel>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    name="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Xác nhận mật khẩu của bạn"
                    required
                    disabled={isLoading}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <IconSize size="sm">
                        <EyeOff className="text-muted-foreground" />
                      </IconSize>
                    ) : (
                      <IconSize size="sm">
                        <Eye className="text-muted-foreground" />
                      </IconSize>
                    )}
                  </Button>
                </div>
              </Field>
              <Field>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Đang đăng ký..." : "Đăng ký"}
                </Button>
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Hoặc tiếp tục với
              </FieldSeparator>
              <Field className="flex justify-center">
                <Button
                  variant="outline"
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full"
                >
                  <IconBrandGoogleFilled />
                  Đăng ký bằng Google
                </Button>
              </Field>
              <FieldDescription className="text-center">
                Đã có tài khoản? <Link href="/auth/sign-in" className="underline-offset-2 hover:underline">Đăng nhập</Link>
              </FieldDescription>
            </FieldGroup>
          </form>
          <div className="bg-muted relative hidden md:block">
            <Image
              src="https://hub.edu.vn/DATA/IMAGES/2025/06/06/20250606095214z6676928339374_824596735893cad9e9d4402075fcccd2.jpg"
              alt="Hình ảnh"
              width={1000}
              height={1000}
              loading="eager"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />    
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

