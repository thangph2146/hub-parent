import { logger } from "@/lib/config/logger";
import { resourceLogger } from "@/lib/config/resource-logger";
import {
  createNotificationForAllAdmins,
  emitNotificationToAllAdminsAfterCreate,
} from "@/features/admin/notifications/server/mutations";
import {
  getActorInfo,
  formatItemNames,
  logNotificationError,
} from "@/features/admin/notifications/server/notification-helpers";
import { NotificationKind } from "@prisma/client";

export const notifySuperAdminsOfRoleAction = async (
  action: "create" | "update" | "delete" | "restore" | "hard-delete",
  actorId: string,
  role: { id: string; name: string; displayName: string },
  changes?: {
    name?: { old: string; new: string };
    displayName?: { old: string; new: string };
    description?: { old: string | null; new: string | null };
    permissions?: { old: string[]; new: string[] };
    isActive?: { old: boolean; new: boolean };
  }
) => {
  try {
    logger.debug("[notifySuperAdmins] Starting role notification", {
      action,
      actorId,
      roleId: role.id,
      roleName: role.name,
      hasChanges: !!changes,
      changesKeys: changes ? Object.keys(changes) : [],
    });

    const actor = await getActorInfo(actorId);
    const actorName = actor?.name || actor?.email || "Hệ thống";

    let title = "";
    let description = "";
    const actionUrl = `/admin/roles/${role.id}`;

    switch (action) {
      case "create":
        title = "👤 Vai trò mới được tạo";
        description = `${actorName} đã tạo vai trò "${role.displayName}" (${role.name})`;
        break;
      case "update":
        const changeDescriptions: string[] = [];
        if (changes?.name) {
          changeDescriptions.push(
            `Tên: ${changes.name.old} → ${changes.name.new}`
          );
        }
        if (changes?.displayName) {
          changeDescriptions.push(
            `Tên hiển thị: ${changes.displayName.old} → ${changes.displayName.new}`
          );
        }
        if (changes?.description) {
          changeDescriptions.push(
            `Mô tả: ${changes.description.old || "trống"} → ${
              changes.description.new || "trống"
            }`
          );
        }
        if (changes?.permissions) {
          const oldCount = changes.permissions.old.length;
          const newCount = changes.permissions.new.length;
          changeDescriptions.push(`Quyền: ${oldCount} → ${newCount}`);
        }
        if (changes?.isActive) {
          changeDescriptions.push(
            `Trạng thái: ${changes.isActive.old ? "Hoạt động" : "Tạm khóa"} → ${
              changes.isActive.new ? "Hoạt động" : "Tạm khóa"
            }`
          );
        }
        title = "✏️ Vai trò được cập nhật";
        description = `${actorName} đã cập nhật vai trò "${role.displayName}"${
          changeDescriptions.length > 0
            ? `\nThay đổi: ${changeDescriptions.join(", ")}`
            : ""
        }`;
        break;
      case "delete":
        title = "🗑️ Vai trò bị xóa";
        description = `${actorName} đã xóa vai trò "${role.displayName}"`;
        break;
      case "restore":
        title = "♻️ Vai trò được khôi phục";
        description = `${actorName} đã khôi phục vai trò "${role.displayName}"`;
        break;
      case "hard-delete":
        title = "⚠️ Vai trò bị xóa vĩnh viễn";
        description = `${actorName} đã xóa vĩnh viễn vai trò "${role.displayName}"`;
        break;
    }

    logger.debug("[notifySuperAdmins] Creating notifications in DB", {
      title,
      description,
      actionUrl,
      action,
    });
    const result = await createNotificationForAllAdmins(
      title,
      description,
      actionUrl,
      NotificationKind.SYSTEM,
      {
        type: `role_${action}`,
        actorId,
        actorName: actor?.name || actor?.email,
        actorEmail: actor?.email,
        roleId: role.id,
        roleName: role.name,
        roleDisplayName: role.displayName,
        ...(changes && { changes }),
        timestamp: new Date().toISOString(),
      }
    );
    logger.debug("[notifyAllAdmins] Notifications created", {
      count: result.count,
      action,
    });

    // Emit socket event nếu có socket server
    if (result.count > 0) {
      await emitNotificationToAllAdminsAfterCreate(
        title,
        description,
        actionUrl,
        NotificationKind.SYSTEM,
        {
          type: `role_${action}`,
          actorId,
          actorName: actor?.name || actor?.email,
          actorEmail: actor?.email,
          roleId: role.id,
          roleName: role.name,
          roleDisplayName: role.displayName,
          ...(changes && { changes }),
          timestamp: new Date().toISOString(),
        }
      );
    }
  } catch (error) {
    logger.error(
      "[notifications] Failed to notify super admins of role action",
      error as Error
    );
  }
};

const formatRoleNames = (
  roles: Array<{ displayName: string }>,
  maxNames = 3
): string => {
  return formatItemNames(
    roles,
    (r) => `"${r.displayName}"`,
    maxNames,
    "vai trò"
  );
};

export const notifySuperAdminsOfBulkRoleAction = async (
  action: "delete" | "restore" | "hard-delete",
  actorId: string,
  count: number,
  roles?: Array<{ displayName: string }>
) => {
  const startTime = Date.now();

  resourceLogger.actionFlow({
    resource: "roles",
    action:
      action === "delete"
        ? "bulk-delete"
        : action === "restore"
        ? "bulk-restore"
        : "bulk-hard-delete",
    step: "start",
    metadata: { count, roleCount: roles?.length || 0, actorId },
  });

  try {
    const actor = await getActorInfo(actorId);
    const actorName = actor?.name || actor?.email || "Hệ thống";

    let title = "";
    let description = "";

    // Format role names - hiển thị tối đa 3 tên đầu tiên
    const namesText =
      roles && roles.length > 0 ? formatRoleNames(roles, 3) : "";

    switch (action) {
      case "delete":
        title = `🗑️ ${count} Vai trò bị xóa`;
        description = namesText
          ? `${actorName} đã xóa ${count} vai trò: ${namesText}`
          : `${actorName} đã xóa ${count} vai trò`;
        break;
      case "restore":
        title = `♻️ ${count} Vai trò được khôi phục`;
        description = namesText
          ? `${actorName} đã khôi phục ${count} vai trò: ${namesText}`
          : `${actorName} đã khôi phục ${count} vai trò`;
        break;
      case "hard-delete":
        title = `⚠️ ${count} Vai trò bị xóa vĩnh viễn`;
        description = namesText
          ? `${actorName} đã xóa vĩnh viễn ${count} vai trò: ${namesText}`
          : `${actorName} đã xóa vĩnh viễn ${count} vai trò`;
        break;
    }

    const actionUrl = `/admin/roles`;

    const result = await createNotificationForAllAdmins(
      title,
      description,
      actionUrl,
      NotificationKind.SYSTEM,
      {
        type: `role_bulk_${action}`,
        actorId,
        actorName: actor?.name || actor?.email,
        actorEmail: actor?.email,
        count,
        roleNames: roles?.map((r) => r.displayName) || [],
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
          type: `role_bulk_${action}`,
          actorId,
          actorName: actor?.name || actor?.email,
          actorEmail: actor?.email,
          count,
          roleNames: roles?.map((r) => r.displayName) || [],
          timestamp: new Date().toISOString(),
        }
      );
    }

    resourceLogger.actionFlow({
      resource: "roles",
      action:
        action === "delete"
          ? "bulk-delete"
          : action === "restore"
          ? "bulk-restore"
          : "bulk-hard-delete",
      step: "success",
      duration: Date.now() - startTime,
      metadata: { count, roleCount: roles?.length || 0 },
    });
  } catch (error) {
    logNotificationError(
      "roles",
      action === "delete"
        ? "bulk-delete"
        : action === "restore"
        ? "bulk-restore"
        : "bulk-hard-delete",
      error as Record<string, unknown>,
      { count, roleCount: roles?.length || 0 }
    );
  }
};
