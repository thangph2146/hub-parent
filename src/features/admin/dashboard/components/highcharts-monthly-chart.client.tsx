"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import type HighchartsReactRef from "highcharts-react-official";
import type Highcharts from "highcharts";
import { Flex } from "@/components/ui/flex";
import { TypographyP } from "@/components/ui/typography";
import { getComputedColor } from "./utils";

const HighchartsReact = dynamic(
  () => import("highcharts-react-official"),
  { ssr: false }
);

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

type ExtendedSeriesOptions = Highcharts.SeriesOptionsType & {
  key?: string;
};

export const HighchartsMonthlyChart = ({
  monthlyData,
  availableResources,
  selectedResources,
  hiddenSeries,
  chartType,
  onSeriesToggle,
}: HighchartsMonthlyChartProps) => {
  const chartRef = useRef<HighchartsReactRef.RefObject>(null);
  const [Highcharts, setHighcharts] = useState<typeof import("highcharts") | null>(null);
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
        } as ExtendedSeriesOptions;
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
        } as ExtendedSeriesOptions;
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
          } as ExtendedSeriesOptions;
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
          } as ExtendedSeriesOptions;
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
        formatter: function (this: any) {
          const maxPoints = 8;
          const pointsToShow = this.points ? this.points.slice(0, maxPoints) : [];
          const hasMore = this.points ? this.points.length > maxPoints : false;
          
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
                ">${point.y?.toLocaleString("vi-VN")}</span>
              </div>
            `;
          });
          if (hasMore && this.points) {
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
            legendItemClick: function (this: Highcharts.Series) {
              const seriesKey = (this.options as ExtendedSeriesOptions).key || this.name;
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
    } as Highcharts.Options;
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
