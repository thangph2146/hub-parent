import { queryKeys } from "@/constants"
import { createResourceActionsHook } from "@/features/admin/resources/hooks"
import type { StudentRow } from "../types"
import { STUDENT_MESSAGES } from "../constants/messages"

export const useStudentActions = createResourceActionsHook<StudentRow>({
  resourceName: "students",
  messages: STUDENT_MESSAGES,
  getRecordName: (row) => row.studentCode,
  getLogMetadata: (row) => ({ studentId: row.id, studentCode: row.studentCode }),
  customQueryKeys: {
    all: () => queryKeys.adminStudents.all(),
    detail: (id) => queryKeys.adminStudents.detail(id),
  },
})
