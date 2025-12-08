import { z } from "zod"

export const createProductSchema = z.object({
  name: z.string().min(1, "Tên sản phẩm là bắt buộc"),
  slug: z.string().min(1, "Slug là bắt buộc"),
  description: z.any().optional().nullable(), // SerializedEditorState hoặc string
  shortDescription: z.string().optional().nullable(),
  sku: z.string().min(1, "SKU là bắt buộc"),
  price: z.string().or(z.number()).transform((val) => {
    if (typeof val === "string") return parseFloat(val)
    return val
  }),
  compareAtPrice: z.string().or(z.number()).optional().nullable().transform((val) => {
    if (!val) return null
    if (typeof val === "string") return parseFloat(val)
    return val
  }),
  cost: z.string().or(z.number()).optional().nullable().transform((val) => {
    if (!val) return null
    if (typeof val === "string") return parseFloat(val)
    return val
  }),
  stock: z.number().int().min(0).default(0),
  trackInventory: z.boolean().optional().default(true),
  weight: z.string().or(z.number()).optional().nullable().transform((val) => {
    if (!val) return null
    if (typeof val === "string") return parseFloat(val)
    return val
  }),
  status: z.enum(["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"]).optional().default("DRAFT"),
  featured: z.boolean().optional().default(false),
  categoryIds: z.union([z.array(z.string()), z.string()]).optional().transform((val) => {
    if (!val) return []
    if (typeof val === "string") return [val]
    return val
  }),
  images: z.array(z.object({
    url: z.string(),
    alt: z.string().optional().nullable(),
    order: z.number().int().default(0),
    isPrimary: z.boolean().default(false),
  })).optional().default([]),
  specifications: z.record(z.string(), z.unknown()).optional().nullable(), // JSON object
  relatedProductIds: z.array(z.string()).optional().default([]),
  bundleProductIds: z.array(z.string()).optional().default([]),
  variants: z.array(z.object({
    id: z.string().optional(),
    name: z.string(),
    value: z.string().optional().nullable(),
    type: z.enum(["version", "color", "size"]),
    price: z.string().or(z.number()).optional().nullable().transform((val) => {
      if (!val) return null
      if (typeof val === "string") return parseFloat(val)
      return val
    }),
    sku: z.string().optional().nullable(),
    stock: z.number().int().optional().nullable(),
    imageUrl: z.string().optional().nullable(),
    order: z.number().int().default(0),
    isDefault: z.boolean().default(false),
  })).optional().default([]),
})

export const updateProductSchema = z.object({
  name: z.string().optional(),
  slug: z.string().optional(),
  description: z.any().optional().nullable(), // SerializedEditorState hoặc string
  shortDescription: z.string().optional().nullable(),
  sku: z.string().optional(),
  price: z.string().or(z.number()).optional().transform((val) => {
    if (val === undefined) return undefined
    if (typeof val === "string") return parseFloat(val)
    return val
  }),
  compareAtPrice: z.string().or(z.number()).optional().nullable().transform((val) => {
    if (val === undefined) return undefined
    if (!val) return null
    if (typeof val === "string") return parseFloat(val)
    return val
  }),
  cost: z.string().or(z.number()).optional().nullable().transform((val) => {
    if (val === undefined) return undefined
    if (!val) return null
    if (typeof val === "string") return parseFloat(val)
    return val
  }),
  stock: z.number().int().min(0).optional(),
  trackInventory: z.boolean().optional(),
  weight: z.string().or(z.number()).optional().nullable().transform((val) => {
    if (val === undefined) return undefined
    if (!val) return null
    if (typeof val === "string") return parseFloat(val)
    return val
  }),
  status: z.enum(["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"]).optional(),
  featured: z.boolean().optional(),
  categoryIds: z.union([z.array(z.string()), z.string()]).optional().transform((val) => {
    if (val === undefined) return undefined
    if (!val) return []
    if (typeof val === "string") return [val]
    return val
  }),
  images: z.array(z.object({
    url: z.string(),
    alt: z.string().optional().nullable(),
    order: z.number().int().default(0),
    isPrimary: z.boolean().default(false),
  })).optional(),
  specifications: z.record(z.string(), z.unknown()).optional().nullable(), // JSON object
  relatedProductIds: z.array(z.string()).optional(),
  bundleProductIds: z.array(z.string()).optional(),
  variants: z.array(z.object({
    id: z.string().optional(),
    name: z.string(),
    value: z.string().optional().nullable(),
    type: z.enum(["version", "color", "size"]),
    price: z.string().or(z.number()).optional().nullable().transform((val) => {
      if (val === undefined) return undefined
      if (!val) return null
      if (typeof val === "string") return parseFloat(val)
      return val
    }),
    sku: z.string().optional().nullable(),
    stock: z.number().int().optional().nullable(),
    imageUrl: z.string().optional().nullable(),
    order: z.number().int().default(0),
    isDefault: z.boolean().default(false),
  })).optional(),
})

export type CreateProductSchema = z.infer<typeof createProductSchema>
export type UpdateProductSchema = z.infer<typeof updateProductSchema>

