import { useEffect, useRef } from "react"
import { resourceLogger } from "@/utils"
import type { ResourceAction } from "@/types"

const FORM_LOG_DEBOUNCE_MS = 500

interface UseResourceFormLoggerOptions<T extends Record<string, unknown>> {
  resourceName: string
  resourceId?: string
  action: "create" | "update"
  formData: T | null | undefined
  isSubmitting?: boolean
  submitSuccess?: boolean
  submitError?: string | null
}

export const useResourceFormLogger = <T extends Record<string, unknown>>({
  resourceName,
  resourceId,
  action,
  formData,
  isSubmitting = false,
  submitSuccess = false,
  submitError = null,
}: UseResourceFormLoggerOptions<T>) => {
  const loggedFormDataKeyRef = useRef<string | null>(null)
  const loggedSubmitRef = useRef<boolean>(false)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!formData || isSubmitting) {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
        debounceTimeoutRef.current = null
      }
      return
    }

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    debounceTimeoutRef.current = setTimeout(() => {
      const normalizedData = Object.keys(formData)
        .sort()
        .reduce((acc, key) => {
          const value = formData[key]
          if (value === null || value === undefined || typeof value !== "object" || Array.isArray(value)) {
            acc[key] = value
          } else {
            acc[key] = `[object:${typeof value}]`
          }
          return acc
        }, {} as Record<string, unknown>)
      
      const formDataKey = JSON.stringify(normalizedData)

      if (loggedFormDataKeyRef.current === formDataKey) return

      loggedFormDataKeyRef.current = formDataKey

      resourceLogger.logStructure({
        resource: resourceName,
        dataType: "form",
        structure: {
          fields: formData as Record<string, unknown>,
          action,
        },
      })
    }, FORM_LOG_DEBOUNCE_MS)

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
        debounceTimeoutRef.current = null
      }
    }
  }, [resourceName, action, formData, isSubmitting])

  useEffect(() => {
    const actionType: ResourceAction = action === "create" ? "create" : "update"

    if (!isSubmitting && submitSuccess && !loggedSubmitRef.current) {
      loggedSubmitRef.current = true

      if (resourceId) {
        resourceLogger.logAction({
          resource: resourceName,
          action: actionType,
          resourceId,
          recordData: formData as Record<string, unknown> | undefined,
        })
      }

      resourceLogger.logFlow({
        resource: resourceName,
        action: actionType,
        step: "success",
        details: { resourceId: resourceId || undefined },
      })
    }

    if (submitError && !loggedSubmitRef.current) {
      loggedSubmitRef.current = true
      resourceLogger.logFlow({
        resource: resourceName,
        action: actionType,
        step: "error",
        details: { resourceId: resourceId || undefined, error: submitError },
      })
    }

    if (isSubmitting) {
      loggedSubmitRef.current = false
    }
  }, [resourceName, resourceId, action, isSubmitting, submitSuccess, submitError, formData])
}

