import { prisma } from "@/services/prisma"
import { getSocketServer } from "@/services/socket/state"
import { mapStudentRecord, serializeStudentForTable } from "./helpers"
import type { StudentRow } from "../types"
import { resourceLogger } from "@/utils"

const SUPER_ADMIN_ROOM = "role:super_admin"

export type StudentStatus = "active" | "deleted"

const resolveStatusFromRow = (row: StudentRow): StudentStatus => {
  return row.deletedAt ? "deleted" : "active"
}

const fetchStudentRow = async (studentId: string): Promise<StudentRow | null> => {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
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

  if (!student) {
    return null
  }

  const listed = mapStudentRecord(student)
  return serializeStudentForTable(listed)
}

export const emitStudentUpsert = async (
  studentId: string,
  previousStatus: StudentStatus | null,
): Promise<void> => {
  const io = getSocketServer()
  if (!io) return

  const row = await fetchStudentRow(studentId)
  if (!row) {
    if (previousStatus) {
      emitStudentRemove(studentId, previousStatus)
    }
    return
  }

  const newStatus = resolveStatusFromRow(row)

  io.to(SUPER_ADMIN_ROOM).emit("student:upsert", {
    student: row,
    previousStatus,
    newStatus,
  })
  
  resourceLogger.socket({
    resource: "students",
    action: previousStatus === null ? "create" : previousStatus !== newStatus ? "update" : "update",
    event: "student:upsert",
    resourceId: studentId,
    payload: { studentId, previousStatus, newStatus },
  })
}

export const emitStudentRemove = (studentId: string, previousStatus: StudentStatus): void => {
  const io = getSocketServer()
  if (!io) return

  io.to(SUPER_ADMIN_ROOM).emit("student:remove", {
    id: studentId,
    previousStatus,
  })
  
  resourceLogger.socket({
    resource: "students",
    action: "hard-delete",
    event: "student:remove",
    resourceId: studentId,
    payload: { studentId, previousStatus },
  })
}

export const emitStudentBatchUpsert = async (
  studentIds: string[],
  previousStatus: StudentStatus | null,
): Promise<void> => {
  const io = getSocketServer()
  if (!io || studentIds.length === 0) return

  // Fetch tất cả students trong một query
  const students = await prisma.student.findMany({
    where: {
      id: { in: studentIds },
    },
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

  // Map students to rows
  const rows = students
    .map((student) => {
      const listed = mapStudentRecord(student)
      return serializeStudentForTable(listed)
    })
    .filter((row): row is StudentRow => row !== null)

  // Emit batch event với tất cả students
  io.to(SUPER_ADMIN_ROOM).emit("student:batch-upsert", {
    students: rows.map((row) => ({
      student: row,
      previousStatus,
      newStatus: resolveStatusFromRow(row),
    })),
  })
  
  resourceLogger.logFlow({
    resource: "students",
    action: "socket-update",
    step: "success",
    details: { count: rows.length, type: "batch" },
  })
}

