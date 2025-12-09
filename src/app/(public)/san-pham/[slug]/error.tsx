"use client"

import { AlertCircle, RefreshCw, Home } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

/**
 * Error Boundary cho Product Detail Page
 * Handle errors gracefully khi fetch product data
 */
export default function ProductDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const isDatabaseError = error.message.includes("database") || error.message.includes("kết nối")

  return (
    <div className="container mx-auto px-4 sm:px-6 max-w-4xl py-12">
      <Card className="border-destructive/50">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-destructive/10 p-3">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl md:text-3xl">
              {isDatabaseError ? "Không thể tải sản phẩm" : "Đã xảy ra lỗi"}
            </CardTitle>
            <CardDescription className="text-base">
              {isDatabaseError
                ? "Không thể kết nối đến database. Vui lòng thử lại sau."
                : error.message || "Đã xảy ra lỗi không mong muốn"}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {error.digest && (
            <div className="rounded-lg bg-muted p-3 border">
              <p className="text-xs font-mono text-muted-foreground">
                <span className="font-semibold">Error ID:</span> {error.digest}
              </p>
            </div>
          )}

          <div className="rounded-lg bg-muted/50 p-4 border border-destructive/20">
            <p className="text-sm text-muted-foreground text-center">
              {isDatabaseError
                ? "Vui lòng kiểm tra kết nối mạng hoặc liên hệ quản trị viên nếu vấn đề vẫn tiếp tục."
                : "Vui lòng thử lại hoặc quay về trang chủ."}
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} size="lg" className="w-full sm:w-auto">
            <RefreshCw className="mr-2 h-4 w-4" />
            Thử lại
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
            <Link href="/san-pham">
              <Home className="mr-2 h-4 w-4" />
              Về danh sách sản phẩm
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

