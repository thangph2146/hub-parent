/**
 * Mutations Generator - Tạo base mutations template từ config
 * Tự động generate data mapping từ form fields
 */

import type { ServerConfig } from "./server-generator";
import type { ResourceFormField } from "../components";
import {
  generateCreateDataMapping,
  generateUpdateDataMapping,
} from "./field-extractor";

/**
 * Generate mutations.ts file template
 */
export const generateMutationsFile = <
  TRow extends { id: string },
  TFormData extends Record<string, unknown> = Record<string, unknown>
>(
  config: ServerConfig<TRow>,
  formFields?: ResourceFormField<TFormData>[]
) => {
  const { prismaModel, resourceName } = config;
  const ModelName = prismaModel.charAt(0).toUpperCase() + prismaModel.slice(1);
  const ResourceName =
    resourceName.singular.charAt(0).toUpperCase() +
    resourceName.singular.slice(1);
  const resourcePlural = resourceName.plural;
  const permissionName = resourcePlural.toUpperCase();

  return `"use server"

import type { Prisma } from "@prisma/client"
import { PERMISSIONS } from "@/permissions"
import { prisma } from "@/services/prisma"
import { map${ResourceName}Record, type ${ModelName}WithRelations } from "./helpers"
import type { Listed${ResourceName}, ${ResourceName}Detail } from "./queries"
import {
  Create${ResourceName}Schema,
  Update${ResourceName}Schema,
  Bulk${ResourceName}ActionSchema,
  type Create${ResourceName}Input,
  type Update${ResourceName}Input,
} from "./schemas"
import {
  ApplicationError,
  ForbiddenError,
  NotFoundError,
  ensurePermission,
  logTableStatusAfterMutation,
  logActionFlow,
  logDetailAction,
  validateBulkIds,
  buildBulkError,
  type AuthContext,
  type BulkActionResult,
} from "@/features/admin/resources/server"
import { emit${ResourceName}Upsert, emit${ResourceName}Remove, emitBatch${ResourceName}Upsert } from "./events"

export { ApplicationError, ForbiddenError, NotFoundError, type AuthContext, type BulkActionResult }

const sanitize${ResourceName} = (${
    resourceName.singular
  }: ${ModelName}WithRelations): Listed${ResourceName} => {
  return map${ResourceName}Record(${resourceName.singular})
}

export const create${ResourceName} = async (ctx: AuthContext, input: Create${ResourceName}Input): Promise<Listed${ResourceName}> => {
  const startTime = Date.now()
  logActionFlow("${resourcePlural}", "create", "start", { actorId: ctx.actorId })
  ensurePermission(ctx, PERMISSIONS.${permissionName}_CREATE, PERMISSIONS.${permissionName}_MANAGE)

  const validatedInput = Create${ResourceName}Schema.parse(input)

  // TODO: Add unique check if needed
  // const existing = await prisma.${prismaModel}.findFirst({
  //   where: { /* unique field check */, deletedAt: null },
  // })
  // if (existing) {
  //   throw new ApplicationError("Đã tồn tại", 400)
  // }

  const ${resourceName.singular} = await prisma.${prismaModel}.create({
    data: {
${
  formFields
    ? generateCreateDataMapping(formFields, "validatedInput")
    : `      // TODO: Map validatedInput to Prisma data
      // Example: name: validatedInput.name.trim(),`
}
    },
  })

  const sanitized = sanitize${ResourceName}(${resourceName.singular})
  await emit${ResourceName}Upsert(sanitized.id, null)
  
  logActionFlow("${resourcePlural}", "create", "success", { ${
    resourceName.singular
  }Id: sanitized.id }, startTime)
  logDetailAction("${resourcePlural}", "create", sanitized.id, sanitized as unknown as Record<string, unknown>)

  return sanitized
}

export const update${ResourceName} = async (ctx: AuthContext, id: string, input: Update${ResourceName}Input): Promise<Listed${ResourceName}> => {
  const startTime = Date.now()
  logActionFlow("${resourcePlural}", "update", "start", { ${
    resourceName.singular
  }Id: id, actorId: ctx.actorId })
  ensurePermission(ctx, PERMISSIONS.${permissionName}_UPDATE, PERMISSIONS.${permissionName}_MANAGE)

  if (!id?.trim()) throw new ApplicationError("ID không hợp lệ", 400)

  const validatedInput = Update${ResourceName}Schema.parse(input)
  const existing = await prisma.${prismaModel}.findUnique({ where: { id } })
  if (!existing || existing.deletedAt) throw new NotFoundError("${ResourceName} không tồn tại")

  const updateData: Prisma.${ModelName}UpdateInput = {}
  
${
  formFields
    ? generateUpdateDataMapping(formFields, "validatedInput", "updateData")
    : `  // TODO: Map validatedInput to updateData
  // Example:
  // if (validatedInput.name !== undefined) {
  //   updateData.name = validatedInput.name.trim()
  // }`
}

  if (Object.keys(updateData).length === 0) {
    const sanitized = sanitize${ResourceName}(existing)
    logActionFlow("${resourcePlural}", "update", "success", { ${
    resourceName.singular
  }Id: sanitized.id, noChanges: true }, startTime)
    return sanitized
  }

  const ${
    resourceName.singular
  } = await prisma.${prismaModel}.update({ where: { id }, data: updateData })
  const sanitized = sanitize${ResourceName}(${resourceName.singular})
  const previousStatus: "active" | "deleted" | null = existing.deletedAt ? "deleted" : "active"

  await emit${ResourceName}Upsert(sanitized.id, previousStatus)
  logActionFlow("${resourcePlural}", "update", "success", { ${
    resourceName.singular
  }Id: sanitized.id }, startTime)
  logDetailAction("${resourcePlural}", "update", sanitized.id, sanitized as unknown as Record<string, unknown>)

  return sanitized
}

export const softDelete${ResourceName} = async (ctx: AuthContext, id: string): Promise<void> => {
  const startTime = Date.now()
  logActionFlow("${resourcePlural}", "delete", "start", { ${
    resourceName.singular
  }Id: id, actorId: ctx.actorId })
  ensurePermission(ctx, PERMISSIONS.${permissionName}_DELETE, PERMISSIONS.${permissionName}_MANAGE)

  const ${
    resourceName.singular
  } = await prisma.${prismaModel}.findUnique({ where: { id } })
  if (!${resourceName.singular} || ${
    resourceName.singular
  }.deletedAt) throw new NotFoundError("${ResourceName} không tồn tại")

  await prisma.${prismaModel}.update({ where: { id }, data: { deletedAt: new Date() } })
  await logTableStatusAfterMutation({ resource: "${resourcePlural}", action: "delete", prismaModel: prisma.${prismaModel}, affectedIds: id })
  await emit${ResourceName}Upsert(id, "active")

  logActionFlow("${resourcePlural}", "delete", "success", { ${
    resourceName.singular
  }Id: id }, startTime)
}

export const restore${ResourceName} = async (ctx: AuthContext, id: string): Promise<void> => {
  const startTime = Date.now()
  logActionFlow("${resourcePlural}", "restore", "start", { ${
    resourceName.singular
  }Id: id, actorId: ctx.actorId })
  ensurePermission(ctx, PERMISSIONS.${permissionName}_UPDATE, PERMISSIONS.${permissionName}_MANAGE)

  const ${
    resourceName.singular
  } = await prisma.${prismaModel}.findUnique({ where: { id } })
  if (!${resourceName.singular} || !${
    resourceName.singular
  }.deletedAt) throw new NotFoundError("${ResourceName} không tồn tại hoặc chưa bị xóa")

  await prisma.${prismaModel}.update({ where: { id }, data: { deletedAt: null } })
  await logTableStatusAfterMutation({ resource: "${resourcePlural}", action: "restore", prismaModel: prisma.${prismaModel}, affectedIds: id })
  await emit${ResourceName}Upsert(id, "deleted")

  logActionFlow("${resourcePlural}", "restore", "success", { ${
    resourceName.singular
  }Id: id }, startTime)
}

export const hardDelete${ResourceName} = async (ctx: AuthContext, id: string): Promise<void> => {
  const startTime = Date.now()
  logActionFlow("${resourcePlural}", "hard-delete", "start", { ${
    resourceName.singular
  }Id: id, actorId: ctx.actorId })
  ensurePermission(ctx, PERMISSIONS.${permissionName}_DELETE, PERMISSIONS.${permissionName}_MANAGE)

  const ${
    resourceName.singular
  } = await prisma.${prismaModel}.findUnique({ where: { id } })
  if (!${
    resourceName.singular
  }) throw new NotFoundError("${ResourceName} không tồn tại")

  await prisma.${prismaModel}.delete({ where: { id } })
  await logTableStatusAfterMutation({ resource: "${resourcePlural}", action: "hard-delete", prismaModel: prisma.${prismaModel}, affectedIds: id })
  await emit${ResourceName}Remove(id, ${
    resourceName.singular
  }.deletedAt ? "deleted" : "active")

  logActionFlow("${resourcePlural}", "hard-delete", "success", { ${
    resourceName.singular
  }Id: id }, startTime)
}

export const bulkSoftDelete${ResourceName}s = async (ctx: AuthContext, ids: string[]): Promise<BulkActionResult> => {
  const startTime = Date.now()
  logActionFlow("${resourcePlural}", "bulk-delete", "start", { count: ids.length, ${
    resourceName.singular
  }Ids: ids, actorId: ctx.actorId })
  ensurePermission(ctx, PERMISSIONS.${permissionName}_DELETE, PERMISSIONS.${permissionName}_MANAGE)
  validateBulkIds(ids, "${resourceName.displayName.toLowerCase()}")

  const ${
    resourceName.plural
  } = await prisma.${prismaModel}.findMany({ where: { id: { in: ids }, deletedAt: null }, select: { id: true } })

  if (${resourceName.plural}.length === 0) {
    const all${ResourceName}s = await prisma.${prismaModel}.findMany({ where: { id: { in: ids } }, select: { id: true, deletedAt: true } })
    logActionFlow("${resourcePlural}", "bulk-delete", "error", { requestedCount: ids.length, foundCount: ${
    resourceName.plural
  }.length, error: "Không có ${resourceName.displayName.toLowerCase()} nào có thể xóa" }, startTime)
    throw new ApplicationError(buildBulkError(all${ResourceName}s, ids, "${resourceName.displayName.toLowerCase()}"), 400)
  }

  const result = await prisma.${prismaModel}.updateMany({
    where: { id: { in: ${
      resourceName.plural
    }.map((c) => c.id) }, deletedAt: null },
    data: { deletedAt: new Date() },
  })

  if (result.count > 0) {
    await logTableStatusAfterMutation({
      resource: "${resourcePlural}",
      action: "bulk-delete",
      prismaModel: prisma.${prismaModel},
      affectedIds: ${resourceName.plural}.map((c) => c.id),
      affectedCount: result.count,
    })
    await Promise.allSettled(${resourceName.plural}.map((${
    resourceName.singular
  }) => emit${ResourceName}Upsert(${
    resourceName.singular
  }.id, "active").catch(() => null)))
    logActionFlow("${resourcePlural}", "bulk-delete", "success", { requestedCount: ids.length, affectedCount: result.count }, startTime)
  }

  return { success: true, message: \`Đã xóa \${result.count} ${resourceName.displayName.toLowerCase()}\`, affected: result.count }
}

export const bulkRestore${ResourceName}s = async (ctx: AuthContext, ids: string[]): Promise<BulkActionResult> => {
  const startTime = Date.now()
  logActionFlow("${resourcePlural}", "bulk-restore", "start", { count: ids.length, ${
    resourceName.singular
  }Ids: ids, actorId: ctx.actorId })
  ensurePermission(ctx, PERMISSIONS.${permissionName}_UPDATE, PERMISSIONS.${permissionName}_MANAGE)
  validateBulkIds(ids, "${resourceName.displayName.toLowerCase()}")

  const all${ResourceName}s = await prisma.${prismaModel}.findMany({ where: { id: { in: ids } }, select: { id: true, deletedAt: true } })
  const softDeleted${ResourceName}s = all${ResourceName}s.filter((c) => c.deletedAt !== null)

  if (softDeleted${ResourceName}s.length === 0) {
    return { success: true, message: "Không có ${resourceName.displayName.toLowerCase()} nào để khôi phục", affected: 0 }
  }

  const result = await prisma.${prismaModel}.updateMany({
    where: { id: { in: softDeleted${ResourceName}s.map((c) => c.id) }, deletedAt: { not: null } },
    data: { deletedAt: null },
  })

  if (result.count > 0) {
    await logTableStatusAfterMutation({
      resource: "${resourcePlural}",
      action: "bulk-restore",
      prismaModel: prisma.${prismaModel},
      affectedIds: softDeleted${ResourceName}s.map((c) => c.id),
      affectedCount: result.count,
    })
    await Promise.allSettled(softDeleted${ResourceName}s.map((${
    resourceName.singular
  }) => emit${ResourceName}Upsert(${
    resourceName.singular
  }.id, "deleted").catch(() => null)))
    logActionFlow("${resourcePlural}", "bulk-restore", "success", { requestedCount: ids.length, affectedCount: result.count }, startTime)
  }

  return { success: true, message: \`Đã khôi phục \${result.count} ${resourceName.displayName.toLowerCase()}\`, affected: result.count }
}

export const bulkHardDelete${ResourceName}s = async (ctx: AuthContext, ids: string[]): Promise<BulkActionResult> => {
  const startTime = Date.now()
  logActionFlow("${resourcePlural}", "bulk-hard-delete", "start", { count: ids.length, ${
    resourceName.singular
  }Ids: ids, actorId: ctx.actorId })
  ensurePermission(ctx, PERMISSIONS.${permissionName}_DELETE, PERMISSIONS.${permissionName}_MANAGE)
  validateBulkIds(ids, "${resourceName.displayName.toLowerCase()}")

  const ${
    resourceName.plural
  } = await prisma.${prismaModel}.findMany({ where: { id: { in: ids } }, select: { id: true, deletedAt: true } })

  if (${resourceName.plural}.length === 0) {
    throw new NotFoundError("Không tìm thấy ${resourceName.displayName.toLowerCase()} nào")
  }

  const result = await prisma.${prismaModel}.deleteMany({
    where: { id: { in: ${resourceName.plural}.map((c) => c.id) } },
  })

  if (result.count > 0) {
    await logTableStatusAfterMutation({
      resource: "${resourcePlural}",
      action: "bulk-hard-delete",
      prismaModel: prisma.${prismaModel},
      affectedIds: ${resourceName.plural}.map((c) => c.id),
      affectedCount: result.count,
    })
    await Promise.allSettled(${resourceName.plural}.map((${
    resourceName.singular
  }) => 
      emit${ResourceName}Remove(${resourceName.singular}.id, ${
    resourceName.singular
  }.deletedAt ? "deleted" : "active").catch(() => null)
    ))
    logActionFlow("${resourcePlural}", "bulk-hard-delete", "success", { requestedCount: ids.length, affectedCount: result.count }, startTime)
  }

  return { success: true, message: \`Đã xóa vĩnh viễn \${result.count} ${resourceName.displayName.toLowerCase()}\`, affected: result.count }
}
`;
};
