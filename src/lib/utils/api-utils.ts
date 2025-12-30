/**
 * API utility functions for handling HTTP responses
 * Shared across the application
 */

/**
 * Safely parses JSON from a Response object
 */
export const parseJsonSafe = async <T>(response: Response): Promise<T | null> => {
  try {
    const textBody = await response.clone().text()
    return textBody ? (JSON.parse(textBody) as T) : null
  } catch {
    return null
  }
}

/**
 * Extracts error message from a Response object
 */
export const extractErrorMessage = async (response: Response): Promise<string> => {
  const data = await parseJsonSafe<{ error?: string; message?: string }>(response)
  if (data) {
    if (typeof data.error === "string") return data.error
    if (typeof data.message === "string") return data.message
    return JSON.stringify(data)
  }
  try {
    return await response.clone().text()
  } catch {
    return "Không xác định"
  }
}

/**
 * HTTP status code error messages
 */
const STATUS_MESSAGES: Record<number, string> = {
  401: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  403: "Bạn không có quyền thực hiện hành động này.",
  404: "Không tìm thấy tài nguyên.",
  500: "Lỗi máy chủ. Vui lòng thử lại sau.",
}

/**
 * Extracts error message from axios error object
 */
export const extractAxiosErrorMessage = (
  error: unknown,
  defaultMessage = "Đã xảy ra lỗi"
): string => {
  if (error && typeof error === "object" && "response" in error) {
    const axiosError = error as { 
      response?: { 
        data?: { 
          error?: string
          message?: string
          errors?: Array<{ message?: string; path?: string }> | Record<string, string[]>
        }
        status?: number 
      } 
    }
    
    const responseData = axiosError.response?.data
    
    // Ưu tiên error message
    if (responseData?.error && typeof responseData.error === "string") {
      return responseData.error
    }
    
    // Nếu có message
    if (responseData?.message && typeof responseData.message === "string") {
      return responseData.message
    }
    
    // Nếu có validation errors (array format)
    if (Array.isArray(responseData?.errors) && responseData.errors.length > 0) {
      const firstError = responseData.errors[0]
      if (firstError?.message) {
        return firstError.message
      }
    }
    
    // Nếu có validation errors (object format - Zod style)
    if (responseData?.errors && typeof responseData.errors === "object" && !Array.isArray(responseData.errors)) {
      const errors = responseData.errors as Record<string, string[]>
      const firstKey = Object.keys(errors)[0]
      if (firstKey && Array.isArray(errors[firstKey]) && errors[firstKey].length > 0) {
        return `${firstKey}: ${errors[firstKey][0]}`
      }
    }
    
    // Fallback to status message
    if (axiosError.response?.status) {
      return STATUS_MESSAGES[axiosError.response.status] || defaultMessage
    }
  }
  return error instanceof Error ? error.message : defaultMessage
}

/**
 * Normalize error to Error instance
 */
export const normalizeError = (error: unknown): Error =>
  error instanceof Error ? error : new Error(String(error))

/**
 * Get error message from unknown error
 */
export const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error)

