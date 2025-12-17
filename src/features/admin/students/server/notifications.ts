import {
  createNotificationForAllAdmins,
  emitNotificationToAllAdminsAfterCreate,
} from "@/features/admin/notifications/server/mutations";
import {
  getActorInfo,
  logNotificationError,
  formatItemNames,
} from "@/features/admin/notifications/server/notification-helpers";
import { NotificationKind } from "@prisma/client";

export const notifySuperAdminsOfStudentAction = async (
  action: "create" | "update" | "delete" | "restore" | "hard-delete",
  actorId: string,
  student: { id: string; studentCode: string; name: string | null },
  changes?: {
    studentCode?: { old: string; new: string };
    name?: { old: string | null; new: string | null };
    email?: { old: string | null; new: string | null };
    isActive?: { old: boolean; new: boolean };
  }
) => {
  try {
    const actor = await getActorInfo(actorId);

    let title = "";
    let description = "";
    const actionUrl = `/admin/students/${student.id}`;

    const studentDisplay = student.name || student.studentCode;

    switch (action) {
      case "create":
        title = "Tạo sinh viên";
        description = studentDisplay;
        break;
      case "update":
        const changeDescriptions: string[] = [];
        if (changes?.studentCode) {
          changeDescriptions.push(
            `Mã sinh viên: ${changes.studentCode.old} → ${changes.studentCode.new}`
          );
        }
        if (changes?.name) {
          changeDescriptions.push(
            `Tên: ${changes.name.old || "trống"} → ${
              changes.name.new || "trống"
            }`
          );
        }
        if (changes?.email) {
          changeDescriptions.push(
            `Email: ${changes.email.old || "trống"} → ${
              changes.email.new || "trống"
            }`
          );
        }
        if (changes?.isActive) {
          changeDescriptions.push(
            `Trạng thái: ${
              changes.isActive.old ? "Hoạt động" : "Vô hiệu hóa"
            } → ${changes.isActive.new ? "Hoạt động" : "Vô hiệu hóa"}`
          );
        }
        title = "Cập nhật sinh viên";
        description = `${studentDisplay}${
          changeDescriptions.length > 0
            ? `\n${changeDescriptions.join(", ")}`
            : ""
        }`;
        break;
      case "delete":
        title = "Xóa sinh viên";
        description = studentDisplay;
        break;
      case "restore":
        title = "Khôi phục sinh viên";
        description = studentDisplay;
        break;
      case "hard-delete":
        title = "Xóa vĩnh viễn sinh viên";
        description = studentDisplay;
        break;
    }

    // Tạo metadata một lần để tái sử dụng
    const metadata = {
      type: `student_${action}`,
      actorId,
      actorName: actor?.name || actor?.email,
      actorEmail: actor?.email,
      studentId: student.id,
      studentCode: student.studentCode,
      studentName: student.name,
      ...(changes && { changes }),
      timestamp: new Date().toISOString(),
    };

    const result = await createNotificationForAllAdmins(
      title,
      description,
      actionUrl,
      NotificationKind.SYSTEM,
      metadata
    );

    // Emit socket event nếu có socket server
    if (result.count > 0) {
      await emitNotificationToAllAdminsAfterCreate(
        title,
        description,
        actionUrl,
        NotificationKind.SYSTEM,
        metadata
      );
    }
  } catch (error) {
    logNotificationError(
      "students",
      "notify-all-admins",
      { studentId: student.id },
      error
    );
  }
};

export const formatStudentNames = (
  students: Array<{ studentCode: string; name: string | null }>,
  maxDisplay: number = 3
): string => {
  return formatItemNames(
    students,
    (s: { studentCode: string; name: string | null }) => s.name || s.studentCode || "Không xác định",
    maxDisplay,
    "sinh viên"
  )
}

export const notifySuperAdminsOfBulkStudentAction = async (
  action: "delete" | "restore" | "hard-delete" | "active" | "unactive",
  actorId: string,
  students: Array<{ studentCode: string; name: string | null }>
): Promise<void> => {
  if (students.length === 0) return;

  try {
    const actor = await getActorInfo(actorId);

    const namesText = formatStudentNames(students, 3);
    const count = students.length;

    let title = "";
    let description = "";

    switch (action) {
      case "delete":
        title = `Xóa ${count} sinh viên`;
        description = namesText || `${count} sinh viên`;
        break;
      case "restore":
        title = `Khôi phục ${count} sinh viên`;
        description = namesText || `${count} sinh viên`;
        break;
      case "hard-delete":
        title = `Xóa vĩnh viễn ${count} sinh viên`;
        description = namesText || `${count} sinh viên`;
        break;
      case "active":
        title = `Kích hoạt ${count} sinh viên`;
        description = namesText || `${count} sinh viên`;
        break;
      case "unactive":
        title = `Bỏ kích hoạt ${count} sinh viên`;
        description = namesText || `${count} sinh viên`;
        break;
    }

    const actionUrl = `/admin/students`;

    // Tạo metadata một lần để tái sử dụng
    const metadata = {
      type: `student_bulk_${action}`,
      actorId,
      actorName: actor?.name || actor?.email,
      actorEmail: actor?.email,
      studentCount: count,
      studentNames: students.map((s) => s.name || s.studentCode),
      timestamp: new Date().toISOString(),
    };

    const result = await createNotificationForAllAdmins(
      title,
      description,
      actionUrl,
      NotificationKind.SYSTEM,
      metadata
    );

    // Emit socket event nếu có socket server
    if (result.count > 0) {
      await emitNotificationToAllAdminsAfterCreate(
        title,
        description,
        actionUrl,
        NotificationKind.SYSTEM,
        metadata
      );
    }
  } catch (error) {
    logNotificationError(
      "students",
      "notify-all-admins-bulk",
      { count: students.length },
      error
    );
  }
};
