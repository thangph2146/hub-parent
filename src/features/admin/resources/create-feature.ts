/**
 * Create Feature - One-stop function để tạo feature admin mới
 *
 * ✨ Chỉ cần cung cấp API endpoints và form-fields, tất cả files sẽ được generate tự động!
 *
 * 🎯 Single Source of Truth: formFields → Types, Helpers, Schemas, Mutations đều đồng bộ 100%
 * ✅ Events & Queries tự động sử dụng Helpers đã generate → Đảm bảo hoạt động chính xác
 *
 * Luồng đồng bộ:
 * - Types ← formFields (Row, Listed, Detail types)
 * - Helpers ← formFields (mapRecord, serializeForTable, serializeDetail)
 * - Schemas ← formFields (CreateSchema, UpdateSchema validation)
 * - Mutations ← formFields + Schemas (data mapping từ validatedInput)
 * - Queries ← Helpers (sử dụng mapRecord từ helpers)
 * - Events ← Helpers (sử dụng mapRecord, serializeForTable từ helpers)
 * - API Routes ← config (endpoints + server functions)
 *
 * @example
 * ```typescript
 * const config = createFeatureConfig(featureConfig, serverConfig)
 * const files = createFeature(config)
 * // ✅ Tất cả files đồng bộ từ formFields
 * // ✅ Events → Helpers → Mutations → Queries hoạt động chính xác
 * ```
 */

import { logger } from "@/lib/config/logger";
import type { AdminFeatureConfig } from "./config-generator";
import type { ServerConfig } from "./server-generator";
import type { ResourceFormField, ResourceFormSection } from "./components";
import { extractSearchFields, extractFilterFields } from "./field-extractor";
import {
  generateHelpersFile,
  generateQueriesFile,
  generateEventsFile,
  generateServerIndexFile,
} from "./server-generator";
import { generateMessagesFile, generateHooksFile } from "./config-generator";
import { generateSchemasFile } from "./schema-generator";
import { generateMutationsFile } from "./mutations-generator";
import { generateAllApiRouteFiles } from "./api-route-generator";
import { generateTypesFile } from "./types-generator";

/**
 * Complete Feature Config - Kết hợp tất cả config cần thiết
 */
export interface CompleteFeatureConfig<
  TRow extends { id: string },
  TFormData extends Record<string, unknown> = Record<string, unknown>
> {
  // Feature config (API endpoints + form fields)
  feature: AdminFeatureConfig<TRow, TFormData>;

  // Server config (Prisma model + search fields)
  server: ServerConfig<TRow>;
}

/**
 * Generated Files - Tất cả files được generate
 */
export interface GeneratedFiles {
  // Client files
  messages: string; // constants/messages.ts
  hooks: string; // hooks/index.ts hoặc hooks/use-{resource}-actions.ts
  types: string; // types.ts

  // Server files
  helpers: string; // server/helpers.ts
  queries: string; // server/queries.ts
  events: string; // server/events.ts
  schemas: string; // server/schemas.ts
  mutations: string; // server/mutations.ts
  serverIndex: string; // server/index.ts

  // API Route files
  apiRoutes: {
    main: string; // app/api/admin/{resource}/route.ts
    detail: string; // app/api/admin/{resource}/[id]/route.ts
    restore: string; // app/api/admin/{resource}/[id]/restore/route.ts
    hardDelete: string; // app/api/admin/{resource}/[id]/hard-delete/route.ts
    bulk: string; // app/api/admin/{resource}/bulk/route.ts
  };
}

/**
 * Tạo tất cả files cần thiết cho một feature admin mới
 *
 * Xem README.md để xem ví dụ sử dụng
 */
export const createFeature = <
  TRow extends { id: string },
  TFormData extends Record<string, unknown> = Record<string, unknown>
>(
  config: CompleteFeatureConfig<TRow, TFormData>
): GeneratedFiles => {
  const { feature, server } = config;

  // Single source of truth: formFields - đảm bảo tính đồng bộ 100%
  const formFields = feature.formFields.fields;

  // Type casts để tránh type errors
  const featureForMessages = feature as AdminFeatureConfig<TRow>;
  const featureForHooks = feature as AdminFeatureConfig<TRow, TFormData>;

  return {
    // Client files - Tự động từ config
    messages: generateMessagesFile<TRow>(featureForMessages),
    hooks: generateHooksFile<TRow, TFormData>(featureForHooks),
    
    // Types - Tự động từ formFields (Row, Listed, Detail)
    types: generateTypesFile(server, formFields),

    // Server files - Tất cả đồng bộ từ formFields
    // Helpers: mapRecord, serializeForTable, serializeDetail ← formFields
    helpers: generateHelpersFile(server, formFields),
    
    // Queries: Sử dụng mapRecord từ helpers (đã generate) ✅
    queries: generateQueriesFile(server),
    
    // Events: Sử dụng mapRecord, serializeForTable từ helpers (đã generate) ✅
    events: generateEventsFile(server),
    
    // Schemas: Validation ← formFields
    schemas: generateSchemasFile(formFields, server.resourceName),
    
    // Mutations: Data mapping ← formFields + Schemas ✅
    mutations: generateMutationsFile(server, formFields),
    
    // Server index: Export tất cả
    serverIndex: generateServerIndexFile(server),

    // API Route files - Tự động từ endpoints
    apiRoutes: generateAllApiRouteFiles(featureForMessages, server),
  };
};

/**
 * Helper để tạo config object từ feature config và server config
 *
 * ✨ Tự động validate và đảm bảo đồng bộ giữa feature config và server config
 *
 * @example
 * ```typescript
 * const config = createFeatureConfig(featureConfig, serverConfig)
 * const files = createFeature(config)
 * ```
 */
export const createFeatureConfig = <
  TRow extends { id: string },
  TFormData extends Record<string, unknown> = Record<string, unknown>
>(
  feature: AdminFeatureConfig<TRow, TFormData>,
  server: ServerConfig<TRow>
): CompleteFeatureConfig<TRow, TFormData> => {
  // Validate: Đảm bảo resourceName khớp nhau
  if (feature.resourceName.singular !== server.resourceName.singular) {
    logger.warn("Resource name mismatch", {
      feature: feature.resourceName.singular,
      server: server.resourceName.singular,
    });
  }

  // Validate: Đảm bảo formFields có fields
  if (!feature.formFields?.fields || feature.formFields.fields.length === 0) {
    logger.warn("No form fields defined. Types, Helpers, Schemas, and Mutations will be generated with TODO comments.");
  }

  return { feature, server };
};

/**
 * Helper để tự động tạo API endpoints từ resource name
 * 
 * ✨ Tự động tạo tất cả endpoints từ resource name - không cần viết thủ công!
 * 
 * @example
 * ```typescript
 * const endpoints = createApiEndpoints("article", "articles")
 * // Tự động tạo: /api/admin/articles, /api/admin/articles/:id, etc.
 * ```
 */
export const createApiEndpoints = (
  singular: string,
  plural: string
): AdminFeatureConfig<{ id: string }>["apiEndpoints"] => {
  const basePath = `/api/admin/${plural}`;
  return {
    list: basePath,
    detail: (id: string) => `${basePath}/${id}`,
    create: basePath,
    update: (id: string) => `${basePath}/${id}`,
    delete: (id: string) => `${basePath}/${id}`,
    restore: (id: string) => `${basePath}/${id}/restore`,
    hardDelete: (id: string) => `${basePath}/${id}/hard-delete`,
    bulk: `${basePath}/bulk`,
  };
};

/**
 * Helper để tự động tạo server config từ feature config
 * 
 * ✨ Giúp đơn giản hóa việc tạo feature mới - chỉ cần feature config!
 * 
 * @example
 * ```typescript
 * const featureConfig = { ... }
 * const serverConfig = createServerConfigFromFeature(featureConfig, {
 *   prismaModel: "article",
 *   searchFields: ["title", "slug"]
 * })
 * const config = createFeatureConfig(featureConfig, serverConfig)
 * const files = createFeature(config)
 * ```
 */
export const createServerConfigFromFeature = <
  TRow extends { id: string },
  TFormData extends Record<string, unknown> = Record<string, unknown>
>(
  feature: AdminFeatureConfig<TRow, TFormData>,
  options: {
    prismaModel: string;
    searchFields: string[];
    filterFields?: Array<{ name: string; type: "string" | "boolean" | "date" | "status" }>;
    includeRelations?: Record<string, unknown>;
  }
): ServerConfig<TRow> => {
  return {
    prismaModel: options.prismaModel,
    resourceName: feature.resourceName,
    searchFields: options.searchFields,
    filterFields: options.filterFields,
    includeRelations: options.includeRelations,
  };
};

/**
 * One-liner helper để tạo feature từ minimal config
 * 
 * ✨ Chỉ cần: resource name, form fields, prisma model!
 * Tự động tạo: API endpoints, search fields, filter fields, server config!
 * 
 * @example
 * ```typescript
 * const files = createFeatureFromMinimal({
 *   resourceName: { singular: "article", plural: "articles", displayName: "Bài viết" },
 *   formFields: { sections: [...], fields: [...] },
 *   getRecordName: (row) => row.title,
 *   prismaModel: "article",
 *   // searchFields và filterFields tự động extract từ form fields!
 * })
 * ```
 */
export const createFeatureFromMinimal = <
  TRow extends { id: string },
  TFormData extends Record<string, unknown> = Record<string, unknown>
>(params: {
  resourceName: {
    singular: string;
    plural: string;
    displayName: string;
  };
  formFields: {
    sections: ResourceFormSection[];
    fields: ResourceFormField<TFormData>[];
  };
  getRecordName: (row: TRow) => string;
  prismaModel: string;
  searchFields?: string[]; // Optional - tự động extract nếu không cung cấp
  filterFields?: Array<{ name: string; type: "string" | "boolean" | "date" | "status" }>; // Optional - tự động extract nếu không cung cấp
  includeRelations?: Record<string, unknown>;
  messages?: AdminFeatureConfig<TRow>["messages"];
  hasToggleStatus?: boolean;
  toggleStatusConfig?: AdminFeatureConfig<TRow>["toggleStatusConfig"];
}): GeneratedFiles => {
  // Tự động tạo API endpoints
  const apiEndpoints = createApiEndpoints(params.resourceName.singular, params.resourceName.plural);

  // Tự động extract search fields nếu không cung cấp
  const searchFields = params.searchFields || extractSearchFields(params.formFields.fields);
  
  // Tự động extract filter fields nếu không cung cấp
  const filterFields = params.filterFields || extractFilterFields(params.formFields.fields);

  // Tạo feature config
  const featureConfig: AdminFeatureConfig<TRow, TFormData> = {
    resourceName: params.resourceName,
    apiEndpoints,
    formFields: params.formFields,
    getRecordName: params.getRecordName,
    messages: params.messages,
    hasToggleStatus: params.hasToggleStatus,
    toggleStatusConfig: params.toggleStatusConfig,
  };

  // Tự động tạo server config
  const serverConfig = createServerConfigFromFeature(featureConfig, {
    prismaModel: params.prismaModel,
    searchFields,
    filterFields,
    includeRelations: params.includeRelations,
  });

  // Tạo complete config và generate files
  const config = createFeatureConfig(featureConfig, serverConfig);
  return createFeature(config);
};
