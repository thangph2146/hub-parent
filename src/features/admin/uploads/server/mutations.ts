"use server"

/**
 * Upload Server Mutations
 * Server-side functions để xử lý uploads
 */

import { apiRoutes } from "@/lib/api/routes"
import type { UploadResponse, UploadError } from "../types"

/**
 * Upload hình ảnh
 * Sử dụng fetch API trong server action thay vì axios
 */
export const uploadImage = async (file: File): Promise<UploadResponse | UploadError> => {
  try {
    const formData = new FormData()
    formData.append("file", file)

    // Sử dụng fetch API trong server action
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXTAUTH_URL || ""
    const apiUrl = `${baseUrl}/api${apiRoutes.uploads.upload}`

    const response = await fetch(apiUrl, {
      method: "POST",
      body: formData,
      // Không set Content-Type header - browser sẽ tự động set với boundary cho FormData
    })

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as UploadError
      return errorData.error ? errorData : { error: `HTTP ${response.status}: ${response.statusText}` }
    }

    const data = (await response.json()) as UploadResponse
    return data
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Đã xảy ra lỗi khi upload"
    return { error: errorMessage }
  }
}

