"use client"

import { typography, headerConfig, iconSizes } from "@/lib/typography"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FieldGroup } from "@/components/ui/field"
import Link from "next/link"
import { Info, ArrowLeft, Phone, MapPin, Shield } from "lucide-react"

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden border-2 border-primary/20 shadow-xl">
        <CardContent className="p-8 md:p-10">
          <FieldGroup className="gap-6">
            {/* Header Section */}
            <div className="flex flex-col items-center gap-6 text-center">
              {/* Icon với animation - sử dụng primary color */}
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
                <div className="relative rounded-full bg-primary p-4 shadow-lg ring-4 ring-primary/10">
                  <Shield className={`${iconSizes["2xl"]} text-primary-foreground`} />
                </div>
              </div>

              {/* Title - sử dụng primary color */}
              <div className="space-y-2">
                <h1 className={`${headerConfig.main.className} tracking-tight text-primary`}>
                  Quên mật khẩu?
                </h1>
                <p className={typography.description.default}>
                  Chúng tôi sẽ giúp bạn lấy lại quyền truy cập
                </p>
              </div>
            </div>

            {/* Info Card - sử dụng primary color với accent */}
            <div className="relative overflow-hidden rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-primary/10 to-secondary/5 p-6 dark:from-primary/10 dark:via-primary/15 dark:to-secondary/10">
              <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-primary/10 blur-3xl dark:bg-primary/20" />
              <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-secondary/10 blur-2xl dark:bg-secondary/15" />
              <div className="relative space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-lg bg-primary/10 p-2.5 dark:bg-primary/20 ring-2 ring-primary/20">
                    <Info className={`${iconSizes.md} text-primary`} />
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className={`${typography.body.large} font-semibold`}>
                      Vui lòng liên hệ phòng QLCTT
                    </p>
                    <p className={`${typography.body.muted.medium} leading-relaxed`}>
                      Trường Đại học Ngân hàng Thành phố Hồ Chí Minh để được cấp lại mật khẩu.
                    </p>
                  </div>
                </div>

                {/* Contact Info - sử dụng card background */}
                <div className="mt-6 space-y-3 rounded-lg bg-card/80 backdrop-blur-sm border border-border/50 p-4 shadow-sm">
                  <div className={`flex items-center gap-3 ${typography.body.medium}`}>
                    <div className="rounded-md bg-primary/10 p-1.5 dark:bg-primary/20 ring-1 ring-primary/20">
                      <MapPin className={`${iconSizes.sm} text-primary`} />
                    </div>
                    <span className="text-foreground font-medium">
                      Trường Đại học Ngân hàng TP.HCM
                    </span>
                  </div>
                  <div className={`flex items-center gap-3 ${typography.body.medium}`}>
                    <div className="rounded-md bg-secondary/10 p-1.5 dark:bg-secondary/20 ring-1 ring-secondary/20">
                      <Phone className={`${iconSizes.sm} text-secondary`} />
                    </div>
                    <span className="text-foreground font-medium">
                      Phòng Quản lý Công tác Tuyển sinh (QLCTT)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons - sử dụng primary color */}
            <div className="flex flex-col gap-3 pt-2">
              <Button
                type="button"
                variant="default"
                size="lg"
                asChild
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200 group"
              >
                <Link href="/auth/sign-in" className="flex items-center justify-center gap-2">
                  <ArrowLeft className={`${iconSizes.sm} transition-transform group-hover:-translate-x-1`} />
                  Quay lại đăng nhập
                </Link>
              </Button>
              
              <div className="text-center">
                <Link
                  href="/auth/sign-in"
                  className={`${typography.body.muted.medium} hover:text-primary transition-colors underline-offset-4 hover:underline`}
                >
                  Nhớ mật khẩu rồi? Đăng nhập ngay
                </Link>
              </div>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>
    </div>
  )
}

