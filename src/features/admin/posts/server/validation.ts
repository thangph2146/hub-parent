import { z } from "zod"

const literalSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
type Literal = z.infer<typeof literalSchema>;
type Json = Literal | { [key: string]: Json } | Json[];
const jsonSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([literalSchema, z.array(jsonSchema), z.record(z.string(), jsonSchema)])
);

export const createPostSchema = z.object({
  title: z.string().min(1, "Tiêu đề là bắt buộc"),
  content: jsonSchema, // Prisma.InputJsonValue validated strictly with Zod
  excerpt: z.string().optional().nullable(),
  slug: z.string().min(1, "Slug là bắt buộc"),
  image: z.string().optional().nullable(),
  published: z.boolean().optional(),
  publishedAt: z.preprocess(
    (val) => {
      if (val === null || val === undefined || val === "") return null
      if (typeof val === "string") return new Date(val)
      return val
    },
    z.date().nullable()
  ).optional(),
  authorId: z.string().min(1, "Tác giả là bắt buộc"),
  categoryIds: z.union([z.array(z.string()), z.string()]).optional().transform((val) => {
    if (!val) return []
    if (typeof val === "string") return [val]
    return val
  }),
  tagIds: z.union([z.array(z.string()), z.string()]).optional().transform((val) => {
    if (!val) return []
    if (typeof val === "string") return [val]
    return val
  }),
})

export const updatePostSchema = z.object({
  title: z.string().optional(),
  content: jsonSchema.optional(),
  excerpt: z.string().optional().nullable(),
  slug: z.string().optional(),
  image: z.string().optional().nullable(),
  published: z.boolean().optional(),
  publishedAt: z.preprocess(
    (val) => {
      if (val === null || val === undefined || val === "") return null
      if (typeof val === "string") return new Date(val)
      return val
    },
    z.date().nullable()
  ).optional(),
  authorId: z.string().optional(),
  categoryIds: z.union([z.array(z.string()), z.string()]).optional().transform((val) => {
    if (!val) return []
    if (typeof val === "string") return [val]
    return val
  }),
  tagIds: z.union([z.array(z.string()), z.string()]).optional().transform((val) => {
    if (!val) return []
    if (typeof val === "string") return [val]
    return val
  }),
})

export type CreatePostSchema = z.infer<typeof createPostSchema>
export type UpdatePostSchema = z.infer<typeof updatePostSchema>

