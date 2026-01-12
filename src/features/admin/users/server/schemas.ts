import { z } from "zod"
import { updateUserSchema } from "./validation"

export type UpdateUserSchema = z.infer<typeof updateUserSchema>
