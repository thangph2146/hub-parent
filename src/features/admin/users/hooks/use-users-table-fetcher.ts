"use client"

import { useCallback } from "react"
import type { DataTableQueryState, DataTableResult } from "@/components/tables"
import type { ResourceViewMode } from "@/features/admin/resources/types"
import { normalizeSearch, sanitizeFilters } from "@/features/admin/resources/utils"
import { apiClient } from "@/services/api/axios"
import { apiRoutes, queryKeys } from "@/constants"
import type { AdminUsersListParams } from "@/constants"
import type { UserRow, UsersResponse } from "../types"
import { useResourceTableLoader } from "@/features/admin/resources/hooks"
import { useQueryClient } from "@tanstack/react-query"

export const useUsersTableFetcher = () => {
  const queryClient = useQueryClient()

  const fetchUsers = useCallback(
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
    }): Promise<DataTableResult<UserRow>> => {
      const baseUrl = apiRoutes.users.list({
        page,
        limit,
        status,
        search,
      })

      const filterParams = new URLSearchParams()
      Object.entries(filters ?? {}).forEach(([key, value]) => {
        if (value) {
          filterParams.set(`filter[${key}]`, value)
        }
      })

      const filterString = filterParams.toString()
      const url = filterString ? `${baseUrl}&${filterString}` : baseUrl

      const response = await apiClient.get<UsersResponse>(url)
      const payload = response.data

      if (!payload || !payload.data) {
        throw new Error("Không thể tải danh sách người dùng")
      }

      // payload.data là object { data: [...], pagination: {...} }
      const usersData = payload.data.data || []
      const pagination = payload.data.pagination

      return {
        rows: usersData,
        page: pagination?.page ?? page,
        limit: pagination?.limit ?? limit,
        total: pagination?.total ?? 0,
        totalPages: pagination?.totalPages ?? 0,
      }
    },
    [],
  )

  const buildListParams = useCallback(
    ({ query, view }: { query: DataTableQueryState; view: ResourceViewMode<UserRow> }): AdminUsersListParams => {
      const filtersRecord = sanitizeFilters(query.filters)

      return {
        status: (view.status ?? "active") as AdminUsersListParams["status"],
        page: query.page,
        limit: query.limit,
        search: normalizeSearch(query.search),
        filters: Object.keys(filtersRecord).length ? filtersRecord : undefined,
      }
    },
    [],
  )

  const fetchUsersWithDefaults = useCallback(
    (params: AdminUsersListParams) =>
      fetchUsers({
        page: params.page,
        limit: params.limit,
        status: params.status ?? "active",
        search: params.search,
        filters: params.filters,
      }),
    [fetchUsers],
  )

  const loader = useResourceTableLoader<UserRow, AdminUsersListParams>({
    queryClient,
    fetcher: fetchUsersWithDefaults,
    buildParams: buildListParams,
    buildQueryKey: queryKeys.adminUsers.list,
  })

  return {
    fetchUsers,
    loader,
  }
}
