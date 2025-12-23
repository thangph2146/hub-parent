/**
 * Student Scores Section Component
 * Hiển thị điểm số và điểm trung bình của sinh viên
 * Chỉ hiển thị và call API khi student isActive = true
 */

"use client"

import { TypographyP, TypographyPSmall, TypographyPSmallMuted, TypographyPMuted, IconSize } from "@/components/ui/typography"

import { useCallback, useMemo, useState } from "react"
import { 
  TrendingUp, 
  Calendar, 
  BookOpen, 
  AlertCircle,
  Loader2,
  Filter,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  useStudentDetailedScores,
  useStudentYearAverages,
  useStudentTermAverages,
} from "@/hooks/use-student-scores"
import type {
  DetailedScore,
  YearAverage,
  TermAverage,
} from "@/lib/api/types/student-scores"
import { cn } from "@/lib/utils"
import {
  DataTable,
  type DataTableColumn,
  type DataTableLoader,
  type DataTableQueryState,
  type DataTableResult,
} from "@/components/tables"

interface StudentScoresSectionProps {
  studentId: string
  isActive: boolean
  studentName?: string | null
}

/**
 * Format điểm số với màu sắc
 */
const formatScore = (score: number | null, type: "10" | "4" = "10"): { text: string; color: string } => {
  if (score === null || score === undefined) {
    return { text: "—", color: "text-muted-foreground" }
  }

  if (type === "10") {
    if (score >= 8.5) return { text: score.toFixed(1), color: "text-green-600 dark:text-green-400" }
    if (score >= 7.0) return { text: score.toFixed(1), color: "text-blue-600 dark:text-blue-400" }
    if (score >= 5.5) return { text: score.toFixed(1), color: "text-yellow-600 dark:text-yellow-400" }
    return { text: score.toFixed(1), color: "text-red-600 dark:text-red-400" }
  } else {
    if (score >= 3.5) return { text: score.toFixed(1), color: "text-green-600 dark:text-green-400" }
    if (score >= 2.5) return { text: score.toFixed(1), color: "text-blue-600 dark:text-blue-400" }
    if (score >= 2.0) return { text: score.toFixed(1), color: "text-yellow-600 dark:text-yellow-400" }
    return { text: score.toFixed(1), color: "text-red-600 dark:text-red-400" }
  }
}

/**
 * Format điểm chữ
 */
const formatGrade = (grade: string | null): { text: string; color: string } => {
  if (!grade) {
    return { text: "—", color: "text-muted-foreground" }
  }

  const gradeColors: Record<string, string> = {
    "A+": "text-green-600 dark:text-green-400",
    "A": "text-green-600 dark:text-green-400",
    "A-": "text-green-600 dark:text-green-400",
    "B+": "text-blue-600 dark:text-blue-400",
    "B": "text-blue-600 dark:text-blue-400",
    "B-": "text-blue-600 dark:text-blue-400",
    "C+": "text-yellow-600 dark:text-yellow-400",
    "C": "text-yellow-600 dark:text-yellow-400",
    "C-": "text-yellow-600 dark:text-yellow-400",
    "D+": "text-orange-600 dark:text-orange-400",
    "D": "text-red-600 dark:text-red-400",
    "F": "text-red-600 dark:text-red-400",
  }

  return {
    text: grade,
    color: gradeColors[grade] || "text-muted-foreground",
  }
}

/**
 * Component hiển thị Year Averages sử dụng DataTable
 */
const YearAveragesList = ({ averages, isLoading }: { averages?: YearAverage[]; isLoading: boolean }) => {
  // Extract unique years for filter
  const uniqueYears = useMemo(() => {
    if (!averages || averages.length === 0) return []
    return Array.from(new Set(averages.map((avg) => avg.yearStudy))).sort().reverse()
  }, [averages])

  // Create DataTable columns
  const columns: DataTableColumn<YearAverage>[] = useMemo(
    () => [
      {
        accessorKey: "yearStudy",
        header: "Năm học",
        cell: (row) => <div className="font-medium">{row.yearStudy}</div>,
        className: "min-w-[120px]",
        filter: {
          type: "select",
          options: uniqueYears.map((year) => ({ label: year, value: year })),
          placeholder: "Tất cả năm học",
        },
      },
      {
        accessorKey: "averageScore10",
        header: "Điểm hệ 10",
        cell: (row) => {
          const score10 = formatScore(row.averageScore10, "10")
          return <div className={cn("font-semibold", score10.color)}>{score10.text}</div>
        },
        className: "min-w-[100px]",
      },
      {
        accessorKey: "averageScore4",
        header: "Điểm hệ 4",
        cell: (row) => {
          const score4 = formatScore(row.averageScore4, "4")
          return <div className={cn("font-semibold", score4.color)}>{score4.text}</div>
        },
        className: "min-w-[100px]",
      },
      {
        accessorKey: "averageGatherScore10",
        header: "Tích lũy hệ 10",
        cell: (row) => {
          const gatherScore10 = formatScore(row.averageGatherScore10, "10")
          return <div className={cn(gatherScore10.color)}>{gatherScore10.text}</div>
        },
        className: "min-w-[120px]",
      },
      {
        accessorKey: "averageGatherScore4",
        header: "Tích lũy hệ 4",
        cell: (row) => {
          const gatherScore4 = formatScore(row.averageGatherScore4, "4")
          return <div className={cn(gatherScore4.color)}>{gatherScore4.text}</div>
        },
        className: "min-w-[120px]",
      },
    ],
    [uniqueYears]
  )

  // Create DataTable loader với client-side filtering
  const loader: DataTableLoader<YearAverage> = useCallback(
    async (query: DataTableQueryState): Promise<DataTableResult<YearAverage>> => {
      if (!averages || averages.length === 0) {
        return {
          rows: [],
          page: 1,
          limit: query.limit,
          total: 0,
          totalPages: 0,
        }
      }

      // Client-side filtering
      let filtered = [...averages]

      // Search filter
      if (query.search) {
        const searchLower = query.search.toLowerCase()
        filtered = filtered.filter((avg) => avg.yearStudy?.toLowerCase().includes(searchLower))
      }

      // Column filters
      if (query.filters.yearStudy && query.filters.yearStudy !== "all") {
        filtered = filtered.filter((avg) => avg.yearStudy === query.filters.yearStudy)
      }

      // Sort by year (desc)
      filtered.sort((a, b) => (b.yearStudy || "").localeCompare(a.yearStudy || ""))

      // Pagination
      const total = filtered.length
      const totalPages = Math.ceil(total / query.limit)
      const startIndex = (query.page - 1) * query.limit
      const endIndex = startIndex + query.limit
      const paginatedRows = filtered.slice(startIndex, endIndex)

      return {
        rows: paginatedRows,
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
      }
    },
    [averages]
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <IconSize size="lg" className="animate-spin text-muted-foreground">
          <Loader2 />
        </IconSize>
      </div>
    )
  }

  if (!averages || averages.length === 0) {
    return (
      <div className="py-8 text-muted-foreground">
        Chưa có dữ liệu điểm trung bình theo năm học
      </div>
    )
  }

  return (
    <DataTable<YearAverage>
      columns={columns}
      loader={loader}
      initialLimit={10}
      limitOptions={[10, 20, 50]}
      emptyMessage="Không tìm thấy dữ liệu"
      getRowId={(row) => row.yearStudy || `year-${row.updateDate}`}
      enableHorizontalScroll={true}
    />
  )
}

/**
 * Component hiển thị DataTable cho các học kỳ trong một năm học
 */
const YearTermAveragesDataTable = ({ termAverages }: { termAverages: TermAverage[] }) => {
  // Extract unique terms for filter
  const uniqueTerms = useMemo(() => {
    if (!termAverages || termAverages.length === 0) return []
    return Array.from(new Set(termAverages.map((avg) => avg.termID).filter(Boolean))).sort()
  }, [termAverages])

  // Create DataTable columns
  const columns: DataTableColumn<TermAverage>[] = useMemo(
    () => [
      {
        accessorKey: "termID",
        header: "Học kỳ",
        cell: (row) => (
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="whitespace-nowrap">
              <TypographyPSmall>
                {row.termID}
              </TypographyPSmall>
            </Badge>
            {row.orderTerm && (
              <TypographyPSmallMuted className="whitespace-nowrap">
                Học kỳ {row.orderTerm}
              </TypographyPSmallMuted>
            )}
          </div>
        ),
        className: "min-w-[140px]",
        filter: {
          type: "select",
          options: uniqueTerms.map((term) => ({ label: term, value: term })),
          placeholder: "Tất cả học kỳ",
        },
      },
      {
        accessorKey: "averageScore10",
        header: "Điểm hệ 10",
        cell: (row) => {
          const score10 = formatScore(row.averageScore10, "10")
          return <div className={cn("font-semibold", score10.color)}>{score10.text}</div>
        },
        className: "min-w-[100px]",
      },
      {
        accessorKey: "averageScore4",
        header: "Điểm hệ 4",
        cell: (row) => {
          const score4 = formatScore(row.averageScore4, "4")
          return <div className={cn("font-semibold", score4.color)}>{score4.text}</div>
        },
        className: "min-w-[100px]",
      },
      {
        accessorKey: "averageGatherScore10",
        header: "Tích lũy hệ 10",
        cell: (row) => {
          const gatherScore10 = formatScore(row.averageGatherScore10, "10")
          return <div className={cn(gatherScore10.color)}>{gatherScore10.text}</div>
        },
        className: "min-w-[120px]",
      },
      {
        accessorKey: "averageGatherScore4",
        header: "Tích lũy hệ 4",
        cell: (row) => {
          const gatherScore4 = formatScore(row.averageGatherScore4, "4")
          return <div className={cn(gatherScore4.color)}>{gatherScore4.text}</div>
        },
        className: "min-w-[120px]",
      },
    ],
    [uniqueTerms]
  )

  // Create DataTable loader với client-side filtering (không pagination)
  const loader: DataTableLoader<TermAverage> = useCallback(
    async (query: DataTableQueryState): Promise<DataTableResult<TermAverage>> => {
      if (!termAverages || termAverages.length === 0) {
        return {
          rows: [],
          page: 1,
          limit: query.limit,
          total: 0,
          totalPages: 1,
        }
      }

      // Client-side filtering
      let filtered = [...termAverages]

      // Search filter
      if (query.search) {
        const searchLower = query.search.toLowerCase()
        filtered = filtered.filter(
          (avg) =>
            avg.termID?.toLowerCase().includes(searchLower) ||
            avg.orderTerm?.toString().toLowerCase().includes(searchLower)
        )
      }

      // Column filters
      if (query.filters.termID && query.filters.termID !== "all") {
        filtered = filtered.filter((avg) => avg.termID === query.filters.termID)
      }

      // Sort by termID (asc)
      filtered.sort((a, b) => (a.termID || "").localeCompare(b.termID || ""))

      // Không pagination - trả về tất cả rows
      const total = filtered.length

      return {
        rows: filtered,
        page: 1,
        limit: total || 1, // Set limit = total để không hiển thị pagination
        total,
        totalPages: 1, // Set totalPages = 1 để không hiển thị pagination
      }
    },
    [termAverages]
  )

  if (!termAverages || termAverages.length === 0) {
    return (
      <TypographyPMuted className="py-4">
        Không có dữ liệu học kỳ
      </TypographyPMuted>
    )
  }

  return (
    <DataTable<TermAverage>
      columns={columns}
      loader={loader}
      initialLimit={termAverages.length || 1000} // Set limit lớn để hiển thị tất cả
      limitOptions={[]} // Không hiển thị limit options
      emptyMessage="Không tìm thấy dữ liệu"
      getRowId={(row) => `${row.yearStudy}-${row.termID}`}
      enableHorizontalScroll={true}
    />
  )
}

/**
 * Component hiển thị Term Averages với tree structure: Năm học -> DataTable học kỳ
 */
const TermAveragesList = ({ averages, isLoading }: { averages?: TermAverage[]; isLoading: boolean }) => {
  const [filterYear, setFilterYear] = useState<string>("all")
  const [openYears, setOpenYears] = useState<Set<string>>(new Set())

  // Extract unique years for filter
  const uniqueYears = useMemo(() => {
    if (!averages || averages.length === 0) return []
    return Array.from(new Set(averages.map((avg) => avg.yearStudy).filter(Boolean))).sort().reverse()
  }, [averages])

  // Group scores by yearStudy
  const groupedByYear = useMemo(() => {
    if (!averages || averages.length === 0) return {}

    // Filter scores first
    let filtered = [...averages]

    // Year filter
    if (filterYear !== "all") {
      filtered = filtered.filter((avg) => avg.yearStudy === filterYear)
    }

    // Group: yearStudy -> averages[]
    const grouped: Record<string, TermAverage[]> = {}

    filtered.forEach((avg) => {
      const year = avg.yearStudy || "Khác"
      if (!grouped[year]) {
        grouped[year] = []
      }
      grouped[year].push(avg)
    })

    return grouped
  }, [averages, filterYear])

  // Toggle function
  const toggleYear = useCallback((year: string) => {
    setOpenYears((prev) => {
      const next = new Set(prev)
      if (next.has(year)) {
        next.delete(year)
      } else {
        next.add(year)
      }
      return next
    })
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <IconSize size="lg" className="animate-spin text-muted-foreground">
          <Loader2 />
        </IconSize>
      </div>
    )
  }

  if (!averages || averages.length === 0) {
    return (
      <div className="py-8 text-muted-foreground">
        Chưa có dữ liệu điểm trung bình tích lũy theo học kỳ
      </div>
    )
  }

  const hasData = Object.keys(groupedByYear).length > 0

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={filterYear} onValueChange={setFilterYear}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <IconSize size="sm" className="mr-2">
              <Filter />
            </IconSize>
            <SelectValue placeholder="Tất cả năm học" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả năm học</SelectItem>
            {uniqueYears.map((year) => (
              <SelectItem key={year} value={year}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tree Structure: Năm học -> DataTable học kỳ */}
      {hasData ? (
        <div className="space-y-2">
          {Object.entries(groupedByYear)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([yearStudy, termAverages]) => {
              const isYearOpen = openYears.has(yearStudy)
              return (
                <Collapsible key={yearStudy} open={isYearOpen} onOpenChange={() => toggleYear(yearStudy)}>
                  <div className="rounded-md border overflow-hidden">
                    <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 hover:bg-muted transition-colors">
                      {isYearOpen ? (
                        <IconSize size="sm" className="text-muted-foreground">
                          <ChevronDown />
                        </IconSize>
                      ) : (
                        <IconSize size="sm" className="text-muted-foreground">
                          <ChevronRight />
                        </IconSize>
                      )}
                      <IconSize size="sm" className="text-muted-foreground">
                        <Calendar />
                      </IconSize>
                      <span className="font-semibold">Năm học ({yearStudy})</span>
                      <Badge variant="secondary" className="ml-auto">
                        {termAverages.length} học kỳ
                      </Badge>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="p-4 border-t">
                        <YearTermAveragesDataTable termAverages={termAverages} />
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              )
            })}
        </div>
      ) : (
        <div className="py-8 text-muted-foreground">
          Không tìm thấy dữ liệu phù hợp
        </div>
      )}
    </div>
  )
}

/**
 * Component hiển thị DataTable cho các môn học trong một học kỳ
 */
const TermScoresDataTable = ({ termScores }: { termScores: DetailedScore[] }) => {
  // Create DataTable columns
  const columns: DataTableColumn<DetailedScore>[] = useMemo(
    () => [
      {
        accessorKey: "curriculumName",
        header: "Môn học",
        cell: (row) => (
          <div className="space-y-0.5 min-w-0">
            <div className="font-medium truncate">{row.curriculumName}</div>
          </div>
        ),
        className: "min-w-[250px] sm:min-w-[300px]",
        filter: {
          type: "text",
          placeholder: "Tìm kiếm môn học...",
        },
      },
      {
        accessorKey: "curriculumID",
        header: "Mã môn",
        cell: (row) => <TypographyP>{row.curriculumID}</TypographyP>,
        className: "min-w-[120px]",
      },
      {
        accessorKey: "studyUnitAlias",
        header: "Mã học phần",
        cell: (row) => <TypographyPMuted>{row.studyUnitAlias}</TypographyPMuted>,
        className: "min-w-[120px]",
      },
      {
        accessorKey: "mark10",
        header: "Điểm hệ 10",
        cell: (row) => {
          const mark10 = formatScore(row.mark10, "10")
          return (
            <div className={cn("font-semibold whitespace-nowrap", mark10.color)}>
              {mark10.text}
            </div>
          )
        },
        className: "min-w-[90px]",
      },
      {
        accessorKey: "mark4",
        header: "Điểm hệ 4",
        cell: (row) => {
          const mark4 = formatScore(row.mark4, "4")
          return (
            <div className={cn("font-semibold whitespace-nowrap", mark4.color)}>
              {mark4.text}
            </div>
          )
        },
        className: "min-w-[90px]",
      },
      {
        accessorKey: "markLetter",
        header: "Điểm chữ",
        cell: (row) => {
          if (!row.markLetter) return <span className="text-muted-foreground">—</span>
          const grade = formatGrade(row.markLetter)
          return (
            <Badge variant="outline" className={cn("font-semibold whitespace-nowrap", grade.color)}>
              {grade.text}
            </Badge>
          )
        },
        className: "min-w-[90px]",
      },
    ],
    []
  )

  // Create DataTable loader với client-side filtering
  const loader: DataTableLoader<DetailedScore> = useCallback(
    async (query: DataTableQueryState): Promise<DataTableResult<DetailedScore>> => {
      if (!termScores || termScores.length === 0) {
        return {
          rows: [],
          page: 1,
          limit: query.limit,
          total: 0,
          totalPages: 0,
        }
      }

      // Client-side filtering
      let filtered = [...termScores]

      // Search filter - ưu tiên tìm theo tên môn học (curriculumName)
      if (query.search) {
        const searchLower = query.search.toLowerCase().trim()
        filtered = filtered.filter((score) => {
          const matchesName = score.curriculumName?.toLowerCase().includes(searchLower)
          const matchesID = score.curriculumID?.toLowerCase().includes(searchLower)
          const matchesAlias = score.studyUnitAlias?.toLowerCase().includes(searchLower)
          return matchesName || matchesID || matchesAlias
        })
      }

      // Column filters
      // Filter theo tên môn học (curriculumName)
      if (query.filters.curriculumName && query.filters.curriculumName.trim() !== "") {
        const nameFilter = query.filters.curriculumName.toLowerCase().trim()
        filtered = filtered.filter(
          (score) =>
            score.curriculumName?.toLowerCase().includes(nameFilter) ||
            score.curriculumID?.toLowerCase().includes(nameFilter) ||
            score.studyUnitAlias?.toLowerCase().includes(nameFilter)
        )
      }

      // Sort by curriculum name (asc)
      filtered.sort((a, b) => (a.curriculumName || "").localeCompare(b.curriculumName || ""))

      // Pagination
      const total = filtered.length
      const totalPages = Math.ceil(total / query.limit)
      const startIndex = (query.page - 1) * query.limit
      const endIndex = startIndex + query.limit
      const paginatedRows = filtered.slice(startIndex, endIndex)

      return {
        rows: paginatedRows,
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
      }
    },
    [termScores]
  )

  if (!termScores || termScores.length === 0) {
    return (
      <TypographyPMuted className="py-4">
        Không có dữ liệu môn học
      </TypographyPMuted>
    )
  }

  return (
    <DataTable<DetailedScore>
      columns={columns}
      loader={loader}
      initialLimit={20}
      limitOptions={[10, 20, 50, 100]}
      emptyMessage="Không tìm thấy môn học nào"
      getRowId={(row) => row.studyUnitID || `${row.curriculumID}-${row.termID}`}
      enableHorizontalScroll={true}
    />
  )
}

/**
 * Component hiển thị Detailed Scores với tree structure: Năm học -> Học kỳ -> DataTable môn học
 */
const DetailedScoresTable = ({ scores, isLoading }: { scores?: DetailedScore[]; isLoading: boolean }) => {
  const [filterYear, setFilterYear] = useState<string>("all")
  const [filterTerm, setFilterTerm] = useState<string>("all")
  const [openYears, setOpenYears] = useState<Set<string>>(new Set())
  const [openTerms, setOpenTerms] = useState<Set<string>>(new Set())

  // Extract unique years and terms for filters
  const { uniqueYears, uniqueTerms } = useMemo(() => {
    if (!scores || scores.length === 0) {
      return { uniqueYears: [], uniqueTerms: [] }
    }
    const years = new Set<string>()
    const terms = new Set<string>()
    scores.forEach((score) => {
      if (score.yearStudy) years.add(score.yearStudy)
      if (score.termID) terms.add(score.termID)
    })
    return {
      uniqueYears: Array.from(years).sort().reverse(),
      uniqueTerms: Array.from(terms).sort(),
    }
  }, [scores])

  // Group scores by yearStudy -> termID -> scores[]
  const groupedScores = useMemo(() => {
    if (!scores || scores.length === 0) return {}

    // Filter scores first
    let filtered = [...scores]

    // Year filter
    if (filterYear !== "all") {
      filtered = filtered.filter((score) => score.yearStudy === filterYear)
    }

    // Term filter
    if (filterTerm !== "all") {
      filtered = filtered.filter((score) => score.termID === filterTerm)
    }

    // Group: yearStudy -> termID -> scores[]
    const grouped: Record<string, Record<string, DetailedScore[]>> = {}

    filtered.forEach((score) => {
      const year = score.yearStudy || "Khác"
      const term = score.termID || "Khác"

      if (!grouped[year]) {
        grouped[year] = {}
      }
      if (!grouped[year][term]) {
        grouped[year][term] = []
      }
      grouped[year][term].push(score)
    })

    return grouped
  }, [scores, filterYear, filterTerm])

  // Toggle functions
  const toggleYear = (year: string) => {
    setOpenYears((prev) => {
      const next = new Set(prev)
      if (next.has(year)) {
        next.delete(year)
      } else {
        next.add(year)
      }
      return next
    })
  }

  const toggleTerm = (year: string, term: string) => {
    const key = `${year}-${term}`
    setOpenTerms((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <IconSize size="lg" className="animate-spin text-muted-foreground">
          <Loader2 />
        </IconSize>
      </div>
    )
  }

  if (!scores || scores.length === 0) {
    return (
      <div className="py-8 text-muted-foreground">
        Chưa có dữ liệu điểm chi tiết
      </div>
    )
  }

  const hasData = Object.keys(groupedScores).length > 0

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={filterYear} onValueChange={setFilterYear}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <IconSize size="sm" className="mr-2">
              <Filter />
            </IconSize>
            <SelectValue placeholder="Tất cả năm học" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả năm học</SelectItem>
            {uniqueYears.map((year) => (
              <SelectItem key={year} value={year}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterTerm} onValueChange={setFilterTerm}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Tất cả học kỳ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả học kỳ</SelectItem>
            {uniqueTerms.map((term) => (
              <SelectItem key={term} value={term}>
                {term}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tree Structure */}
      {hasData ? (
        <div className="space-y-2">
          {Object.entries(groupedScores)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([yearStudy, terms]) => {
              const isYearOpen = openYears.has(yearStudy)
              return (
                <Collapsible key={yearStudy} open={isYearOpen} onOpenChange={() => toggleYear(yearStudy)}>
                  <div className="rounded-md border overflow-hidden">
                    <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 hover:bg-muted transition-colors">
                      {isYearOpen ? (
                        <IconSize size="sm" className="text-muted-foreground">
                          <ChevronDown />
                        </IconSize>
                      ) : (
                        <IconSize size="sm" className="text-muted-foreground">
                          <ChevronRight />
                        </IconSize>
                      )}
                      <IconSize size="sm" className="text-muted-foreground">
                        <Calendar />
                      </IconSize>
                      <span className="font-semibold">Năm học ({yearStudy})</span>
                      <Badge variant="secondary" className="ml-auto">
                        {Object.keys(terms).length} học kỳ
                      </Badge>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-2 border-t space-y-2">
                        {Object.entries(terms)
                          .sort(([a], [b]) => a.localeCompare(b))
                          .map(([termID, termScores]) => {
                            const termKey = `${yearStudy}-${termID}`
                            const isTermOpen = openTerms.has(termKey)
                            return (
                              <Collapsible
                                key={termID}
                                open={isTermOpen}
                                onOpenChange={() => toggleTerm(yearStudy, termID)}
                              >
                                <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 hover:bg-muted rounded-md transition-colors">
                                  {isTermOpen ? (
                                    <IconSize size="sm" className="text-muted-foreground">
                                      <ChevronDown />
                                    </IconSize>
                                  ) : (
                                    <IconSize size="sm" className="text-muted-foreground">
                                      <ChevronRight />
                                    </IconSize>
                                  )}
                                  <IconSize size="sm" className="text-muted-foreground">
                                    <TrendingUp />
                                  </IconSize>
                                  <span className="font-medium">Học kỳ ({termID})</span>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="ml-6 mt-2">
                                  <TermScoresDataTable termScores={termScores} />
                                </CollapsibleContent>
                              </Collapsible>
                            )
                          })}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              )
            })}
        </div>
      ) : (
        <div className="py-8 text-muted-foreground">
          Không tìm thấy dữ liệu phù hợp
        </div>
      )}
    </div>
  )
}

/**
 * Main Component
 */
export const StudentScoresSection = ({ studentId, isActive }: StudentScoresSectionProps) => {
  // Chỉ call API khi isActive = true
  const { data: yearAverages, isLoading: isLoadingYear, error: errorYear } = useStudentYearAverages(
    studentId,
    isActive
  )
  const { data: termAverages, isLoading: isLoadingTerm, error: errorTerm } = useStudentTermAverages(
    studentId,
    isActive
  )
  const { data: detailedScores, isLoading: isLoadingScores, error: errorScores } = useStudentDetailedScores(
    studentId,
    isActive
  )

  // Nếu student không active, hiển thị thông báo
  if (!isActive) {
    return (
      <Card>
        <CardContent>
          <Alert>
            <IconSize size="sm">
              <AlertCircle />
            </IconSize>
            <AlertDescription>
              sinh viên này chưa được kích hoạt. Vui lòng kích hoạt sinh viên để xem điểm số.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const hasError = errorYear || errorTerm || errorScores

  return (
    <div className="space-y-6">
      {hasError && (
        <Alert variant="destructive">
          <IconSize size="sm">
            <AlertCircle />
          </IconSize>
          <AlertDescription>
            {errorYear?.message || errorTerm?.message || errorScores?.message || "Không thể tải dữ liệu điểm số"}
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs để tổ chức các sections */}
      <Tabs defaultValue="year" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="year" className="flex items-center gap-2">
            <IconSize size="sm">
              <Calendar />
            </IconSize>
            <span className="hidden sm:inline">Theo năm học</span>
            <span className="sm:hidden">Năm học</span>
          </TabsTrigger>
          <TabsTrigger value="term" className="flex items-center gap-2">
            <IconSize size="sm">
              <TrendingUp />
            </IconSize>
            <span className="hidden sm:inline">Theo học kỳ</span>
            <span className="sm:hidden">Học kỳ</span>
          </TabsTrigger>
          <TabsTrigger value="detailed" className="flex items-center gap-2">
            <IconSize size="sm">
              <BookOpen />
            </IconSize>
            <span className="hidden sm:inline">Điểm chi tiết</span>
            <span className="sm:hidden">Chi tiết</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="year" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconSize size="md">
                  <Calendar />
                </IconSize>
                Điểm trung bình theo năm học
              </CardTitle>
            </CardHeader>
            <CardContent>
              <YearAveragesList averages={yearAverages} isLoading={isLoadingYear} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="term" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconSize size="md">
                  <TrendingUp />
                </IconSize>
                Điểm trung bình tích lũy theo học kỳ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TermAveragesList averages={termAverages} isLoading={isLoadingTerm} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconSize size="md">
                  <BookOpen />
                </IconSize>
                Điểm chi tiết các môn học
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DetailedScoresTable scores={detailedScores} isLoading={isLoadingScores} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

