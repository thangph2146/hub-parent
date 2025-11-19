"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { useSession } from "next-auth/react"
import {
    TrendingUp,
    TrendingDown,
    Users,
    FileText,
    MessageSquare,
    Calendar,
    BarChart3,
    PieChart,
    LineChart,
    Activity,
    ArrowUpRight,
    Tag,
    FolderTree,
    Bell,
    Mail,
    UserCheck,
    Shield
} from "lucide-react"
import {
    Line,
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ComposedChart
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useClientOnly } from "@/hooks/use-client-only"
import { usePermissions } from "@/hooks/use-permissions"
import { PERMISSIONS, isSuperAdmin } from "@/lib/permissions"
import { cn } from "@/lib/utils"
import type { DashboardStatsData } from "./server/queries"

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
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

// Chart colors from CSS variables
const CHART_COLORS = [
    "oklch(var(--chart-1))",
    "oklch(var(--chart-2))",
    "oklch(var(--chart-3))",
    "oklch(var(--chart-4))",
    "oklch(var(--chart-5))",
]

// Custom tooltip component
interface CustomTooltipProps {
    active?: boolean
    payload?: Array<{
        name?: string
        value?: number
        color?: string
    }>
    label?: string
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-background border border-border rounded-lg shadow-lg p-3 backdrop-blur-sm">
                <p className="text-sm font-semibold mb-2">{label}</p>
                {payload.map((entry, index) => (
                    <p key={index} className="text-xs" style={{ color: entry.color }}>
                        {`${entry.name ?? ""}: ${entry.value?.toLocaleString() ?? ""}`}
                    </p>
                ))}
            </div>
        )
    }
    return null
}

export interface DashboardStatsClientProps {
    stats: DashboardStatsData
}

export function DashboardStatsClient({ stats }: DashboardStatsClientProps) {
    const isMounted = useClientOnly()
    const { data: session } = useSession()
    const { hasPermission } = usePermissions()
    const userRoles = session?.roles || []
    const isSuperAdminUser = isSuperAdmin(userRoles)

    // Get chart colors for categories
    const categoryDataWithColors = stats.categoryData.map((item, index) => ({
        ...item,
        color: CHART_COLORS[index % CHART_COLORS.length]
    }))

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
    const canViewDashboard = isSuperAdminUser || hasPermission(PERMISSIONS.DASHBOARD_VIEW)

    // Check if user has any permission to view stats
    const hasAnyStatsPermission = canViewUsers || canViewPosts || canViewComments || canViewCategories || 
        canViewTags || canViewMessages || canViewNotifications || canViewContactRequests || 
        canViewStudents || canViewSessions || canViewRoles || canViewDashboard

    // Define available chart resources with permissions
    const availableResources = useMemo(() => [
        { key: "users", label: "Người dùng", permission: canViewUsers, color: CHART_COLORS[0] },
        { key: "posts", label: "Bài viết", permission: canViewPosts, color: CHART_COLORS[1] },
        { key: "comments", label: "Bình luận", permission: canViewComments, color: CHART_COLORS[2] },
        { key: "categories", label: "Danh mục", permission: canViewCategories, color: CHART_COLORS[3] },
        { key: "tags", label: "Thẻ", permission: canViewTags, color: CHART_COLORS[4] },
        { key: "messages", label: "Tin nhắn", permission: canViewMessages, color: "#3b82f6" },
        { key: "notifications", label: "Thông báo", permission: canViewNotifications, color: "#eab308" },
        { key: "contactRequests", label: "Yêu cầu liên hệ", permission: canViewContactRequests, color: "#a855f7" },
        { key: "students", label: "Học sinh", permission: canViewStudents, color: "#22c55e" },
        { key: "sessions", label: "Phiên đăng nhập", permission: canViewSessions, color: "#f97316" },
        { key: "roles", label: "Vai trò", permission: canViewRoles, color: "#ef4444" },
    ].filter(r => r.permission), [canViewUsers, canViewPosts, canViewComments, canViewCategories, 
        canViewTags, canViewMessages, canViewNotifications, canViewContactRequests, 
        canViewStudents, canViewSessions, canViewRoles])

    // State for selected resources in chart
    const [selectedResourcesState, setSelectedResources] = useState<Set<string>>(() => {
        // Default: select all available resources
        return new Set(availableResources.map(r => r.key))
    })

    // Sync selected resources with available resources (filter out unavailable ones)
    const selectedResources = useMemo(() => {
        const availableKeys = new Set(availableResources.map(r => r.key))
        const filtered = new Set([...selectedResourcesState].filter(key => availableKeys.has(key)))
        // If nothing selected but resources are available, return all available
        if (filtered.size === 0 && availableKeys.size > 0) {
            return availableKeys
        }
        return filtered
    }, [selectedResourcesState, availableResources])

    // Toggle resource selection
    const toggleResource = (key: string) => {
        setSelectedResources(prev => {
            const next = new Set(prev)
            if (next.has(key)) {
                next.delete(key)
            } else {
                next.add(key)
            }
            return next
        })
    }

    // Select all / Deselect all
    const selectAll = () => {
        setSelectedResources(new Set(availableResources.map(r => r.key)))
    }

    const deselectAll = () => {
        setSelectedResources(new Set())
    }

    if (!isMounted) {
        return (
            <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
                <div className="h-64 bg-muted/50 rounded-xl animate-pulse" />
            </div>
        )
    }

    // If user has no permissions, show empty state
    if (!hasAnyStatsPermission) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center p-4 md:p-6 lg:p-8">
                <Card className="max-w-md w-full">
                    <CardHeader>
                        <CardTitle className="text-center">Không có quyền truy cập</CardTitle>
                        <CardDescription className="text-center">
                            Bạn không có quyền xem thống kê. Vui lòng liên hệ quản trị viên để được cấp quyền.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    const formatNumber = (num: number): string => {
        if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}K`
        }
        return num.toLocaleString()
    }

    const formatChange = (change: number): string => {
        const sign = change >= 0 ? "+" : ""
        return `${sign}${change.toFixed(1)}%`
    }

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
                {/* Header */}
                <motion.div variants={itemVariants} className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
                                <BarChart3 className="h-8 w-8 text-primary" />
                                <span className="bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
                                    Thống kê chi tiết
                                </span>
                            </h1>
                            <p className="text-muted-foreground mt-2 flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                {new Date().toLocaleDateString("vi-VN", {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric"
                                })}
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Overview Cards */}
                <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[
                        { 
                            title: "Tổng người dùng", 
                            value: formatNumber(stats.overview.totalUsers), 
                            change: formatChange(stats.overview.usersChange), 
                            trend: stats.overview.usersChange >= 0 ? "up" as const : "down" as const, 
                            icon: Users, 
                            bgColor: "bg-chart-1/10", 
                            borderColor: "border-chart-1/20", 
                            iconColor: "text-chart-1", 
                            barColor: "bg-chart-1",
                            permission: canViewUsers
                        },
                        { 
                            title: "Tổng bài viết", 
                            value: formatNumber(stats.overview.totalPosts), 
                            change: formatChange(stats.overview.postsChange), 
                            trend: stats.overview.postsChange >= 0 ? "up" as const : "down" as const, 
                            icon: FileText, 
                            bgColor: "bg-chart-2/10", 
                            borderColor: "border-chart-2/20", 
                            iconColor: "text-chart-2", 
                            barColor: "bg-chart-2",
                            permission: canViewPosts
                        },
                        { 
                            title: "Tổng bình luận", 
                            value: formatNumber(stats.overview.totalComments), 
                            change: formatChange(stats.overview.commentsChange), 
                            trend: stats.overview.commentsChange >= 0 ? "up" as const : "down" as const, 
                            icon: MessageSquare, 
                            bgColor: "bg-chart-3/10", 
                            borderColor: "border-chart-3/20", 
                            iconColor: "text-chart-3", 
                            barColor: "bg-chart-3",
                            permission: canViewComments
                        },
                        { 
                            title: "Danh mục", 
                            value: formatNumber(stats.overview.totalCategories), 
                            change: formatChange(stats.overview.categoriesChange), 
                            trend: stats.overview.categoriesChange >= 0 ? "up" as const : "down" as const, 
                            icon: FolderTree, 
                            bgColor: "bg-chart-4/10", 
                            borderColor: "border-chart-4/20", 
                            iconColor: "text-chart-4", 
                            barColor: "bg-chart-4",
                            permission: canViewCategories
                        },
                        { 
                            title: "Thẻ", 
                            value: formatNumber(stats.overview.totalTags), 
                            change: formatChange(stats.overview.tagsChange), 
                            trend: stats.overview.tagsChange >= 0 ? "up" as const : "down" as const, 
                            icon: Tag, 
                            bgColor: "bg-chart-5/10", 
                            borderColor: "border-chart-5/20", 
                            iconColor: "text-chart-5", 
                            barColor: "bg-chart-5",
                            permission: canViewTags
                        },
                        { 
                            title: "Tin nhắn", 
                            value: formatNumber(stats.overview.totalMessages), 
                            change: formatChange(stats.overview.messagesChange), 
                            trend: stats.overview.messagesChange >= 0 ? "up" as const : "down" as const, 
                            icon: Mail, 
                            bgColor: "bg-blue-500/10", 
                            borderColor: "border-blue-500/20", 
                            iconColor: "text-blue-500", 
                            barColor: "bg-blue-500",
                            permission: canViewMessages
                        },
                        { 
                            title: "Thông báo", 
                            value: formatNumber(stats.overview.totalNotifications), 
                            change: formatChange(stats.overview.notificationsChange), 
                            trend: stats.overview.notificationsChange >= 0 ? "up" as const : "down" as const, 
                            icon: Bell, 
                            bgColor: "bg-yellow-500/10", 
                            borderColor: "border-yellow-500/20", 
                            iconColor: "text-yellow-500", 
                            barColor: "bg-yellow-500",
                            permission: canViewNotifications
                        },
                        { 
                            title: "Yêu cầu liên hệ", 
                            value: formatNumber(stats.overview.totalContactRequests), 
                            change: formatChange(stats.overview.contactRequestsChange), 
                            trend: stats.overview.contactRequestsChange >= 0 ? "up" as const : "down" as const, 
                            icon: MessageSquare, 
                            bgColor: "bg-purple-500/10", 
                            borderColor: "border-purple-500/20", 
                            iconColor: "text-purple-500", 
                            barColor: "bg-purple-500",
                            permission: canViewContactRequests
                        },
                        { 
                            title: "Học sinh", 
                            value: formatNumber(stats.overview.totalStudents), 
                            change: formatChange(stats.overview.studentsChange), 
                            trend: stats.overview.studentsChange >= 0 ? "up" as const : "down" as const, 
                            icon: UserCheck, 
                            bgColor: "bg-green-500/10", 
                            borderColor: "border-green-500/20", 
                            iconColor: "text-green-500", 
                            barColor: "bg-green-500",
                            permission: canViewStudents
                        },
                        { 
                            title: "Phiên đăng nhập", 
                            value: formatNumber(stats.overview.totalSessions), 
                            change: formatChange(stats.overview.sessionsChange), 
                            trend: stats.overview.sessionsChange >= 0 ? "up" as const : "down" as const, 
                            icon: Activity, 
                            bgColor: "bg-orange-500/10", 
                            borderColor: "border-orange-500/20", 
                            iconColor: "text-orange-500", 
                            barColor: "bg-orange-500",
                            permission: canViewSessions
                        },
                        { 
                            title: "Vai trò", 
                            value: formatNumber(stats.overview.totalRoles), 
                            change: formatChange(stats.overview.rolesChange), 
                            trend: stats.overview.rolesChange >= 0 ? "up" as const : "down" as const, 
                            icon: Shield, 
                            bgColor: "bg-red-500/10", 
                            borderColor: "border-red-500/20", 
                            iconColor: "text-red-500", 
                            barColor: "bg-red-500",
                            permission: canViewRoles
                        },
                    ]
                    .filter((stat) => stat.permission) // Only show cards user has permission for
                    .map((stat, index) => {
                        const Icon = stat.icon
                        return (
                            <motion.div
                                key={stat.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * index }}
                            >
                                <Card className={cn(
                                    "relative overflow-hidden border transition-all duration-300 hover:shadow-xl group cursor-pointer",
                                    stat.borderColor,
                                    "hover:border-primary/50",
                                    "backdrop-blur-sm bg-card/80 hover:bg-card"
                                )}>
                                    <div className={cn(
                                        "absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-30 group-hover:opacity-50 transition-opacity",
                                        stat.bgColor
                                    )} />
                                    <div className={cn(
                                        "absolute top-0 left-0 w-full h-1 bg-gradient-to-r",
                                        stat.barColor
                                    )} />
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">
                                            {stat.title}
                                        </CardTitle>
                                        <div className={cn(
                                            "p-2.5 rounded-xl transition-all group-hover:scale-110 group-hover:rotate-6 shadow-lg backdrop-blur-sm",
                                            stat.bgColor,
                                            "border border-border/50"
                                        )}>
                                            <Icon className={cn("h-5 w-5", stat.iconColor)} />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="relative z-10">
                                        <div className="text-3xl font-bold mb-2 tracking-tight">{stat.value}</div>
                                        <div className="flex items-center gap-1.5 text-xs">
                                            {stat.trend === "up" ? (
                                                <TrendingUp className="h-3.5 w-3.5 text-[#00cc44] dark:text-[#00ff88]" />
                                            ) : (
                                                <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                                            )}
                                            <span className={cn(
                                                "font-semibold",
                                                stat.trend === "up" ? "text-[#00cc44] dark:text-[#00ff88]" : "text-destructive"
                                            )}>
                                                {stat.change}
                                            </span>
                                            <span className="text-muted-foreground">so với tháng trước</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )
                    })}
                </motion.div>

                {/* Main Charts Row */}
                {(canViewUsers || canViewPosts || canViewComments || canViewCategories || canViewTags || 
                  canViewMessages || canViewNotifications || canViewContactRequests || canViewStudents || 
                  canViewSessions || canViewRoles) && (
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Line Chart - Monthly Trends */}
                    {(canViewUsers || canViewPosts || canViewComments || canViewCategories || canViewTags || 
                      canViewMessages || canViewNotifications || canViewContactRequests || canViewStudents || 
                      canViewSessions || canViewRoles) && (
                    <motion.div variants={itemVariants}>
                        <Card className="relative overflow-hidden backdrop-blur-md bg-card/80 border border-border shadow-lg">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-background" />
                            <CardHeader className="relative z-10">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2 text-xl">
                                            <LineChart className="h-6 w-6 text-primary" />
                                            Xu hướng theo tháng
                                        </CardTitle>
                                        <CardDescription className="text-base">
                                            Thống kê các resources theo tháng
                                        </CardDescription>
                                    </div>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" size="sm" className="gap-2">
                                                <BarChart3 className="h-4 w-4" />
                                                Chọn mục hiển thị
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-64" align="end">
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-semibold text-sm">Chọn resources</h4>
                                                    <div className="flex gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 px-2 text-xs"
                                                            onClick={selectAll}
                                                        >
                                                            Tất cả
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 px-2 text-xs"
                                                            onClick={deselectAll}
                                                        >
                                                            Bỏ chọn
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                                    {availableResources.map((resource) => (
                                                        <div
                                                            key={resource.key}
                                                            className="flex items-center space-x-2 cursor-pointer hover:bg-muted/50 rounded-md p-2 -mx-2"
                                                            onClick={() => toggleResource(resource.key)}
                                                        >
                                                            <Checkbox
                                                                id={resource.key}
                                                                checked={selectedResources.has(resource.key)}
                                                                onCheckedChange={() => toggleResource(resource.key)}
                                                            />
                                                            <label
                                                                htmlFor={resource.key}
                                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 flex-1 cursor-pointer"
                                                            >
                                                                <div
                                                                    className="w-3 h-3 rounded-full"
                                                                    style={{ backgroundColor: resource.color }}
                                                                />
                                                                {resource.label}
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </CardHeader>
                            <CardContent className="relative z-10">
                                {selectedResources.size === 0 ? (
                                    <div className="h-80 flex items-center justify-center text-muted-foreground">
                                        <div className="text-center">
                                            <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                            <p>Vui lòng chọn ít nhất một resource để hiển thị</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-80">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ComposedChart data={stats.monthlyData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                                                <XAxis 
                                                    dataKey="month" 
                                                    stroke="hsl(var(--muted-foreground))"
                                                    fontSize={12}
                                                    tickLine={{ stroke: "hsl(var(--border))" }}
                                                />
                                                <YAxis 
                                                    stroke="hsl(var(--muted-foreground))"
                                                    fontSize={12}
                                                    tickLine={{ stroke: "hsl(var(--border))" }}
                                                />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Legend 
                                                    wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }}
                                                    iconType="circle"
                                                />
                                                {availableResources
                                                    .filter(r => selectedResources.has(r.key))
                                                    .map((resource) => (
                                                        <Line
                                                            key={resource.key}
                                                            type="monotone"
                                                            dataKey={resource.key}
                                                            stroke={resource.color}
                                                            strokeWidth={2}
                                                            dot={{ fill: resource.color, r: 4 }}
                                                            activeDot={{ r: 6 }}
                                                            name={resource.label}
                                                        />
                                                    ))}
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                    )}

                    {/* Pie Chart - Categories */}
                    {canViewCategories && (
                    <motion.div variants={itemVariants}>
                        <Card className="relative overflow-hidden backdrop-blur-md bg-card/80 border border-border shadow-lg">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-background" />
                            <CardHeader className="relative z-10">
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <PieChart className="h-6 w-6 text-primary" />
                                    Phân bố danh mục
                                </CardTitle>
                                <CardDescription className="text-base">
                                    Tỷ lệ bài viết theo từng danh mục
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <div className="space-y-6">
                                    {/* Donut Chart */}
                                    <div className="flex items-center justify-center">
                                        <ResponsiveContainer width="100%" height={320}>
                                            <RechartsPieChart>
                                                <Pie
                                                    data={categoryDataWithColors}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={100}
                                                    paddingAngle={2}
                                                    dataKey="value"
                                                    label={false}
                                                >
                                                    {categoryDataWithColors.map((entry, index) => (
                                                        <Cell 
                                                            key={`cell-${index}`} 
                                                            fill={entry.color}
                                                            stroke="oklch(var(--background))"
                                                            strokeWidth={2}
                                                        />
                                                    ))}
                                                </Pie>
                                                <Tooltip 
                                                    content={({ active, payload }) => {
                                                        if (active && payload && payload.length) {
                                                            const data = payload[0]
                                                            const value = typeof data.value === "number" ? data.value : 0
                                                            const count = Math.round((value / 100) * stats.overview.totalPosts)
                                                            return (
                                                                <div className="bg-background border border-border rounded-lg shadow-lg p-3 backdrop-blur-sm">
                                                                    <p className="text-sm font-semibold mb-1">{data.name}</p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {value}% • {count} bài viết
                                                                    </p>
                                                                </div>
                                                            )
                                                        }
                                                        return null
                                                    }}
                                                />
                                            </RechartsPieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    
                                    {/* Enhanced Legend with values */}
                                    <div className="grid grid-cols-2 gap-4">
                                        {categoryDataWithColors.map((item, index) => {
                                            const count = Math.round((item.value / 100) * stats.overview.totalPosts)
                                            return (
                                                <div 
                                                    key={item.name} 
                                                    className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/50 hover:bg-background/70 transition-all group cursor-pointer"
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-semibold truncate">{item.name}</div>
                                                        <div className="flex items-center gap-2 text-xs">
                                                            <span className="text-muted-foreground">{item.value}%</span>
                                                            <span className="text-muted-foreground">•</span>
                                                            <span className="font-medium">{count} bài viết</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-xs font-bold text-muted-foreground">
                                                        #{index + 1}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                    )}
                </div>
                )}

                {/* Top Posts Table */}
                {canViewPosts && (
                <motion.div variants={itemVariants}>
                    <Card className="relative overflow-hidden backdrop-blur-md bg-card/80 border border-border shadow-lg">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-background" />
                        <CardHeader className="relative z-10">
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <FileText className="h-6 w-6 text-primary" />
                                Bài viết phổ biến nhất
                            </CardTitle>
                            <CardDescription className="text-base">
                                Top 5 bài viết có nhiều bình luận nhất
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="space-y-4">
                                {stats.topPosts.length > 0 ? (
                                    stats.topPosts.map((post, index) => (
                                        <motion.div
                                            key={post.id}
                                            className="flex items-center gap-4 p-4 rounded-xl bg-background/50 border border-border/50 backdrop-blur-sm hover:bg-background/70 transition-all duration-300 hover:shadow-md"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.5 + index * 0.1 }}
                                        >
                                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-semibold text-sm mb-1">{post.title}</div>
                                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                    <div className="flex items-center gap-1">
                                                        <MessageSquare className="h-3 w-3" />
                                                        {post.comments} bình luận
                                                    </div>
                                                </div>
                                            </div>
                                            <ArrowUpRight className="h-5 w-5 text-muted-foreground opacity-50" />
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="text-center text-muted-foreground py-8">
                                        Chưa có bài viết nào
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
                )}
            </motion.div>
        </div>
    )
}

