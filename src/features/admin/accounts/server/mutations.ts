"use server"

import bcrypt from "bcryptjs"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import type { AccountProfile } from "../types"
import { UpdateAccountSchema, type UpdateAccountInput } from "./schemas"
import { getCurrentUserProfile } from "./queries"
import {
  ApplicationError,
  NotFoundError,
  type AuthContext,
} from "@/features/admin/resources/server"

export const updateCurrentUserAccount = async (
  ctx: AuthContext,
  input: UpdateAccountInput
): Promise<AccountProfile> => {
  const userId = ctx.actorId

  if (!userId) {
    throw new ApplicationError("Không tìm thấy thông tin người dùng", 401)
  }

  // Validate user exists
  const existing = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!existing || existing.deletedAt) {
    throw new NotFoundError("Tài khoản không tồn tại")
  }

  // Validate input với Zod
  const validatedInput = UpdateAccountSchema.parse(input)

  const updateData: Prisma.UserUpdateInput = {}

  // name is required, so it will always be present and valid after schema validation
  updateData.name = validatedInput.name.trim()
  if (validatedInput.bio !== undefined) updateData.bio = validatedInput.bio?.trim() || null
  if (validatedInput.phone !== undefined) updateData.phone = validatedInput.phone?.trim() || null
  if (validatedInput.address !== undefined) updateData.address = validatedInput.address?.trim() || null
  if (validatedInput.avatar !== undefined) {
    updateData.avatar = validatedInput.avatar === null ? null : validatedInput.avatar.trim() || null
  }
  if (validatedInput.password && validatedInput.password.trim() !== "") {
    updateData.password = await bcrypt.hash(validatedInput.password, 10)
  }

  await prisma.user.update({
    where: { id: userId },
    data: updateData,
  })

  // Fetch updated profile
  const updated = await getCurrentUserProfile(userId)

  if (!updated) {
    throw new NotFoundError("Không thể tải thông tin tài khoản sau khi cập nhật")
  }

  return updated
};

