/**
 * Server Files Generator
 * Tự động tạo mutations, queries, events, helpers từ config tối thiểu
 * Tự động generate fields từ form fields
 */

import type { ResourceFormField } from "./components";
import {
  generateMapRecordFields,
  generateSerializeForTableFields,
  generateSerializeDetailFields,
} from "./field-extractor";

/**
 * Config cho server files
 */
export interface ServerConfig<_TRow extends { id: string }> {
  // Prisma model name (ví dụ: "user", "post", "category")
  prismaModel: string;

  // Resource name từ feature config
  resourceName: {
    singular: string;
    plural: string;
    displayName: string;
  };

  // Search fields cho where clause
  searchFields: string[];

  // Filter fields (optional)
  filterFields?: Array<{
    name: string;
    type: "string" | "boolean" | "date" | "status";
  }>;

  // Include relations cho queries
  includeRelations?: Record<string, unknown>;

  // Map record function (tùy chỉnh nếu cần)
  customMapRecord?: string;

  // Custom where clause builder (tùy chỉnh nếu cần)
  customWhereClause?: string;
}

/**
 * Generate helpers.ts file content
 */
export const generateHelpersFile = <
  _TRow extends { id: string },
  TFormData extends Record<string, unknown> = Record<string, unknown>
>(
  config: ServerConfig<_TRow>,
  formFields?: ResourceFormField<TFormData>[]
) => {
  const { prismaModel, resourceName, searchFields, filterFields = [] } = config;
  const ModelName = prismaModel.charAt(0).toUpperCase() + prismaModel.slice(1);
  const ResourceName =
    resourceName.singular.charAt(0).toUpperCase() +
    resourceName.singular.slice(1);
  const ListedResource = `Listed${ResourceName}`;
  const ResourceRow = `${ResourceName}Row`;

  let whereClauseBuilder = "";
  if (config.customWhereClause) {
    whereClauseBuilder = config.customWhereClause;
  } else {
    whereClauseBuilder = `export const buildWhereClause = (params: List${ResourceName}sInput): Prisma.${ModelName}WhereInput => {
  const where: Prisma.${ModelName}WhereInput = {}

  // Apply status filter
  applyStatusFilter(where, params.status)

  // Apply search filter
  applySearchFilter(where, params.search, ${JSON.stringify(searchFields)})

  // Apply custom filters
  if (params.filters) {
    const activeFilters = Object.entries(params.filters).filter(([, value]) => Boolean(value))
    for (const [key, rawValue] of activeFilters) {
      const value = rawValue?.trim()
      if (!value) continue

      switch (key) {
${filterFields
  .map((field) => {
    switch (field.type) {
      case "string":
        return `        case "${field.name}":\n          applyStringFilter(where, key, value)\n          break`;
      case "boolean":
        return `        case "${field.name}":\n          applyBooleanFilter(where, key, value)\n          break`;
      case "date":
        return `        case "${field.name}":\n          applyDateFilter(where, key, value)\n          break`;
      case "status":
        return `        case "status":\n          applyStatusFilterFromFilters(where, value)\n          break`;
      default:
        return "";
    }
  })
  .filter(Boolean)
  .join("\n")}
      }
    }
  }

  return where
}`;
  }

  // Generate mapRecord từ form fields nếu có
  const mapRecord =
    config.customMapRecord ||
    (formFields
      ? `export const map${ResourceName}Record = (${prismaModel}: ${ModelName}WithRelations): ${ListedResource} => {
  return {
    id: ${prismaModel}.id,
${generateMapRecordFields(formFields, prismaModel)}
  }
}`
      : `export const map${ResourceName}Record = (${prismaModel}: ${ModelName}WithRelations): ${ListedResource} => {
  return {
    id: ${prismaModel}.id,
    // TODO: Add your fields here based on Prisma model
    // Example:
    // name: ${prismaModel}.name,
    // slug: ${prismaModel}.slug,
    // description: ${prismaModel}.description,
    createdAt: ${prismaModel}.createdAt,
    updatedAt: ${prismaModel}.updatedAt,
    deletedAt: ${prismaModel}.deletedAt,
  }
}`);

  return `import type { Prisma } from "@prisma/client"
import {
  serializeDate,
  applyStatusFilter,
  applySearchFilter,
  applyDateFilter,
  applyStringFilter,
  applyBooleanFilter,
  applyStatusFilterFromFilters,
  createSerializeList,
} from "@/features/admin/resources/server"
import type { List${ResourceName}sInput, Listed${ResourceName}, ${ResourceName}Detail } from "../types"
import type { ${ResourceRow} } from "../types"

type ${ModelName}WithRelations = Prisma.${ModelName}GetPayload<{
  include: ${JSON.stringify(config.includeRelations || {}, null, 2)}
}>

${mapRecord}

${whereClauseBuilder}

export const serialize${ResourceName}ForTable = (${
    resourceName.singular
  }: ${ListedResource}): ${ResourceRow} => {
  return {
    id: ${resourceName.singular}.id,
${
  formFields
    ? generateSerializeForTableFields(formFields, resourceName.singular)
    : `    // TODO: Map your fields here based on ${ResourceRow} type
    // Example:
    // name: ${resourceName.singular}.name,
    // slug: ${resourceName.singular}.slug,`
}
    createdAt: serializeDate(${resourceName.singular}.createdAt)!,
    updatedAt: serializeDate(${
      resourceName.singular
    }.updatedAt) ?? undefined, // Thêm updatedAt để so sánh cache chính xác
    deletedAt: serializeDate(${resourceName.singular}.deletedAt),
  }
}

export const serialize${ResourceName}sList = createSerializeList(serialize${ResourceName}ForTable)

export const serialize${ResourceName}Detail = (${
    resourceName.singular
  }: ${ResourceName}Detail) => {
  return {
    id: ${resourceName.singular}.id,
${
  formFields
    ? generateSerializeDetailFields(formFields, resourceName.singular)
    : `    // TODO: Add detail fields here based on ${ResourceName}Detail type
    // Example:
    // name: ${resourceName.singular}.name,
    // slug: ${resourceName.singular}.slug,
    // description: ${resourceName.singular}.description,`
}
    createdAt: serializeDate(${resourceName.singular}.createdAt)!,
    updatedAt: serializeDate(${resourceName.singular}.updatedAt)!,
    deletedAt: serializeDate(${resourceName.singular}.deletedAt),
  }
}

export type { ${ModelName}WithRelations }
`;
};

/**
 * Generate queries.ts file content
 */
export const generateQueriesFile = <_TRow extends { id: string }>(
  config: ServerConfig<_TRow>
) => {
  const { prismaModel, resourceName } = config;
  const ModelName = prismaModel.charAt(0).toUpperCase() + prismaModel.slice(1);
  const ResourceName =
    resourceName.singular.charAt(0).toUpperCase() +
    resourceName.singular.slice(1);

  return `import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { validatePagination, buildPagination } from "@/features/admin/resources/server"
import { map${ResourceName}Record, buildWhereClause } from "./helpers"
import type { List${ResourceName}sInput, Listed${ResourceName}, ${ResourceName}Detail, List${ResourceName}sResult } from "../types"

${
  config.includeRelations
    ? `const ${ModelName.toUpperCase()}_INCLUDE = ${JSON.stringify(
        config.includeRelations,
        null,
        2
      )} satisfies Prisma.${ModelName}Include\n`
    : ""
}

export const list${ResourceName}s = async (params: List${ResourceName}sInput = {}): Promise<List${ResourceName}sResult> => {
  const { page, limit } = validatePagination(params.page, params.limit, 100)
  const where = buildWhereClause(params)

  const [data, total] = await Promise.all([
    prisma.${prismaModel}.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { updatedAt: "desc" },
      ${
        config.includeRelations
          ? `include: ${ModelName.toUpperCase()}_INCLUDE,`
          : ""
      }
    }),
    prisma.${prismaModel}.count({ where }),
  ])

  return {
    data: data.map(map${ResourceName}Record),
    pagination: buildPagination(page, limit, total),
  }
}

export const get${ResourceName}ById = async (id: string): Promise<${ResourceName}Detail | null> => {
  const ${resourceName.singular} = await prisma.${prismaModel}.findUnique({
    where: { id },
    ${
      config.includeRelations
        ? `include: ${ModelName.toUpperCase()}_INCLUDE,`
        : ""
    }
  })

  if (!${resourceName.singular}) {
    return null
  }

  return map${ResourceName}Record(${
    resourceName.singular
  }) as ${ResourceName}Detail
}

export const get${ResourceName}DetailById = async (id: string): Promise<${ResourceName}Detail | null> => {
  return get${ResourceName}ById(id)
}
`;
};

/**
 * Generate events.ts file content
 */
export const generateEventsFile = <_TRow extends { id: string }>(
  config: ServerConfig<_TRow>
) => {
  const { prismaModel, resourceName } = config;
  const ModelName = prismaModel.charAt(0).toUpperCase() + prismaModel.slice(1);
  const ResourceName =
    resourceName.singular.charAt(0).toUpperCase() +
    resourceName.singular.slice(1);
  const ResourceRow = `${ResourceName}Row`;
  const resourcePlural = resourceName.plural;

  const includeConstant = config.includeRelations
    ? `const ${ModelName.toUpperCase()}_INCLUDE = ${JSON.stringify(
        config.includeRelations,
        null,
        2
      )} satisfies Prisma.${ModelName}Include\n\n`
    : "";

  return `import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { getSocketServer } from "@/lib/socket/state"
import { map${ResourceName}Record, serialize${ResourceName}ForTable } from "./helpers"
import type { ${ResourceRow} } from "../types"
import { resourceLogger } from "@/lib/config/resource-logger"

${includeConstant}export type ${ResourceName}Status = "active" | "deleted"

const resolveStatusFromRow = (row: ${ResourceRow}): ${ResourceName}Status => {
  return row.deletedAt ? "deleted" : "active"
}

const fetch${ResourceName}Row = async (${resourceName.singular}Id: string): Promise<${ResourceRow} | null> => {
  const ${resourceName.singular} = await prisma.${prismaModel}.findUnique({
    where: { id: ${resourceName.singular}Id },
    ${config.includeRelations ? `include: ${ModelName.toUpperCase()}_INCLUDE,` : ""}
  })

  if (!${resourceName.singular}) {
    return null
  }

  const listed = map${ResourceName}Record(${resourceName.singular})
  return serialize${ResourceName}ForTable(listed)
}

export const emit${ResourceName}Upsert = async (
  ${resourceName.singular}Id: string,
  previousStatus: ${ResourceName}Status | null,
): Promise<void> => {
  const io = getSocketServer()
  
  if (!io) {
    resourceLogger.actionFlow({
      resource: "${resourcePlural}",
      action: "socket-update",
      step: "error",
      metadata: { ${resourceName.singular}Id, error: "Socket server not available", type: "single" },
    })
    return
  }

  const row = await fetch${ResourceName}Row(${resourceName.singular}Id)
  if (!row) {
    resourceLogger.actionFlow({
      resource: "${resourcePlural}",
      action: "socket-update",
      step: "error",
      metadata: { ${resourceName.singular}Id, error: "${ResourceName} not found", type: "single" },
    })
    if (previousStatus) {
      emit${ResourceName}Remove(${resourceName.singular}Id, previousStatus)
    }
    return
  }

  const newStatus = resolveStatusFromRow(row)

  resourceLogger.actionFlow({
    resource: "${resourcePlural}",
    action: "socket-update",
    step: "start",
    metadata: { 
      ${resourceName.singular}Id, 
      previousStatus, 
      newStatus,
      type: "single" 
    },
  })

  io.to(\`${resourcePlural}:\${newStatus}\`).emit("${resourcePlural}:upsert", row)
  
  if (previousStatus && previousStatus !== newStatus) {
    io.to(\`${resourcePlural}:\${previousStatus}\`).emit("${resourcePlural}:remove", { id: ${resourceName.singular}Id })
  }

  resourceLogger.actionFlow({
    resource: "${resourcePlural}",
    action: "socket-update",
    step: "success",
    metadata: { ${resourceName.singular}Id, previousStatus, newStatus, type: "single" },
  })
}

export const emit${ResourceName}Remove = async (
  ${resourceName.singular}Id: string,
  status: ${ResourceName}Status,
): Promise<void> => {
  const io = getSocketServer()
  
  if (!io) {
    return
  }

  io.to(\`${resourcePlural}:\${status}\`).emit("${resourcePlural}:remove", { id: ${resourceName.singular}Id })
  
  resourceLogger.actionFlow({
    resource: "${resourcePlural}",
    action: "socket-remove",
    step: "success",
    metadata: { ${resourceName.singular}Id, status },
  })
}

export const emitBatch${ResourceName}Upsert = async (
  ${resourceName.singular}Ids: string[],
): Promise<void> => {
  const io = getSocketServer()
  
  if (!io) {
    return
  }

  const rows = await Promise.all(
    ${resourceName.singular}Ids.map(id => fetch${ResourceName}Row(id))
  )

  const validRows = rows.filter((row): row is ${ResourceRow} => row !== null)
  
  if (validRows.length === 0) {
    return
  }

  const rowsByStatus = validRows.reduce((acc, row) => {
    const status = resolveStatusFromRow(row)
    if (!acc[status]) {
      acc[status] = []
    }
    acc[status].push(row)
    return acc
  }, {} as Record<${ResourceName}Status, ${ResourceRow}[]>)

  for (const [status, statusRows] of Object.entries(rowsByStatus)) {
    io.to(\`${resourcePlural}:\${status}\`).emit("${resourcePlural}:batch-upsert", statusRows)
  }

  resourceLogger.actionFlow({
    resource: "${resourcePlural}",
    action: "socket-batch-update",
    step: "success",
    metadata: { count: validRows.length },
  })
}
`;
};

/**
 * Generate server/index.ts file content
 */
export const generateServerIndexFile = <_TRow extends { id: string }>(
  config: ServerConfig<_TRow>
) => {
  const { resourceName, prismaModel } = config;
  const ResourceName =
    resourceName.singular.charAt(0).toUpperCase() +
    resourceName.singular.slice(1);
  const ModelName = prismaModel.charAt(0).toUpperCase() + prismaModel.slice(1);

  return `// Queries
export {
  list${ResourceName}s,
  get${ResourceName}ById,
  get${ResourceName}DetailById,
} from "./queries"

// Types are exported from ../types.ts
// export type { List${ResourceName}sInput, Listed${ResourceName}, ${ResourceName}Detail, List${ResourceName}sResult } from "../types"

// Mutations
export {
  create${ResourceName},
  update${ResourceName},
  softDelete${ResourceName},
  hardDelete${ResourceName},
  restore${ResourceName},
  bulkSoftDelete${ResourceName}s,
  bulkRestore${ResourceName}s,
  bulkHardDelete${ResourceName}s,
  type AuthContext,
  ApplicationError,
  NotFoundError,
  type BulkActionResult,
} from "./mutations"

// Schemas
export {
  Create${ResourceName}Schema,
  Update${ResourceName}Schema,
  Bulk${ResourceName}ActionSchema,
  type Create${ResourceName}Input,
  type Update${ResourceName}Input,
  type Bulk${ResourceName}ActionInput,
} from "./schemas"

// Helpers
export {
  map${ResourceName}Record,
  buildWhereClause,
  serialize${ResourceName}ForTable,
  serialize${ResourceName}sList,
  serialize${ResourceName}Detail,
  type ${ModelName}WithRelations,
} from "./helpers"

// Events
export {
  emit${ResourceName}Upsert,
  emit${ResourceName}Remove,
  emitBatch${ResourceName}Upsert,
  type ${ResourceName}Status,
} from "./events"

// Notifications (optional)
// export {
//   notifySuperAdminsOf${ResourceName}Action,
// } from "./notifications"
`;
};

/**
 * Combine server config để generate tất cả server files
 */
export const generateAllServerFiles = <_TRow extends { id: string }>(
  serverConfig: ServerConfig<_TRow>
) => {
  return {
    helpers: generateHelpersFile(serverConfig),
    queries: generateQueriesFile(serverConfig),
    events: generateEventsFile(serverConfig),
    index: generateServerIndexFile(serverConfig),
  };
};
