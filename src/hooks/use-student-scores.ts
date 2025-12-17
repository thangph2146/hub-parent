/**
 * React Query hooks để quản lý Student Scores & Averages API
 * Sử dụng TanStack Query để cache, refetch và quản lý state
 */

"use client"

import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api/axios"
import { queryKeys } from "@/lib/query-keys"
import { apiRoutes } from "@/lib/api/routes"
import { createAdminQueryOptions } from "@/features/admin/resources/config"
import type {
  StudentScoresResponse,
  StudentYearAveragesResponse,
  StudentTermAveragesResponse,
  StudentOverallAverageResponse,
} from "@/lib/api/types/student-scores"

/**
 * Helper to extract payload from API response or throw error
 */
const getPayloadOrThrow = <T>(
  response: { data: { data?: T; error?: string; message?: string } },
  errorMessage: string
): T => {
  const payload = response.data.data
  if (!payload) {
    const error = response.data.error || response.data.message || errorMessage
    throw new Error(error)
  }
  return payload
}

/**
 * Hook để lấy danh sách điểm chi tiết theo MSSV
 * Chỉ call API khi student isActive = true
 */
export const useStudentDetailedScores = (
  studentId: string | undefined,
  isActive: boolean = false
) => {
  return useQuery(
    createAdminQueryOptions<StudentScoresResponse>({
      queryKey: queryKeys.studentScores.detailed(studentId || ""),
      queryFn: async () => {
        if (!studentId) {
          throw new Error("Student ID is required")
        }

        const response = await apiClient.get<{
          data?: StudentScoresResponse
          error?: string
          message?: string
        }>(apiRoutes.studentScores.detailed(studentId))

        return getPayloadOrThrow<StudentScoresResponse>(
          response,
          "Không thể lấy dữ liệu điểm chi tiết"
        )
      },
      enabled: !!studentId && isActive,
    })
  )
}

/**
 * Hook để lấy danh sách điểm trung bình theo năm học
 * Chỉ call API khi student isActive = true
 */
export const useStudentYearAverages = (
  studentId: string | undefined,
  isActive: boolean = false
) => {
  return useQuery(
    createAdminQueryOptions<StudentYearAveragesResponse>({
      queryKey: queryKeys.studentAverages.year(studentId || ""),
      queryFn: async () => {
        if (!studentId) {
          throw new Error("Student ID is required")
        }

        const response = await apiClient.get<{
          data?: StudentYearAveragesResponse
          error?: string
          message?: string
        }>(apiRoutes.studentAverages.year(studentId))

        return getPayloadOrThrow<StudentYearAveragesResponse>(
          response,
          "Không thể lấy dữ liệu điểm trung bình theo năm học"
        )
      },
      enabled: !!studentId && isActive,
    })
  )
}

/**
 * Hook để lấy danh sách điểm trung bình tích lũy theo học kỳ
 * Chỉ call API khi student isActive = true
 */
export const useStudentTermAverages = (
  studentId: string | undefined,
  isActive: boolean = false
) => {
  return useQuery(
    createAdminQueryOptions<StudentTermAveragesResponse>({
      queryKey: queryKeys.studentAverages.terms(studentId || ""),
      queryFn: async () => {
        if (!studentId) {
          throw new Error("Student ID is required")
        }

        const response = await apiClient.get<{
          data?: StudentTermAveragesResponse
          error?: string
          message?: string
        }>(apiRoutes.studentAverages.terms(studentId))

        return getPayloadOrThrow<StudentTermAveragesResponse>(
          response,
          "Không thể lấy dữ liệu điểm trung bình tích lũy theo học kỳ"
        )
      },
      enabled: !!studentId && isActive,
    })
  )
}

/**
 * Hook để lấy tổng hợp điểm trung bình chung
 * Chỉ call API khi student isActive = true
 */
export const useStudentOverallAverage = (
  studentId: string | undefined,
  isActive: boolean = false
) => {
  return useQuery(
    createAdminQueryOptions<StudentOverallAverageResponse>({
      queryKey: queryKeys.studentAverages.overall(studentId || ""),
      queryFn: async () => {
        if (!studentId) {
          throw new Error("Student ID is required")
        }

        const response = await apiClient.get<{
          data?: StudentOverallAverageResponse
          error?: string
          message?: string
        }>(apiRoutes.studentAverages.overall(studentId))

        return getPayloadOrThrow<StudentOverallAverageResponse>(
          response,
          "Không thể lấy dữ liệu tổng hợp điểm trung bình chung"
        )
      },
      enabled: !!studentId && isActive,
    })
  )
}

