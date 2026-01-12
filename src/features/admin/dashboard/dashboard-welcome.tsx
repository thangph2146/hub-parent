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
  Sparkles,
  Zap,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Flex } from "@/components/ui/flex"
import { Grid } from "@/components/ui/grid"
import { useClientOnly } from "@/hooks/use-client-only"
import { usePermissions } from "@/features/auth"
import { PERMISSIONS, isSuperAdmin } from "@/lib/permissions"
import { cn } from "@/lib/utils"
import { TypographyDescriptionLarge, TypographyTitleLarge, TypographyPSmallMuted, IconSize, TypographySpan } from "@/components/ui/typography"

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
    textColor: "text-primary dark:text-primary",
    bgColor: "bg-primary/10 dark:bg-primary/20",
    borderColor: "border-primary/30 dark:border-primary/40",
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
  const canViewPosts = isSuperAdminUser || hasPermission(PERMISSIONS.POSTS_VIEW_ALL) || hasPermission(PERMISSIONS.POSTS_VIEW_OWN)
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
      <Flex direction="col" gap={4} flex="1" padding="md-lg" fullWidth>
        <Flex className="h-64 bg-muted/50 rounded-xl animate-pulse" />
      </Flex>
    )
  }

  const RoleIcon = roleInfo.icon

  return (
    <Flex direction="col" gap={6} flex="1" padding="responsive-lg" position="relative" overflow="hidden" fullWidth>
      {/* Enhanced Background gradient effects with animated orbs */}
      <Flex position="absolute-inset" className="-z-10 overflow-hidden pointer-events-none">
        {/* Primary gradient orb - top right */}
        <motion.div 
          className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-gradient-to-br from-primary/20 via-primary/10 to-transparent rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Secondary gradient orb - bottom left */}
        <motion.div 
          className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-gradient-to-tr from-[#00cc44]/15 via-[#00ff88]/10 to-transparent dark:from-[#00ff88]/20 dark:via-[#00cc44]/10 rounded-full blur-3xl"
          animate={{ 
            scale: [1.1, 1, 1.1],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Accent gradient orb - center */}
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-chart-1/5 via-transparent to-transparent rounded-full blur-3xl"
          animate={{ 
            rotate: [0, 180, 360],
            scale: [0.9, 1.1, 0.9],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        {/* Grid pattern overlay */}
        <Flex 
          position="absolute-inset" 
          className="opacity-[0.02] dark:opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />
      </Flex>

      <motion.div
        className="relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Flex direction="col" gap={8} flex="1" fullWidth>
        {/* Welcome Header with Role Badge - Enhanced */}
        <motion.div variants={itemVariants}>
          <Flex direction="col-md-row" align="center" justify="between" gap={6} fullWidth>
            <Flex direction="col" gap={5} fullWidth>
              <Flex align="center" gap={3} wrap fullWidth>
                <motion.h1
                  className="leading-tight text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <motion.span 
                    className="bg-gradient-to-r from-primary via-chart-1 to-primary bg-[length:200%_100%] bg-clip-text text-transparent"
                    animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    {greeting}
                  </motion.span>
                  {user?.name && (
                    <motion.span 
                      className="bg-gradient-to-r from-[#00cc44] via-[#00ff88] to-[#00cc44] bg-[length:200%_100%] bg-clip-text text-transparent"
                      animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    >
                      {`, ${user.name}`}
                    </motion.span>
                  )}
                  <motion.span 
                    className="ml-3 inline-block"
                    animate={{ rotate: [0, 20, -10, 20, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
                  >
                    👋
                  </motion.span>
                </motion.h1>
              </Flex>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <Flex align="center" gap={2} className="bg-muted/30 dark:bg-muted/20 px-4 py-2 rounded-full w-fit backdrop-blur-sm border border-border/50">
                  <IconSize size="md" className="text-primary">
                    <Calendar />
                  </IconSize>
                  <TypographyDescriptionLarge className="font-medium">{currentDate}</TypographyDescriptionLarge>
                </Flex>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                <Flex wrap align="center" gap={4}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Badge
                      variant="outline"
                      className={cn(
                        "px-5 py-2.5 border-2 gap-2.5 shadow-lg backdrop-blur-md relative overflow-hidden group cursor-default",
                        roleInfo.bgColor,
                        roleInfo.textColor,
                        roleInfo.borderColor,
                        "transition-all duration-300"
                      )}
                    >
                      {/* Shimmer effect */}
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full"
                        animate={{ translateX: ["-100%", "200%"] }}
                        transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                      />
                      <IconSize size="md" className="relative z-10">
                        <RoleIcon />
                      </IconSize>
                      <span className="relative z-10 font-semibold">{roleInfo.label}</span>
                    </Badge>
                  </motion.div>
                  <Flex align="center" gap={2}>
                    <IconSize size="sm" className="text-primary/60">
                      <Sparkles />
                    </IconSize>
                    <TypographySpan className="text-foreground/70 dark:text-foreground/80 font-medium">
                      {roleInfo.description}
                    </TypographySpan>
                  </Flex>
                </Flex>
              </motion.div>
            </Flex>
          </Flex>
        </motion.div>

        {/* Welcome Message with Permissions - Enhanced Card */}
        <motion.div
          variants={itemVariants}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="relative overflow-hidden backdrop-blur-md bg-card/90 dark:bg-card/80 border-2 border-primary/20 dark:border-primary/30 shadow-2xl shadow-primary/5">
            {/* Animated gradient background */}
            <motion.div 
              className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-[#00cc44]/5 dark:from-primary/15 dark:to-[#00ff88]/10"
              animate={{ 
                background: [
                  "linear-gradient(135deg, hsl(var(--primary) / 0.1) 0%, transparent 50%, hsl(142deg 100% 40% / 0.05) 100%)",
                  "linear-gradient(135deg, hsl(var(--primary) / 0.15) 0%, transparent 50%, hsl(142deg 100% 40% / 0.1) 100%)",
                  "linear-gradient(135deg, hsl(var(--primary) / 0.1) 0%, transparent 50%, hsl(142deg 100% 40% / 0.05) 100%)",
                ]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Top border glow */}
            <motion.div 
              className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/60 to-transparent"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <CardHeader className="relative z-10 pb-2">
              <CardTitle>
                <TypographyTitleLarge>
                  <Flex align="center" gap={3}>
                    <motion.div
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                      <IconSize size="lg">
                        {isSuperAdminUser ? (
                          <Zap className="text-[#00cc44] dark:text-[#00ff88] drop-shadow-[0_0_10px_rgba(0,204,68,0.5)]" />
                        ) : (
                          <CheckCircle2 className="text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]" />
                        )}
                      </IconSize>
                    </motion.div>
                    <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                      {isSuperAdminUser ? "Quyền truy cập đầy đủ" : "Quyền truy cập của bạn"}
                    </span>
                  </Flex>
                </TypographyTitleLarge>
              </CardTitle>
              <CardDescription className="text-muted-foreground/80 mt-1">
                {isSuperAdminUser 
                  ? "Bạn có quyền truy cập đầy đủ vào tất cả các tính năng của hệ thống."
                  : "Danh sách các tính năng bạn có thể sử dụng với quyền hiện tại."}
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10 pt-2">
              {availablePermissions.length > 0 ? (
                <Grid cols="responsive-2" gap={3} fullWidth>
                  {availablePermissions.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * index }}
                      whileHover={{ scale: 1.02, x: 5 }}
                    >
                      <Flex 
                        align="center" 
                        gap={3} 
                        padding="md" 
                        rounded="lg" 
                        className="bg-background/60 dark:bg-background/40 border-border/40 hover:border-primary/40 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all duration-200 group cursor-default shadow-sm hover:shadow-md min-h-[56px]" 
                        border="all" 
                        fullWidth
                      >
                        <motion.div
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.5 }}
                          className="shrink-0"
                        >
                          <IconSize size="md">
                            <CheckCircle2 className="text-[#00cc44] dark:text-[#00ff88] group-hover:drop-shadow-[0_0_6px_rgba(0,204,68,0.5)] transition-all duration-200" />
                          </IconSize>
                        </motion.div>
                        <span className="text-base sm:text-lg font-medium text-foreground/90 dark:text-foreground/95 group-hover:text-foreground group-hover:font-semibold transition-all duration-200 leading-relaxed">
                          {item.label}
                        </span>
                      </Flex>
                    </motion.div>
                  ))}
                </Grid>
              ) : (
                <Flex direction="col" align="center" gap={3} textAlign="center" paddingY={6}>
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <IconSize size="2xl">
                      <AlertCircle className="text-muted-foreground/50" />
                    </IconSize>
                  </motion.div>
                  <TypographyPSmallMuted>Bạn chưa có quyền truy cập vào bất kỳ tính năng nào.</TypographyPSmallMuted>
                  <TypographyPSmallMuted>Vui lòng liên hệ quản trị viên để được cấp quyền.</TypographyPSmallMuted>
                </Flex>
              )}
            </CardContent>
          </Card>
        </motion.div>
        </Flex>
      </motion.div>
    </Flex>
  )
}
