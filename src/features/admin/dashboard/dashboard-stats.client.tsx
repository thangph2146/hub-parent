"use client";

import { TypographyH1, TypographyH4, TypographyP, TypographyPSmallMuted, TypographySpanSmall, TypographySpanSmallMuted, TypographyDescription, TypographyTitleLarge, IconSize } from "@/components/ui/typography";
import { Flex } from "@/components/ui/flex";
import { Grid } from "@/components/ui/grid";

import { useState, useMemo, useEffect, useRef, useCallback, useLayoutEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { Calendar, BarChart3, PieChart, LineChart } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamic import Highcharts để tránh lỗi SSR
const HighchartsReact = dynamic(
  () => import("highcharts-react-official"),
  { ssr: false }
);
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

// Helper function để chuyển đổi CSS variable sang màu hex/rgb
const getComputedColor = (cssVar: string): string => {
  if (typeof window === "undefined") return "#3b82f6";
  
  // Nếu đã là màu HSL, hex hoặc rgb, trả về trực tiếp
  if (cssVar.startsWith("hsl(") || cssVar.startsWith("#") || cssVar.startsWith("rgb")) {
    return cssVar;
  }
  
  // Xử lý CSS variable
  const varName = cssVar.startsWith("var(") 
    ? cssVar.replace("var(", "").replace(")", "").trim()
    : cssVar;
  
  const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  if (value) return value;
  
  // Fallback colors nếu không lấy được từ CSS variable
  const fallbackColors: Record<string, string> = {
    "var(--chart-1)": "#3d5a9e",
    "var(--chart-2)": "#c9444f",
    "var(--chart-3)": "#6b6b6b",
    "var(--chart-4)": "#6b8cae",
    "var(--chart-5)": "#e57580",
  };
  
  return fallbackColors[cssVar] || "#3b82f6";
};

// Highcharts Monthly Trends Chart Component
interface HighchartsMonthlyChartProps {
  monthlyData: Array<{
    month: string;
    [key: string]: string | number;
  }>;
  availableResources: Array<{
    key: string;
    label: string;
    color: string;
  }>;
  selectedResources: Set<string>;
  hiddenSeries: Set<string>;
  chartType: "line" | "bar" | "composed";
  onSeriesToggle: (key: string) => void;
}

const HighchartsMonthlyChart = ({
  monthlyData,
  availableResources,
  selectedResources,
  hiddenSeries,
  chartType,
  onSeriesToggle,
}: HighchartsMonthlyChartProps) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [Highcharts, setHighcharts] = useState<any>(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Dynamic import Highcharts
    import("highcharts").then((hc) => {
      setHighcharts(hc.default);
    });

    // Kiểm tra theme
    const checkTheme = () => {
      const isDarkMode = document.documentElement.classList.contains("dark") ||
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDark(isDarkMode);
    };

    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const chartOptions = useMemo(() => {
    if (!Highcharts) return null;


    // Lọc các series được chọn (bao gồm cả những cái bị ẩn)
    const selectedResourcesList = availableResources.filter(
      (r) => selectedResources.has(r.key)
    );

    // Tạo series data cho Highcharts
    const series = selectedResourcesList.map((resource) => {
      const data = monthlyData.map((item) => {
        const value = item[resource.key] as number;
        return value || 0;
      });

      const baseSeries = {
        name: resource.label,
        key: resource.key,
        color: getComputedColor(resource.color),
        visible: !hiddenSeries.has(resource.key),
      };

      if (chartType === "line") {
        return {
          ...baseSeries,
          type: "spline",
          data: data,
          lineWidth: 3,
          marker: {
            enabled: true,
            radius: 5,
            lineWidth: 2,
            lineColor: "#ffffff",
            fillColor: getComputedColor(resource.color),
            states: {
              hover: {
                radius: 7,
                lineWidth: 3,
              },
            },
          },
          states: {
            hover: {
              lineWidth: 4,
              marker: {
                radius: 7,
              },
            },
          },
          shadow: {
            color: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
            offsetX: 0,
            offsetY: 2,
            opacity: 0.3,
            width: 3,
          },
        };
      } else if (chartType === "bar") {
        return {
          ...baseSeries,
          type: "column",
          data: data,
          borderRadius: 6,
          borderWidth: 0,
          pointPadding: 0.1,
          groupPadding: 0.15,
          states: {
            hover: {
              brightness: -0.1,
            },
          },
        };
      } else {
        // Composed: 3 đầu tiên là bar, còn lại là line
        const index = selectedResourcesList.findIndex((r) => r.key === resource.key);
        if (index < 3) {
          return {
            ...baseSeries,
            type: "column",
            data: data,
            borderRadius: 6,
            borderWidth: 0,
            opacity: 0.7,
            pointPadding: 0.1,
            groupPadding: 0.15,
            states: {
              hover: {
                brightness: -0.1,
                opacity: 1,
              },
            },
          };
        } else {
          return {
            ...baseSeries,
            type: "spline",
            data: data,
            lineWidth: 3,
            marker: {
              enabled: true,
              radius: 5,
              lineWidth: 2,
              lineColor: "#ffffff",
              fillColor: getComputedColor(resource.color),
              states: {
                hover: {
                  radius: 7,
                  lineWidth: 3,
                },
              },
            },
            states: {
              hover: {
                lineWidth: 4,
                marker: {
                  radius: 7,
                },
              },
            },
          };
        }
      }
    });

    // Lấy categories từ monthlyData
    const categories = monthlyData.map((item) => item.month);

    return {
      chart: {
        type: chartType === "line" ? "spline" : chartType === "bar" ? "column" : undefined,
        backgroundColor: "transparent",
        height: 360,
        spacing: [15, 15, 15, 15],
        zooming: {
          type: "xy",
        },
        panning: {
          enabled: true,
          type: "xy",
        },
        panKey: "shift",
      },
      title: {
        text: "",
      },
      xAxis: {
        categories: categories,
        labels: {
          style: {
            fontSize: "12px",
            fontWeight: "600",
          },
        },
        lineWidth: 1,
        tickWidth: 1,
        gridLineColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
        gridLineWidth: 1,
        gridLineDashStyle: "Dot",
      },
      yAxis: {
        title: {
          text: "",
        },
        labels: {
          style: {
            fontSize: "12px",
            fontWeight: "600",
          },
        },
        lineWidth: 1,
        tickWidth: 1,
        gridLineColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
        gridLineWidth: 1,
        gridLineDashStyle: "Dot",
      },
      tooltip: {
        shared: true,
        useHTML: true,
        borderRadius: 10,
        borderWidth: 1,
        shadow: {
          color: isDark ? "rgba(0, 0, 0, 0.5)" : "rgba(0, 0, 0, 0.15)",
          offsetX: 0,
          offsetY: 4,
          opacity: 0.8,
          width: 4,
        },
        style: {
          fontSize: "12px",
          fontFamily: "inherit",
          pointerEvents: "auto",
        },
        padding: 0,
        outside: false,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, react-hooks/unsupported-syntax
        formatter: function (this: any) {
          const maxPoints = 8;
          const pointsToShow = this.points.slice(0, maxPoints);
          const hasMore = this.points.length > maxPoints;
          
          let tooltip = `
            <div style="
              border-radius: 10px;
              padding: 10px;
              box-shadow: 0 4px 6px -1px ${isDark ? "rgba(0, 0, 0, 0.3)" : "rgba(0, 0, 0, 0.1)"};
              min-width: 180px;
              max-width: 280px;
              max-height: 400px;
              overflow-y: auto;
              z-index: 9999;
            ">
              <div style="
                font-weight: 700;
                font-size: 14px;
                margin-bottom: 8px;
                padding-bottom: 6px;
              ">${this.x}</div>
              <div style="display: flex; flex-direction: column; gap: 4px;">
          `;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          pointsToShow.forEach((point: any) => {
            tooltip += `
              <div style="
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 4px 0;
              ">
                <div style="
                  width: 10px;
                  height: 10px;
                  border-radius: 50%;
                  background: ${point.color};
                  flex-shrink: 0;
                "></div>
                <span style="
                  flex: 1;
                  font-size: 13px;
                  font-weight: 600;
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                ">${point.series.name}</span>
                <span style="
                  font-weight: 700;
                  font-size: 13px;
                  color: ${point.color};
                  min-width: 60px;
                  text-align: right;
                  flex-shrink: 0;
                ">${point.y.toLocaleString("vi-VN")}</span>
              </div>
            `;
          });
          if (hasMore) {
            tooltip += `
              <div style="
                padding-top: 4px;
                margin-top: 4px;
                font-size: 11px;
                text-align: center;
              ">+${this.points.length - maxPoints} mục khác</div>
            `;
          }
          tooltip += `
              </div>
            </div>
          `;
          return tooltip;
        },
      },
      legend: {
        enabled: true,
        align: "center",
        verticalAlign: "bottom",
        layout: "horizontal",
        itemMarginTop: 5,
        itemMarginBottom: 5,
        itemStyle: {
          fontSize: "13px",
          fontWeight: "600",
        },
        itemHoverStyle: {
          fontWeight: "700",
        },
        itemHiddenStyle: {
          textDecoration: "line-through",
          opacity: 0.6,
        },
        symbolHeight: 10,
        symbolWidth: 10,
        symbolRadius: 5,
        padding: 10,
      },
      plotOptions: {
        spline: {
          marker: {
            enabled: true,
          },
          animation: {
            duration: 500,
            easing: "easeOut",
          },
        },
        line: {
          marker: {
            enabled: true,
          },
          animation: {
            duration: 500,
            easing: "easeOut",
          },
        },
        column: {
          animation: {
            duration: 500,
            easing: "easeOut",
          },
        },
        series: {
          cursor: "pointer",
          events: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            legendItemClick: function (this: any) {
              const seriesKey = this.options.key || this.name;
              onSeriesToggle(seriesKey);
              return false; // Ngăn Highcharts tự động ẩn/hiện
            },
          },
        },
      },
      series: series,
      credits: {
        enabled: false,
      },
    };
  }, [
    Highcharts,
    monthlyData,
    availableResources,
    selectedResources,
    hiddenSeries,
    chartType,
    isDark,
    onSeriesToggle,
  ]);

  if (!Highcharts || !chartOptions) {
    return (
      <Flex align="center" justify="center" className="h-80">
        <TypographyP>Đang tải biểu đồ...</TypographyP>
      </Flex>
    );
  }

  return (
    <div className="w-full" style={{ minHeight: "320px" }}>
      <HighchartsReact
        highcharts={Highcharts}
        options={chartOptions}
        ref={chartRef}
      />
    </div>
  );
};

// Highcharts Pie Chart Component
interface HighchartsPieChartProps {
  categoryData: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  totalPosts: number;
}

const HighchartsPieChart = ({ categoryData, totalPosts }: HighchartsPieChartProps) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [Highcharts, setHighcharts] = useState<any>(null);

  useEffect(() => {
    // Dynamic import Highcharts
    import("highcharts").then((hc) => {
      setHighcharts(hc.default);
    });
  }, []);

  const chartOptions = useMemo(() => {
    if (!Highcharts) return null;

    // Chuyển đổi dữ liệu sang format Highcharts
    const highchartsData = categoryData.map((item, index) => ({
      name: item.name,
      y: item.value,
      color: getComputedColor(item.color),
      sliced: index === 1, // Slice thứ 2 giống như ví dụ
      selected: index === 1,
    }));

    return {
      chart: {
        type: "pie",
        backgroundColor: "transparent",
        height: 320,
        spacing: [10, 10, 10, 10],
        zooming: {
          type: "xy",
        },
        panning: {
          enabled: true,
          type: "xy",
        },
        panKey: "shift",
      },
      title: {
        text: "",
      },
      tooltip: {
        valueSuffix: "%",
        // eslint-disable-next-line react-hooks/unsupported-syntax
        pointFormatter: function (this: { percentage: number; color: string; name: string }) {
          const count = Math.round((this.percentage / 100) * totalPosts);
          return `<span style="color:${this.color}">●</span> <b>${this.name}</b>: ${this.percentage.toFixed(1)}%<br/>${count.toLocaleString("vi-VN")} bài viết`;
        },
      },
      subtitle: {
        text: "",
      },
      plotOptions: {
        pie: {
          allowPointSelect: true,
          cursor: "pointer",
          showInLegend: false,
          borderWidth: 2,
          dataLabels: [
            {
              enabled: true,
              distance: 15,
              style: {
                fontSize: "11px",
                fontWeight: "500",
                textOutline: "1px contrast",
              },
            },
            {
              enabled: true,
              distance: -35,
              format: "{point.percentage:.1f}%",
              style: {
                fontSize: "1.1em",
                fontWeight: "600",
                textOutline: "2px contrast",
                opacity: 0.9,
              },
              filter: {
                operator: ">",
                property: "percentage",
                value: 8,
              },
            },
          ],
          states: {
            hover: {
              brightness: 0.1,
            },
            select: {
              brightness: 0.1,
            },
          },
        },
      },
      series: [
        {
          name: "Tỷ lệ",
          colorByPoint: true,
          data: highchartsData,
        },
      ],
      credits: {
        enabled: false,
      },
    };
  }, [Highcharts, categoryData, totalPosts]);

  if (!Highcharts || !chartOptions) {
    return (
      <Flex align="center" justify="center" className="h-96">
        <TypographyP>Đang tải biểu đồ...</TypographyP>
      </Flex>
    );
  }

  return (
    <div className="w-full" style={{ minHeight: "320px" }}>
      <HighchartsReact
        highcharts={Highcharts}
        options={chartOptions}
        ref={chartRef}
      />
    </div>
  );
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
    isSuperAdminUser || hasPermission(PERMISSIONS.POSTS_VIEW_ALL) || hasPermission(PERMISSIONS.POSTS_VIEW_OWN);
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
    
    // Không tự động select lại khi đã có user interaction
    // Chỉ trả về filtered set, không auto-select
    return filtered;
  }, [selectedResourcesState, availableResources]);

  // Auto-select all on mount (chỉ một lần)
  const hasAutoSelectedRef = useRef(false);
  useLayoutEffect(() => {
    if (!hasAutoSelectedRef.current && selectedResourcesState.size === 0 && availableResources.length > 0) {
      const availableKeys = new Set(availableResources.map((r) => r.key));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedResources(availableKeys);
      hasAutoSelectedRef.current = true;
    }
  }, [availableResources, selectedResourcesState.size, setSelectedResources]);

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
  const selectAll = useCallback(() => {
    const allKeys = new Set(availableResources.map((r) => r.key));
    setSelectedResources(allKeys);
    hasAutoSelectedRef.current = true; // Đánh dấu đã select để không auto-select nữa
  }, [availableResources]);

  const deselectAll = useCallback(() => {
    setSelectedResources(new Set());
    hasAutoSelectedRef.current = true; // Đánh dấu đã có user interaction để không auto-select nữa
  }, []);

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
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-8 w-8 text-primary" />
                  <span className="bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
                    Thống kê chi tiết
                  </span>
                </div>
              </TypographyH1>
              <TypographyDescription className="mt-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                  {new Date().toLocaleDateString("vi-VN", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                  </span>
                </div>
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
                <Card className="relative backdrop-blur-md bg-card/80 border border-border shadow-lg">
                  <Flex position="absolute-inset" className="bg-gradient-to-br from-primary/5 to-background overflow-hidden" />
                  <CardHeader className="relative z-10">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="space-y-1">
                        <CardTitle>
                          <TypographyTitleLarge>
                            <div className="flex items-center gap-2.5">
                              <LineChart className="h-5 w-5 text-primary" />
                              <span>Xu hướng theo tháng</span>
                            </div>
                          </TypographyTitleLarge>
                        </CardTitle>
                        <CardDescription>
                          Thống kê các resources theo tháng
                        </CardDescription>
                      </div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-2 w-full sm:w-auto"
                            aria-label="Chọn resources để hiển thị trên biểu đồ"
                          >
                            <BarChart3 className="h-4 w-4" />
                            <span className="hidden sm:inline">Chọn mục hiển thị</span>
                            <span className="sm:hidden">Chọn</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <TypographyP className="font-medium">
                                Chọn resources
                              </TypographyP>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => {
                                  const allSelected = availableResources.length > 0 && 
                                    availableResources.every(r => selectedResources.has(r.key));
                                  if (allSelected) {
                                    deselectAll();
                                  } else {
                                    selectAll();
                                  }
                                }}
                              >
                                {availableResources.length > 0 && 
                                 availableResources.every(r => selectedResources.has(r.key))
                                  ? "Bỏ chọn tất cả"
                                  : "Chọn tất cả"}
                                </Button>
                            </div>
                            <div className="space-y-1 max-h-64 overflow-y-auto">
                              {availableResources.map((resource) => (
                                <div
                                  key={resource.key}
                                  className="flex items-center gap-2.5 cursor-pointer hover:bg-muted/50 rounded-md p-2 -mx-2 transition-colors"
                                  onClick={() => toggleResource(resource.key)}
                                >
                                  <Checkbox
                                    id={resource.key}
                                    checked={selectedResources.has(resource.key)}
                                    onCheckedChange={() => toggleResource(resource.key)}
                                  />
                                  <label
                                    htmlFor={resource.key}
                                    className="flex items-center gap-2 flex-1 cursor-pointer"
                                  >
                                    <div
                                      className="h-3 w-3 rounded-full shrink-0"
                                      style={{ backgroundColor: resource.color }}
                                    />
                                    <TypographyP className="text-sm">{resource.label}</TypographyP>
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10 overflow-visible">
                    {/* Chart Type Selector */}
                    <div className="flex items-center justify-between pb-4">
                      <div className="text-xs text-muted-foreground">
                        {selectedResources.size > 0 && (
                          <span>
                            Đang hiển thị {selectedResources.size} / {availableResources.length} mục
                          </span>
                        )}
                      </div>
                      <div className="inline-flex items-center gap-1 rounded-lg border bg-muted/50 p-1 shadow-sm">
                        <Button
                          variant={chartType === "line" ? "default" : "ghost"}
                          size="sm"
                          className="h-8 px-3 gap-1.5 transition-all"
                          onClick={() => setChartType("line")}
                        >
                          <LineChart className="h-3.5 w-3.5" />
                          <span className="text-xs font-medium">Đường</span>
                        </Button>
                        <Button
                          variant={chartType === "bar" ? "default" : "ghost"}
                          size="sm"
                          className="h-8 px-3 gap-1.5 transition-all"
                          onClick={() => setChartType("bar")}
                        >
                          <BarChart3 className="h-3.5 w-3.5" />
                          <span className="text-xs font-medium">Cột</span>
                        </Button>
                        <Button
                          variant={chartType === "composed" ? "default" : "ghost"}
                          size="sm"
                          className="h-8 px-3 gap-1.5 transition-all"
                          onClick={() => setChartType("composed")}
                        >
                          <BarChart3 className="h-3.5 w-3.5" />
                          <span className="text-xs font-medium">Kết hợp</span>
                        </Button>
                      </div>
                    </div>

                    {selectedResources.size === 0 ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="h-80 flex flex-col items-center justify-center text-center text-muted-foreground"
                      >
                        <BarChart3 className="h-12 w-12 opacity-50 mb-3" />
                          <TypographyP>Vui lòng chọn ít nhất một resource để hiển thị</TypographyP>
                      </motion.div>
                    ) : (
                      <div className="overflow-visible">
                        <HighchartsMonthlyChart
                          monthlyData={stats.monthlyData}
                          availableResources={availableResources}
                          selectedResources={selectedResources}
                          hiddenSeries={hiddenSeries}
                          chartType={chartType}
                          onSeriesToggle={toggleSeriesVisibility}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Pie Chart - Categories */}
            {canViewCategories && (
              <motion.div variants={itemVariants} className="xl:col-span-1">
                <Card className="relative backdrop-blur-md bg-card/80 border border-border shadow-lg">
                  <Flex position="absolute-inset" className="bg-gradient-to-br from-primary/5 to-background overflow-hidden" />
                  <CardHeader className="relative z-10">
                    <CardTitle>
                      <div className="flex items-center gap-2.5">
                        <PieChart className="h-5 w-5 text-primary" />
                        <TypographyH4>Phân bố danh mục</TypographyH4>
                      </div>
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
                        className="h-64 sm:h-80 flex flex-col items-center justify-center text-center text-muted-foreground"
                      >
                        <PieChart className="h-12 w-12 opacity-50 mb-3" />
                          <TypographyP>Chưa có dữ liệu danh mục</TypographyP>
                      </motion.div>
                    ) : (
                      <div className="space-y-4">
                        {/* Highcharts Pie Chart */}
                        <div className="relative">
                          <HighchartsPieChart 
                            categoryData={categoryDataWithColors}
                            totalPosts={stats.overview.totalPosts}
                          />
                        </div>

                        {/* Enhanced Legend with values and animations */}
                        <div className="border-t pt-4">
                          <ScrollArea className="h-[220px]">
                            <div className="space-y-2 pr-4">
                          <AnimatePresence>
                            {categoryDataWithColors.map((item, index) => {
                              const count = Math.round(
                                (item.value / 100) * stats.overview.totalPosts
                              );
                                  const percentage = item.value;
                              return (
                                <motion.div
                                  key={item.name}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      exit={{ opacity: 0, x: -10 }}
                                      transition={{ delay: index * 0.03 }}
                                      className="group relative p-3 rounded-lg bg-muted/30 hover:bg-muted/50 border border-transparent hover:border-border/50 transition-all cursor-pointer"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                          <div
                                            className="h-3.5 w-3.5 rounded-full shrink-0 ring-2 ring-offset-1 ring-offset-background"
                                            style={{ 
                                              backgroundColor: item.color,
                                            }}
                                          />
                                          <div className="flex-1 min-w-0">
                                            <TypographyP className="truncate text-sm font-semibold text-foreground">
                                        {item.name}
                                      </TypographyP>
                                            <div className="flex items-center gap-2 mt-1">
                                              <span className="text-xs font-medium text-muted-foreground">
                                                {percentage.toFixed(1)}%
                                              </span>
                                              <span className="text-muted-foreground/60">•</span>
                                              <span className="text-xs text-muted-foreground">
                                          {count.toLocaleString("vi-VN")} bài viết
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                          {/* Progress bar */}
                                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div
                                              className="h-full rounded-full transition-all duration-300"
                                              style={{ 
                                                width: `${percentage}%`,
                                                backgroundColor: item.color,
                                              }}
                                            />
                                          </div>
                                          <div className="w-6 text-center">
                                            <span className="text-xs font-medium text-muted-foreground">
                                        #{index + 1}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                </motion.div>
                              );
                              })}
                            </AnimatePresence>
                            </div>
                          </ScrollArea>
                        </div>
                      </div>
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
