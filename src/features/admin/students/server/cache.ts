/**
 * Cached Database Queries for Students
 * 
 * Sử dụng React.cache() để tự động deduplicate requests và cache kết quả
 * Dùng cho Server Components để tối ưu performance
 */

import { cache } from "react"
import { listStudents, getStudentById, getStudentColumnOptions } from "./queries"
import type { ListStudentsInput, ListStudentsResult, StudentDetail } from "../types"

/**
 * Cache function: List students
 * 
 * Sử dụng cache() để tự động deduplicate requests và cache kết quả
 * Dùng cho Server Components
 * 
 * @param params - ListStudentsInput
 * @returns ListStudentsResult
 */
export const listStudentsCached = cache(async (params: ListStudentsInput = {}): Promise<ListStudentsResult> => {
  return listStudents(params)
})

/**
 * Cache function: Get student by ID
 * 
 * Sử dụng cache() để tự động deduplicate requests và cache kết quả
 * Dùng cho Server Components
 * 
 * @param id - Student ID
 * @param actorId - Actor user ID for permission check
 * @param isSuperAdmin - Whether actor is super admin
 * @returns StudentDetail | null
 */
export const getStudentDetailById = cache(
  async (id: string, actorId?: string, isSuperAdmin?: boolean): Promise<StudentDetail | null> => {
    return getStudentById(id, actorId, isSuperAdmin)
  }
)

/**
 * Cache function: Get student column options for filters
 */
export const getStudentColumnOptionsCached = cache(
  async (
    column: string,
    search?: string,
    limit: number = 50,
    actorId?: string,
    isSuperAdmin?: boolean
  ): Promise<Array<{ label: string; value: string }>> => {
    return getStudentColumnOptions(column, search, limit, actorId, isSuperAdmin)
  }
)

