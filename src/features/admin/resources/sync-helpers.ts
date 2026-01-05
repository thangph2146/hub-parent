/**
 * Sync Helpers - Tự động generate code snippets để sync query keys và API routes
 * 
 * ✨ Giúp developer chỉ cần copy-paste code snippets vào query-keys.ts và api/routes.ts
 * 
 * Khi tạo feature mới, chỉ cần:
 * 1. Định nghĩa API endpoints và form-fields trong config
 * 2. Generate files bằng createFeature
 * 3. Copy-paste code snippets từ sync helpers vào query-keys.ts và api/routes.ts
 */

import type { AdminFeatureConfig } from "./config-generator";

/**
 * Generate query keys code snippet để thêm vào query-keys.ts
 * 
 * @example
 * ```typescript
 * const snippet = generateQueryKeysSnippet({
 *   resourceName: { plural: "articles" }
 * })
 * // Returns: "adminArticles: createAdminResourceKeys(\"adminArticles\"),"
 * ```
 */
export const generateQueryKeysSnippet = (
  config: Pick<AdminFeatureConfig<{ id: string }>, "resourceName">
): string => {
  const { plural } = config.resourceName;
  const queryKeyName = `admin${plural.charAt(0).toUpperCase() + plural.slice(1)}`;
  
  return `  ${queryKeyName}: createAdminResourceKeys("${queryKeyName}"),`;
};

/**
 * Generate API routes code snippet để thêm vào api/routes.ts
 * 
 * @example
 * ```typescript
 * const snippet = generateApiRoutesSnippet({
 *   resourceName: { plural: "articles" }
 * })
 * // Returns: "articles: getResourceRoutesOrFallback(\"articles\", \"articles\"),"
 * ```
 */
export const generateApiRoutesSnippet = (
  config: Pick<AdminFeatureConfig<{ id: string }>, "resourceName">
): string => {
  const { plural } = config.resourceName;
  
  return `  ${plural}: getResourceRoutesOrFallback("${plural}", "${plural}"),`;
};

/**
 * Generate sync instructions cho developer
 * 
 * @example
 * ```typescript
 * const instructions = generateSyncInstructions({
 *   resourceName: { plural: "articles", displayName: "Bài viết" }
 * })
 * ```
 */
export const generateSyncInstructions = (
  config: Pick<AdminFeatureConfig<{ id: string }>, "resourceName">
): string => {
  const queryKeysSnippet = generateQueryKeysSnippet(config);
  const apiRoutesSnippet = generateApiRoutesSnippet(config);
  const { plural, displayName } = config.resourceName;
  
  return `
📋 Sync Instructions cho ${displayName} (${plural})

1. Thêm query keys vào src/lib/query-keys.ts:
   Tìm dòng "// Admin resource query keys (using factory pattern)" và thêm:
   
   ${queryKeysSnippet}

2. Thêm API routes vào src/lib/api/routes.ts:
   Tìm dòng "// Explicitly add resource routes..." và thêm:
   
   ${apiRoutesSnippet}

3. (Optional) Thêm route config vào src/lib/permissions/route-config.ts:
   Nếu cần custom permissions, thêm vào ROUTE_CONFIG:
   
   ...generateResourceRoutes({
     name: "${plural}",
     permissions: {
       view: PERMISSIONS.${plural.toUpperCase()}_VIEW,
       create: PERMISSIONS.${plural.toUpperCase()}_CREATE,
       update: PERMISSIONS.${plural.toUpperCase()}_UPDATE,
       delete: PERMISSIONS.${plural.toUpperCase()}_DELETE,
       manage: PERMISSIONS.${plural.toUpperCase()}_MANAGE,
     },
     adminApi: true,
   }),

✅ Sau khi sync, tất cả hooks, mutations, queries sẽ hoạt động tự động!
`;
};

/**
 * Generate tất cả sync code snippets từ feature config
 */
export const generateAllSyncSnippets = <TRow extends { id: string }>(
  config: AdminFeatureConfig<TRow>
): {
  queryKeys: string;
  apiRoutes: string;
  instructions: string;
} => {
  return {
    queryKeys: generateQueryKeysSnippet(config),
    apiRoutes: generateApiRoutesSnippet(config),
    instructions: generateSyncInstructions(config),
  };
};
