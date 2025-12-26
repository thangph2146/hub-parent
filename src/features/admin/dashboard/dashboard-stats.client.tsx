"use client";

import { TypographyH1, TypographyH2, TypographyH4, TypographyP, TypographyPSmallMuted, TypographySpanSmall, TypographySpanSmallMuted, TypographyDescription, TypographyTitleLarge, IconSize } from "@/components/ui/typography";
import { Flex } from "@/components/ui/flex";
import { Grid } from "@/components/ui/grid";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { Calendar, BarChart3, PieChart, LineChart } from "lucide-react";
import {
  Line,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  BarChart,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useClientOnly } from "@/hooks/use-client-only";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS, isSuperAdmin } from "@/lib/permissions";
import type { DashboardStatsData } from "./queries";
import { ScrollArea } from "@/components/ui/scroll-area";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.15,
    },
  },
};

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
};

const CHART_COLORS = [
  "var(--chart-1)",              // Người dùng - Primary blue (#1f3368 / #3d5a9e)
  "var(--chart-2)",              // Bài viết - Primary red (#a71b29 / #c9444f)
  "var(--chart-3)",              // Bình luận - Dark gray (#3b3939 / #6b6b6b)
  "var(--chart-4)",              // Danh mục - Light blue (#6b8cae)
  "var(--chart-5)",              // Thẻ - Pink red (#c94857 / #e57580)
  "hsl(217, 91%, 60%)",          // Tin nhắn - Bright blue (#3b82f6)
  "hsl(45, 93%, 47%)",           // Thông báo - Yellow (#eab308)
  "hsl(270, 91%, 65%)",          // Yêu cầu liên hệ - Purple (#a855f7)
  "hsl(142, 71%, 45%)",          // sinh viên - Green (#22c55e)
  "hsl(25, 95%, 53%)",           // Phiên đăng nhập - Orange (#f97316)
  "hsl(0, 84%, 60%)",            // Vai trò - Red (#ef4444)
  "hsl(199, 89%, 48%)",          // Cyan - #06b6d4
  "hsl(262, 83%, 58%)",          // Indigo - #6366f1
  "hsl(340, 82%, 52%)",          // Pink - #ec4899
  "hsl(142, 76%, 36%)",          // Emerald - #10b981
];

const IMPORTANT_RESOURCE_COLORS: Record<string, string> = {
  users: "var(--chart-1)",       // Người dùng - màu primary blue
  posts: "var(--chart-2)",       // Bài viết - màu secondary red
  categories: "var(--chart-4)",  // Danh mục - màu accent blue
};

// Enhanced Custom Tooltip component
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number;
    color?: string;
    dataKey?: string;
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum, entry) => sum + (entry.value || 0), 0);
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-background/95 backdrop-blur-md border border-border/50 rounded-xl shadow-2xl p-4 min-w-[200px]"
      >
        <TypographyP className="mb-3 border-b border-border/50 pb-2">
          {label}
        </TypographyP>
        <Flex direction="col" gap={2}>
          {payload.map((entry, index) => {
            const percentage = total > 0 ? ((entry.value || 0) / total) * 100 : 0;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Flex align="center" justify="between" gap={3}>
                  <Flex align="center" gap={2} flex="1" minWidth="0" fullWidth>
                    <IconSize size="xs">
                      <Flex
                        rounded="full"
                        shrink
                        className="w-full h-full"
                        style={{ backgroundColor: entry.color }}
                      />
                    </IconSize>
                    <TypographySpanSmall className="truncate">
                      {entry.name ?? ""}
                    </TypographySpanSmall>
                  </Flex>
                  <Flex align="center" gap={2} className="flex-shrink-0">
                    <TypographyP style={{ color: entry.color }}>
                      {entry.value?.toLocaleString("vi-VN") ?? "0"}
                    </TypographyP>
                    {payload.length > 1 && (
                      <TypographySpanSmallMuted>
                        ({percentage.toFixed(1)}%)
                      </TypographySpanSmallMuted>
                    )}
                  </Flex>
                </Flex>
              </motion.div>
            );
          })}
        </Flex>
        {payload.length > 1 && (
          <Flex align="center" justify="between" gap={2} className="mt-3 pt-2 border-t border-border/50">
            <TypographySpanSmall>Tổng cộng</TypographySpanSmall>
            <TypographyP>
              {total.toLocaleString("vi-VN")}
            </TypographyP>
          </Flex>
        )}
      </motion.div>
    );
  }
  return null;
};

// Enhanced Pie Chart Tooltip
interface CustomPieTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number;
    color?: string;
  }>;
}

const CustomPieTooltip = ({ active, payload }: CustomPieTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const value = typeof data.value === "number" ? data.value : 0;
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-background/95 backdrop-blur-md border border-border/50 rounded-xl shadow-2xl p-4"
      >
        <Flex align="center" gap={2} className="mb-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: data.color }}
          />
          <TypographyP>{data.name}</TypographyP>
        </Flex>
        <Flex direction="col" gap={1}>
          <TypographyPSmallMuted>
            Tỷ lệ: <TypographySpanSmall>{value}%</TypographySpanSmall>
          </TypographyPSmallMuted>
        </Flex>
      </motion.div>
    );
  }
  return null;
};

export interface DashboardStatsClientProps {
  stats: DashboardStatsData;
}

export const DashboardStatsClient = ({ stats }: DashboardStatsClientProps) => {
  const isMounted = useClientOnly();
  const { data: session } = useSession();
  const { hasPermission } = usePermissions();
  const userRoles = session?.roles || [];
  const isSuperAdminUser = isSuperAdmin(userRoles);

  // Get chart colors for categories
  const categoryDataWithColors = stats.categoryData.map((item, index) => ({
    ...item,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  const canViewUsers =
    isSuperAdminUser || hasPermission(PERMISSIONS.USERS_VIEW);
  const canViewPosts =
    isSuperAdminUser || hasPermission(PERMISSIONS.POSTS_VIEW);
  const canViewComments =
    isSuperAdminUser || hasPermission(PERMISSIONS.COMMENTS_VIEW);
  const canViewCategories =
    isSuperAdminUser || hasPermission(PERMISSIONS.CATEGORIES_VIEW);
  const canViewTags = isSuperAdminUser || hasPermission(PERMISSIONS.TAGS_VIEW);
  const canViewMessages =
    isSuperAdminUser || hasPermission(PERMISSIONS.MESSAGES_VIEW);
  const canViewNotifications =
    isSuperAdminUser || hasPermission(PERMISSIONS.NOTIFICATIONS_VIEW);
  const canViewContactRequests =
    isSuperAdminUser || hasPermission(PERMISSIONS.CONTACT_REQUESTS_VIEW);
  const canViewStudents =
    isSuperAdminUser || hasPermission(PERMISSIONS.STUDENTS_VIEW);
  const canViewSessions =
    isSuperAdminUser || hasPermission(PERMISSIONS.SESSIONS_VIEW);
  const canViewRoles =
    isSuperAdminUser || hasPermission(PERMISSIONS.ROLES_VIEW);
  const canViewDashboard =
    isSuperAdminUser || hasPermission(PERMISSIONS.DASHBOARD_VIEW);

  const hasAnyStatsPermission =
    canViewUsers ||
    canViewPosts ||
    canViewComments ||
    canViewCategories ||
    canViewTags ||
    canViewMessages ||
    canViewNotifications ||
    canViewContactRequests ||
    canViewStudents ||
    canViewSessions ||
    canViewRoles ||
    canViewDashboard;

  const availableResources = useMemo(
    () => {
      const allResources = [
        {
          key: "users",
          label: "Người dùng",
          permission: canViewUsers,
          color: IMPORTANT_RESOURCE_COLORS.users || CHART_COLORS[0],
          isImportant: true,
        },
        {
          key: "posts",
          label: "Bài viết",
          permission: canViewPosts,
          color: IMPORTANT_RESOURCE_COLORS.posts || CHART_COLORS[1],
          isImportant: true,
        },
        {
          key: "comments",
          label: "Bình luận",
          permission: canViewComments,
          color: CHART_COLORS[2],
          isImportant: false,
        },
        {
          key: "categories",
          label: "Danh mục",
          permission: canViewCategories,
          color: IMPORTANT_RESOURCE_COLORS.categories || CHART_COLORS[3],
          isImportant: true,
        },
        {
          key: "tags",
          label: "Thẻ",
          permission: canViewTags,
          color: CHART_COLORS[4],
          isImportant: false,
        },
        {
          key: "messages",
          label: "Tin nhắn",
          permission: canViewMessages,
          color: CHART_COLORS[5],
          isImportant: false,
        },
        {
          key: "notifications",
          label: "Thông báo",
          permission: canViewNotifications,
          color: CHART_COLORS[6],
          isImportant: false,
        },
        {
          key: "contactRequests",
          label: "Yêu cầu liên hệ",
          permission: canViewContactRequests,
          color: CHART_COLORS[7],
          isImportant: false,
        },
        {
          key: "students",
          label: "sinh viên",
          permission: canViewStudents,
          color: CHART_COLORS[8],
          isImportant: false,
        },
        {
          key: "sessions",
          label: "Phiên đăng nhập",
          permission: canViewSessions,
          color: CHART_COLORS[9],
          isImportant: false,
        },
        {
          key: "roles",
          label: "Vai trò",
          permission: canViewRoles,
          color: CHART_COLORS[10],
          isImportant: false,
        },
      ];
      
      const filtered = allResources.filter((r) => r.permission);
      
      // Sắp xếp lại: các mục quan trọng lên đầu
      return filtered.sort((a, b) => {
        if (a.isImportant && !b.isImportant) return -1;
        if (!a.isImportant && b.isImportant) return 1;
        return 0;
      });
    },
    [
      canViewUsers,
      canViewPosts,
      canViewComments,
      canViewCategories,
      canViewTags,
      canViewMessages,
      canViewNotifications,
      canViewContactRequests,
      canViewStudents,
      canViewSessions,
      canViewRoles,
    ]
  );

  const [selectedResourcesState, setSelectedResources] = useState<Set<string>>(() => {
    return new Set();
  });

  const [chartType, setChartType] = useState<"line" | "bar" | "composed">("composed");
  
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());

  const selectedResources = useMemo(() => {
    const availableKeys = new Set(availableResources.map((r) => r.key));
    
    // Lọc bỏ các resources không còn available (không có permission)
    const filtered = new Set(
      [...selectedResourcesState].filter((key) => availableKeys.has(key))
    );
    
    if (filtered.size === 0 && availableKeys.size > 0 && selectedResourcesState.size === 0) {
      setTimeout(() => {
        setSelectedResources(availableKeys);
      }, 0);
      return availableKeys;
    }
    
    return filtered;
  }, [selectedResourcesState, availableResources]);

  const toggleResource = (key: string) => {
    setSelectedResources((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleSeriesVisibility = (key: string) => {
    setHiddenSeries((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Select all / Deselect all
  const selectAll = () => {
    setSelectedResources(new Set(availableResources.map((r) => r.key)));
  };

  const deselectAll = () => {
    setSelectedResources(new Set());
  };

  if (!isMounted) {
    return (
      <Flex direction="col" gap={4} flex="1" padding="responsive-lg" fullWidth>
        <Flex className="h-64 bg-muted/50 rounded-xl animate-pulse" fullWidth />
      </Flex>
    );
  }

  if (!hasAnyStatsPermission) {
    return (
      <Flex direction="col" align="center" flex="1" padding="responsive-lg" fullWidth>
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center">
              Không có quyền truy cập
            </CardTitle>
            <CardDescription className="text-center">
              Bạn không có quyền xem thống kê. Vui lòng liên hệ quản trị viên để
              được cấp quyền.
            </CardDescription>
          </CardHeader>
        </Card>
      </Flex>
    );
  }

  return (
    <Flex direction="col" gap={6} flex="1" padding="responsive-lg" position="relative" overflow="hidden" fullWidth>
      {/* Background gradient effects */}
      <Flex position="absolute-inset" className="-z-10 overflow-hidden pointer-events-none">
        <Flex position="absolute-right-top" className="w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <Flex position="absolute" className="bottom-0 left-0 w-96 h-96 bg-[#00cc44]/5 dark:bg-[#00ff88]/5 rounded-full blur-3xl" />
      </Flex>

      <motion.div
        className="flex flex-1 flex-col gap-8 relative z-10 w-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <Flex direction="col" gap={2}>
          <motion.div variants={itemVariants}>
          <Flex align="center" justify="between">
            <div>
              <TypographyH1>
                <Flex align="center" gap={3}>
                  <IconSize size="2xl">
                    <BarChart3 className="text-primary" />
                  </IconSize>
                  <span className="bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
                    Thống kê chi tiết
                  </span>
                </Flex>
              </TypographyH1>
              <TypographyDescription className="mt-2">
                <Flex align="center" gap={2}>
                  <IconSize size="md">
                    <Calendar />
                  </IconSize>
                  {new Date().toLocaleDateString("vi-VN", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </Flex>
              </TypographyDescription>
            </div>
          </Flex>
          </motion.div>
        </Flex>

        {/* Main Charts Row */}
        {(canViewUsers ||
          canViewPosts ||
          canViewComments ||
          canViewCategories ||
          canViewTags ||
          canViewMessages ||
          canViewNotifications ||
          canViewContactRequests ||
          canViewStudents ||
          canViewSessions ||
          canViewRoles) && (
          <Grid cols="responsive-3" gap={6} fullWidth>
            {/* Line Chart - Monthly Trends */}
            {(canViewUsers ||
              canViewPosts ||
              canViewComments ||
              canViewCategories ||
              canViewTags ||
              canViewMessages ||
              canViewNotifications ||
              canViewContactRequests ||
              canViewStudents ||
              canViewSessions ||
              canViewRoles) && (
              <motion.div variants={itemVariants} className="lg:col-span-2 xl:col-span-2">
                <Card className="relative overflow-hidden backdrop-blur-md bg-card/80 border border-border shadow-lg">
                  <Flex position="absolute-inset" className="bg-gradient-to-br from-primary/5 to-background" />
                  <CardHeader className="relative z-10">
                    <Flex direction="col" align="center" justify="between" gap={4} fullWidth className="sm:flex-row">
                      <Flex direction="col" gap={2}>
                        <CardTitle>
                          <TypographyTitleLarge>
                            <Flex align="center" gap={2}>
                              <IconSize size="md">
                                <LineChart className="text-primary" />
                              </IconSize>
                              Xu hướng theo tháng
                            </Flex>
                          </TypographyTitleLarge>
                        </CardTitle>
                        <CardDescription>
                          Thống kê các resources theo tháng
                        </CardDescription>
                      </Flex>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-2 w-full sm:w-auto"
                            aria-label="Chọn resources để hiển thị trên biểu đồ"
                          >
                            <IconSize size="sm">
                              <BarChart3 />
                            </IconSize>
                            <span className="hidden sm:inline">Chọn mục hiển thị</span>
                            <span className="sm:hidden">Chọn</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64" align="end">
                          <Flex direction="col" gap={3}>
                            <Flex align="center" justify="between" fullWidth>
                              <TypographyP>
                                Chọn resources
                              </TypographyP>
                              <Flex gap={1}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2"
                                  onClick={selectAll}
                                >
                                  <TypographySpanSmall>Tất cả</TypographySpanSmall>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2"
                                  onClick={deselectAll}
                                >
                                  <TypographySpanSmall>Bỏ chọn</TypographySpanSmall>
                                </Button>
                              </Flex>
                            </Flex>
                            <Flex direction="col" gap={2} className="max-h-64 overflow-y-auto">
                              {availableResources.map((resource) => (
                                <Flex
                                  key={resource.key}
                                  align="center"
                                  gap={2}
                                  className="cursor-pointer hover:bg-muted/50 rounded-md p-2 -mx-2"
                                  onClick={() => toggleResource(resource.key)}
                                  fullWidth
                                >
                                  <Checkbox
                                    id={resource.key}
                                    checked={selectedResources.has(
                                      resource.key
                                    )}
                                    onCheckedChange={() =>
                                      toggleResource(resource.key)
                                    }
                                  />
                                  <label
                                    htmlFor={resource.key}
                                    className="leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer"
                                  >
                                    <Flex align="center" gap={2} fullWidth>
                                      <IconSize size="xs">
                                        <Flex
                                          rounded="full"
                                          className="w-full h-full"
                                          style={{
                                            backgroundColor: resource.color,
                                          }}
                                        />
                                      </IconSize>
                                      <TypographyP>{resource.label}</TypographyP>
                                    </Flex>
                                  </label>
                                </Flex>
                              ))}
                            </Flex>
                          </Flex>
                        </PopoverContent>
                      </Popover>
                    </Flex>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    {/* Chart Type Selector */}
                    <Flex align="center" justify="end" gap={2} paddingBottom={4} fullWidth>
                      <Flex align="center" gap={1} rounded="lg" border="all" bg="muted-50" padding="xs">
                        <Button
                          variant={chartType === "line" ? "default" : "ghost"}
                          size="sm"
                          className="h-7 px-3"
                          onClick={() => setChartType("line")}
                        >
                          <IconSize size="xs" className="mr-1">
                            <LineChart />
                          </IconSize>
                          <TypographySpanSmall>Đường</TypographySpanSmall>
                        </Button>
                        <Button
                          variant={chartType === "bar" ? "default" : "ghost"}
                          size="sm"
                          className="h-7 px-3"
                          onClick={() => setChartType("bar")}
                        >
                          <IconSize size="xs" className="mr-1">
                            <BarChart3 />
                          </IconSize>
                          <TypographySpanSmall>Cột</TypographySpanSmall>
                        </Button>
                        <Button
                          variant={chartType === "composed" ? "default" : "ghost"}
                          size="sm"
                          className="h-7 px-3"
                          onClick={() => setChartType("composed")}
                        >
                          <IconSize size="xs" className="mr-1">
                            <BarChart3 />
                          </IconSize>
                          <TypographySpanSmall>Kết hợp</TypographySpanSmall>
                        </Button>
                      </Flex>
                    </Flex>

                    {selectedResources.size === 0 ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="h-80"
                      >
                        <Flex direction="col" align="center" gap={2} className="h-full text-muted-foreground text-center">
                          <BarChart3 className="h-12 w-12 opacity-50" />
                          <TypographyP>Vui lòng chọn ít nhất một resource để hiển thị</TypographyP>
                        </Flex>
                      </motion.div>
                    ) : (
                      <div className="h-64 sm:h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          {chartType === "line" ? (
                            <ComposedChart
                              data={stats.monthlyData}
                              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                            >
                              <defs>
                                {availableResources
                                  .filter((r) => selectedResources.has(r.key))
                                  .map((resource) => (
                                    <linearGradient
                                      key={`gradient-${resource.key}`}
                                      id={`gradient-${resource.key}`}
                                      x1="0"
                                      y1="0"
                                      x2="0"
                                      y2="1"
                                    >
                                      <stop
                                        offset="0%"
                                        stopColor={resource.color}
                                        stopOpacity={0.3}
                                      />
                                      <stop
                                        offset="100%"
                                        stopColor={resource.color}
                                        stopOpacity={0}
                                      />
                                    </linearGradient>
                                  ))}
                              </defs>
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="hsl(var(--border))"
                                opacity={0.2}
                                vertical={false}
                              />
                              <XAxis
                                dataKey="month"
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                              />
                              <YAxis
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                width={50}
                              />
                              <Tooltip
                                content={<CustomTooltip />}
                                cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1, strokeDasharray: "5 5" }}
                              />
                              <Legend
                                wrapperStyle={{
                                  fontSize: "11px",
                                  paddingTop: "20px",
                                }}
                                iconType="circle"
                                iconSize={8}
                                onClick={(e) => {
                                  const dataKey = e.dataKey as string;
                                  if (dataKey) toggleSeriesVisibility(dataKey);
                                }}
                                formatter={(value, entry) => {
                                  const isHidden = hiddenSeries.has(entry.dataKey as string);
                                  return (
                                    <span
                                      style={{
                                        opacity: isHidden ? 0.5 : 1,
                                        cursor: "pointer",
                                        textDecoration: isHidden ? "line-through" : "none",
                                      }}
                                    >
                                      {value}
                                    </span>
                                  );
                                }}
                              />
                              {availableResources
                                .filter((r) => selectedResources.has(r.key) && !hiddenSeries.has(r.key))
                                .map((resource) => (
                                  <Line
                                    key={resource.key}
                                    type="monotone"
                                    dataKey={resource.key}
                                    stroke={resource.color}
                                    strokeWidth={2.5}
                                    dot={{ fill: resource.color, r: 4, strokeWidth: 2 }}
                                    activeDot={{ r: 7, strokeWidth: 2, stroke: resource.color }}
                                    name={resource.label}
                                    strokeDasharray={hiddenSeries.has(resource.key) ? "5 5" : "0"}
                                    opacity={hiddenSeries.has(resource.key) ? 0.3 : 1}
                                    animationDuration={300}
                                  />
                                ))}
                            </ComposedChart>
                          ) : chartType === "bar" ? (
                            <BarChart
                              data={stats.monthlyData}
                              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                            >
                              <defs>
                                {availableResources
                                  .filter((r) => selectedResources.has(r.key))
                                  .map((resource) => (
                                    <linearGradient
                                      key={`gradient-${resource.key}`}
                                      id={`gradient-${resource.key}`}
                                      x1="0"
                                      y1="0"
                                      x2="0"
                                      y2="1"
                                    >
                                      <stop
                                        offset="0%"
                                        stopColor={resource.color}
                                        stopOpacity={0.8}
                                      />
                                      <stop
                                        offset="100%"
                                        stopColor={resource.color}
                                        stopOpacity={0.4}
                                      />
                                    </linearGradient>
                                  ))}
                              </defs>
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="hsl(var(--border))"
                                opacity={0.2}
                                vertical={false}
                              />
                              <XAxis
                                dataKey="month"
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                              />
                              <YAxis
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                width={50}
                              />
                              <Tooltip
                                content={<CustomTooltip />}
                                cursor={{ fill: "hsl(var(--muted))", opacity: 0.1 }}
                              />
                              <Legend
                                wrapperStyle={{
                                  fontSize: "11px",
                                  paddingTop: "20px",
                                }}
                                iconType="square"
                                iconSize={8}
                                onClick={(e) => {
                                  const dataKey = e.dataKey as string;
                                  if (dataKey) toggleSeriesVisibility(dataKey);
                                }}
                                formatter={(value, entry) => {
                                  const isHidden = hiddenSeries.has(entry.dataKey as string);
                                  return (
                                    <span
                                      style={{
                                        opacity: isHidden ? 0.5 : 1,
                                        cursor: "pointer",
                                        textDecoration: isHidden ? "line-through" : "none",
                                      }}
                                    >
                                      {value}
                                    </span>
                                  );
                                }}
                              />
                              {availableResources
                                .filter((r) => selectedResources.has(r.key) && !hiddenSeries.has(r.key))
                                .map((resource) => (
                                  <Bar
                                    key={resource.key}
                                    dataKey={resource.key}
                                    fill={`url(#gradient-${resource.key})`}
                                    stroke={resource.color}
                                    strokeWidth={1}
                                    name={resource.label}
                                    radius={[4, 4, 0, 0]}
                                    opacity={hiddenSeries.has(resource.key) ? 0.3 : 1}
                                    animationDuration={300}
                                  />
                                ))}
                            </BarChart>
                          ) : (
                            <ComposedChart
                              data={stats.monthlyData}
                              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                            >
                              <defs>
                                {availableResources
                                  .filter((r) => selectedResources.has(r.key))
                                  .map((resource) => (
                                    <linearGradient
                                      key={`gradient-${resource.key}`}
                                      id={`gradient-${resource.key}`}
                                      x1="0"
                                      y1="0"
                                      x2="0"
                                      y2="1"
                                    >
                                      <stop
                                        offset="0%"
                                        stopColor={resource.color}
                                        stopOpacity={0.3}
                                      />
                                      <stop
                                        offset="100%"
                                        stopColor={resource.color}
                                        stopOpacity={0}
                                      />
                                    </linearGradient>
                                  ))}
                              </defs>
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="hsl(var(--border))"
                                opacity={0.2}
                                vertical={false}
                              />
                              <XAxis
                                dataKey="month"
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                              />
                              <YAxis
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                width={50}
                              />
                              <Tooltip
                                content={<CustomTooltip />}
                                cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1, strokeDasharray: "5 5" }}
                              />
                              <Legend
                                wrapperStyle={{
                                  fontSize: "11px",
                                  paddingTop: "20px",
                                }}
                                iconType="circle"
                                iconSize={8}
                                onClick={(e) => {
                                  const dataKey = e.dataKey as string;
                                  if (dataKey) toggleSeriesVisibility(dataKey);
                                }}
                                formatter={(value, entry) => {
                                  const isHidden = hiddenSeries.has(entry.dataKey as string);
                                  return (
                                    <span
                                      style={{
                                        opacity: isHidden ? 0.5 : 1,
                                        cursor: "pointer",
                                        textDecoration: isHidden ? "line-through" : "none",
                                      }}
                                    >
                                      {value}
                                    </span>
                                  );
                                }}
                              />
                              {availableResources
                                .filter((r) => selectedResources.has(r.key) && !hiddenSeries.has(r.key))
                                .map((resource, index) => {
                                  // Show first 3 as bars, rest as lines
                                  if (index < 3) {
                                    return (
                                      <Bar
                                        key={resource.key}
                                        dataKey={resource.key}
                                        fill={`url(#gradient-${resource.key})`}
                                        stroke={resource.color}
                                        strokeWidth={1}
                                        name={resource.label}
                                        radius={[4, 4, 0, 0]}
                                        opacity={hiddenSeries.has(resource.key) ? 0.3 : 0.6}
                                        animationDuration={300}
                                      />
                                    );
                                  }
                                  return (
                                    <Line
                                      key={resource.key}
                                      type="monotone"
                                      dataKey={resource.key}
                                      stroke={resource.color}
                                      strokeWidth={2.5}
                                      dot={{ fill: resource.color, r: 4, strokeWidth: 2 }}
                                      activeDot={{ r: 7, strokeWidth: 2, stroke: resource.color }}
                                      name={resource.label}
                                      strokeDasharray={hiddenSeries.has(resource.key) ? "5 5" : "0"}
                                      opacity={hiddenSeries.has(resource.key) ? 0.3 : 1}
                                      animationDuration={300}
                                    />
                                  );
                                })}
                            </ComposedChart>
                          )}
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Pie Chart - Categories */}
            {canViewCategories && (
              <motion.div variants={itemVariants} className="xl:col-span-1">
                <Card className="relative overflow-hidden backdrop-blur-md bg-card/80 border border-border shadow-lg">
                  <Flex position="absolute-inset" className="bg-gradient-to-br from-primary/5 to-background" />
                  <CardHeader className="relative z-10">
                    <CardTitle>
                      <Flex align="center" gap={2}>
                        <IconSize size="md">
                          <PieChart className="text-primary" />
                        </IconSize>
                        <TypographyH4>Phân bố danh mục</TypographyH4>
                      </Flex>
                    </CardTitle>
                    <CardDescription>
                      Tỷ lệ bài viết theo từng danh mục
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    {categoryDataWithColors.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="h-64 sm:h-80 text-muted-foreground"
                      >
                        <Flex align="center" justify="center" direction="col" gap={2} textAlign="center">
                          <PieChart className="h-12 w-12 opacity-50" />
                          <TypographyP>Chưa có dữ liệu danh mục</TypographyP>
                        </Flex>
                      </motion.div>
                    ) : (
                      <Flex direction="col" gap={6}>
                        {/* Enhanced Donut Chart */}
                        <Flex align="center" justify="center" position="relative" fullWidth>
                            <ResponsiveContainer width="100%" height={280}>
                              <RechartsPieChart>
                                <defs>
                                  {categoryDataWithColors.map((entry, index) => (
                                    <linearGradient
                                      key={`pie-gradient-${index}`}
                                      id={`pie-gradient-${index}`}
                                      x1="0"
                                      y1="0"
                                      x2="1"
                                      y2="1"
                                    >
                                      <stop
                                        offset="0%"
                                        stopColor={entry.color}
                                        stopOpacity={1}
                                      />
                                      <stop
                                        offset="100%"
                                        stopColor={entry.color}
                                        stopOpacity={0.7}
                                      />
                                    </linearGradient>
                                  ))}
                                </defs>
                              <Pie
                                data={categoryDataWithColors}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={110}
                                paddingAngle={3}
                                dataKey="value"
                                label={false}
                                labelLine={false}
                                animationBegin={0}
                                animationDuration={600}
                                animationEasing="ease-out"
                              >
                                {categoryDataWithColors.map((entry, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={`url(#pie-gradient-${index})`}
                                    stroke="oklch(var(--background))"
                                    strokeWidth={3}
                                    style={{
                                      filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
                                    }}
                                  />
                                ))}
                              </Pie>
                              <Tooltip content={<CustomPieTooltip />} />
                            </RechartsPieChart>
                          </ResponsiveContainer>
                          {/* Center label showing total */}
                          <Flex align="center" justify="center" direction="col" gap={1} position="absolute-inset" className="pointer-events-none" textAlign="center">
                            <TypographyH2>
                              {stats.overview.totalPosts}
                            </TypographyH2>
                            <TypographyPSmallMuted>
                              Tổng bài viết
                            </TypographyPSmallMuted>
                          </Flex>
                        </Flex>

                        {/* Enhanced Legend with values and animations */}
                        <ScrollArea className="h-[200px]">
                        <Flex direction="col" gap={3} className="px-4">
                          <AnimatePresence>
                            {categoryDataWithColors.map((item, index) => {
                              const count = Math.round(
                                (item.value / 100) * stats.overview.totalPosts
                              );
                              return (
                                <motion.div
                                  key={item.name}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  transition={{ delay: index * 0.05 }}
                                  className="p-3 rounded-lg bg-background/50 border border-border/50 hover:bg-background/80 hover:border-border transition-all group cursor-pointer"
                                >
                                  <Flex align="center" gap={3} fullWidth>
                                    <IconSize size="sm">
                                      <Flex
                                        rounded="full"
                                        shrink
                                        className="shadow-sm"
                                        style={{ backgroundColor: item.color, width: "100%", height: "100%" }}
                                      />
                                    </IconSize>
                                    <Flex direction="col" flex="1" minWidth="0" fullWidth>
                                      <TypographyP className="truncate">
                                        {item.name}
                                      </TypographyP>
                                      <Flex align="center" gap={2} className="mt-0.5">
                                        <TypographySpanSmallMuted>
                                          {item.value}%
                                        </TypographySpanSmallMuted>
                                        <span className="text-muted-foreground">•</span>
                                        <TypographySpanSmall>
                                          {count.toLocaleString("vi-VN")} bài viết
                                        </TypographySpanSmall>
                                      </Flex>
                                    </Flex>
                                    <Flex align="center" gap={2} className="flex-shrink-0">
                                      <TypographySpanSmall className="bg-muted/50 px-2 py-1 rounded">
                                        #{index + 1}
                                      </TypographySpanSmall>
                                    </Flex>
                                  </Flex>
                                </motion.div>
                              );
                              })}
                            </AnimatePresence>
                          </Flex>
                          </ScrollArea>
                      </Flex>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </Grid>
        )}
      </motion.div>
    </Flex>
  );
}
