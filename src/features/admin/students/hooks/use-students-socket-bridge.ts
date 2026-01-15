"use client"

import { useQueryClient } from "@tanstack/react-query"
import type { StudentRow } from "../types"
import { queryKeys, type AdminStudentsListParams } from "@/constants"
import { useResourceSocketBridge } from "@/features/admin/resources/hooks/use-resource-socket-bridge"
import { matchesSearch, matchesFilters } from "../utils/socket-helpers"

const CACHE_UPDATE_DEBOUNCE_MS = 150

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

export const useStudentsSocketBridge = () => {
  const queryClient = useQueryClient()

  return useResourceSocketBridge<StudentRow, AdminStudentsListParams>({
    resourceName: "students",
    queryKey: queryKeys.adminStudents.all() as unknown[],
    eventNames: {
      upsert: "student:upsert",
      batchUpsert: "student:batch-upsert",
      remove: "student:remove",
    },
    getRowFromPayload: (payload) => {
      const p = payload as StudentUpsertPayload
      return p.student
    },
    getRowIdFromPayload: (payload) => {
      const p = payload as StudentRemovePayload
      return p.id
    },
    getBatchRowsFromPayload: (payload) => {
      const p = payload as StudentBatchUpsertPayload
      return p.students.map((item) => item.student)
    },
    getRowStatus: (row) => {
        if (row.deletedAt) return "deleted"
        if (!row.isActive) return "inactive"
        return "active"
      },
    matchesSearch,
    matchesFilters,
    debounceMs: CACHE_UPDATE_DEBOUNCE_MS,
    onRowUpserted: (row) => {
      // Update detail query
      queryClient.setQueryData<{ data: StudentRow } | undefined>(
        queryKeys.adminStudents.detail(row.id),
        (oldData) => {
          if (!oldData) return undefined
          return { data: row }
        }
      )
    },
    onRowRemoved: (id) => {
      // Invalidate detail query for the removed student
      queryClient.setQueryData(queryKeys.adminStudents.detail(id), undefined)
    },
  })
}
