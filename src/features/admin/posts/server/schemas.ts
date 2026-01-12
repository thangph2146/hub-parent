import { z } from "zod"
import { updatePostSchema } from "./validation"

export type UpdatePostSchema = z.infer<typeof updatePostSchema>
