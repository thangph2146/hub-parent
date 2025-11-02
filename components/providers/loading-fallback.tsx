/**
 * Loading Fallback Component
 * Hiển thị khi các providers đang khởi tạo (Suspense boundary)
 */
"use client"

import { Loader } from "@/components/ui/loader"

export function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader />
    </div>
  )
}

