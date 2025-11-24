/**
 * Hook để log detail action và data structure
 * Standardize logging cho tất cả detail components
 * Theo chuẩn Next.js 16: chỉ log khi data từ API (isFromApi = true)
 */

import { useEffect, useRef } from "react"
import { resourceLogger } from "@/lib/config/resource-logger"

interface UseResourceDetailLoggerOptions<T extends Record<string, unknown>> {
  resourceName: string
  resourceId: string
  data: T | null | undefined
  isFetched: boolean
  isFromApi: boolean
  fetchedData?: T
}

/**
 * Hook để log detail action và data structure
 * Chỉ log một lần sau khi fetch từ API xong
 * 
 * @example
 * ```typescript
 * const { data, isFetched, isFromApi, fetchedData } = useResourceDetailData({...})
 * 
 * useResourceDetailLogger({
 *   resourceName: "students",
 *   resourceId: studentId,
 *   data,
 *   isFetched,
 *   isFromApi,
 *   fetchedData,
 * })
 * ```
 */
export function useResourceDetailLogger<T extends Record<string, unknown>>({
  resourceName,
  resourceId,
  data: _data,
  isFetched,
  isFromApi,
  fetchedData,
}: UseResourceDetailLoggerOptions<T>) {
  const loggedDataKeyRef = useRef<string | null>(null)

  useEffect(() => {
    if (!isFetched || !isFromApi || !fetchedData) return

    const dataKey = `${resourceId}-${fetchedData.updatedAt || fetchedData.createdAt || ""}`
    if (loggedDataKeyRef.current === dataKey) return

    loggedDataKeyRef.current = dataKey

    const recordData = fetchedData as Record<string, unknown>

    resourceLogger.detailAction({
      resource: resourceName,
      action: "load-detail",
      resourceId,
      recordData,
    })

    resourceLogger.dataStructure({
      resource: resourceName,
      dataType: "detail",
      structure: { fields: recordData },
    })
  }, [resourceName, resourceId, isFetched, isFromApi, fetchedData])
}

