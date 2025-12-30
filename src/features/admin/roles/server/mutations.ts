"use server";

import type { Prisma } from "@prisma/client";
import { PERMISSIONS, canPerformAnyAction } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { mapRoleRecord, type ListedRole } from "./queries";
import {
  CreateRoleSchema,
  UpdateRoleSchema,
  type CreateRoleInput,
  type UpdateRoleInput,
} from "./schemas";
import {
  notifySuperAdminsOfRoleAction,
  notifySuperAdminsOfBulkRoleAction,
} from "./notifications";
import {
  ApplicationError,
  ForbiddenError,
  NotFoundError,
  ensurePermission,
  logTableStatusAfterMutation,
  logActionFlow,
  logDetailAction,
  type AuthContext,
} from "@/features/admin/resources/server";
import type { BulkActionResult } from "@/features/admin/resources/types";
import { emitRoleUpsert, emitRoleRemove } from "./events";

// Re-export for backward compatibility with API routes
export { ApplicationError, ForbiddenError, NotFoundError, type AuthContext, type BulkActionResult }

export const createRole = async (
  ctx: AuthContext,
  input: CreateRoleInput
): Promise<ListedRole> => {
  const startTime = Date.now();

  logActionFlow("roles", "create", "start", {
    actorId: ctx.actorId,
    input: { name: input.name, displayName: input.displayName },
  });
  ensurePermission(ctx, PERMISSIONS.ROLES_CREATE, PERMISSIONS.ROLES_MANAGE);

  const validatedInput = CreateRoleSchema.parse(input);

  const existing = await prisma.role.findUnique({
    where: { name: validatedInput.name.trim() },
  });
  if (existing) {
    logActionFlow("roles", "create", "error", {
      error: "Tên vai trò đã tồn tại",
      name: validatedInput.name.trim(),
    });
    throw new ApplicationError("Tên vai trò đã tồn tại", 400);
  }

  const role = await prisma.role.create({
    data: {
      name: validatedInput.name.trim(),
      displayName: validatedInput.displayName.trim(),
      description: validatedInput.description?.trim() || null,
      permissions: validatedInput.permissions || [],
      isActive: validatedInput.isActive ?? true,
    },
  });

  const sanitized = mapRoleRecord(role);

  await emitRoleUpsert(sanitized.id, null);

  await notifySuperAdminsOfRoleAction("create", ctx.actorId, {
    id: sanitized.id,
    name: sanitized.name,
    displayName: sanitized.displayName,
  });

  logActionFlow(
    "roles",
    "create",
    "success",
    {
      roleId: sanitized.id,
      roleName: sanitized.name,
      roleDisplayName: sanitized.displayName,
    },
    startTime
  );
  logDetailAction(
    "roles",
    "create",
    sanitized.id,
    sanitized as unknown as Record<string, unknown>
  );

  return sanitized;
};

export const updateRole = async (
  ctx: AuthContext,
  id: string,
  input: UpdateRoleInput
): Promise<ListedRole> => {
  const startTime = Date.now();

  logActionFlow("roles", "update", "start", {
    roleId: id,
    actorId: ctx.actorId,
    input,
  });
  ensurePermission(ctx, PERMISSIONS.ROLES_UPDATE, PERMISSIONS.ROLES_MANAGE);

  if (!id || typeof id !== "string" || id.trim() === "") {
    throw new ApplicationError("ID vai trò không hợp lệ", 400);
  }

  const validatedInput = UpdateRoleSchema.parse(input);
  const existing = await prisma.role.findUnique({ where: { id } });

  if (!existing || existing.deletedAt) {
    throw new NotFoundError("Vai trò không tồn tại");
  }

  const changes: {
    name?: { old: string; new: string };
    displayName?: { old: string; new: string };
    description?: { old: string | null; new: string | null };
    permissions?: { old: string[]; new: string[] };
    isActive?: { old: boolean; new: boolean };
  } = {};
  const updateData: Prisma.RoleUpdateInput = {};

  if (validatedInput.name !== undefined) {
    const trimmedName = validatedInput.name.trim();
    if (trimmedName !== existing.name) {
      if (existing.name === "super_admin") {
        logActionFlow("roles", "update", "error", {
          roleId: id,
          error: "Không thể đổi tên vai trò super_admin",
        });
        throw new ApplicationError(
          "Không thể đổi tên vai trò super_admin",
          400
        );
      }
      const nameExists = await prisma.role.findFirst({
        where: { name: trimmedName, id: { not: id } },
      });
      if (nameExists) {
        logActionFlow("roles", "update", "error", {
          roleId: id,
          error: "Tên vai trò đã tồn tại",
          newName: trimmedName,
        });
        throw new ApplicationError("Tên vai trò đã tồn tại", 400);
      }
      updateData.name = trimmedName;
      changes.name = { old: existing.name, new: trimmedName };
    }
  }

  if (validatedInput.displayName !== undefined) {
    const trimmedDisplayName = validatedInput.displayName.trim();
    if (trimmedDisplayName !== existing.displayName) {
      updateData.displayName = trimmedDisplayName;
      changes.displayName = {
        old: existing.displayName,
        new: trimmedDisplayName,
      };
    }
  }

  if (validatedInput.description !== undefined) {
    const trimmedDescription = validatedInput.description?.trim() || null;
    if (trimmedDescription !== existing.description) {
      updateData.description = trimmedDescription;
      changes.description = {
        old: existing.description,
        new: trimmedDescription,
      };
    }
  }

  if (validatedInput.permissions !== undefined) {
    const oldPerms = existing.permissions.sort();
    const newPerms = validatedInput.permissions.sort();
    if (JSON.stringify(oldPerms) !== JSON.stringify(newPerms)) {
      updateData.permissions = validatedInput.permissions;
      changes.permissions = {
        old: existing.permissions,
        new: validatedInput.permissions,
      };
    }
  }

  if (
    validatedInput.isActive !== undefined &&
    validatedInput.isActive !== existing.isActive
  ) {
    updateData.isActive = validatedInput.isActive;
    changes.isActive = { old: existing.isActive, new: validatedInput.isActive };
  }

  if (Object.keys(updateData).length === 0) {
    const sanitized = mapRoleRecord(existing);
    logActionFlow(
      "roles",
      "update",
      "success",
      {
        roleId: sanitized.id,
        roleName: sanitized.name,
        changes: {},
        noChanges: true,
      },
      startTime
    );
    return sanitized;
  }

  const updated = await prisma.role.update({
    where: { id },
    data: { ...updateData, updatedAt: new Date() },
  });

  const sanitized = mapRoleRecord(updated);
  const previousStatus: "active" | "deleted" | null = existing.deletedAt
    ? "deleted"
    : "active";

  await emitRoleUpsert(sanitized.id, previousStatus);

  await notifySuperAdminsOfRoleAction(
    "update",
    ctx.actorId,
    {
      id: sanitized.id,
      name: sanitized.name,
      displayName: sanitized.displayName,
    },
    Object.keys(changes).length > 0 ? changes : undefined
  );

  logActionFlow(
    "roles",
    "update",
    "success",
    { roleId: sanitized.id, roleName: sanitized.name, changes },
    startTime
  );
  logDetailAction("roles", "update", sanitized.id, {
    ...sanitized,
    changes,
  } as unknown as Record<string, unknown>);

  return sanitized;
};

export const softDeleteRole = async (
  ctx: AuthContext,
  id: string
): Promise<void> => {
  const startTime = Date.now();

  logActionFlow("roles", "delete", "start", {
    roleId: id,
    actorId: ctx.actorId,
  });
  ensurePermission(ctx, PERMISSIONS.ROLES_DELETE, PERMISSIONS.ROLES_MANAGE);

  const role = await prisma.role.findUnique({ where: { id } });
  if (!role || role.deletedAt) {
    logActionFlow("roles", "delete", "error", {
      roleId: id,
      error: "Vai trò không tồn tại",
    });
    throw new NotFoundError("Vai trò không tồn tại");
  }

  if (role.name === "super_admin") {
    logActionFlow("roles", "delete", "error", {
      roleId: id,
      roleName: role.name,
      error: "Không thể xóa vai trò super_admin",
    });
    throw new ApplicationError("Không thể xóa vai trò super_admin", 400);
  }

  const previousStatus: "active" | "deleted" = role.deletedAt
    ? "deleted"
    : "active";

  await prisma.role.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });

  await logTableStatusAfterMutation({
    resource: "roles",
    action: "delete",
    prismaModel: prisma.role,
    affectedIds: id,
  });

  await emitRoleUpsert(id, previousStatus);

  await notifySuperAdminsOfRoleAction("delete", ctx.actorId, {
    id: role.id,
    name: role.name,
    displayName: role.displayName,
  });

  logActionFlow(
    "roles",
    "delete",
    "success",
    { roleId: id, roleName: role.name, roleDisplayName: role.displayName },
    startTime
  );
};

export const bulkSoftDeleteRoles = async (
  ctx: AuthContext,
  ids: string[]
): Promise<BulkActionResult> => {
  const startTime = Date.now();

  logActionFlow("roles", "bulk-delete", "start", {
    count: ids.length,
    roleIds: ids,
    actorId: ctx.actorId,
  });

  ensurePermission(ctx, PERMISSIONS.ROLES_DELETE, PERMISSIONS.ROLES_MANAGE);

  if (!ids || ids.length === 0) {
    throw new ApplicationError("Danh sách vai trò trống", 400);
  }

  // Lấy thông tin roles trước khi delete để tạo notifications
  // Chỉ tìm các roles đang hoạt động (chưa bị xóa)
  const roles = await prisma.role.findMany({
    where: {
      id: { in: ids },
      deletedAt: null,
    },
    select: { id: true, name: true, displayName: true },
  });

  const foundIds = roles.map((r) => r.id);
  const _notFoundIds = ids.filter((id) => !foundIds.includes(id));

  // Check if any role is super_admin
  const superAdminRole = roles.find((r) => r.name === "super_admin");
  if (superAdminRole) {
    const errorMessage = "Không thể xóa vai trò super_admin";
    logActionFlow("roles", "bulk-delete", "error", {
      requestedCount: ids.length,
      foundCount: roles.length,
      error: errorMessage,
      superAdminRoleId: superAdminRole.id,
    });
    throw new ApplicationError(errorMessage, 400);
  }

  // Nếu không tìm thấy role nào, kiểm tra lý do và trả về error message chi tiết
  if (roles.length === 0) {
    const allRoles = await prisma.role.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, displayName: true, deletedAt: true },
    });
    const alreadyDeletedRoles = allRoles.filter(
      (r) => r.deletedAt !== null && r.deletedAt !== undefined
    );
    const alreadyDeletedCount = alreadyDeletedRoles.length;
    const notFoundCount = ids.length - allRoles.length;

    logActionFlow("roles", "bulk-delete", "start", {
      requestedCount: ids.length,
      foundCount: roles.length,
      allRolesCount: allRoles.length,
      alreadyDeletedCount,
      notFoundCount,
      alreadyDeletedRoleIds: alreadyDeletedRoles.map((r) => r.id),
      alreadyDeletedRoleNames: alreadyDeletedRoles.map((r) => r.displayName),
      notFoundIds: ids.filter((id) => !allRoles.some((r) => r.id === id)),
    });

    let errorMessage = "Không có vai trò nào có thể xóa";
    const parts: string[] = [];
    if (alreadyDeletedCount > 0) {
      const roleNames = alreadyDeletedRoles
        .slice(0, 3)
        .map((r) => `"${r.displayName}"`)
        .join(", ");
      const moreCount =
        alreadyDeletedCount > 3
          ? ` và ${alreadyDeletedCount - 3} vai trò khác`
          : "";
      parts.push(
        `${alreadyDeletedCount} vai trò đã bị xóa trước đó: ${roleNames}${moreCount}`
      );
    }
    if (notFoundCount > 0) {
      parts.push(`${notFoundCount} vai trò không tồn tại`);
    }

    if (parts.length > 0) {
      errorMessage += ` (${parts.join(", ")})`;
    }

    logActionFlow("roles", "bulk-delete", "error", {
      requestedCount: ids.length,
      foundCount: roles.length,
      alreadyDeletedCount,
      notFoundCount,
      error: errorMessage,
    });

    throw new ApplicationError(errorMessage, 400);
  }

  const result = await prisma.role.updateMany({
    where: {
      id: { in: roles.map((role) => role.id) },
      deletedAt: null,
    },
    data: {
      deletedAt: new Date(),
      isActive: false,
    },
  });

  if (result.count > 0) {
    await logTableStatusAfterMutation({
      resource: "roles",
      action: "bulk-delete",
      prismaModel: prisma.role,
      affectedIds: roles.map((role) => role.id),
      affectedCount: result.count,
    });
  }

  // Emit socket events và tạo bulk notification
  if (result.count > 0 && roles.length > 0) {
    // Emit events song song
    const emitPromises = roles.map((role) =>
      emitRoleUpsert(role.id, "active").catch((_error) => {
        return null;
      })
    );
    await Promise.allSettled(emitPromises);

    // Tạo bulk notification với tên records
    await notifySuperAdminsOfBulkRoleAction(
      "delete",
      ctx.actorId,
      result.count,
      roles
    );

    logActionFlow(
      "roles",
      "bulk-delete",
      "success",
      { requestedCount: ids.length, affectedCount: result.count },
      startTime
    );
  }

  return {
    success: true,
    message: `Đã xóa ${result.count} vai trò`,
    affected: result.count,
  };
};

export const restoreRole = async (
  ctx: AuthContext,
  id: string
): Promise<void> => {
  const startTime = Date.now();

  logActionFlow("roles", "restore", "start", {
    roleId: id,
    actorId: ctx.actorId,
  });
  ensurePermission(ctx, PERMISSIONS.ROLES_UPDATE, PERMISSIONS.ROLES_MANAGE);

  const role = await prisma.role.findUnique({ where: { id } });
  if (!role || !role.deletedAt) {
    logActionFlow("roles", "restore", "error", {
      roleId: id,
      error: "Vai trò không tồn tại hoặc chưa bị xóa",
    });
    throw new NotFoundError("Vai trò không tồn tại hoặc chưa bị xóa");
  }

  const previousStatus: "active" | "deleted" = role.deletedAt
    ? "deleted"
    : "active";

  await prisma.role.update({
    where: { id },
    data: { deletedAt: null, isActive: true },
  });

  await logTableStatusAfterMutation({
    resource: "roles",
    action: "restore",
    prismaModel: prisma.role,
    affectedIds: id,
  });

  await emitRoleUpsert(id, previousStatus);

  await notifySuperAdminsOfRoleAction("restore", ctx.actorId, {
    id: role.id,
    name: role.name,
    displayName: role.displayName,
  });

  logActionFlow(
    "roles",
    "restore",
    "success",
    { roleId: id, roleName: role.name, roleDisplayName: role.displayName },
    startTime
  );
};

export const bulkRestoreRoles = async (
  ctx: AuthContext,
  ids: string[]
): Promise<BulkActionResult> => {
  const startTime = Date.now();

  logActionFlow("roles", "bulk-restore", "start", {
    count: ids.length,
    roleIds: ids,
    actorId: ctx.actorId,
  });

  ensurePermission(ctx, PERMISSIONS.ROLES_UPDATE, PERMISSIONS.ROLES_MANAGE);

  if (!ids || ids.length === 0) {
    throw new ApplicationError("Danh sách vai trò trống", 400);
  }

  // Tìm tất cả roles được request để phân loại trạng thái
  // Prisma findMany mặc định KHÔNG filter theo deletedAt, nên sẽ tìm thấy cả soft-deleted và active roles
  // Nhưng KHÔNG tìm thấy hard-deleted roles (đã bị xóa vĩnh viễn khỏi database)
  // Sử dụng findMany mà KHÔNG filter theo deletedAt để tìm được tất cả roles (kể cả đã bị soft delete)
  const allRequestedRoles = await prisma.role.findMany({
    where: {
      id: { in: ids },
      // KHÔNG filter theo deletedAt ở đây để tìm được cả soft-deleted và active roles
    },
    select: {
      id: true,
      deletedAt: true,
      name: true,
      displayName: true,
      createdAt: true,
    },
  });

  // Phân loại roles - sử dụng cách so sánh chính xác hơn
  // deletedAt có thể là Date object hoặc null, cần check cả undefined
  const softDeletedRoles = allRequestedRoles.filter((role) => {
    const isDeleted = role.deletedAt !== null && role.deletedAt !== undefined;
    return isDeleted;
  });
  const activeRoles = allRequestedRoles.filter((role) => {
    const isActive = role.deletedAt === null || role.deletedAt === undefined;
    return isActive;
  });
  const notFoundCount = ids.length - allRequestedRoles.length;
  const foundIds = allRequestedRoles.map((r) => r.id);
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));
  const softDeletedIds = softDeletedRoles.map((r) => r.id);
  const activeIds = activeRoles.map((r) => r.id);

  // Log chi tiết để debug - bao gồm deletedAt values
  logActionFlow("roles", "bulk-restore", "start", {
    requestedCount: ids.length,
    foundCount: allRequestedRoles.length,
    softDeletedCount: softDeletedRoles.length,
    activeCount: activeRoles.length,
    notFoundCount,
    requestedIds: ids,
    foundIds,
    softDeletedIds,
    activeIds,
    notFoundIds,
    // Log chi tiết deletedAt values để debug
    allRequestedRolesDetails: allRequestedRoles.map((r) => ({
      id: r.id,
      name: r.name,
      deletedAt: r.deletedAt,
      deletedAtType: typeof r.deletedAt,
      deletedAtIsNull: r.deletedAt === null,
      deletedAtIsNotNull: r.deletedAt !== null,
    })),
  });

  // Nếu không có role nào đã bị soft delete, throw error với message chi tiết
  if (softDeletedRoles.length === 0) {
    const parts: string[] = [];
    if (activeRoles.length > 0) {
      parts.push(`${activeRoles.length} vai trò đang hoạt động`);
    }
    if (notFoundCount > 0) {
      parts.push(
        `${notFoundCount} vai trò không tồn tại (đã bị xóa vĩnh viễn)`
      );
    }

    const errorMessage =
      parts.length > 0
        ? `Không có vai trò nào để khôi phục (${parts.join(", ")})`
        : `Không tìm thấy vai trò nào để khôi phục`;

    logActionFlow("roles", "bulk-restore", "error", {
      requestedCount: ids.length,
      foundCount: allRequestedRoles.length,
      softDeletedCount: softDeletedRoles.length,
      activeCount: activeRoles.length,
      notFoundCount,
      error: errorMessage,
    });

    throw new ApplicationError(errorMessage, 400);
  }

  // Chỉ restore các roles đã bị soft delete
  const rolesToRestore = softDeletedRoles;
  const result = await prisma.role.updateMany({
    where: {
      id: { in: softDeletedRoles.map((r) => r.id) },
      deletedAt: { not: null },
    },
    data: {
      deletedAt: null,
      isActive: true,
    },
  });

  if (result.count > 0) {
    await logTableStatusAfterMutation({
      resource: "roles",
      action: "bulk-restore",
      prismaModel: prisma.role,
      affectedIds: rolesToRestore.map((r) => r.id),
      affectedCount: result.count,
    });
  }

  // Emit socket events và tạo bulk notification
  if (result.count > 0 && rolesToRestore.length > 0) {
    // Emit events song song
    const emitPromises = rolesToRestore.map((role) =>
      emitRoleUpsert(role.id, "deleted").catch((_error) => {
        return null;
      })
    );
    await Promise.allSettled(emitPromises);

    // Tạo bulk notification với tên records
    await notifySuperAdminsOfBulkRoleAction(
      "restore",
      ctx.actorId,
      result.count,
      rolesToRestore
    );

    logActionFlow(
      "roles",
      "bulk-restore",
      "success",
      { requestedCount: ids.length, affectedCount: result.count },
      startTime
    );
  }

  // Tạo message chi tiết nếu có roles không thể restore
  let message = `Đã khôi phục ${result.count} vai trò`;
  if (result.count < ids.length) {
    const skippedCount = ids.length - result.count;
    const skippedParts: string[] = [];
    if (activeRoles.length > 0) {
      skippedParts.push(`${activeRoles.length} vai trò đang hoạt động`);
    }
    if (notFoundCount > 0) {
      skippedParts.push(`${notFoundCount} vai trò đã bị xóa vĩnh viễn`);
    }
    if (skippedParts.length > 0) {
      message += ` (${skippedCount} vai trò không thể khôi phục: ${skippedParts.join(
        ", "
      )})`;
    }
  }

  return { success: true, message, affected: result.count };
};

export const hardDeleteRole = async (
  ctx: AuthContext,
  id: string
): Promise<void> => {
  const startTime = Date.now();

  logActionFlow("roles", "hard-delete", "start", {
    roleId: id,
    actorId: ctx.actorId,
  });

  if (
    !canPerformAnyAction(ctx.permissions, ctx.roles, [PERMISSIONS.ROLES_MANAGE])
  ) {
    throw new ForbiddenError();
  }

  const role = await prisma.role.findUnique({
    where: { id },
    select: { id: true, name: true, displayName: true, deletedAt: true },
  });

  if (!role) {
    logActionFlow("roles", "hard-delete", "error", {
      roleId: id,
      error: "Vai trò không tồn tại",
    });
    throw new NotFoundError("Vai trò không tồn tại");
  }

  if (role.name === "super_admin") {
    logActionFlow("roles", "hard-delete", "error", {
      roleId: id,
      roleName: role.name,
      error: "Không thể xóa vĩnh viễn vai trò super_admin",
    });
    throw new ApplicationError(
      "Không thể xóa vĩnh viễn vai trò super_admin",
      400
    );
  }

  const previousStatus: "active" | "deleted" = role.deletedAt
    ? "deleted"
    : "active";

  await prisma.role.delete({
    where: { id },
  });

  // Emit socket event for real-time updates
  emitRoleRemove(id, previousStatus);

  // Emit notification realtime
  await notifySuperAdminsOfRoleAction("hard-delete", ctx.actorId, role);

  logActionFlow(
    "roles",
    "hard-delete",
    "success",
    { roleId: id, roleName: role.name, roleDisplayName: role.displayName },
    startTime
  );
};

export const bulkHardDeleteRoles = async (
  ctx: AuthContext,
  ids: string[]
): Promise<BulkActionResult> => {
  const startTime = Date.now();

  logActionFlow("roles", "bulk-hard-delete", "start", {
    count: ids.length,
    roleIds: ids,
    actorId: ctx.actorId,
  });

  if (
    !canPerformAnyAction(ctx.permissions, ctx.roles, [PERMISSIONS.ROLES_MANAGE])
  ) {
    throw new ForbiddenError();
  }

  if (!ids || ids.length === 0) {
    throw new ApplicationError("Danh sách vai trò trống", 400);
  }

  // Lấy thông tin roles trước khi delete để tạo notifications
  const roles = await prisma.role.findMany({
    where: {
      id: { in: ids },
    },
    select: { id: true, name: true, displayName: true, deletedAt: true },
  });

  const foundIds = roles.map((r) => r.id);
  const _notFoundIds = ids.filter((id) => !foundIds.includes(id));

  // Log để debug với đầy đủ thông tin
  logActionFlow("roles", "bulk-hard-delete", "start", {
    requestedCount: ids.length,
    foundCount: roles.length,
    notFoundCount: _notFoundIds.length,
    requestedIds: ids,
    foundIds,
    _notFoundIds,
  });

  // Check if any role is super_admin
  const superAdminRole = roles.find((r) => r.name === "super_admin");
  if (superAdminRole) {
    const errorMessage = "Không thể xóa vĩnh viễn vai trò super_admin";
    logActionFlow("roles", "bulk-hard-delete", "error", {
      requestedCount: ids.length,
      foundCount: roles.length,
      error: errorMessage,
      superAdminRoleId: superAdminRole.id,
    });
    throw new ApplicationError(errorMessage, 400);
  }

  if (roles.length === 0) {
    const errorMessage = `Không tìm thấy vai trò nào để xóa vĩnh viễn`;
    logActionFlow("roles", "bulk-hard-delete", "error", {
      requestedCount: ids.length,
      foundCount: roles.length,
      notFoundCount: _notFoundIds.length,
      error: errorMessage,
    });
    throw new ApplicationError(errorMessage, 400);
  }

  const result = await prisma.role.deleteMany({
    where: {
      id: { in: roles.map((role) => role.id) },
    },
  });

  // Emit socket events và tạo bulk notification
  if (result.count > 0 && roles.length > 0) {
    // Emit events (emitRoleRemove trả về void, không phải Promise)
    roles.forEach((role) => {
      const previousStatus: "active" | "deleted" = role.deletedAt
        ? "deleted"
        : "active";
      try {
        emitRoleRemove(role.id, previousStatus);
      } catch {}
    });

    // Tạo bulk notification với tên records
    await notifySuperAdminsOfBulkRoleAction(
      "hard-delete",
      ctx.actorId,
      result.count,
      roles
    );

    logActionFlow(
      "roles",
      "bulk-hard-delete",
      "success",
      { requestedCount: ids.length, affectedCount: result.count },
      startTime
    );
  }

  return {
    success: true,
    message: `Đã xóa vĩnh viễn ${result.count} vai trò`,
    affected: result.count,
  };
};
