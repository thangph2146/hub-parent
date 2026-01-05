/**
 * API Route Generator - Tạo Next.js API route handlers từ config
 * Tự động tạo route.ts files cho list, detail, create, update, delete, restore, hard-delete, bulk
 */

import type { AdminFeatureConfig } from "./config-generator";
import type { ServerConfig } from "./server-generator";

/**
 * Generate main route handler (GET list, POST create)
 */
export const generateMainRouteFile = <TRow extends { id: string }>(
  featureConfig: AdminFeatureConfig<TRow>,
  _serverConfig: ServerConfig<TRow>
) => {
  const { resourceName } = featureConfig;
  const ResourceName =
    resourceName.singular.charAt(0).toUpperCase() +
    resourceName.singular.slice(1);
  const resourcePlural = resourceName.plural;
  const resourceSingular = resourceName.singular;

  return `/**
 * API Route: GET /api/admin/${resourcePlural} - List ${resourcePlural}
 * POST /api/admin/${resourcePlural} - Create ${resourceSingular}
 */
import { NextRequest } from "next/server"
import { list${ResourceName}s } from "@/features/admin/${resourcePlural}/server/queries"
import { serialize${ResourceName}sList } from "@/features/admin/${resourcePlural}/server/helpers"
import {
  create${ResourceName},
  type AuthContext,
  ApplicationError,
  NotFoundError,
} from "@/features/admin/${resourcePlural}/server/mutations"
import { Create${ResourceName}Schema } from "@/features/admin/${resourcePlural}/server/schemas"
import { createGetRoute, createPostRoute } from "@/lib/api/api-route-wrapper"
import type { ApiRouteContext } from "@/lib/api/types"
import { validatePagination, sanitizeSearchQuery } from "@/lib/api/validation"
import { createSuccessResponse, createErrorResponse } from "@/lib/config"
import { logger } from "@/lib/config/logger"
import type { ${ResourceName}sResponse } from "@/features/admin/${resourcePlural}/types"

async function get${ResourceName}sHandler(req: NextRequest, _context: ApiRouteContext) {
  const searchParams = req.nextUrl.searchParams

  const paginationValidation = validatePagination({
    page: searchParams.get("page"),
    limit: searchParams.get("limit"),
  })

  if (!paginationValidation.valid) {
    return createErrorResponse(paginationValidation.error || "Invalid pagination parameters", { status: 400 })
  }

  const searchValidation = sanitizeSearchQuery(searchParams.get("search") || "", 200)
  const statusParam = searchParams.get("status") || "active"
  const status = statusParam === "deleted" || statusParam === "all" ? statusParam : "active"

  const columnFilters: Record<string, string> = {}
  searchParams.forEach((value, key) => {
    if (key.startsWith("filter[")) {
      const columnKey = key.replace("filter[", "").replace("]", "")
      const sanitizedValue = sanitizeSearchQuery(value, Infinity)
      if (sanitizedValue.valid && sanitizedValue.value) {
        columnFilters[columnKey] = sanitizedValue.value
      }
    }
  })

  const result = await list${ResourceName}s({
    page: paginationValidation.page,
    limit: paginationValidation.limit,
    search: searchValidation.value || undefined,
    filters: Object.keys(columnFilters).length > 0 ? columnFilters : undefined,
    status,
  })

  const serialized = serialize${ResourceName}sList(result)
  return createSuccessResponse({
    data: serialized.rows,
    pagination: {
      page: serialized.page,
      limit: serialized.limit,
      total: serialized.total,
      totalPages: serialized.totalPages,
    },
  } as ${ResourceName}sResponse)
}

async function post${ResourceName}sHandler(req: NextRequest, context: ApiRouteContext) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return createErrorResponse("Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.", { status: 400 })
  }

  const validationResult = Create${ResourceName}Schema.safeParse(body)
  if (!validationResult.success) {
    return createErrorResponse(validationResult.error.errors[0]?.message || "Dữ liệu không hợp lệ", { status: 400 })
  }

  const ctx: AuthContext = {
    actorId: context.session.user?.id ?? "unknown",
    permissions: context.permissions,
    roles: context.roles,
  }

  try {
    const ${resourceSingular} = await create${ResourceName}(ctx, validationResult.data)
    return createSuccessResponse(${resourceSingular})
  } catch (error) {
    if (error instanceof ApplicationError) {
      return createErrorResponse(error.message || "Không thể tạo ${resourceName.displayName.toLowerCase()}", { status: error.status || 400 })
    }
    if (error instanceof NotFoundError) {
      return createErrorResponse(error.message || "Không tìm thấy", { status: 404 })
    }
    logger.error("Error creating ${resourceSingular}", error instanceof Error ? error : new Error(String(error)))
    return createErrorResponse("Đã xảy ra lỗi khi tạo ${resourceName.displayName.toLowerCase()}", { status: 500 })
  }
}

export const GET = createGetRoute(get${ResourceName}sHandler)
export const POST = createPostRoute(post${ResourceName}sHandler)
`;
};

/**
 * Generate detail route handler (GET, PUT, DELETE)
 */
export const generateDetailRouteFile = <TRow extends { id: string }>(
  featureConfig: AdminFeatureConfig<TRow>,
  _serverConfig: ServerConfig<TRow>
) => {
  const { resourceName } = featureConfig;
  const ResourceName =
    resourceName.singular.charAt(0).toUpperCase() +
    resourceName.singular.slice(1);
  const resourcePlural = resourceName.plural;
  const resourceSingular = resourceName.singular;

  return `/**
 * API Route: GET /api/admin/${resourcePlural}/[id] - Get ${resourceSingular} detail
 * PUT /api/admin/${resourcePlural}/[id] - Update ${resourceSingular}
 * DELETE /api/admin/${resourcePlural}/[id] - Soft delete ${resourceSingular}
 */
import { NextRequest } from "next/server"
import { get${ResourceName}ById } from "@/features/admin/${resourcePlural}/server/queries"
import { serialize${ResourceName}Detail } from "@/features/admin/${resourcePlural}/server/helpers"
import {
  update${ResourceName},
  softDelete${ResourceName},
  type AuthContext,
  ApplicationError,
  NotFoundError,
} from "@/features/admin/${resourcePlural}/server/mutations"
import { Update${ResourceName}Schema } from "@/features/admin/${resourcePlural}/server/schemas"
import { createGetRoute, createPutRoute, createDeleteRoute } from "@/lib/api/api-route-wrapper"
import type { ApiRouteContext } from "@/lib/api/types"
import { createSuccessResponse, createErrorResponse } from "@/lib/config"
import { logger } from "@/lib/config/logger"

async function get${ResourceName}Handler(_req: NextRequest, _context: ApiRouteContext, ...args: unknown[]) {
  const { params } = args[0] as { params: Promise<{ id: string }> }
  const { id: ${resourceSingular}Id } = await params

  if (!${resourceSingular}Id) {
    return createErrorResponse("${ResourceName} ID is required", { status: 400 })
  }

  try {
    const ${resourceSingular} = await get${ResourceName}ById(${resourceSingular}Id)
    if (!${resourceSingular}) {
      return createErrorResponse("${ResourceName} not found", { status: 404 })
    }
    return createSuccessResponse(serialize${ResourceName}Detail(${resourceSingular}))
  } catch (error) {
    logger.error("Error getting ${resourceSingular}", error instanceof Error ? error : new Error(String(error)))
    return createErrorResponse("Đã xảy ra lỗi khi lấy ${resourceName.displayName.toLowerCase()}", { status: 500 })
  }
}

async function put${ResourceName}Handler(req: NextRequest, context: ApiRouteContext, ...args: unknown[]) {
  const { params } = args[0] as { params: Promise<{ id: string }> }
  const { id: ${resourceSingular}Id } = await params

  if (!${resourceSingular}Id) {
    return createErrorResponse("${ResourceName} ID is required", { status: 400 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return createErrorResponse("Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.", { status: 400 })
  }

  const ctx: AuthContext = {
    actorId: context.session.user?.id ?? "unknown",
    permissions: context.permissions,
    roles: context.roles,
  }

  try {
    const ${resourceSingular} = await update${ResourceName}(ctx, ${resourceSingular}Id, body)
    // Serialize ${resourceSingular} to client format (dates to strings)
    const serialized = {
      id: ${resourceSingular}.id,
      // TODO: Add all fields from ${resourceSingular}
      createdAt: ${resourceSingular}.createdAt.toISOString(),
      deletedAt: ${resourceSingular}.deletedAt ? ${resourceSingular}.deletedAt.toISOString() : null,
    }
    return createSuccessResponse(serialized)
  } catch (error) {
    if (error instanceof ApplicationError) {
      return createErrorResponse(error.message || "Không thể cập nhật ${resourceName.displayName.toLowerCase()}", { status: error.status || 400 })
    }
    if (error instanceof NotFoundError) {
      return createErrorResponse(error.message || "Không tìm thấy", { status: 404 })
    }
    logger.error("Error updating ${resourceSingular}", error instanceof Error ? error : new Error(String(error)))
    return createErrorResponse("Đã xảy ra lỗi khi cập nhật ${resourceName.displayName.toLowerCase()}", { status: 500 })
  }
}

async function delete${ResourceName}Handler(_req: NextRequest, context: ApiRouteContext, ...args: unknown[]) {
  const { params } = args[0] as { params: Promise<{ id: string }> }
  const { id: ${resourceSingular}Id } = await params

  if (!${resourceSingular}Id) {
    return createErrorResponse("${ResourceName} ID is required", { status: 400 })
  }

  const ctx: AuthContext = {
    actorId: context.session.user?.id ?? "unknown",
    permissions: context.permissions,
    roles: context.roles,
  }

  try {
    await softDelete${ResourceName}(ctx, ${resourceSingular}Id)
    return createSuccessResponse({ message: "${ResourceName} deleted successfully" })
  } catch (error) {
    if (error instanceof ApplicationError) {
      return createErrorResponse(error.message || "Không thể xóa ${resourceName.displayName.toLowerCase()}", { status: error.status || 400 })
    }
    if (error instanceof NotFoundError) {
      return createErrorResponse(error.message || "Không tìm thấy", { status: 404 })
    }
    logger.error("Error deleting ${resourceSingular}", error instanceof Error ? error : new Error(String(error)))
    return createErrorResponse("Đã xảy ra lỗi khi xóa ${resourceName.displayName.toLowerCase()}", { status: 500 })
  }
}

export const GET = createGetRoute(get${ResourceName}Handler)
export const PUT = createPutRoute(put${ResourceName}Handler)
export const DELETE = createDeleteRoute(delete${ResourceName}Handler)
`;
};

/**
 * Generate restore route handler
 */
export const generateRestoreRouteFile = <TRow extends { id: string }>(
  featureConfig: AdminFeatureConfig<TRow>
) => {
  const { resourceName } = featureConfig;
  const ResourceName =
    resourceName.singular.charAt(0).toUpperCase() +
    resourceName.singular.slice(1);
  const resourcePlural = resourceName.plural;
  const resourceSingular = resourceName.singular;

  return `/**
 * API Route: POST /api/admin/${resourcePlural}/[id]/restore - Restore ${resourceSingular}
 */
import { NextRequest } from "next/server"
import {
  restore${ResourceName},
  type AuthContext,
  ApplicationError,
  NotFoundError,
} from "@/features/admin/${resourcePlural}/server/mutations"
import { createPostRoute } from "@/lib/api/api-route-wrapper"
import type { ApiRouteContext } from "@/lib/api/types"
import { createSuccessResponse, createErrorResponse } from "@/lib/config"
import { logger } from "@/lib/config/logger"

async function restore${ResourceName}Handler(_req: NextRequest, context: ApiRouteContext, ...args: unknown[]) {
  const { params } = args[0] as { params: Promise<{ id: string }> }
  const { id: ${resourceSingular}Id } = await params

  if (!${resourceSingular}Id) {
    return createErrorResponse("${ResourceName} ID is required", { status: 400 })
  }

  const ctx: AuthContext = {
    actorId: context.session.user?.id ?? "unknown",
    permissions: context.permissions,
    roles: context.roles,
  }

  try {
    await restore${ResourceName}(ctx, ${resourceSingular}Id)
    return createSuccessResponse({ message: "${ResourceName} restored successfully" })
  } catch (error) {
    if (error instanceof ApplicationError) {
      return createErrorResponse(error.message || "Không thể khôi phục ${resourceName.displayName.toLowerCase()}", { status: error.status || 400 })
    }
    if (error instanceof NotFoundError) {
      return createErrorResponse(error.message || "Không tìm thấy", { status: 404 })
    }
    logger.error("Error restoring ${resourceSingular}", error instanceof Error ? error : new Error(String(error)))
    return createErrorResponse("Đã xảy ra lỗi khi khôi phục ${resourceName.displayName.toLowerCase()}", { status: 500 })
  }
}

export const POST = createPostRoute(restore${ResourceName}Handler)
`;
};

/**
 * Generate hard-delete route handler
 */
export const generateHardDeleteRouteFile = <TRow extends { id: string }>(
  featureConfig: AdminFeatureConfig<TRow>
) => {
  const { resourceName } = featureConfig;
  const ResourceName =
    resourceName.singular.charAt(0).toUpperCase() +
    resourceName.singular.slice(1);
  const resourcePlural = resourceName.plural;
  const resourceSingular = resourceName.singular;

  return `/**
 * API Route: DELETE /api/admin/${resourcePlural}/[id]/hard-delete - Hard delete ${resourceSingular}
 */
import { NextRequest } from "next/server"
import {
  hardDelete${ResourceName},
  type AuthContext,
  ApplicationError,
  NotFoundError,
} from "@/features/admin/${resourcePlural}/server/mutations"
import { createDeleteRoute } from "@/lib/api/api-route-wrapper"
import type { ApiRouteContext } from "@/lib/api/types"
import { createSuccessResponse, createErrorResponse } from "@/lib/config"
import { logger } from "@/lib/config/logger"

async function hardDelete${ResourceName}Handler(_req: NextRequest, context: ApiRouteContext, ...args: unknown[]) {
  const { params } = args[0] as { params: Promise<{ id: string }> }
  const { id: ${resourceSingular}Id } = await params

  if (!${resourceSingular}Id) {
    return createErrorResponse("${ResourceName} ID is required", { status: 400 })
  }

  const ctx: AuthContext = {
    actorId: context.session.user?.id ?? "unknown",
    permissions: context.permissions,
    roles: context.roles,
  }

  try {
    await hardDelete${ResourceName}(ctx, ${resourceSingular}Id)
    return createSuccessResponse({ message: "${ResourceName} hard deleted successfully" })
  } catch (error) {
    if (error instanceof ApplicationError) {
      return createErrorResponse(error.message || "Không thể xóa vĩnh viễn ${resourceName.displayName.toLowerCase()}", { status: error.status || 400 })
    }
    if (error instanceof NotFoundError) {
      return createErrorResponse(error.message || "Không tìm thấy", { status: 404 })
    }
    logger.error("Error hard deleting ${resourceSingular}", error instanceof Error ? error : new Error(String(error)))
    return createErrorResponse("Đã xảy ra lỗi khi xóa vĩnh viễn ${resourceName.displayName.toLowerCase()}", { status: 500 })
  }
}

export const DELETE = createDeleteRoute(hardDelete${ResourceName}Handler)
`;
};

/**
 * Generate bulk route handler
 */
export const generateBulkRouteFile = <TRow extends { id: string }>(
  featureConfig: AdminFeatureConfig<TRow>
) => {
  const { resourceName } = featureConfig;
  const ResourceName =
    resourceName.singular.charAt(0).toUpperCase() +
    resourceName.singular.slice(1);
  const resourcePlural = resourceName.plural;

  return `/**
 * API Route: POST /api/admin/${resourcePlural}/bulk - Bulk actions
 */
import { NextRequest } from "next/server"
import {
  bulkSoftDelete${ResourceName}s,
  bulkRestore${ResourceName}s,
  bulkHardDelete${ResourceName}s,
  type AuthContext,
  ApplicationError,
  NotFoundError,
} from "@/features/admin/${resourcePlural}/server/mutations"
import { Bulk${ResourceName}ActionSchema } from "@/features/admin/${resourcePlural}/server/schemas"
import { createPostRoute } from "@/lib/api/api-route-wrapper"
import type { ApiRouteContext } from "@/lib/api/types"
import { createSuccessResponse, createErrorResponse } from "@/lib/config"
import { logger } from "@/lib/config/logger"

async function bulk${ResourceName}sHandler(req: NextRequest, context: ApiRouteContext) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return createErrorResponse("Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.", { status: 400 })
  }

  const validationResult = Bulk${ResourceName}ActionSchema.safeParse(body)
  if (!validationResult.success) {
    return createErrorResponse(validationResult.error.errors[0]?.message || "Dữ liệu không hợp lệ", { status: 400 })
  }

  const ctx: AuthContext = {
    actorId: context.session.user?.id ?? "unknown",
    permissions: context.permissions,
    roles: context.roles,
  }

  try {
    const validatedBody = validationResult.data
    let result
    if (validatedBody.action === "delete") {
      result = await bulkSoftDelete${ResourceName}s(ctx, validatedBody.ids)
    } else if (validatedBody.action === "restore") {
      result = await bulkRestore${ResourceName}s(ctx, validatedBody.ids)
    } else if (validatedBody.action === "hard-delete") {
      result = await bulkHardDelete${ResourceName}s(ctx, validatedBody.ids)
    } else {
      return createErrorResponse("Action không hợp lệ", { status: 400 })
    }

    return createSuccessResponse(result)
  } catch (error) {
    if (error instanceof ApplicationError) {
      return createErrorResponse(error.message || "Không thể thực hiện thao tác hàng loạt", { status: error.status || 400 })
    }
    logger.error("Error in bulk ${resourcePlural} operation", error instanceof Error ? error : new Error(String(error)))
    return createErrorResponse("Đã xảy ra lỗi khi thực hiện thao tác hàng loạt", { status: 500 })
  }
}

export const POST = createPostRoute(bulk${ResourceName}sHandler)
`;
};

/**
 * Generate all API route files
 */
export const generateAllApiRouteFiles = <TRow extends { id: string }>(
  featureConfig: AdminFeatureConfig<TRow>,
  serverConfig: ServerConfig<TRow>
) => {
  return {
    main: generateMainRouteFile(featureConfig, serverConfig), // route.ts
    detail: generateDetailRouteFile(featureConfig, serverConfig), // [id]/route.ts
    restore: generateRestoreRouteFile(featureConfig), // [id]/restore/route.ts
    hardDelete: generateHardDeleteRouteFile(featureConfig), // [id]/hard-delete/route.ts
    bulk: generateBulkRouteFile(featureConfig), // bulk/route.ts
  };
};
