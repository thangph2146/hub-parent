"use server";

import bcrypt from "bcryptjs";
import type { Prisma } from "@prisma/client";
import { PERMISSIONS, canPerformAnyAction } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { mapUserRecord, type ListedUser, type UserWithRoles } from "./queries";
import {
  notifySuperAdminsOfUserAction,
  notifySuperAdminsOfBulkUserAction,
} from "./notifications";
import {
  ApplicationError,
  ForbiddenError,
  NotFoundError,
  ensurePermission,
  logTableStatusAfterMutation,
  logActionFlow,
  logDetailAction,
  validateBulkIds,
  type AuthContext,
} from "@/features/admin/resources/server";
import type { BulkActionResult } from "@/features/admin/resources/types";
import {
  emitUserUpsert,
  emitUserRemove,
  emitBatchUserUpsert,
  type UserStatus,
} from "./events";
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserSchema,
  type UpdateUserSchema,
} from "./validation";
import { PROTECTED_SUPER_ADMIN_EMAIL } from "../constants";

export { ApplicationError, ForbiddenError, NotFoundError, type AuthContext };
export type { BulkActionResult };

const sanitizeUser = (user: UserWithRoles): ListedUser => mapUserRecord(user);

const mapUserForNotification = (user: {
  id: string;
  email: string;
  name: string | null;
}) => ({
  id: user.id,
  email: user.email,
  name: user.name,
});


const checkSuperAdmin = (email: string, action: string) => {
  if (email === PROTECTED_SUPER_ADMIN_EMAIL) {
    throw new ForbiddenError(`Không thể ${action} tài khoản super admin`);
  }
};

export const createUser = async (
  ctx: AuthContext,
  input: CreateUserSchema
): Promise<ListedUser> => {
  ensurePermission(ctx, PERMISSIONS.USERS_CREATE, PERMISSIONS.USERS_MANAGE);

  const validatedInput = createUserSchema.parse(input);
  const existing = await prisma.user.findUnique({
    where: { email: validatedInput.email },
  });
  if (existing) throw new ApplicationError("Email đã tồn tại", 400);

  const passwordHash = await bcrypt.hash(validatedInput.password, 10);

  const user = await prisma.user.create({
    data: {
      email: validatedInput.email,
      name: validatedInput.name ?? null,
      password: passwordHash,
      isActive: validatedInput.isActive ?? true,
      bio: validatedInput.bio,
      phone: validatedInput.phone,
      address: validatedInput.address,
      userRoles: validatedInput.roleIds?.length
        ? { create: validatedInput.roleIds.map((roleId) => ({ roleId })) }
        : undefined,
    },
    include: {
      userRoles: {
        include: {
          role: {
            select: { id: true, name: true, displayName: true },
          },
        },
      },
    },
  });

  await notifySuperAdminsOfUserAction(
    "create",
    ctx.actorId,
    mapUserForNotification(user)
  );
  await emitUserUpsert(user.id, null);

  const sanitized = sanitizeUser(user);
  const startTime = Date.now();
  logActionFlow(
    "users",
    "create",
    "success",
    { userId: user.id, userEmail: user.email, userName: user.name },
    startTime
  );
  logDetailAction(
    "users",
    "create",
    user.id,
    sanitized as unknown as Record<string, unknown>
  );

  return sanitized;
};

export const updateUser = async (
  ctx: AuthContext,
  id: string,
  input: UpdateUserSchema
): Promise<ListedUser> => {
  ensurePermission(ctx, PERMISSIONS.USERS_UPDATE, PERMISSIONS.USERS_MANAGE);

  const startTime = Date.now();
  logActionFlow("users", "update", "init", { userId: id });

  if (!id?.trim())
    throw new ApplicationError("ID người dùng không hợp lệ", 400);

  const validatedInput = updateUserSchema.parse(input);
  logActionFlow(
    "users",
    "update",
    "start",
    { userId: id, changes: Object.keys(validatedInput) },
    startTime
  );

  const existing = await prisma.user.findUnique({
    where: { id },
    include: { userRoles: { include: { role: true } } },
  });

  if (!existing || existing.deletedAt)
    throw new NotFoundError("User không tồn tại");

  if (
    validatedInput.email !== undefined &&
    validatedInput.email !== existing.email
  ) {
    const emailExists = await prisma.user.findUnique({
      where: { email: validatedInput.email },
    });
    if (emailExists) throw new ApplicationError("Email đã được sử dụng", 400);
  }

  if (validatedInput.roleIds?.length) {
    const roles = await prisma.role.findMany({
      where: { id: { in: validatedInput.roleIds } },
      select: { id: true },
    });
    if (roles.length !== validatedInput.roleIds.length)
      throw new ApplicationError("Một số vai trò không tồn tại", 400);
  }

  const updateData: Prisma.UserUpdateInput = {};

  // Track changes để tạo notification
  const changes: {
    email?: { old: string; new: string };
    isActive?: { old: boolean; new: boolean };
    roles?: { old: string[]; new: string[] };
  } = {};

  if (validatedInput.email !== undefined) {
    const newEmail = validatedInput.email.trim();
    if (newEmail !== existing.email) {
      changes.email = { old: existing.email, new: newEmail };
      updateData.email = newEmail;
    }
  }
  if (validatedInput.name !== undefined)
    updateData.name = validatedInput.name?.trim() || null;
  if (validatedInput.isActive !== undefined) {
    if (
      existing.email === PROTECTED_SUPER_ADMIN_EMAIL &&
      validatedInput.isActive === false
    ) {
      throw new ForbiddenError("Không thể vô hiệu hóa tài khoản super admin");
    }
    if (validatedInput.isActive !== existing.isActive) {
      changes.isActive = {
        old: existing.isActive,
        new: validatedInput.isActive,
      };
    }
    updateData.isActive = validatedInput.isActive;
  }
  if (validatedInput.bio !== undefined)
    updateData.bio = validatedInput.bio?.trim() || null;
  if (validatedInput.phone !== undefined)
    updateData.phone = validatedInput.phone?.trim() || null;
  if (validatedInput.address !== undefined)
    updateData.address = validatedInput.address?.trim() || null;
  if (validatedInput.password && validatedInput.password.trim() !== "") {
    updateData.password = await bcrypt.hash(validatedInput.password, 10);
  }

  const shouldUpdateRoles = Array.isArray(validatedInput.roleIds);

  // Track role changes
  if (shouldUpdateRoles) {
    const oldRoleNames = existing.userRoles.map((ur) => ur.role.name).sort();
    // Get new role names
    const newRoleIds = validatedInput.roleIds || [];
    const newRoles = await prisma.role.findMany({
      where: { id: { in: newRoleIds } },
      select: { name: true },
    });
    const newRoleNames = newRoles.map((r) => r.name).sort();

    if (JSON.stringify(oldRoleNames) !== JSON.stringify(newRoleNames)) {
      changes.roles = { old: oldRoleNames, new: newRoleNames };
    }
  }

  const user = await prisma.$transaction(async (tx) => {
    if (Object.keys(updateData).length > 0) {
      await tx.user.update({
        where: { id },
        data: updateData,
      });
    }

    if (shouldUpdateRoles) {
      await tx.userRole.deleteMany({
        where: { userId: id },
      });

      if (validatedInput.roleIds && validatedInput.roleIds.length > 0) {
        await tx.userRole.createMany({
          data: validatedInput.roleIds.map((roleId) => ({
            userId: id,
            roleId,
          })),
        });
      }
    }

    const updated = await tx.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                displayName: true,
              },
            },
          },
        },
      },
    });

    if (!updated) {
      throw new NotFoundError("User không tồn tại");
    }

    return updated;
  });

  if (Object.keys(changes).length > 0) {
    await notifySuperAdminsOfUserAction(
      "update",
      ctx.actorId,
      mapUserForNotification(user),
      changes
    );
  }

  const previousStatus: "active" | "deleted" = existing.deletedAt
    ? "deleted"
    : "active";
  await emitUserUpsert(user.id, previousStatus);

  const sanitized = sanitizeUser(user);
  logActionFlow(
    "users",
    "update",
    "success",
    { userId: user.id, userEmail: user.email, changes: Object.keys(changes) },
    startTime
  );
  logDetailAction("users", "update", user.id, {
    ...sanitized,
    changes,
  } as unknown as Record<string, unknown>);

  return sanitized;
};

export const softDeleteUser = async (
  ctx: AuthContext,
  id: string
): Promise<void> => {
  ensurePermission(ctx, PERMISSIONS.USERS_DELETE, PERMISSIONS.USERS_MANAGE);

  const startTime = Date.now();
  logActionFlow("users", "delete", "init", { userId: id });

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.deletedAt) throw new NotFoundError("User không tồn tại");
  checkSuperAdmin(user.email, "xóa");

  await prisma.user.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });
  await logTableStatusAfterMutation({
    resource: "users",
    action: "delete",
    prismaModel: prisma.user,
    affectedIds: id,
  });
  await notifySuperAdminsOfUserAction(
    "delete",
    ctx.actorId,
    mapUserForNotification(user)
  );
  await emitUserUpsert(id, "active");

  logActionFlow(
    "users",
    "delete",
    "success",
    { userId: id, userEmail: user.email },
    startTime
  );
  logDetailAction("users", "delete", id, {
    id: user.id,
    email: user.email,
    name: user.name,
  } as unknown as Record<string, unknown>);
};

export const bulkSoftDeleteUsers = async (
  ctx: AuthContext,
  ids: string[]
): Promise<BulkActionResult> => {
  ensurePermission(ctx, PERMISSIONS.USERS_DELETE, PERMISSIONS.USERS_MANAGE);
  validateBulkIds(ids, "người dùng");

  const users = await prisma.user.findMany({
    where: { id: { in: ids }, deletedAt: null },
    select: { id: true, email: true, name: true },
  });

  const startTime = Date.now();
  logActionFlow("users", "bulk-delete", "start", {
    requestedCount: ids.length,
    foundCount: users.length,
  });

  const superAdminUser = users.find(
    (u) => u.email === PROTECTED_SUPER_ADMIN_EMAIL
  );
  if (superAdminUser)
    throw new ForbiddenError("Không thể xóa tài khoản super admin");

  const filteredIds = users
    .filter((u) => u.email !== PROTECTED_SUPER_ADMIN_EMAIL)
    .map((u) => u.id);

  if (filteredIds.length === 0) {
    const alreadyDeletedCount = ids.length - users.length;
    const superAdminCount = users.filter(
      (u) => u.email === PROTECTED_SUPER_ADMIN_EMAIL
    ).length;
    let errorMessage = "Không có người dùng nào có thể xóa";
    if (alreadyDeletedCount > 0)
      errorMessage += `. ${alreadyDeletedCount} người dùng đã bị xóa trước đó`;
    if (superAdminCount > 0)
      errorMessage += `. ${superAdminCount} người dùng là super admin và không thể xóa`;
    if (users.length === 0 && ids.length > 0)
      errorMessage = `Không tìm thấy người dùng nào trong danh sách (có thể đã bị xóa hoặc không tồn tại)`;

    logActionFlow(
      "users",
      "bulk-delete",
      "error",
      {
        requestedCount: ids.length,
        foundCount: users.length,
        alreadyDeletedCount,
        superAdminCount,
        error: errorMessage,
      },
      startTime
    );
    throw new ApplicationError(errorMessage, 400);
  }

  const result = await prisma.user.updateMany({
    where: { id: { in: filteredIds }, deletedAt: null },
    data: { deletedAt: new Date(), isActive: false },
  });

  if (result.count > 0) {
    await logTableStatusAfterMutation({
      resource: "users",
      action: "bulk-delete",
      prismaModel: prisma.user,
      affectedIds: filteredIds,
      affectedCount: result.count,
    });

    const deletableUsers = users.filter(
      (u) => u.email !== PROTECTED_SUPER_ADMIN_EMAIL
    );
    try {
      await emitBatchUserUpsert(
        deletableUsers.map((u) => u.id),
        "active"
      );
    } catch (error) {
      logActionFlow("users", "bulk-delete", "error", {
        error: error instanceof Error ? error.message : String(error),
        count: result.count,
      });
    }

    try {
      await notifySuperAdminsOfBulkUserAction(
        "delete",
        ctx.actorId,
        result.count,
        deletableUsers
      );
    } catch (error) {
      logActionFlow("users", "bulk-delete", "error", {
        error: error instanceof Error ? error.message : String(error),
        notificationError: true,
      });
    }

    logActionFlow(
      "users",
      "bulk-delete",
      "success",
      { requestedCount: ids.length, affectedCount: result.count },
      startTime
    );
  }

  return {
    success: true,
    message: `Đã xóa ${result.count} người dùng`,
    affected: result.count,
  };
};

export const restoreUser = async (
  ctx: AuthContext,
  id: string
): Promise<void> => {
  ensurePermission(ctx, PERMISSIONS.USERS_UPDATE, PERMISSIONS.USERS_MANAGE);

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || !user.deletedAt)
    throw new NotFoundError("User không tồn tại hoặc chưa bị xóa");

  await prisma.user.update({
    where: { id },
    data: { deletedAt: null, isActive: true },
  });

  const startTime = Date.now();
  logActionFlow("users", "restore", "init", { userId: id });

  await logTableStatusAfterMutation({
    resource: "users",
    action: "restore",
    prismaModel: prisma.user,
    affectedIds: id,
  });
  await notifySuperAdminsOfUserAction(
    "restore",
    ctx.actorId,
    mapUserForNotification(user)
  );
  await emitUserUpsert(id, "deleted");

  logActionFlow(
    "users",
    "restore",
    "success",
    { userId: user.id, userEmail: user.email },
    startTime
  );
  logDetailAction("users", "restore", id, {
    id: user.id,
    email: user.email,
    name: user.name,
  } as unknown as Record<string, unknown>);
};

export const bulkRestoreUsers = async (
  ctx: AuthContext,
  ids: string[]
): Promise<BulkActionResult> => {
  ensurePermission(ctx, PERMISSIONS.USERS_UPDATE, PERMISSIONS.USERS_MANAGE);
  validateBulkIds(ids, "người dùng");

  const users = await prisma.user.findMany({
    where: { id: { in: ids }, deletedAt: { not: null } },
    select: { id: true, email: true, name: true },
  });

  const startTime = Date.now();
  logActionFlow("users", "bulk-restore", "start", {
    requestedCount: ids.length,
    foundCount: users.length,
  });

  if (users.length === 0) {
    const allUsers = await prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, email: true, deletedAt: true },
    });
    const alreadyActiveCount = allUsers.filter(
      (u) => u.deletedAt === null
    ).length;
    const notFoundCount = ids.length - allUsers.length;
    let errorMessage = "Không có người dùng nào có thể khôi phục";
    if (alreadyActiveCount > 0)
      errorMessage += `. ${alreadyActiveCount} người dùng đang ở trạng thái hoạt động`;
    if (notFoundCount > 0)
      errorMessage += `. ${notFoundCount} người dùng không tồn tại`;

    logActionFlow(
      "users",
      "bulk-restore",
      "error",
      {
        requestedCount: ids.length,
        foundCount: users.length,
        notFoundCount,
        alreadyActiveCount,
        error: errorMessage,
      },
      startTime
    );
    throw new ApplicationError(errorMessage, 400);
  }

  const result = await prisma.user.updateMany({
    where: { id: { in: ids }, deletedAt: { not: null } },
    data: { deletedAt: null, isActive: true },
  });

  if (result.count > 0) {
    await logTableStatusAfterMutation({
      resource: "users",
      action: "bulk-restore",
      prismaModel: prisma.user,
      affectedIds: ids,
      affectedCount: result.count,
    });

    try {
      await emitBatchUserUpsert(
        users.map((u) => u.id),
        "deleted"
      );
    } catch (error) {
      logActionFlow("users", "bulk-restore", "error", {
        error: error instanceof Error ? error.message : String(error),
        count: result.count,
      });
    }

    try {
      await notifySuperAdminsOfBulkUserAction(
        "restore",
        ctx.actorId,
        result.count,
        users
      );
    } catch (error) {
      logActionFlow("users", "bulk-restore", "error", {
        error: error instanceof Error ? error.message : String(error),
        notificationError: true,
      });
    }

    logActionFlow(
      "users",
      "bulk-restore",
      "success",
      { requestedCount: ids.length, affectedCount: result.count },
      startTime
    );
  }

  return {
    success: true,
    message: `Đã khôi phục ${result.count} người dùng`,
    affected: result.count,
  };
};

export const hardDeleteUser = async (
  ctx: AuthContext,
  id: string
): Promise<void> => {
  if (
    !canPerformAnyAction(ctx.permissions, ctx.roles, [PERMISSIONS.USERS_MANAGE])
  )
    throw new ForbiddenError();

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, deletedAt: true },
  });
  if (!user) throw new NotFoundError("User không tồn tại");
  checkSuperAdmin(user.email, "xóa vĩnh viễn");

  await prisma.user.delete({ where: { id } });
  await notifySuperAdminsOfUserAction(
    "hard-delete",
    ctx.actorId,
    mapUserForNotification(user)
  );

  const previousStatus: "active" | "deleted" = user.deletedAt
    ? "deleted"
    : "active";
  emitUserRemove(id, previousStatus);
};

export const bulkHardDeleteUsers = async (
  ctx: AuthContext,
  ids: string[]
): Promise<BulkActionResult> => {
  if (
    !canPerformAnyAction(ctx.permissions, ctx.roles, [PERMISSIONS.USERS_MANAGE])
  )
    throw new ForbiddenError();
  validateBulkIds(ids, "người dùng");

  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, email: true, name: true, deletedAt: true },
  });

  const startTime = Date.now();
  logActionFlow("users", "bulk-hard-delete", "start", {
    requestedCount: ids.length,
    foundCount: users.length,
  });

  const superAdminUser = users.find(
    (u) => u.email === PROTECTED_SUPER_ADMIN_EMAIL
  );
  if (superAdminUser)
    throw new ForbiddenError("Không thể xóa vĩnh viễn tài khoản super admin");

  const filteredIds = users
    .filter((u) => u.email !== PROTECTED_SUPER_ADMIN_EMAIL)
    .map((u) => u.id);

  if (filteredIds.length === 0) {
    const notFoundCount = ids.length - users.length;
    const superAdminCount = users.filter(
      (u) => u.email === PROTECTED_SUPER_ADMIN_EMAIL
    ).length;
    let errorMessage = "Không có người dùng nào có thể xóa vĩnh viễn";
    if (notFoundCount > 0)
      errorMessage += `. ${notFoundCount} người dùng không tồn tại`;
    if (superAdminCount > 0)
      errorMessage += `. ${superAdminCount} người dùng là super admin và không thể xóa`;
    if (users.length === 0 && ids.length > 0)
      errorMessage = `Không tìm thấy người dùng nào trong danh sách`;

    logActionFlow(
      "users",
      "bulk-hard-delete",
      "error",
      {
        requestedCount: ids.length,
        foundCount: users.length,
        notFoundCount,
        superAdminCount,
        error: errorMessage,
      },
      startTime
    );
    throw new ApplicationError(errorMessage, 400);
  }

  const result = await prisma.user.deleteMany({
    where: { id: { in: filteredIds } },
  });

  const deletableUsers = users.filter(
    (u) => u.email !== PROTECTED_SUPER_ADMIN_EMAIL
  );
  if (result.count > 0) {
    const { getSocketServer } = await import("@/lib/socket/state");
    const io = getSocketServer();
    if (io && deletableUsers.length > 0) {
      const removeEvents = deletableUsers.map((user) => ({
        id: user.id,
        previousStatus: (user.deletedAt ? "deleted" : "active") as UserStatus,
      }));
      io.to("role:super_admin").emit("user:batch-remove", {
        users: removeEvents,
      });
    }

    await notifySuperAdminsOfBulkUserAction(
      "hard-delete",
      ctx.actorId,
      result.count,
      deletableUsers
    );
    logActionFlow(
      "users",
      "bulk-hard-delete",
      "success",
      { requestedCount: ids.length, affectedCount: result.count },
      startTime
    );
  }

  return {
    success: true,
    message: `Đã xóa vĩnh viễn ${result.count} người dùng`,
    affected: result.count,
  };
};
