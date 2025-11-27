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

