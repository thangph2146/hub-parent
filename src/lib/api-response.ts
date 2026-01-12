import { NextResponse } from "next/server"
import type { ApiResponsePayload } from "@/types"

const DEFAULT_SUCCESS_MESSAGE = "Thao tác thành công"
const DEFAULT_ERROR_MESSAGE = "Đã xảy ra lỗi"

export const createSuccessResponse = <T>(
  data?: T,
  options?: { message?: string; status?: number }
): NextResponse<ApiResponsePayload<T>> =>
  NextResponse.json(
    {
      success: true,
      message: options?.message || DEFAULT_SUCCESS_MESSAGE,
      error: null,
      data,
    },
    {
      status: options?.status ?? 200,
    }
  )

export const createErrorResponse = (
  message?: string,
  options?: { status?: number; error?: string; data?: unknown }
): NextResponse<ApiResponsePayload> =>
  NextResponse.json(
    {
      success: false,
      message: message || DEFAULT_ERROR_MESSAGE,
      error: options?.error || message || DEFAULT_ERROR_MESSAGE,
      data: options?.data,
    },
    {
      status: options?.status ?? 400,
    }
  )
