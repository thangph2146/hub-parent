import { z } from "zod"

export const CreateStudentSchema = z.object({
  studentCode: z
    .string()
    .min(2, "Mã sinh viên phải có ít nhất 2 ký tự")
    .max(50, "Mã sinh viên không được vượt quá 50 ký tự")
    .regex(/^[a-zA-Z0-9_-]+$/, "Mã sinh viên chỉ được chứa chữ cái, số, dấu gạch dưới và dấu gạch ngang"),
  name: z.string().min(2, "Tên sinh viên phải có ít nhất 2 ký tự").max(100, "Tên sinh viên không được vượt quá 100 ký tự").nullable().optional(),
  email: z.string().email("Email không hợp lệ").max(255, "Email không được vượt quá 255 ký tự").nullable().optional(),
  userId: z.string().cuid("ID người dùng không hợp lệ").nullable().optional(),
  isActive: z.boolean().optional(),
})

export const UpdateStudentSchema = z.object({
  studentCode: z
    .string()
    .min(2, "Mã sinh viên phải có ít nhất 2 ký tự")
    .max(50, "Mã sinh viên không được vượt quá 50 ký tự")
    .regex(/^[a-zA-Z0-9_-]+$/, "Mã sinh viên chỉ được chứa chữ cái, số, dấu gạch dưới và dấu gạch ngang")
    .optional(),
  name: z.string().min(2, "Tên sinh viên phải có ít nhất 2 ký tự").max(100, "Tên sinh viên không được vượt quá 100 ký tự").nullable().optional(),
  email: z.string().email("Email không hợp lệ").max(255, "Email không được vượt quá 255 ký tự").nullable().optional(),
  userId: z.string().cuid("ID người dùng không hợp lệ").nullable().optional(),
  isActive: z.boolean().optional(),
})

export const BulkStudentActionSchema = z.object({
  action: z.enum(["delete", "restore", "hard-delete", "active", "unactive"]),
  ids: z.array(z.string().cuid("ID không hợp lệ")).min(1, "Danh sách ID không được trống"),
})

export type CreateStudentInput = z.infer<typeof CreateStudentSchema>
export type UpdateStudentInput = z.infer<typeof UpdateStudentSchema>
export type BulkStudentActionInput = z.infer<typeof BulkStudentActionSchema>

