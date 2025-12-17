"use client"

import { motion } from "framer-motion"
import { useSession } from "next-auth/react"
import {
  FileText,
  Calendar,
  Shield,
  Crown,
  Edit,
  User,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useClientOnly } from "@/hooks/use-client-only"
import { usePermissions } from "@/hooks/use-permissions"
import { PERMISSIONS, isSuperAdmin } from "@/lib/permissions"
import { cn } from "@/lib/utils"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.15,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 120,
      damping: 18,
    },
  },
}

const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return "Chào buổi sáng"
  if (hour < 18) return "Chào buổi chiều"
  return "Chào buổi tối"
}

const getCurrentDate = () => {
  const date = new Date()
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }
  return date.toLocaleDateString("vi-VN", options)
}

const getRoleInfo = (roles: Array<{ name: string; displayName?: string }> = []) => {
  const roleNames = roles.map(r => r.name)
  const displayNames = roles.map(r => r.displayName || r.name).join(", ")

  if (roleNames.includes("super_admin")) {
    return {
      label: "Super Admin",
      icon: Crown,
      textColor: "text-[#00cc44] dark:text-[#00ff88]",
      bgColor: "bg-[#00cc44]/10 dark:bg-[#00ff88]/10",
      borderColor: "border-[#00cc44]/20 dark:border-[#00ff88]/20",
      description: "Quyền truy cập đầy đủ vào hệ thống"
    }
  }
  if (roleNames.includes("admin")) {
    return {
      label: "Admin",
      icon: Shield,
      textColor: "text-chart-1 dark:text-chart-2",
      bgColor: "bg-chart-1/10 dark:bg-chart-2/10",
      borderColor: "border-chart-1/20 dark:border-chart-2/20",
      description: "Quản trị viên hệ thống"
    }
  }
  if (roleNames.includes("editor")) {
    return {
      label: "Editor",
      icon: Edit,
      textColor: "text-chart-3 dark:text-chart-4",
      bgColor: "bg-chart-3/10 dark:bg-chart-4/10",
      borderColor: "border-chart-3/20 dark:border-chart-4/20",
      description: "Biên tập viên nội dung"
    }
  }
  if (roleNames.includes("author")) {
    return {
      label: "Author",
      icon: FileText,
      textColor: "text-chart-4 dark:text-chart-5",
      bgColor: "bg-chart-4/10 dark:bg-chart-5/10",
      borderColor: "border-chart-4/20 dark:border-chart-5/20",
      description: "Tác giả bài viết"
    }
  }
  return {
    label: displayNames || "Người dùng",
    icon: User,
    textColor: "text-muted-foreground",
    bgColor: "bg-muted/50",
    borderColor: "border-border",
    description: "Thành viên hệ thống"
  }
}



export const DashboardWelcome = () => {
  const { data: session } = useSession()
  const { hasPermission } = usePermissions()
  const isMounted = useClientOnly()
  const user = session?.user
  const userRoles = session?.roles || []
  const isSuperAdminUser = isSuperAdmin(userRoles)

  const greeting = getGreeting()
  const currentDate = getCurrentDate()
  const roleInfo = getRoleInfo(userRoles)

  // Permission checks for all resources
  const canViewUsers = isSuperAdminUser || hasPermission(PERMISSIONS.USERS_VIEW)
  const canViewPosts = isSuperAdminUser || hasPermission(PERMISSIONS.POSTS_VIEW)
  const canViewComments = isSuperAdminUser || hasPermission(PERMISSIONS.COMMENTS_VIEW)
  const canViewCategories = isSuperAdminUser || hasPermission(PERMISSIONS.CATEGORIES_VIEW)
  const canViewTags = isSuperAdminUser || hasPermission(PERMISSIONS.TAGS_VIEW)
  const canViewMessages = isSuperAdminUser || hasPermission(PERMISSIONS.MESSAGES_VIEW)
  const canViewNotifications = isSuperAdminUser || hasPermission(PERMISSIONS.NOTIFICATIONS_VIEW)
  const canViewContactRequests = isSuperAdminUser || hasPermission(PERMISSIONS.CONTACT_REQUESTS_VIEW)
  const canViewStudents = isSuperAdminUser || hasPermission(PERMISSIONS.STUDENTS_VIEW)
  const canViewSessions = isSuperAdminUser || hasPermission(PERMISSIONS.SESSIONS_VIEW)
  const canViewRoles = isSuperAdminUser || hasPermission(PERMISSIONS.ROLES_VIEW)
  const canViewAccounts = isSuperAdminUser || hasPermission(PERMISSIONS.ACCOUNTS_VIEW)

  // Available permissions list
  const availablePermissions = [
    { label: "Xem và quản lý người dùng", permission: canViewUsers },
    { label: "Xem và quản lý bài viết", permission: canViewPosts },
    { label: "Xem và duyệt bình luận", permission: canViewComments },
    { label: "Xem và quản lý danh mục", permission: canViewCategories },
    { label: "Xem và quản lý thẻ", permission: canViewTags },
    { label: "Xem và gửi tin nhắn", permission: canViewMessages },
    { label: "Xem thông báo", permission: canViewNotifications },
    { label: "Xem và xử lý yêu cầu liên hệ", permission: canViewContactRequests },
    { label: "Xem và quản lý sinh viên", permission: canViewStudents },
    { label: "Xem phiên đăng nhập", permission: canViewSessions },
    { label: "Xem và quản lý vai trò", permission: canViewRoles },
    { label: "Xem dashboard tổng quan", permission: hasPermission(PERMISSIONS.DASHBOARD_VIEW) },
    { label: "Xem và cập nhật tài khoản", permission: canViewAccounts },
  ].filter(item => item.permission)




  if (!isMounted) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <div className="h-64 bg-muted/50 rounded-xl animate-pulse" />
      </div>
    )
  }

  const RoleIcon = roleInfo.icon

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#00cc44]/5 dark:bg-[#00ff88]/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        className="flex flex-1 flex-col gap-8 relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Welcome Header with Role Badge */}
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <motion.h1
                  className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <span className="bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
                    {greeting}
                  </span>
                  {user?.name && (
                    <span className="bg-gradient-to-r from-[#00cc44] to-[#00ff88] dark:from-[#00ff88] dark:to-[#00cc44] bg-clip-text text-transparent">
                      {`, ${user.name}`}
                    </span>
                  )}
                  <span className="ml-2">👋</span>
                </motion.h1>
              </div>
              <motion.p
                className="text-muted-foreground flex items-center gap-2 text-base md:text-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <Calendar className="h-5 w-5" />
                {currentDate}
              </motion.p>
              <motion.div
                className="flex flex-wrap items-center gap-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                <Badge
                  variant="outline"
                  className={cn(
                    "px-4 py-2 border-2 gap-2 font-semibold shadow-lg backdrop-blur-sm",
                    roleInfo.bgColor,
                    roleInfo.textColor,
                    roleInfo.borderColor,
                    "hover:scale-105 hover:shadow-xl transition-all duration-300"
                  )}
                >
                  <RoleIcon className="h-5 w-5" />
                  <span>{roleInfo.label}</span>
                </Badge>
                <span className="text-sm md:text-base text-muted-foreground">
                  {roleInfo.description}
                </span>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Welcome Message with Permissions */}
        <motion.div
          variants={itemVariants}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="relative overflow-hidden backdrop-blur-md bg-card/80 border border-primary/20 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-background" />
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2 text-xl">
                <CheckCircle2 className="h-6 w-6 text-primary" />
                {isSuperAdminUser ? "Quyền truy cập đầy đủ" : "Quyền truy cập của bạn"}
              </CardTitle>
              <CardDescription className="text-base">
                {isSuperAdminUser 
                  ? "Bạn có quyền truy cập đầy đủ vào tất cả các tính năng của hệ thống."
                  : "Danh sách các tính năng bạn có thể sử dụng với quyền hiện tại."}
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              {availablePermissions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {availablePermissions.map((item, index) => (
                    <motion.div
                      key={index}
                      className="flex items-center gap-2 p-2 rounded-md bg-background/50 border border-border/50"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                    >
                      <CheckCircle2 className="h-4 w-4 text-[#00cc44] dark:text-[#00ff88] flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Bạn chưa có quyền truy cập vào bất kỳ tính năng nào.</p>
                  <p className="text-xs mt-1">Vui lòng liên hệ quản trị viên để được cấp quyền.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}
