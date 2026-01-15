"use client"

import { useResourceNavigation } from "./use-resource-navigation"
import { useToast } from "@/hooks"
import { extractAxiosErrorMessage } from "@/utils/api-utils"
import { apiClient } from "@/services/api/axios"
import { stripApiBase } from "@/utils"
import { logger } from "@/utils"
import type { AxiosResponse } from "axios"

export interface UseResourceFormSubmitOptions {
  apiRoute: string | ((resourceId: string) => string)
  method?: "POST" | "PUT" | "PATCH"
  resourceId?: string
  messages: {
    successTitle: string
    successDescription: string
    errorTitle: string
    errorDescription?: string
  }
  navigation?: {
    toDetail?: boolean | string | ((response: AxiosResponse) => string | undefined)
    fallback?: string
  }
  transformData?: (data: Record<string, unknown>) => Record<string, unknown>
  onSuccess?: (response: AxiosResponse) => void | Promise<void>
}

export interface UseResourceFormSubmitResult {
  handleSubmit: (data: Record<string, unknown>) => Promise<{ success: boolean; error?: string }>
}

export const useResourceFormSubmit = ({
  apiRoute,
  method = "POST",
  resourceId,
  messages,
  navigation,
  transformData,
  onSuccess,
}: UseResourceFormSubmitOptions): UseResourceFormSubmitResult => {
  const { navigate } = useResourceNavigation()
  const { toast } = useToast()

  const handleSubmit = async (data: Record<string, unknown>): Promise<{ success: boolean; error?: string }> => {
    logger.debug("[useResourceFormSubmit] handleSubmit START", { 
      method,
      resourceId,
      hasTransformData: !!transformData,
      dataKeys: Object.keys(data),
    })
    
    // Resolve API route early để có thể sử dụng trong catch block
    let resolvedApiRoute: string = ""
    // Khai báo submitData ở ngoài để có thể sử dụng trong catch block
    let submitData: Record<string, unknown> | undefined = undefined
    
    try {
      // Resolve API route (support function for dynamic routes)
      if (typeof apiRoute === "function") {
        if (!resourceId) {
          return {
            success: false,
            error: "Resource ID is required for update operations",
          }
        }
      }

      resolvedApiRoute = typeof apiRoute === "function" && resourceId
        ? apiRoute(resourceId)
        : typeof apiRoute === "string"
          ? apiRoute
          : ""

      if (!resolvedApiRoute) {
        logger.error("[useResourceFormSubmit] API route is required")
        return {
          success: false,
          error: "API route is required",
        }
      }
    } catch (routeError) {
      logger.error("[useResourceFormSubmit] Error resolving API route", routeError as Error)
      return {
        success: false,
        error: "Lỗi xử lý API route",
      }
    }
    
    try {
      // Transform data if needed
      try {
        submitData = transformData ? transformData(data) : data
        logger.debug("[useResourceFormSubmit] Data transformed", { 
          originalKeys: Object.keys(data),
          transformedKeys: Object.keys(submitData),
        })
      } catch (transformError) {
        logger.error("[useResourceFormSubmit] Transform data error", transformError as Error)
        // Handle validation errors from transformData
        const errorMessage = transformError instanceof Error ? transformError.message : "Lỗi xử lý dữ liệu"
        toast({
          variant: "destructive",
          title: messages.errorTitle,
          description: errorMessage,
        })
        return { success: false, error: errorMessage }
      }

      // submitData chắc chắn đã được gán ở đây vì nếu không sẽ throw error ở trên
      if (!submitData) {
        logger.error("[useResourceFormSubmit] submitData is undefined")
        return {
          success: false,
          error: "Lỗi xử lý dữ liệu",
        }
      }

      // TypeScript guard: submitData không thể undefined ở đây
      const finalSubmitData = submitData

      logger.debug("[useResourceFormSubmit] Making API call", { 
        method,
        url: resolvedApiRoute,
        resourceId,
        dataKeys: Object.keys(finalSubmitData),
        dataPreview: Object.keys(finalSubmitData).reduce((acc, key) => {
          const value = finalSubmitData[key]
          // Chỉ log preview, không log toàn bộ data (có thể rất lớn)
          if (typeof value === "string" && value.length > 100) {
            acc[key] = `${value.substring(0, 100)}... (${value.length} chars)`
          } else if (Array.isArray(value)) {
            acc[key] = `Array(${value.length})`
          } else if (value && typeof value === "object") {
            acc[key] = `Object(${Object.keys(value).length} keys)`
          } else {
            acc[key] = value
          }
          return acc
        }, {} as Record<string, unknown>),
      })

      // Make API call
      const response = await apiClient.request({
        method,
        url: resolvedApiRoute,
        data: finalSubmitData,
      })

      logger.debug("[useResourceFormSubmit] API call completed", { 
        status: response.status,
        hasData: !!response.data,
        responseData: response.data,
        responseDetails: response.data?.data ? {
          id: response.data.data.id,
          ...(typeof response.data.data === 'object' ? Object.keys(response.data.data).slice(0, 10).reduce((acc, key) => {
            acc[key] = (response.data.data as Record<string, unknown>)[key]
            return acc
          }, {} as Record<string, unknown>) : {}),
        } : undefined,
      })

      const isSuccess = response.status === 201 || response.status === 200

      if (isSuccess) {
        logger.debug("[useResourceFormSubmit] Request successful", { 
          status: response.status,
          hasOnSuccess: !!onSuccess,
        })

        // Show success toast
        toast({
          variant: "success",
          title: messages.successTitle,
          description: messages.successDescription,
        })
        if (onSuccess) {
          logger.debug("[useResourceFormSubmit] Calling onSuccess handler")
          await onSuccess(response)
          logger.debug("[useResourceFormSubmit] onSuccess handler completed")
        }

        // Handle navigation ngay sau khi invalidate
        logger.debug("[useResourceFormSubmit] Handling navigation", { 
          hasToDetail: !!navigation?.toDetail,
          hasFallback: !!navigation?.fallback,
        })
        
        if (navigation?.toDetail) {
          let detailPath: string | undefined

          if (typeof navigation.toDetail === "function") {
            detailPath = navigation.toDetail(response)
          } else if (typeof navigation.toDetail === "string") {
            detailPath = navigation.toDetail
          } else if (response.data?.data?.id) {
            if (typeof apiRoute === "string") {
              const normalizedRoute = stripApiBase(apiRoute)
              const resourcePath = normalizedRoute
                .replace(/\/create$/, "")
                .replace(/\/update\([^)]+\)/, "")
                .replace(/\/\d+$/, "")
              detailPath = `${resourcePath}/${response.data.data.id}`
            }
          }

          if (detailPath) {
            logger.debug("[useResourceFormSubmit] Navigating to detail", { detailPath })
            navigate(detailPath)
            logger.debug("[useResourceFormSubmit] Navigation completed")
          } else if (navigation.fallback) {
            navigate(navigation.fallback)
          }
        } else if (navigation?.fallback) {
          navigate(navigation.fallback)
        }

        logger.debug("[useResourceFormSubmit] handleSubmit SUCCESS")
        return { success: true }
      }

      // Handle failure
      logger.warn("[useResourceFormSubmit] Request failed", { status: response.status })
      toast({
        variant: "destructive",
        title: messages.errorTitle,
        description: messages.errorDescription || "Không thể thực hiện thao tác. Vui lòng thử lại.",
      })

      return { success: false, error: messages.errorDescription || "Không thể thực hiện thao tác" }
    } catch (error: unknown) {
      // Log chi tiết error để debug
      const errorDetails: Record<string, unknown> = {
        method,
        url: resolvedApiRoute,
        resourceId,
      }
      
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { 
          response?: { 
            data?: unknown
            status?: number
            statusText?: string
          }
        }
        errorDetails.responseStatus = axiosError.response?.status
        errorDetails.responseStatusText = axiosError.response?.statusText
        errorDetails.responseData = axiosError.response?.data
        
        // Log validation errors nếu có
        if (axiosError.response?.data && typeof axiosError.response.data === "object") {
          const responseData = axiosError.response.data as Record<string, unknown>
          if (responseData.errors) {
            errorDetails.validationErrors = responseData.errors
          }
          // Log thêm error và message nếu có
          if (responseData.error) {
            errorDetails.serverError = responseData.error
          }
          if (responseData.message) {
            errorDetails.serverMessage = responseData.message
          }
        }
        
        // Log request data để debug (chỉ preview, không log toàn bộ)
        if (submitData) {
          errorDetails.requestDataPreview = Object.keys(submitData).reduce((acc, key) => {
            const value = submitData![key]
            if (typeof value === "string" && value.length > 50) {
              acc[key] = `${value.substring(0, 50)}... (${value.length} chars)`
            } else if (Array.isArray(value)) {
              acc[key] = `Array(${value.length})`
            } else if (value && typeof value === "object") {
              acc[key] = `Object(${Object.keys(value).length} keys)`
            } else {
              acc[key] = value
            }
            return acc
          }, {} as Record<string, unknown>)
        }
      }
      
      logger.error("[useResourceFormSubmit] handleSubmit ERROR", error as Error)
      logger.debug("[useResourceFormSubmit] Error details", errorDetails)
      
      const errorMessage = extractAxiosErrorMessage(error, messages.errorDescription || "Đã xảy ra lỗi")

      toast({
        variant: "destructive",
        title: messages.errorTitle,
        description: errorMessage,
      })

      return { success: false, error: errorMessage }
    }
  }

  return { handleSubmit }
}
