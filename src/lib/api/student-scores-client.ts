/**
 * Client functions để gọi Student Scores & Averages API
 */

import { requestJson } from "./client"
import { apiRoutes } from "./routes"
import type {
  StudentScoresResponse,
  StudentYearAveragesResponse,
  StudentTermAveragesResponse,
  StudentOverallAverageResponse,
} from "./types"

/**
 * Lấy danh sách điểm chi tiết theo MSSV
 */
export const getStudentDetailedScores = async (
  studentId: string
): Promise<StudentScoresResponse> => {
  const result = await requestJson<{ data: StudentScoresResponse }>(
    apiRoutes.studentScores.detailed(studentId)
  )

  if (!result.ok || !result.data) {
    throw new Error(result.error || "Không thể lấy dữ liệu điểm chi tiết")
  }

  return result.data.data
}

/**
 * Lấy danh sách điểm trung bình theo năm học
 */
export const getStudentYearAverages = async (
  studentId: string
): Promise<StudentYearAveragesResponse> => {
  const result = await requestJson<{ data: StudentYearAveragesResponse }>(
    apiRoutes.studentAverages.year(studentId)
  )

  if (!result.ok || !result.data) {
    throw new Error(result.error || "Không thể lấy dữ liệu điểm trung bình theo năm học")
  }

  return result.data.data
}

/**
 * Lấy danh sách điểm trung bình tích lũy theo học kỳ
 */
export const getStudentTermAverages = async (
  studentId: string
): Promise<StudentTermAveragesResponse> => {
  const result = await requestJson<{ data: StudentTermAveragesResponse }>(
    apiRoutes.studentAverages.terms(studentId)
  )

  if (!result.ok || !result.data) {
    throw new Error(result.error || "Không thể lấy dữ liệu điểm trung bình tích lũy theo học kỳ")
  }

  return result.data.data
}

/**
 * Lấy tổng hợp điểm trung bình chung
 */
export const getStudentOverallAverage = async (
  studentId: string
): Promise<StudentOverallAverageResponse> => {
  const result = await requestJson<{ data: StudentOverallAverageResponse }>(
    apiRoutes.studentAverages.overall(studentId)
  )

  if (!result.ok || !result.data) {
    throw new Error(result.error || "Không thể lấy dữ liệu tổng hợp điểm trung bình chung")
  }

  return result.data.data
}

