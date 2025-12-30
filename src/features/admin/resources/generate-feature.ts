/**
 * CLI Script để generate feature admin mới
 *
 * Usage:
 * ```bash
 * npx tsx src/features/admin/resources/generate-feature.ts {resource-name}
 * ```
 *
 * Hoặc import và sử dụng trong code:
 * ```typescript
 * import { generateFeatureFiles } from "@/features/admin/resources/generate-feature"
 * import { articleFeatureConfig, articleServerConfig } from "./article-config"
 *
 * await generateFeatureFiles("article", articleFeatureConfig, articleServerConfig)
 * ```
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import type { AdminFeatureConfig, ServerConfig } from "./index";
import { createFeature, createFeatureConfig } from "./index";

/**
 * Generate và lưu tất cả files cho một feature mới
 */
export async function generateFeatureFiles<
  TRow extends { id: string },
  TFormData extends Record<string, unknown> = Record<string, unknown>
>(
  resourceName: string,
  featureConfig: AdminFeatureConfig<TRow, TFormData>,
  serverConfig: ServerConfig<TRow>,
  outputDir?: string
) {
  const config = createFeatureConfig(featureConfig, serverConfig);
  const files = createFeature(config);

  const baseDir =
    outputDir || join(process.cwd(), "src/features/admin", resourceName);
  const apiBaseDir = outputDir
    ? join(outputDir, "..", "..", "..", "app/api/admin", resourceName)
    : join(process.cwd(), "src/app/api/admin", resourceName);

  // Tạo directories
  const dirs = [
    join(baseDir, "constants"),
    join(baseDir, "hooks"),
    join(baseDir, "server"),
    join(apiBaseDir, "[id]", "restore"),
    join(apiBaseDir, "[id]", "hard-delete"),
    join(apiBaseDir, "bulk"),
  ];

  dirs.forEach((dir) => {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  });

  // Write client files
  writeFileSync(join(baseDir, "constants/messages.ts"), files.messages);
  writeFileSync(join(baseDir, "hooks/index.ts"), files.hooks);
  writeFileSync(join(baseDir, "types.ts"), files.types);

  // Write server files
  writeFileSync(join(baseDir, "server/helpers.ts"), files.helpers);
  writeFileSync(join(baseDir, "server/queries.ts"), files.queries);
  writeFileSync(join(baseDir, "server/events.ts"), files.events);
  writeFileSync(join(baseDir, "server/schemas.ts"), files.schemas);
  writeFileSync(join(baseDir, "server/mutations.ts"), files.mutations);
  writeFileSync(join(baseDir, "server/index.ts"), files.serverIndex);

  // Write API route files
  writeFileSync(join(apiBaseDir, "route.ts"), files.apiRoutes.main);
  writeFileSync(join(apiBaseDir, "[id]/route.ts"), files.apiRoutes.detail);
  writeFileSync(
    join(apiBaseDir, "[id]/restore/route.ts"),
    files.apiRoutes.restore
  );
  writeFileSync(
    join(apiBaseDir, "[id]/hard-delete/route.ts"),
    files.apiRoutes.hardDelete
  );
  writeFileSync(join(apiBaseDir, "bulk/route.ts"), files.apiRoutes.bulk);

  console.log(`✅ Generated all files for ${resourceName} feature`);
  console.log(`📁 Client files: ${baseDir}`);
  console.log(`📁 API routes: ${apiBaseDir}`);
  console.log(`\n✨ All files generated automatically and synchronized from form fields!`);
  console.log(`\n📊 Synchronization:`);
  console.log(`   ✓ Types ← formFields`);
  console.log(`   ✓ Helpers ← formFields`);
  console.log(`   ✓ Schemas ← formFields`);
  console.log(`   ✓ Mutations ← formFields`);
  console.log(`   ✓ Events & Queries ← Helpers (already generated)`);
  console.log(`\n⚠️  Optional adjustments (only if needed):`);
  console.log(`   1. Add unique checks in server/mutations.ts`);
  console.log(`   2. Adjust validation in server/schemas.ts (for complex cases)`);
  console.log(`   3. Custom mapRecord in server/helpers.ts (for complex relations)`);
}

// CLI support
if (require.main === module) {
  const resourceName = process.argv[2];

  if (!resourceName) {
    console.error("Usage: npx tsx generate-feature.ts <resource-name>");
    console.error("Example: npx tsx generate-feature.ts article");
    process.exit(1);
  }

  console.error(
    "⚠️  CLI mode requires config file. Please use the function directly:"
  );
  console.error(
    `   import { generateFeatureFiles } from "@/features/admin/resources/generate-feature"`
  );
  console.error(
    `   import { ${resourceName}FeatureConfig, ${resourceName}ServerConfig } from "./${resourceName}-config"`
  );
  console.error(
    `   await generateFeatureFiles("${resourceName}", ${resourceName}FeatureConfig, ${resourceName}ServerConfig)`
  );
  process.exit(1);
}
