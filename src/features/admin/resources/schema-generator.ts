/**
 * Schema Generator - Tạo template Zod schemas từ form fields
 * Note: Chỉ generate template, cần điều chỉnh thủ công cho validation phức tạp
 */

import type { ResourceFormField } from "./components";

/**
 * Generate schemas file content từ form fields
 * Tạo template với comments hướng dẫn dựa trên form fields
 */
export const generateSchemasFile = <
  TFormData extends Record<string, unknown> = Record<string, unknown>
>(
  fields: ResourceFormField<TFormData>[],
  resourceName: { singular: string; plural: string }
) => {
  const ResourceName =
    resourceName.singular.charAt(0).toUpperCase() +
    resourceName.singular.slice(1);

  // Generate field examples từ form fields
  const createFields: string[] = [];
  const updateFields: string[] = [];

  for (const field of fields) {
    const fieldName =
      typeof field.name === "string" ? field.name : String(field.name);

    // Skip system fields
    if (
      fieldName === "id" ||
      fieldName === "createdAt" ||
      fieldName === "updatedAt" ||
      fieldName === "deletedAt"
    ) {
      continue;
    }

    const label = field.label || fieldName;
    let createField = "";
    let updateField = "";

    switch (field.type) {
      case "text":
      case "slug":
        if (field.required) {
          createField = `  ${fieldName}: z.string().min(1, "${label} là bắt buộc").max(100, "${label} không được vượt quá 100 ký tự")${
            field.type === "slug"
              ? '.regex(/^[a-z0-9-]+$/, "Slug chỉ được chứa chữ thường, số và dấu gạch ngang")'
              : ""
          },`;
          updateField = `  ${fieldName}: z.string().min(1).max(100)${
            field.type === "slug" ? ".regex(/^[a-z0-9-]+$/)" : ""
          }.optional(),`;
        } else {
          createField = `  ${fieldName}: z.string().max(100).optional(),`;
          updateField = `  ${fieldName}: z.string().max(100).optional(),`;
        }
        break;
      case "email":
        if (field.required) {
          createField = `  ${fieldName}: z.string().email("Email không hợp lệ").min(1, "${label} là bắt buộc"),`;
          updateField = `  ${fieldName}: z.string().email().optional(),`;
        } else {
          createField = `  ${fieldName}: z.string().email().optional(),`;
          updateField = `  ${fieldName}: z.string().email().optional(),`;
        }
        break;
      case "textarea":
        if (field.required) {
          createField = `  ${fieldName}: z.string().min(1, "${label} là bắt buộc").max(500).nullable().optional(),`;
        } else {
          createField = `  ${fieldName}: z.string().max(500).nullable().optional(),`;
        }
        updateField = `  ${fieldName}: z.string().max(500).nullable().optional(),`;
        break;
      case "number":
        if (field.required) {
          createField = `  ${fieldName}: z.number().min(0, "${label} phải lớn hơn hoặc bằng 0"),`;
        } else {
          createField = `  ${fieldName}: z.number().optional(),`;
        }
        updateField = `  ${fieldName}: z.number().optional(),`;
        break;
      case "checkbox":
      case "switch":
        if (field.required) {
          createField = `  ${fieldName}: z.boolean(),`;
        } else {
          createField = `  ${fieldName}: z.boolean().optional(),`;
        }
        updateField = `  ${fieldName}: z.boolean().optional(),`;
        break;
      case "date":
        createField = `  ${fieldName}: z.preprocess((val) => { if (val === null || val === undefined || val === "") return null; if (typeof val === "string") return new Date(val); return val; }, z.date().nullable()).optional(),`;
        updateField = `  ${fieldName}: z.preprocess((val) => { if (val === null || val === undefined || val === "") return null; if (typeof val === "string") return new Date(val); return val; }, z.date().nullable()).optional(),`;
        break;
      case "multiple-select":
        createField = `  ${fieldName}: z.union([z.array(z.string()), z.string()]).optional().transform((val) => { if (!val) return []; if (typeof val === "string") return [val]; return val; }),`;
        updateField = `  ${fieldName}: z.union([z.array(z.string()), z.string()]).optional().transform((val) => { if (!val) return []; if (typeof val === "string") return [val]; return val; }),`;
        break;
      case "editor":
        createField = `  ${fieldName}: z.any(), // Prisma.InputJsonValue`;
        updateField = `  ${fieldName}: z.any().optional(),`;
        break;
      case "image":
      case "avatar":
        createField = `  ${fieldName}: z.string().nullable().optional(),`;
        updateField = `  ${fieldName}: z.string().nullable().optional(),`;
        break;
      default:
        createField = `  ${fieldName}: z.any(), // TODO: Add validation for ${field.type}`;
        updateField = `  ${fieldName}: z.any().optional(),`;
    }

    if (createField) createFields.push(createField);
    if (updateField) updateFields.push(updateField);
  }

  return `import { z } from "zod"

// Schema được generate từ form fields
// Có thể cần điều chỉnh thủ công cho các validation phức tạp

export const Create${ResourceName}Schema = z.object({
${
  createFields.length > 0
    ? createFields.join("\n")
    : "  // TODO: Add fields based on form configuration"
}
})

export const Update${ResourceName}Schema = z.object({
${
  updateFields.length > 0
    ? updateFields.join("\n")
    : "  // TODO: Add fields (all optional) based on form configuration"
}
})

export const Bulk${ResourceName}ActionSchema = z.object({
  action: z.enum(["delete", "restore", "hard-delete"]),
  ids: z.array(z.string().cuid("ID không hợp lệ")).min(1, "Danh sách ID không được trống"),
})

export type Create${ResourceName}Input = z.infer<typeof Create${ResourceName}Schema>
export type Update${ResourceName}Input = z.infer<typeof Update${ResourceName}Schema>
export type Bulk${ResourceName}ActionInput = z.infer<typeof Bulk${ResourceName}ActionSchema>
`;
};
