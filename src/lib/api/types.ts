/**
 * Shared types for API routes
 */

import type { requireAuth } from "@/lib/auth"
import type { Permission } from "@/lib/permissions"

export type ApiRouteContext = {
  session: Awaited<ReturnType<typeof requireAuth>>
  permissions: Permission[]
  roles: Array<{ name: string }>
}

/**
 * Types cho Student Scores và Averages API responses
 * Khớp với response body từ external API
 */

/**
 * Điểm trung bình theo năm học
 * Response từ /api/Averages/year/{studentCode}
 */
export interface YearAverage {
  yearStudy: string
  averageScore10: number | null
  averageScore4: number | null
  averageGatherScore10: number | null
  averageGatherScore4: number | null
  updateDate: string
}

/**
 * Điểm trung bình tích lũy theo học kỳ
 * Response từ /api/Averages/terms/{studentCode}
 */
export interface TermAverage {
  yearStudy: string
  termID: string
  orderTerm: number | null
  averageScore10: number | null
  averageScore4: number | null
  averageGatherScore10: number | null
  averageGatherScore4: number | null
  updateDate: string
}

/**
 * Tổng hợp điểm trung bình chung
 * Response từ /api/Averages/overall/{studentCode}
 */
export interface OverallAverage {
  averageScore10: number | null
  averageScore4: number | null
  averageGatherScore10: number | null
  averageGatherScore4: number | null
  isModified: boolean | null
  updateStaff: string | null
  updateDate: string
}

/**
 * Điểm chi tiết theo MSSV
 * Response từ /api/Scores/detailed/{studentCode}
 */
export interface DetailedScore {
  studyUnitID: string
  studyUnitAlias: string
  curriculumID: string
  curriculumName: string
  yearStudy: string
  termID: string
  classStudentID: string
  classStudentName: string
  studyProgramID: string
  studyProgramName: string
  studyTypeID: string
  studyTypeName: string
  mark10: number | null
  mark4: number | null
  markLetter: string | null
}

/**
 * Response types cho API routes (wrapped trong { data: ... })
 */
export type StudentYearAveragesResponse = YearAverage[]

export type StudentTermAveragesResponse = TermAverage[]

export type StudentOverallAverageResponse = OverallAverage

export type StudentScoresResponse = DetailedScore[]