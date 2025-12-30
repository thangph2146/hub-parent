/**
 * Admin Feature Generator - Export tất cả generators và utilities
 *
 * ✨ Chỉ cần định nghĩa API endpoints và form-fields, tất cả sẽ được generate tự động và đồng bộ!
 *
 * 🎯 Single Source of Truth: formFields → Types, Helpers, Schemas, Mutations đều đồng bộ 100%
 *
 * @example
 * ```typescript
 * import { createFeature, createFeatureConfig } from "@/features/admin/resources"
 *
 * const config = createFeatureConfig(featureConfig, serverConfig)
 * const files = createFeature(config)
 * // ✅ Tất cả files đồng bộ từ formFields
 * ```
 */

// Config types
export type { AdminFeatureConfig } from "./config-generator";
export type { ServerConfig } from "./server-generator";
export type { CompleteFeatureConfig, GeneratedFiles } from "./create-feature";

// Main generator function - One-stop để tạo feature mới
export { 
  createFeature, 
  createFeatureConfig, 
  createServerConfigFromFeature,
  createApiEndpoints,
  createFeatureFromMinimal
} from "./create-feature";

// File generators - Client (tự động từ config)
export { generateMessagesFile, generateHooksFile } from "./config-generator";

// File generators - Server (tự động từ config + form fields)
export {
  generateHelpersFile,
  generateQueriesFile,
  generateEventsFile,
  generateServerIndexFile,
  generateAllServerFiles,
} from "./server-generator";

// File generators - Schemas & Mutations (tự động từ form fields)
export { generateSchemasFile } from "./schema-generator";
export { generateMutationsFile } from "./mutations-generator";

// File generators - Types (tự động từ form fields)
export { generateTypesFile } from "./types-generator";

// File generators - API Routes (tự động từ endpoints)
export {
  generateAllApiRouteFiles,
  generateMainRouteFile,
  generateDetailRouteFile,
  generateRestoreRouteFile,
  generateHardDeleteRouteFile,
  generateBulkRouteFile,
} from "./api-route-generator";

// Generate script - Lưu files tự động
export { generateFeatureFiles } from "./generate-feature";

// Field extractor utilities
export {
  extractFieldNames,
  extractSearchFields,
  extractFilterFields,
  getFieldTypeScriptType,
  getPrismaFieldType,
  generateMapRecordFields,
  generateSerializeForTableFields,
  generateSerializeDetailFields,
  generateRowTypeFields,
  generateListedTypeFields,
  generateCreateDataMapping,
  generateUpdateDataMapping,
} from "./field-extractor";
