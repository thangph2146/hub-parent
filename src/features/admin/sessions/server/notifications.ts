import { prisma } from "@/lib/prisma";
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

export const formatSessionNames = (
  sessions: Array<{ userName: string | null; userEmail: string }>,
  maxDisplay: number = 3
): string => {
  return formatItemNames(
    sessions,
    (s) => s.userName || s.userEmail || "Không xác định",
    maxDisplay,
    "session"
  );
};

export const notifySuperAdminsOfSessionAction = async (
  action: "create" | "update" | "delete" | "restore" | "hard-delete",
  actorId: string,
  session: { id: string; userId: string; accessToken: string },
  changes?: {
    userId?: { old: string; new: string };
    userAgent?: { old: string | null; new: string | null };
    ipAddress?: { old: string | null; new: string | null };
    isActive?: { old: boolean; new: boolean };
    expiresAt?: { old: string; new: string };
  }
) => {
  try {
    const actor = await getActorInfo(actorId);

    // Lấy thông tin user của session
    const sessionUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { name: true, email: true },
    });
    const userName = sessionUser?.name || sessionUser?.email || "Unknown";

    let title = "";
    let description = "";
    const actionUrl = `/admin/sessions/${session.id}`;

    switch (action) {
      case "create":
        title = "Tạo session";
        description = `${userName}`;
        break;
      case "update":
        const changeDescriptions: string[] = [];
        if (changes?.userId) {
          changeDescriptions.push(
            `Người dùng: ${changes.userId.old} → ${changes.userId.new}`
          );
        }
        if (changes?.userAgent) {
          changeDescriptions.push(
            `User Agent: ${changes.userAgent.old || "trống"} → ${
              changes.userAgent.new || "trống"
            }`
          );
        }
        if (changes?.ipAddress) {
          changeDescriptions.push(
            `IP Address: ${changes.ipAddress.old || "trống"} → ${
              changes.ipAddress.new || "trống"
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
        if (changes?.expiresAt) {
          changeDescriptions.push(
            `Thời gian hết hạn: ${changes.expiresAt.old} → ${changes.expiresAt.new}`
          );
        }
        title = "Cập nhật session";
        description = `${userName}${
          changeDescriptions.length > 0
            ? `\n${changeDescriptions.join(", ")}`
            : ""
        }`;
        break;
      case "delete":
        title = "Xóa session";
        description = `${userName}`;
        break;
      case "restore":
        title = "Khôi phục session";
        description = `${userName}`;
        break;
      case "hard-delete":
        title = "Xóa vĩnh viễn session";
        description = `${userName}`;
        break;
    }
    // Tạo metadata một lần để tái sử dụng
    const metadata = {
      type: `session_${action}`,
      actorId,
      actorName: actor?.name || actor?.email,
      actorEmail: actor?.email,
      sessionId: session.id,
      userId: session.userId,
      userName: userName,
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
      "sessions",
      "notify-all-admins",
      { sessionId: session.id },
      error
    );
  }
};

export const notifySuperAdminsOfBulkSessionAction = async (
  action: "delete" | "restore" | "hard-delete",
  actorId: string,
  sessions: Array<{ userName: string | null; userEmail: string }>
): Promise<void> => {
  if (sessions.length === 0) return;

  try {
    const actor = await getActorInfo(actorId);

    const namesText = formatSessionNames(sessions, 3);
    const count = sessions.length;

    let title = "";
    let description = "";

    switch (action) {
      case "delete":
        title = `Xóa ${count} session`;
        description = namesText || `${count} session`;
        break;
      case "restore":
        title = `Khôi phục ${count} session`;
        description = namesText || `${count} session`;
        break;
      case "hard-delete":
        title = `Xóa vĩnh viễn ${count} session`;
        description = namesText || `${count} session`;
        break;
    }

    const actionUrl = `/admin/sessions`;

    // Tạo metadata một lần để tái sử dụng
    const metadata = {
      type: `session_bulk_${action}`,
      actorId,
      actorName: actor?.name || actor?.email,
      actorEmail: actor?.email,
      count,
      sessionNames: sessions.map((s) => s.userName || s.userEmail),
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
      "sessions",
      "notify-all-admins-bulk",
      { count: sessions.length },
      error
    );
  }
};
