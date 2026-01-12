import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

import { DEFAULT_ROLES, PERMISSIONS } from "../src/permissions"

const prisma = new PrismaClient()

const ROLE_NAMES = {
  SUPER_ADMIN: DEFAULT_ROLES.SUPER_ADMIN.name,
  ADMIN: DEFAULT_ROLES.ADMIN.name,
  EDITOR: DEFAULT_ROLES.EDITOR.name,
  AUTHOR: DEFAULT_ROLES.AUTHOR.name,
  USER: DEFAULT_ROLES.USER.name,
  PARENT: DEFAULT_ROLES.PARENT.name,
} as const

type RoleKey = keyof typeof ROLE_NAMES
type DefaultRoleKey = RoleKey

const ROLE_DESCRIPTIONS: Record<RoleKey, string> = {
  SUPER_ADMIN: "Toàn quyền hệ thống, có thể thực hiện mọi thao tác.",
  ADMIN: "Quản trị viên, quản lý nội dung và người dùng.",
  EDITOR: "Biên tập viên, tạo và chỉnh sửa nội dung.",
  AUTHOR: "Tác giả, quản lý nội dung của riêng mình.",
  USER: "Người dùng thông thường với quyền hạn cơ bản, có thể quản lý tài khoản cá nhân.",
  PARENT: "Phụ huynh sinh viên, truy cập thông tin liên quan sinh viên, có thể quản lý tài khoản cá nhân.",
}

type RoleConfig<T extends RoleKey = RoleKey> = {
  key: T
  name: string
  displayName: string
  description: string
  permissions: string[]
}

const defaultRoleConfigs: RoleConfig<DefaultRoleKey>[] = (
  Object.entries(DEFAULT_ROLES) as Array<[DefaultRoleKey, (typeof DEFAULT_ROLES)[DefaultRoleKey]]>
).map(([key, role]) => ({
  key,
  name: role.name,
  displayName: role.displayName,
  description: ROLE_DESCRIPTIONS[key],
  permissions: [...role.permissions],
}))

const roleConfigs: RoleConfig[] = defaultRoleConfigs.map((role) => {
  if (role.name === DEFAULT_ROLES.PARENT.name) {
    return {
      ...role,
      permissions: role.permissions.filter((permission) => permission !== PERMISSIONS.STUDENTS_ACTIVE),
    }
  }
  return role
})

const resetDatabase = async () => {
  await prisma.$transaction(
    async (tx) => {
      await tx.messageRead.deleteMany()
      await tx.groupMember.deleteMany()
      await tx.group.deleteMany()
      await tx.notification.deleteMany()
      await tx.message.deleteMany()
      await tx.comment.deleteMany()
      await tx.postTag.deleteMany()
      await tx.postCategory.deleteMany()
      await tx.post.deleteMany()
      await tx.tag.deleteMany()
      await tx.category.deleteMany()
      await tx.student.deleteMany()
      await tx.contactRequest.deleteMany()
      await tx.userRole.deleteMany()
      await tx.session.deleteMany()
      await tx.account.deleteMany()
      await tx.role.deleteMany()
      // E-commerce cleanup (removed - no longer needed)
      await tx.user.deleteMany()
    },
    {
      timeout: 60000, // 60 seconds
    }
  )
}

async function main() {
  console.log("🌱 Bắt đầu seed database...")

  console.log("🧹 Đang xóa dữ liệu cũ...")
  await resetDatabase()
  console.log("🧼 Đã xóa dữ liệu cũ")

  const roles = await Promise.all(
    roleConfigs.map((role) =>
      prisma.role.upsert({
        where: { name: role.name },
        update: {
          displayName: role.displayName,
          description: role.description,
          permissions: role.permissions,
          isActive: true,
        },
        create: {
          name: role.name,
          displayName: role.displayName,
          description: role.description,
          permissions: role.permissions,
          isActive: true,
        },
      })
    )
  )

  const roleMap = new Map(roles.map((role) => [role.name, role]))

  const getRoleId = (roleName: string) => {
    const role = roleMap.get(roleName)
    if (!role) {
      throw new Error(`Không tìm thấy role đã seed: ${roleName}`)
    }
    return role.id
  }

  const totalPermissions = roles.reduce((sum, role) => sum + role.permissions.length, 0)
  console.log(`✅ Đã cấu hình ${roles.length} roles với tổng ${totalPermissions} quyền được gán`)

  const hashedPassword = await bcrypt.hash("Buhcm@2026", 10)

  // Tạo Super Admin và Admin users
  const superAdminUser = await prisma.user.upsert({
    where: { email: "superadmin@hub.edu.vn" },
    update: {
      password: hashedPassword,
    },
    create: {
      email: "superadmin@hub.edu.vn",
      name: "Super Administrator",
      password: hashedPassword,
    },
  })

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@hub.edu.vn" },
    update: {
      password: hashedPassword,
    },
    create: {
      email: "admin@hub.edu.vn",
      name: "Administrator",
      password: hashedPassword,
    },
  })

  // Gán roles cho users
  await prisma.userRole.createMany({
    data: [
      {
        userId: superAdminUser.id,
        roleId: getRoleId(ROLE_NAMES.SUPER_ADMIN),
      },
      {
        userId: adminUser.id,
        roleId: getRoleId(ROLE_NAMES.ADMIN),
      },
    ],
    skipDuplicates: true,
  })

  console.log(`✅ Đã tạo 2 users (Super Admin và Admin)`)

  console.log("🎉 Seed database hoàn thành!")

  console.log("\n📊 Thống kê:")
  console.log(
    `- Roles: ${roles.length} (${roleConfigs.map((role) => role.displayName).join(", ")})`
  )
  console.log(`- Tổng quyền được gán: ${totalPermissions}`)
  console.log(`- Users: 2 (Super Admin, Admin)`)

  console.log("\n🔐 Permission System:")
  roleConfigs.forEach((role) => {
    console.log(`✅ ${role.displayName}: ${role.description}`)
  })

  console.log("\n🔑 Thông tin đăng nhập:")
  console.log("Email: superadmin@hub.edu.vn | Password: Buhcm@2026 (SUPER_ADMIN)")
  console.log("Email: admin@hub.edu.vn | Password: Buhcm@2026 (ADMIN)")
}

main()
  .catch((e) => {
    console.error("❌ Lỗi khi seed database:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
