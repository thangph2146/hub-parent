import type { Prisma } from "@prisma/client"
import { prisma } from "@/services/prisma"
import { validatePagination } from "@/features/admin/resources/server"
import { mapSessionRecord, buildWhereClause } from "./helpers"
import type { ListSessionsInput, SessionDetailInfo, ListSessionsResult } from "../types"

export const listSessions = async (params: ListSessionsInput = {}): Promise<ListSessionsResult> => {
  const { page, limit } = validatePagination(params.page, params.limit, 100)
  const where = buildWhereClause(params)

  try {
    const [data, total] = await Promise.all([
      prisma.session.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.session.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    // Map với user info
    const rows = data.map((session) => {
      const mapped = mapSessionRecord(session)
      return {
        ...mapped,
        userName: session.user?.name || null,
        userEmail: session.user?.email || "",
      }
    })

    return {
      rows,
      total,
      page,
      limit,
      totalPages,
    }
  } catch (error) {
    console.error("[listSessions] Error:", error)
    return {
      rows: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
    }
  }
};

export const getSessionColumnOptions = async (
  column: string,
  search?: string,
  limit: number = 50
): Promise<Array<{ label: string; value: string }>> => {
  const where: Prisma.SessionWhereInput = {
    isActive: true, // Only active sessions
  }

  // Add search filter if provided
  if (search && search.trim()) {
    const searchValue = search.trim()
    switch (column) {
      case "userAgent":
        where.userAgent = { contains: searchValue, mode: "insensitive" }
        break
      case "ipAddress":
        where.ipAddress = { contains: searchValue, mode: "insensitive" }
        break
      default:
        where.userAgent = { contains: searchValue, mode: "insensitive" }
    }
  }

  // Build select based on column
  let selectField: Prisma.SessionSelect
  switch (column) {
    case "userAgent":
      selectField = { userAgent: true }
      break
    case "ipAddress":
      selectField = { ipAddress: true }
      break
    default:
      selectField = { userAgent: true }
  }

  try {
    const results = await prisma.session.findMany({
      where,
      select: selectField,
      orderBy: { [column]: "asc" },
      take: limit,
    })

    // Remove duplicates manually
    const uniqueValues = new Set<string>()
    const uniqueResults = results.filter((item) => {
      const value = item[column as keyof typeof item]
      if (typeof value === "string" && value.trim()) {
        if (uniqueValues.has(value)) {
          return false
        }
        uniqueValues.add(value)
        return true
      }
      return false
    })

    // Map results to options format
    return uniqueResults
      .map((item) => {
        const value = item[column as keyof typeof item]
        if (typeof value === "string" && value.trim()) {
          return {
            label: value,
            value: value,
          }
        }
        return null
      })
      .filter((item): item is { label: string; value: string } => item !== null)
  } catch (error) {
    console.error("[getSessionColumnOptions] Error:", error)
    return []
  }
};

export const getSessionById = async (id: string): Promise<SessionDetailInfo | null> => {
  try {
    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!session) {
      return null
    }

    return {
      ...mapSessionRecord(session),
      userName: session.user?.name || null,
      userEmail: session.user?.email || "",
    }
  } catch (error) {
    console.error("[getSessionById] Error:", error)
    return null
  }
};

