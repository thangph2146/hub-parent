/**
 * Field Extractor - Tự động extract và map fields từ form fields
 * Giúp generate code tự động từ form fields config
 */

import type { ResourceFormField } from "./components";

/**
 * Extract field names từ form fields (bỏ qua system fields)
 */
export const extractFieldNames = <
  TFormData extends Record<string, unknown> = Record<string, unknown>
>(
  fields: ResourceFormField<TFormData>[]
): string[] => {
  const fieldNames: string[] = [];
  const systemFields = new Set(["id", "createdAt", "updatedAt", "deletedAt"]);

  for (const field of fields) {
    const fieldName =
      typeof field.name === "string" ? field.name : String(field.name);
    if (!systemFields.has(fieldName)) {
      fieldNames.push(fieldName);
    }
  }

  return fieldNames;
};

/**
 * Tự động extract search fields từ form fields
 * 
 * ✨ Tự động chọn các field phù hợp để search (text, slug, email)
 * 
 * @example
 * ```typescript
 * const searchFields = extractSearchFields(formFields)
 * // Tự động trả về ["title", "slug", "email"] từ các field type text, slug, email
 * ```
 */
export const extractSearchFields = <
  TFormData extends Record<string, unknown> = Record<string, unknown>
>(
  fields: ResourceFormField<TFormData>[]
): string[] => {
  const searchFields: string[] = [];
  const systemFields = new Set(["id", "createdAt", "updatedAt", "deletedAt"]);
  const searchableTypes = new Set(["text", "slug", "email"]);

  for (const field of fields) {
    const fieldName =
      typeof field.name === "string" ? field.name : String(field.name);
    if (
      !systemFields.has(fieldName) &&
      searchableTypes.has(field.type) &&
      field.type !== "editor" // Bỏ qua editor vì quá lớn
    ) {
      searchFields.push(fieldName);
    }
  }

  return searchFields;
};

/**
 * Tự động extract filter fields từ form fields
 * 
 * ✨ Tự động tạo filter fields từ các field phù hợp
 * 
 * @example
 * ```typescript
 * const filterFields = extractFilterFields(formFields)
 * // Tự động trả về filter fields từ text, boolean, date fields
 * ```
 */
export const extractFilterFields = <
  TFormData extends Record<string, unknown> = Record<string, unknown>
>(
  fields: ResourceFormField<TFormData>[]
): Array<{ name: string; type: "string" | "boolean" | "date" | "status" }> => {
  const filterFields: Array<{ name: string; type: "string" | "boolean" | "date" | "status" }> = [];
  const systemFields = new Set(["id", "createdAt", "updatedAt", "deletedAt"]);

  for (const field of fields) {
    const fieldName =
      typeof field.name === "string" ? field.name : String(field.name);
    if (systemFields.has(fieldName)) {
      continue;
    }

    // Map field types to filter types
    if (field.type === "text" || field.type === "slug" || field.type === "email") {
      filterFields.push({ name: fieldName, type: "string" });
    } else if (field.type === "checkbox" || field.type === "switch") {
      filterFields.push({ name: fieldName, type: "boolean" });
    } else if (field.type === "date") {
      filterFields.push({ name: fieldName, type: "date" });
    }
  }

  return filterFields;
};

/**
 * Get TypeScript type từ field type
 */
export const getFieldTypeScriptType = <
  TFormData extends Record<string, unknown> = Record<string, unknown>
>(
  field: ResourceFormField<TFormData>
): string => {
  switch (field.type) {
    case "text":
    case "slug":
    case "email":
    case "password":
      return "string";
    case "textarea":
    case "editor":
      return "string | null";
    case "number":
      return "number";
    case "checkbox":
    case "switch":
      return "boolean";
    case "date":
      return "Date | null";
    case "select":
    case "multiple-select":
      return "string[]";
    case "image":
    case "avatar":
      return "string | null";
    default:
      return "unknown";
  }
};

/**
 * Get Prisma field type từ field type (cho Date fields)
 */
export const getPrismaFieldType = <
  TFormData extends Record<string, unknown> = Record<string, unknown>
>(
  field: ResourceFormField<TFormData>
): "Date" | "string" | "number" | "boolean" | "Json" => {
  switch (field.type) {
    case "date":
      return "Date";
    case "number":
      return "number";
    case "checkbox":
    case "switch":
      return "boolean";
    case "editor":
      return "Json";
    default:
      return "string";
  }
};

/**
 * Generate field mapping cho mapRecord function
 */
export const generateMapRecordFields = <
  TFormData extends Record<string, unknown> = Record<string, unknown>
>(
  fields: ResourceFormField<TFormData>[],
  prismaModelVar: string
): string => {
  const fieldMappings: string[] = [];
  const systemFields = new Set(["id", "createdAt", "updatedAt", "deletedAt"]);

  for (const field of fields) {
    const fieldName =
      typeof field.name === "string" ? field.name : String(field.name);
    if (systemFields.has(fieldName)) {
      continue;
    }

    // Map field từ Prisma model
    fieldMappings.push(`    ${fieldName}: ${prismaModelVar}.${fieldName},`);
  }

  // Thêm system fields
  fieldMappings.push(`    createdAt: ${prismaModelVar}.createdAt,`);
  fieldMappings.push(`    updatedAt: ${prismaModelVar}.updatedAt,`);
  fieldMappings.push(`    deletedAt: ${prismaModelVar}.deletedAt,`);

  return fieldMappings.join("\n");
};

/**
 * Generate field mapping cho serializeForTable function
 */
export const generateSerializeForTableFields = <
  TFormData extends Record<string, unknown> = Record<string, unknown>
>(
  fields: ResourceFormField<TFormData>[],
  resourceVar: string
): string => {
  const fieldMappings: string[] = [];
  const systemFields = new Set(["id", "createdAt", "updatedAt", "deletedAt"]);

  for (const field of fields) {
    const fieldName =
      typeof field.name === "string" ? field.name : String(field.name);
    if (systemFields.has(fieldName)) {
      continue;
    }

    // Map field từ ListedResource (Date) sang string
    if (field.type === "date") {
      fieldMappings.push(
        `    ${fieldName}: serializeDate(${resourceVar}.${fieldName}),`
      );
    } else {
      fieldMappings.push(`    ${fieldName}: ${resourceVar}.${fieldName},`);
    }
  }

  // Thêm system fields
  fieldMappings.push(
    `    createdAt: serializeDate(${resourceVar}.createdAt)!,`
  );
  fieldMappings.push(
    `    updatedAt: serializeDate(${resourceVar}.updatedAt) ?? undefined,`
  );
  fieldMappings.push(`    deletedAt: serializeDate(${resourceVar}.deletedAt),`);

  return fieldMappings.join("\n");
};

/**
 * Generate field mapping cho serializeDetail function
 */
export const generateSerializeDetailFields = <
  TFormData extends Record<string, unknown> = Record<string, unknown>
>(
  fields: ResourceFormField<TFormData>[],
  resourceVar: string
): string => {
  const fieldMappings: string[] = [];
  const systemFields = new Set(["id", "createdAt", "updatedAt", "deletedAt"]);

  for (const field of fields) {
    const fieldName =
      typeof field.name === "string" ? field.name : String(field.name);
    if (systemFields.has(fieldName)) {
      continue;
    }

    // Map field từ Detail (Date) sang string
    if (field.type === "date") {
      fieldMappings.push(
        `    ${fieldName}: serializeDate(${resourceVar}.${fieldName})!,`
      );
    } else {
      fieldMappings.push(`    ${fieldName}: ${resourceVar}.${fieldName},`);
    }
  }

  // Thêm system fields
  fieldMappings.push(
    `    createdAt: serializeDate(${resourceVar}.createdAt)!,`
  );
  fieldMappings.push(
    `    updatedAt: serializeDate(${resourceVar}.updatedAt)!,`
  );
  fieldMappings.push(`    deletedAt: serializeDate(${resourceVar}.deletedAt),`);

  return fieldMappings.join("\n");
};

/**
 * Generate field definitions cho TypeScript interface (Row type)
 */
export const generateRowTypeFields = <
  TFormData extends Record<string, unknown> = Record<string, unknown>
>(
  fields: ResourceFormField<TFormData>[]
): string => {
  const fieldDefs: string[] = [];
  const systemFields = new Set(["id", "createdAt", "updatedAt", "deletedAt"]);

  for (const field of fields) {
    const fieldName =
      typeof field.name === "string" ? field.name : String(field.name);
    if (systemFields.has(fieldName)) {
      continue;
    }

    const tsType = getFieldTypeScriptType(field);
    // Convert Date | null to string | null for Row type
    const rowType = tsType
      .replace(/Date \| null/g, "string | null")
      .replace(/Date/g, "string");
    fieldDefs.push(`  ${fieldName}: ${rowType}`);
  }

  // Thêm system fields
  fieldDefs.push(`  createdAt: string`);
  fieldDefs.push(`  updatedAt?: string`);
  fieldDefs.push(`  deletedAt: string | null`);

  return fieldDefs.join("\n");
};

/**
 * Generate field definitions cho TypeScript interface (Listed type)
 */
export const generateListedTypeFields = <
  TFormData extends Record<string, unknown> = Record<string, unknown>
>(
  fields: ResourceFormField<TFormData>[]
): string => {
  const fieldDefs: string[] = [];
  const systemFields = new Set(["id", "createdAt", "updatedAt", "deletedAt"]);

  for (const field of fields) {
    const fieldName =
      typeof field.name === "string" ? field.name : String(field.name);
    if (systemFields.has(fieldName)) {
      continue;
    }

    const tsType = getFieldTypeScriptType(field);
    // Convert to Date for Listed type
    const listedType = tsType
      .replace(/string \| null/g, "string | null")
      .replace(/string/g, "string");
    // Keep Date fields as Date
    if (field.type === "date") {
      fieldDefs.push(`  ${fieldName}: Date | null`);
    } else {
      fieldDefs.push(`  ${fieldName}: ${listedType}`);
    }
  }

  // Thêm system fields
  fieldDefs.push(`  createdAt: Date`);
  fieldDefs.push(`  updatedAt: Date`);
  fieldDefs.push(`  deletedAt: Date | null`);

  return fieldDefs.join("\n");
};

/**
 * Generate Prisma data mapping cho create mutation
 */
export const generateCreateDataMapping = <
  TFormData extends Record<string, unknown> = Record<string, unknown>
>(
  fields: ResourceFormField<TFormData>[],
  inputVar: string = "validatedInput"
): string => {
  const mappings: string[] = [];
  const systemFields = new Set(["id", "createdAt", "updatedAt", "deletedAt"]);

  for (const field of fields) {
    const fieldName =
      typeof field.name === "string" ? field.name : String(field.name);
    if (systemFields.has(fieldName)) {
      continue;
    }

    // Generate mapping based on field type
    if (
      field.type === "text" ||
      field.type === "slug" ||
      field.type === "email"
    ) {
      const optional = field.required ? "" : "?";
      mappings.push(
        `      ${fieldName}: ${inputVar}.${fieldName}${optional}.trim(),`
      );
    } else if (field.type === "textarea") {
      const optional = field.required ? "" : "?";
      mappings.push(
        `      ${fieldName}: ${inputVar}.${fieldName}${optional}?.trim() || null,`
      );
    } else if (field.type === "number") {
      mappings.push(`      ${fieldName}: ${inputVar}.${fieldName},`);
    } else if (field.type === "checkbox" || field.type === "switch") {
      mappings.push(`      ${fieldName}: ${inputVar}.${fieldName} ?? false,`);
    } else if (field.type === "date") {
      mappings.push(`      ${fieldName}: ${inputVar}.${fieldName} || null,`);
    } else if (field.type === "multiple-select") {
      mappings.push(`      ${fieldName}: ${inputVar}.${fieldName} || [],`);
    } else if (field.type === "editor") {
      mappings.push(`      ${fieldName}: ${inputVar}.${fieldName},`);
    } else if (field.type === "image" || field.type === "avatar") {
      mappings.push(`      ${fieldName}: ${inputVar}.${fieldName} || null,`);
    } else {
      mappings.push(`      ${fieldName}: ${inputVar}.${fieldName},`);
    }
  }

  return mappings.join("\n");
};

/**
 * Generate Prisma update data mapping cho update mutation
 */
export const generateUpdateDataMapping = <
  TFormData extends Record<string, unknown> = Record<string, unknown>
>(
  fields: ResourceFormField<TFormData>[],
  inputVar: string = "validatedInput",
  updateDataVar: string = "updateData"
): string => {
  const mappings: string[] = [];
  const systemFields = new Set(["id", "createdAt", "updatedAt", "deletedAt"]);

  for (const field of fields) {
    const fieldName =
      typeof field.name === "string" ? field.name : String(field.name);
    if (systemFields.has(fieldName)) {
      continue;
    }

    // Generate conditional mapping
    if (
      field.type === "text" ||
      field.type === "slug" ||
      field.type === "email"
    ) {
      mappings.push(`  if (${inputVar}.${fieldName} !== undefined) {`);
      mappings.push(
        `    ${updateDataVar}.${fieldName} = ${inputVar}.${fieldName}.trim()`
      );
      mappings.push(`  }`);
    } else if (field.type === "textarea") {
      mappings.push(`  if (${inputVar}.${fieldName} !== undefined) {`);
      mappings.push(
        `    ${updateDataVar}.${fieldName} = ${inputVar}.${fieldName}?.trim() || null`
      );
      mappings.push(`  }`);
    } else if (field.type === "number") {
      mappings.push(`  if (${inputVar}.${fieldName} !== undefined) {`);
      mappings.push(
        `    ${updateDataVar}.${fieldName} = ${inputVar}.${fieldName}`
      );
      mappings.push(`  }`);
    } else if (field.type === "checkbox" || field.type === "switch") {
      mappings.push(`  if (${inputVar}.${fieldName} !== undefined) {`);
      mappings.push(
        `    ${updateDataVar}.${fieldName} = ${inputVar}.${fieldName}`
      );
      mappings.push(`  }`);
    } else if (field.type === "date") {
      mappings.push(`  if (${inputVar}.${fieldName} !== undefined) {`);
      mappings.push(
        `    ${updateDataVar}.${fieldName} = ${inputVar}.${fieldName} || null`
      );
      mappings.push(`  }`);
    } else if (field.type === "multiple-select") {
      mappings.push(`  if (${inputVar}.${fieldName} !== undefined) {`);
      mappings.push(
        `    ${updateDataVar}.${fieldName} = ${inputVar}.${fieldName} || []`
      );
      mappings.push(`  }`);
    } else if (field.type === "editor") {
      mappings.push(`  if (${inputVar}.${fieldName} !== undefined) {`);
      mappings.push(
        `    ${updateDataVar}.${fieldName} = ${inputVar}.${fieldName}`
      );
      mappings.push(`  }`);
    } else if (field.type === "image" || field.type === "avatar") {
      mappings.push(`  if (${inputVar}.${fieldName} !== undefined) {`);
      mappings.push(
        `    ${updateDataVar}.${fieldName} = ${inputVar}.${fieldName} || null`
      );
      mappings.push(`  }`);
    } else {
      mappings.push(`  if (${inputVar}.${fieldName} !== undefined) {`);
      mappings.push(
        `    ${updateDataVar}.${fieldName} = ${inputVar}.${fieldName}`
      );
      mappings.push(`  }`);
    }
  }

  return mappings.join("\n");
};
