/**
 * Types Generator - Tạo types.ts file từ config
 * Tự động generate fields từ form fields
 */

import type { ServerConfig } from "./server-generator";
import type { ResourceFormField } from "../components";
import {
  generateRowTypeFields,
  generateListedTypeFields,
} from "./field-extractor";

/**
 * Generate types.ts file content
 */
export const generateTypesFile = <
  _TRow extends { id: string },
  TFormData extends Record<string, unknown> = Record<string, unknown>
>(
  config: ServerConfig<_TRow>,
  formFields?: ResourceFormField<TFormData>[]
) => {
  const { resourceName } = config;
  const ResourceName =
    resourceName.singular.charAt(0).toUpperCase() +
    resourceName.singular.slice(1);

  // Generate fields từ form fields nếu có
  const rowFields = formFields
    ? generateRowTypeFields(formFields)
    : `  // TODO: Add your fields here based on Prisma schema
  // Example:
  // name: string
  // slug: string
  // description: string | null`;

  const listedFields = formFields
    ? generateListedTypeFields(formFields)
    : `  // TODO: Add your fields here (matching Prisma model)
  // Example:
  // name: string
  // slug: string
  // description: string | null`;

  return `import type { ResourceResponse, BaseResourceTableClientProps, ResourcePagination, BulkActionResult } from "@/features/admin/resources/types"

export interface ${ResourceName}Row {
  id: string
${rowFields}
}

export type ${ResourceName}sTableClientProps = BaseResourceTableClientProps<${ResourceName}Row>

export type ${ResourceName}sResponse = ResourceResponse<${ResourceName}Row>

export interface List${ResourceName}sInput {
  page?: number
  limit?: number
  search?: string
  filters?: Record<string, string>
  status?: "active" | "deleted" | "all"
}

export interface Listed${ResourceName} {
  id: string
${listedFields}
}

export type ${ResourceName}Detail = Listed${ResourceName}

export interface List${ResourceName}sResult {
  data: Listed${ResourceName}[]
  pagination: ResourcePagination
}

// Types are now exported from schemas.ts
export type { Create${ResourceName}Input, Update${ResourceName}Input, Bulk${ResourceName}ActionInput } from "./server/schemas"

export type { BulkActionResult }
`;
};
