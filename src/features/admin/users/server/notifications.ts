import { prisma } from "@/lib/database";
import { resourceLogger } from "@/lib/config";
import {
  createNotificationForAllAdmins,
  emitNotificationToAllAdminsAfterCreate,
} from "@/features/admin/notifications/server/mutations";
import { NotificationKind } from "@prisma/client";
import { logNotificationError, formatItemNames } from "@/features/admin/notifications/server/notification-helpers";

const getActorInfo = async (actorId: string) => {
  const actor = await prisma.user.findUnique({
    where: { id: actorId },
    select: { id: true, email: true, name: true },
  });
  return actor;
};

const formatUserNames = (
  users: Array<{ name: string | null; email: string }>,
  maxNames = 3
): string => {
  return formatItemNames(
    users,
    (u) => u.name || u.email,
    maxNames,
    "người dùng"
  );
};

export const notifySuperAdminsOfUserAction = async (
  action: "create" | "update" | "delete" | "restore" | "hard-delete",
  actorId: string,
  targetUser: { id: string; email: string; name: string | null },
  changes?: {
    email?: { old: string; new: string };
    isActive?: { old: boolean; new: boolean };
    roles?: { old: string[]; new: string[] };
  }
): Promise<void> => {
  try {
    const actor = await getActorInfo(actorId);
    const actorName = actor?.name || actor?.email || "Hệ thống";
    const targetUserName = targetUser.name || targetUser.email;

    let title = "";
    let description = "";
    const actionUrl = `/admin/users/${targetUser.id}`;

    switch (action) {
      case "create":
        title = "👤 Người dùng mới được tạo";
        description = `${actorName} đã tạo người dùng mới: ${targetUserName} (${targetUser.email})`;
        break;
      case "update":
        const changeDescriptions: string[] = [];
        if (changes?.email) {
          changeDescriptions.push(
            `Email: ${changes.email.old} → ${changes.email.new}`
          );
        }
        if (changes?.isActive !== undefined) {
          changeDescriptions.push(
            `Trạng thái: ${changes.isActive.old ? "Hoạt động" : "Tạm khóa"} → ${
              changes.isActive.new ? "Hoạt động" : "Tạm khóa"
            }`
          );
        }
        if (changes?.roles) {
          changeDescriptions.push(
            `Vai trò: ${changes.roles.old.join(", ") || "Không có"} → ${
              changes.roles.new.join(", ") || "Không có"
            }`
          );
        }
        title = "✏️ Người dùng được cập nhật";
        description = `${actorName} đã cập nhật người dùng: ${targetUserName} (${
          targetUser.email
        })${
          changeDescriptions.length > 0
            ? `\nThay đổi: ${changeDescriptions.join(", ")}`
            : ""
        }`;
        break;
      case "delete":
        title = "🗑️ Người dùng bị xóa";
        description = `${actorName} đã xóa người dùng: ${targetUserName} (${targetUser.email})`;
        break;
      case "restore":
        title = "♻️ Người dùng được khôi phục";
        description = `${actorName} đã khôi phục người dùng: ${targetUserName} (${targetUser.email})`;
        break;
      case "hard-delete":
        title = "⚠️ Người dùng bị xóa vĩnh viễn";
        description = `${actorName} đã xóa vĩnh viễn người dùng: ${targetUserName} (${targetUser.email})`;
        break;
    }

    // Tạo notifications trong DB cho tất cả admin
    const result = await createNotificationForAllAdmins(
      title,
      description,
      actionUrl,
      NotificationKind.SYSTEM,
      {
        type: `user_${action}`,
        actorId,
        actorName: actor?.name || actor?.email,
        actorEmail: actor?.email,
        targetUserId: targetUser.id,
        targetUserName,
        targetUserEmail: targetUser.email,
        changes,
        timestamp: new Date().toISOString(),
      }
    );

    // Emit socket event nếu có socket server
    if (result.count > 0) {
      await emitNotificationToAllAdminsAfterCreate(
        title,
        description,
        actionUrl,
        NotificationKind.SYSTEM,
        {
          type: `user_${action}`,
          actorId,
          actorName: actor?.name || actor?.email,
          actorEmail: actor?.email,
          targetUserId: targetUser.id,
          targetUserName,
          targetUserEmail: targetUser.email,
          changes,
          timestamp: new Date().toISOString(),
        }
      );
    }
  } catch (error) {
    logNotificationError(
      "users",
      action === "create"
        ? "create"
        : action === "update"
        ? "update"
        : action === "delete"
        ? "delete"
        : action === "restore"
        ? "restore"
        : "hard-delete",
      error as Record<string, unknown>,
      { userId: targetUser.id }
    );
  }
};

export const notifySuperAdminsOfBulkUserAction = async (
  action: "delete" | "restore" | "hard-delete",
  actorId: string,
  count: number,
  users?: Array<{ name: string | null; email: string }>
) => {
  const startTime = Date.now();

  resourceLogger.actionFlow({
    resource: "users",
    action:
      action === "delete"
        ? "bulk-delete"
        : action === "restore"
        ? "bulk-restore"
        : "bulk-hard-delete",
    step: "start",
    metadata: { count, userCount: users?.length || 0, actorId },
  });

  try {
    const actor = await getActorInfo(actorId);
    const actorName = actor?.name || actor?.email || "Hệ thống";

    let title = "";
    let description = "";

    // Format user names - hiển thị tối đa 3 tên đầu tiên để rút gọn notification
    const namesText =
      users && users.length > 0 ? formatUserNames(users, 3) : "";

    switch (action) {
      case "delete":
        title = "🗑️ Đã xóa nhiều người dùng";
        description = namesText
          ? `${actorName} đã xóa ${count} người dùng: ${namesText}`
          : `${actorName} đã xóa ${count} người dùng`;
        break;
      case "restore":
        title = "♻️ Đã khôi phục nhiều người dùng";
        description = namesText
          ? `${actorName} đã khôi phục ${count} người dùng: ${namesText}`
          : `${actorName} đã khôi phục ${count} người dùng`;
        break;
      case "hard-delete":
        title = "⚠️ Đã xóa vĩnh viễn nhiều người dùng";
        description = namesText
          ? `${actorName} đã xóa vĩnh viễn ${count} người dùng: ${namesText}`
          : `${actorName} đã xóa vĩnh viễn ${count} người dùng`;
        break;
    }

    const actionUrl = `/admin/users`;

    const result = await createNotificationForAllAdmins(
      title,
      description,
      actionUrl,
      NotificationKind.SYSTEM,
      {
        type: `user_bulk_${action}`,
        actorId,
        actorName: actor?.name || actor?.email,
        actorEmail: actor?.email,
        count,
        userEmails: users?.map((u) => u.email) || [],
        timestamp: new Date().toISOString(),
      }
    );

    // Emit socket event nếu có socket server
    if (result.count > 0) {
      await emitNotificationToAllAdminsAfterCreate(
        title,
        description,
        actionUrl,
        NotificationKind.SYSTEM,
        {
          type: `user_bulk_${action}`,
          actorId,
          actorName: actor?.name || actor?.email,
          actorEmail: actor?.email,
          count,
          userEmails: users?.map((u) => u.email) || [],
          timestamp: new Date().toISOString(),
        }
      );
    }

    resourceLogger.actionFlow({
      resource: "users",
      action:
        action === "delete"
          ? "bulk-delete"
          : action === "restore"
          ? "bulk-restore"
          : "bulk-hard-delete",
      step: "success",
      duration: Date.now() - startTime,
      metadata: { count, userCount: users?.length || 0 },
    });
  } catch (error) {
    logNotificationError(
      "users",
      action === "delete"
        ? "bulk-delete"
        : action === "restore"
        ? "bulk-restore"
        : "bulk-hard-delete",
      error as Record<string, unknown>,
      { count }
    );
  }
};
