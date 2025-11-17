/**
 * Mutations for Accounts
 * 
 * Các hàm để cập nhật thông tin tài khoản cá nhân
 */

import bcrypt from "bcryptjs"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/database"
import type { UpdateAccountInput, AccountProfile } from "../types"
import { getCurrentUserProfile } from "./queries"
import {
  ApplicationError,
  NotFoundError,
  type AuthContext,
} from "@/features/admin/resources/server"

/**
 * Update current user's account profile
 * 
 * Chỉ cho phép user cập nhật thông tin của chính mình
 * Không cho phép thay đổi email, isActive, roles
 */
export async function updateCurrentUserAccount(
  ctx: AuthContext,
  input: UpdateAccountInput
): Promise<AccountProfile> {
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

  // Validate name if provided
  if (input.name !== undefined && input.name !== null) {
    if (typeof input.name !== "string") {
      throw new ApplicationError("Tên phải là chuỗi ký tự", 400)
    }
    if (input.name.trim().length > 0 && input.name.trim().length < 2) {
      throw new ApplicationError("Tên phải có ít nhất 2 ký tự", 400)
    }
  }

  // Validate password if provided
  if (input.password !== undefined && input.password !== null && input.password !== "") {
    if (typeof input.password !== "string") {
      throw new ApplicationError("Mật khẩu phải là chuỗi ký tự", 400)
    }
    if (input.password.length < 6) {
      throw new ApplicationError("Mật khẩu phải có ít nhất 6 ký tự", 400)
    }
  }

  // Validate phone if provided
  if (input.phone !== undefined && input.phone !== null && input.phone !== "") {
    if (typeof input.phone !== "string") {
      throw new ApplicationError("Số điện thoại phải là chuỗi ký tự", 400)
    }
    // Basic phone validation
    const phoneRegex = /^[0-9+\-\s()]+$/
    if (!phoneRegex.test(input.phone)) {
      throw new ApplicationError("Số điện thoại không hợp lệ", 400)
    }
  }

  const updateData: Prisma.UserUpdateInput = {}

  if (input.name !== undefined) updateData.name = input.name?.trim() || null
  if (input.bio !== undefined) updateData.bio = input.bio?.trim() || null
  if (input.phone !== undefined) updateData.phone = input.phone?.trim() || null
  if (input.address !== undefined) updateData.address = input.address?.trim() || null
  if (input.avatar !== undefined) updateData.avatar = input.avatar?.trim() || null
  if (input.password && input.password.trim() !== "") {
    updateData.password = await bcrypt.hash(input.password, 10)
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
}

