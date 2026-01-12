import { z } from "zod"
import { ACCOUNT_MESSAGES } from "../constants"

export const UpdateAccountSchema = z.object({
  name: z
    .string()
    .min(2, ACCOUNT_MESSAGES.NAME_MIN)
    .max(100, "Tên không được vượt quá 100 ký tự")
    .trim(),
  bio: z
    .preprocess(
      (val) => {
        if (val === null || val === undefined || val === "") return null
        return val
      },
      z.string().max(500, "Tiểu sử không được vượt quá 500 ký tự").nullable()
    )
    .optional(),
  phone: z
    .preprocess(
      (val) => {
        if (val === null || val === undefined || val === "") return null
        return val
      },
      z
        .string()
        .regex(/^[0-9+\-\s()]+$/, "Số điện thoại chỉ được chứa số, dấu +, -, khoảng trắng và dấu ngoặc")
        .max(20, "Số điện thoại không được vượt quá 20 ký tự")
        .nullable()
    )
    .optional(),
  address: z
    .preprocess(
      (val) => {
        if (val === null || val === undefined || val === "") return null
        return val
      },
      z.string().max(500, "Địa chỉ không được vượt quá 500 ký tự").nullable()
    )
    .optional(),
  password: z.string().min(6, ACCOUNT_MESSAGES.PASSWORD_MIN).max(100, "Mật khẩu không được vượt quá 100 ký tự").optional(),
  avatar: z
    .preprocess(
      (val) => {
        if (val === null || val === undefined || val === "") return null
        return val
      },
      z
        .string()
        .url("URL avatar không hợp lệ")
        .max(500, "URL avatar không được vượt quá 500 ký tự")
        .nullable()
    )
    .optional(),
})

export type UpdateAccountInput = z.infer<typeof UpdateAccountSchema>

