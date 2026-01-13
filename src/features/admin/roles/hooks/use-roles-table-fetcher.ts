"use client"

import { useCallback } from "react"
import type { DataTableQueryState, DataTableResult } from "@/components/tables"
import type { ResourceViewMode } from "@/features/admin/resources/types"
import { normalizeSearch, sanitizeFilters } from "@/features/admin/resources/utils"
import { apiClient } from "@/services/api/axios"
import { apiRoutes, queryKeys } from "@/constants"
import { sanitizeSearchQuery, resourceLogger } from "@/utils"
import type { AdminRolesListParams } from "@/constants"
import type { RoleRow, RolesResponse } from "../types"
import { useResourceTableLoader } from "@/features/admin/resources/hooks"
import { useQueryClient } from "@tanstack/react-query"

export const useRolesTableFetcher = () => {
  const queryClient = useQueryClient()

  const fetchRoles = useCallback(
    async ({
      page,
      limit,
      status,
      search,
      filters,
    }: {
      page: number
      limit: number
      status: "active" | "deleted" | "all"
      search?: string
      filters?: Record<string, string>
    }): Promise<DataTableResult<RoleRow>> => {
      const safePage = Number.isFinite(page) && page > 0 ? page : 1
      const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 10
      const trimmedSearch = typeof search === "string" ? search.trim() : ""
      const searchValidation =
        trimmedSearch.length > 0 ? sanitizeSearchQuery(trimmedSearch, Infinity) : { valid: true, value: "" }
      if (!searchValidation.valid) {
        throw new Error(searchValidation.error || "Từ khóa tìm kiếm không hợp lệ. Vui lòng thử lại.")
      }

      const requestParams: Record<string, string> = {
        page: safePage.toString(),
        limit: safeLimit.toString(),
        status: status ?? "active",
      }
      if (searchValidation.value) {
        requestParams.search = searchValidation.value
      }

      Object.entries(filters ?? {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          const normalized = `${value}`.trim()
          if (normalized) {
            const filterValidation = sanitizeSearchQuery(normalized, Infinity)
            if (filterValidation.valid && filterValidation.value) {
              requestParams[`filter[${key}]`] = filterValidation.value
            } else if (!filterValidation.valid) {
              throw new Error(filterValidation.error || "Giá trị bộ lọc không hợp lệ. Vui lòng thử lại.")
            }
          }
        }
      })

      try {
        const response = await apiClient.get<{
          success: boolean
          data?: RolesResponse
          error?: string
          message?: string
        }>(apiRoutes.roles.list(), {
          params: requestParams,
        })

        const payload = response.data.data
        if (!payload) {
          throw new Error(response.data.error || response.data.message || "Không thể tải danh sách vai trò")
        }

        const result = {
          rows: payload.data ?? [],
          page: payload.pagination?.page ?? page,
          limit: payload.pagination?.limit ?? limit,
          total: payload.pagination?.total ?? payload.data?.length ?? 0,
          totalPages: payload.pagination?.totalPages ?? 0,
        }

        resourceLogger.logAction({
          resource: "roles",
          action: "load-table",
          view: status,
          page: result.page,
          total: result.total,
        })

        return result
      } catch (error: unknown) {
        if (error && typeof error === "object" && "response" in error) {
          const axiosError = error as { response?: { data?: unknown; status?: number } }
          const errorMessage = axiosError.response?.data
            ? typeof axiosError.response.data === "object" && "error" in axiosError.response.data
              ? String(axiosError.response.data.error)
              : JSON.stringify(axiosError.response.data)
            : `Request failed with status ${axiosError.response?.status ?? "unknown"}`
          throw new Error(errorMessage)
        }
        throw error
      }
    },
    [],
  )

  const buildListParams = useCallback(
    ({ query, view }: { query: DataTableQueryState; view: ResourceViewMode<RoleRow> }): AdminRolesListParams => {
      const filtersRecord = sanitizeFilters(query.filters)
      const normalizedSearch = normalizeSearch(query.search)
      const sanitizedSearch =
        normalizedSearch && normalizedSearch.length > 0
          ? sanitizeSearchQuery(normalizedSearch).value || undefined
          : undefined

      return {
        status: (view.status ?? "active") as AdminRolesListParams["status"],
        page: query.page,
        limit: query.limit,
        search: sanitizedSearch,
        filters: Object.keys(filtersRecord).length ? filtersRecord : undefined,
      }
    },
    [],
  )

  const fetchRolesWithDefaults = useCallback(
    (params: AdminRolesListParams) =>
      fetchRoles({
        page: params.page,
        limit: params.limit,
        status: params.status ?? "active",
        search: params.search,
        filters: params.filters,
      }),
    [fetchRoles],
  )

  const loader = useResourceTableLoader<RoleRow, AdminRolesListParams>({
    queryClient,
    fetcher: fetchRolesWithDefaults,
    buildParams: buildListParams,
    buildQueryKey: queryKeys.adminRoles.list,
  })

  return {
    fetchRoles,
    loader,
  }
}
