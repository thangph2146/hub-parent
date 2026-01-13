"use client";

import { Flex } from "@/components/ui/flex";
import { Grid } from "@/components/ui/grid";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useState, useMemo, useRef, useCallback, useLayoutEffect } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useClientOnly } from "@/hooks";
import { usePermissions } from "@/features/auth";
import { PERMISSIONS, isSuperAdmin } from "@/permissions";
import type { DashboardStatsData } from "./queries";

// Sub-sections
import { DashboardHeader } from "./components/dashboard-stats-sub-sections/DashboardHeader";
import { MonthlyTrendsSection } from "./components/dashboard-stats-sub-sections/MonthlyTrendsSection";
import { CategoryDistributionSection } from "./components/dashboard-stats-sub-sections/CategoryDistributionSection";

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

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "hsl(217, 91%, 60%)",
  "hsl(45, 93%, 47%)",
  "hsl(270, 91%, 65%)",
  "hsl(142, 71%, 45%)",
  "hsl(25, 95%, 53%)",
  "hsl(0, 84%, 60%)",
  "hsl(199, 89%, 48%)",
  "hsl(262, 83%, 58%)",
  "hsl(340, 82%, 52%)",
  "hsl(142, 76%, 36%)",
];

const IMPORTANT_RESOURCE_COLORS: Record<string, string> = {
  users: "var(--chart-1)",
  posts: "var(--chart-2)",
  categories: "var(--chart-4)",
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
  const categoryDataWithColors = useMemo(() => 
    stats.categoryData.map((item, index) => ({
      ...item,
      color: CHART_COLORS[index % CHART_COLORS.length],
    })), [stats.categoryData]);

  const canViewUsers = isSuperAdminUser || hasPermission(PERMISSIONS.USERS_VIEW);
  const canViewPosts = isSuperAdminUser || hasPermission(PERMISSIONS.POSTS_VIEW_ALL) || hasPermission(PERMISSIONS.POSTS_VIEW_OWN);
  const canViewComments = isSuperAdminUser || hasPermission(PERMISSIONS.COMMENTS_VIEW);
  const canViewCategories = isSuperAdminUser || hasPermission(PERMISSIONS.CATEGORIES_VIEW);
  const canViewTags = isSuperAdminUser || hasPermission(PERMISSIONS.TAGS_VIEW);
  const canViewMessages = isSuperAdminUser || hasPermission(PERMISSIONS.MESSAGES_VIEW);
  const canViewNotifications = isSuperAdminUser || hasPermission(PERMISSIONS.NOTIFICATIONS_VIEW);
  const canViewContactRequests = isSuperAdminUser || hasPermission(PERMISSIONS.CONTACT_REQUESTS_VIEW);
  const canViewStudents = isSuperAdminUser || hasPermission(PERMISSIONS.STUDENTS_VIEW);
  const canViewSessions = isSuperAdminUser || hasPermission(PERMISSIONS.SESSIONS_VIEW);
  const canViewRoles = isSuperAdminUser || hasPermission(PERMISSIONS.ROLES_VIEW);
  const canViewDashboard = isSuperAdminUser || hasPermission(PERMISSIONS.DASHBOARD_VIEW);

  const hasAnyStatsPermission = canViewUsers || canViewPosts || canViewComments || canViewCategories || 
    canViewTags || canViewMessages || canViewNotifications || canViewContactRequests || 
    canViewStudents || canViewSessions || canViewRoles || canViewDashboard;

  const availableResources = useMemo(() => {
    const allResources = [
      { key: "users", label: "Người dùng", permission: canViewUsers, color: IMPORTANT_RESOURCE_COLORS.users || CHART_COLORS[0], isImportant: true },
      { key: "posts", label: "Bài viết", permission: canViewPosts, color: IMPORTANT_RESOURCE_COLORS.posts || CHART_COLORS[1], isImportant: true },
      { key: "comments", label: "Bình luận", permission: canViewComments, color: CHART_COLORS[2], isImportant: false },
      { key: "categories", label: "Danh mục", permission: canViewCategories, color: IMPORTANT_RESOURCE_COLORS.categories || CHART_COLORS[3], isImportant: true },
      { key: "tags", label: "Thẻ", permission: canViewTags, color: CHART_COLORS[4], isImportant: false },
      { key: "messages", label: "Tin nhắn", permission: canViewMessages, color: CHART_COLORS[5], isImportant: false },
      { key: "notifications", label: "Thông báo", permission: canViewNotifications, color: CHART_COLORS[6], isImportant: false },
      { key: "contactRequests", label: "Yêu cầu liên hệ", permission: canViewContactRequests, color: CHART_COLORS[7], isImportant: false },
      { key: "students", label: "sinh viên", permission: canViewStudents, color: CHART_COLORS[8], isImportant: false },
      { key: "sessions", label: "Phiên đăng nhập", permission: canViewSessions, color: CHART_COLORS[9], isImportant: false },
      { key: "roles", label: "Vai trò", permission: canViewRoles, color: CHART_COLORS[10], isImportant: false },
    ];
    
    return allResources
      .filter((r) => r.permission)
      .sort((a, b) => {
        if (a.isImportant && !b.isImportant) return -1;
        if (!a.isImportant && b.isImportant) return 1;
        return 0;
      });
  }, [canViewUsers, canViewPosts, canViewComments, canViewCategories, canViewTags, canViewMessages, canViewNotifications, canViewContactRequests, canViewStudents, canViewSessions, canViewRoles]);

  const [selectedResourcesState, setSelectedResources] = useState<Set<string>>(new Set());
  const [chartType, setChartType] = useState<"line" | "bar" | "composed">("composed");
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());

  const selectedResources = useMemo(() => {
    const availableKeys = new Set(availableResources.map((r) => r.key));
    return new Set([...selectedResourcesState].filter((key) => availableKeys.has(key)));
  }, [selectedResourcesState, availableResources]);

  const hasAutoSelectedRef = useRef(false);
  useLayoutEffect(() => {
    if (!hasAutoSelectedRef.current && selectedResourcesState.size === 0 && availableResources.length > 0) {
      setSelectedResources(new Set(availableResources.map((r) => r.key)));
      hasAutoSelectedRef.current = true;
    }
  }, [availableResources, selectedResourcesState.size]);

  const toggleResource = useCallback((key: string) => {
    setSelectedResources((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const toggleSeriesVisibility = useCallback((key: string) => {
    setHiddenSeries((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedResources(new Set(availableResources.map((r) => r.key)));
    hasAutoSelectedRef.current = true;
  }, [availableResources]);

  const deselectAll = useCallback(() => {
    setSelectedResources(new Set());
    hasAutoSelectedRef.current = true;
  }, []);

  if (!isMounted) {
    return (
      <Flex direction="col" gap={4} flex="1" padding="responsive-lg" fullWidth>
        <Flex className="h-64 bg-muted rounded-xl animate-pulse" fullWidth />
      </Flex>
    );
  }

  if (!hasAnyStatsPermission) {
    return (
      <Flex direction="col" align="center" flex="1" padding="responsive-lg" fullWidth>
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center">Không có quyền truy cập</CardTitle>
            <CardDescription className="text-center">
              Bạn không có quyền xem thống kê. Vui lòng liên hệ quản trị viên để được cấp quyền.
            </CardDescription>
          </CardHeader>
        </Card>
      </Flex>
    );
  }

  return (
    <Flex direction="col" gap={6} flex="1" padding="responsive-lg" position="relative" overflow="hidden" fullWidth>
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
        <DashboardHeader />

        <Grid cols="responsive-3" gap={6} fullWidth>
          <MonthlyTrendsSection
            monthlyData={stats.monthlyData}
            availableResources={availableResources}
            selectedResources={selectedResources}
            hiddenSeries={hiddenSeries}
            chartType={chartType}
            setChartType={setChartType}
            toggleResource={toggleResource}
            toggleSeriesVisibility={toggleSeriesVisibility}
            selectAll={selectAll}
            deselectAll={deselectAll}
          />

          {canViewCategories && (
            <CategoryDistributionSection
              categoryData={categoryDataWithColors}
              totalPosts={stats.overview.totalPosts}
            />
          )}
        </Grid>
      </motion.div>
    </Flex>
  );
};
