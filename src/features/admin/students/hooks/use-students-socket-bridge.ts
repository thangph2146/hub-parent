"use client"

import { useEffect, useRef, useCallback, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useQueryClient } from "@tanstack/react-query"
import type { StudentRow } from "../types"
import type { DataTableResult } from "@/components/tables"
import { queryKeys, type AdminStudentsListParams } from "@/lib/query-keys"
import { updateResourceQueries } from "@/features/admin/resources/utils/update-resource-queries"
import { useSocketConnection } from "@/features/admin/resources/hooks/use-socket-connection"
import {
  matchesSearch,
  matchesFilters,
  shouldIncludeInStatus,
  insertRowIntoPage,
  removeRowFromPage,
} from "../utils/socket-helpers"

interface StudentUpsertPayload {
  student: StudentRow
  previousStatus: "active" | "deleted" | null
  newStatus: "active" | "deleted"
}

interface StudentRemovePayload {
  id: string
  previousStatus: "active" | "deleted"
}

interface StudentBatchUpsertPayload {
  students: Array<{
    student: StudentRow
    previousStatus: "active" | "deleted" | null
    newStatus: "active" | "deleted"
  }>
}


const calculateTotalPages = (total: number, limit: number): number => {
  return total === 0 ? 0 : Math.ceil(total / limit)
}

const handleStudentUpsert = (
  student: StudentRow,
  params: AdminStudentsListParams,
  data: DataTableResult<StudentRow>
): DataTableResult<StudentRow> | null => {
  const rowStatus: "active" | "deleted" = student.deletedAt ? "deleted" : "active"
  const matches = matchesFilters(params.filters, student) && matchesSearch(params.search, student)
  const includesByStatus = shouldIncludeInStatus(params.status, rowStatus)
  const existingIndex = data.rows.findIndex((row) => row.id === student.id)
  const shouldInclude = matches && includesByStatus

  if (existingIndex === -1 && !shouldInclude) {
    return null
  }

  let total = data.total
  let rows = data.rows

  if (shouldInclude) {
    if (existingIndex >= 0) {
      rows = rows.map((row) => (row.id === student.id ? student : row))
    } else if (params.page === 1) {
      rows = insertRowIntoPage(rows, student, data.limit)
      total = total + 1
    }
  } else if (existingIndex >= 0) {
    const result = removeRowFromPage(rows, student.id)
    rows = result.rows
    if (result.removed) {
      total = Math.max(0, total - 1)
    }
  } else {
    return null
  }

  return {
    ...data,
    rows,
    total,
    totalPages: calculateTotalPages(total, data.limit),
  }
}

const handleBatchUpsert = (
  students: StudentRow[],
  params: AdminStudentsListParams,
  data: DataTableResult<StudentRow>
): DataTableResult<StudentRow> | null => {
  let total = data.total
  let rows = data.rows
  const actions = { inserted: 0, updated: 0, removed: 0 }

  for (const student of students) {
    const rowStatus: "active" | "deleted" = student.deletedAt ? "deleted" : "active"
    const matches = matchesFilters(params.filters, student) && matchesSearch(params.search, student)
    const includesByStatus = shouldIncludeInStatus(params.status, rowStatus)
    const existingIndex = rows.findIndex((row) => row.id === student.id)
    const shouldInclude = matches && includesByStatus

    if (shouldInclude) {
      if (existingIndex >= 0) {
        rows = rows.map((row) => (row.id === student.id ? student : row))
        actions.updated++
      } else if (params.page === 1) {
        rows = insertRowIntoPage(rows, student, data.limit)
        total = total + 1
        actions.inserted++
      }
    } else if (existingIndex >= 0) {
      const result = removeRowFromPage(rows, student.id)
      rows = result.rows
      if (result.removed) {
        total = Math.max(0, total - 1)
        actions.removed++
      }
    }
  }

  return {
    ...data,
    rows,
    total,
    totalPages: calculateTotalPages(total, data.limit),
  }
}

const CACHE_UPDATE_DEBOUNCE_MS = 150

export const useStudentsSocketBridge = () => {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const primaryRole = useMemo(() => session?.roles?.[0]?.name ?? null, [session?.roles])
  const { socket, on, isConnected, cacheVersion, setCacheVersion, sessionUserId } = useSocketConnection()
  const cacheVersionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const setupKeyRef = useRef<string | null>(null)

  const updateCacheVersion = useCallback(() => {
    if (cacheVersionTimeoutRef.current) {
      clearTimeout(cacheVersionTimeoutRef.current)
    }
    
    cacheVersionTimeoutRef.current = setTimeout(() => {
      setCacheVersion((prev) => prev + 1)
      cacheVersionTimeoutRef.current = null
    }, CACHE_UPDATE_DEBOUNCE_MS)
  }, [setCacheVersion])

  useEffect(() => {
    if (!sessionUserId) return

    // Tạo unique key để tránh duplicate setup trong React strict mode
    const currentSetupKey = `${sessionUserId}-${primaryRole ?? "null"}`
    if (setupKeyRef.current === currentSetupKey) return
    
    setupKeyRef.current = currentSetupKey

    const detachUpsert = on<[StudentUpsertPayload]>("student:upsert", (payload) => {
      const { student } = payload as StudentUpsertPayload

      const updated = updateResourceQueries<StudentRow, AdminStudentsListParams>(
        queryClient,
        queryKeys.adminStudents.all() as unknown[],
        ({ params, data }: { params: AdminStudentsListParams; data: DataTableResult<StudentRow> }) => {
        return handleStudentUpsert(student, params, data)
        },
      )

      // Update detail query
      queryClient.setQueryData<{ data: StudentRow } | undefined>(
        queryKeys.adminStudents.detail(student.id),
        (oldData) => {
          if (!oldData) return undefined
          // Thay thế hoàn toàn với dữ liệu từ server (server là source of truth)
          return { data: student }
        }
      )
      
      if (updated) {
        updateCacheVersion()
      }
    })

    const detachBatchUpsert = on<[StudentBatchUpsertPayload]>("student:batch-upsert", (payload) => {
      const { students } = payload as StudentBatchUpsertPayload

      const updated = updateResourceQueries<StudentRow, AdminStudentsListParams>(
        queryClient,
        queryKeys.adminStudents.all() as unknown[],
        ({ params, data }: { params: AdminStudentsListParams; data: DataTableResult<StudentRow> }) => {
        return handleBatchUpsert(
          students.map((s) => s.student),
          params,
          data
        )
        },
      )

      if (updated) {
        updateCacheVersion()
      }
    })

    const detachRemove = on<[StudentRemovePayload]>("student:remove", (payload) => {
      const { id } = payload as StudentRemovePayload
      
      const updated = updateResourceQueries<StudentRow, AdminStudentsListParams>(
        queryClient,
        queryKeys.adminStudents.all() as unknown[],
        ({ data }: { data: DataTableResult<StudentRow> }) => {
        const result = removeRowFromPage(data.rows, id)
        if (!result.removed) {
          return null
        }
        
        const total = Math.max(0, data.total - 1)
        
        return {
          ...data,
          rows: result.rows,
          total,
          totalPages: calculateTotalPages(total, data.limit),
        }
        },
      )

      // Invalidate detail query for the removed student
      queryClient.setQueryData(queryKeys.adminStudents.detail(id), undefined)
      
      if (updated) {
        updateCacheVersion()
      }
    })

    return () => {
      // Chỉ cleanup khi setup key thay đổi (userId hoặc role thay đổi)
      if (setupKeyRef.current === currentSetupKey) {
        setupKeyRef.current = null
        if (cacheVersionTimeoutRef.current) {
          clearTimeout(cacheVersionTimeoutRef.current)
          cacheVersionTimeoutRef.current = null
        }
        detachUpsert?.()
        detachBatchUpsert?.()
        detachRemove?.()
      }
    }
  }, [sessionUserId, on, queryClient, primaryRole, updateCacheVersion])

  return { socket, isSocketConnected: isConnected, cacheVersion }
}
