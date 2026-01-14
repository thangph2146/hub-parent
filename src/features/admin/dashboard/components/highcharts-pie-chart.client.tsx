"use client";
"use no memo";

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

interface HighchartsPieChartProps {
  categoryData: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  totalPosts: number;
}

export const HighchartsPieChart = ({ categoryData, totalPosts }: HighchartsPieChartProps) => {
  const chartRef = useRef<HighchartsReactRef.RefObject>(null);
  const [Highcharts, setHighcharts] = useState<typeof import("highcharts") | null>(null);

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
      sliced: index === 1,
      selected: index === 1,
    }));

    return {
      chart: {
        type: "pie",
        backgroundColor: "transparent",
        height: 320,
        spacing: [10, 10, 10, 10],
      },
      title: {
        text: "",
      },
      tooltip: {
        valueSuffix: "%",
        // eslint-disable-next-line react-hooks/unsupported-syntax
        pointFormatter: function (this: Highcharts.Point) {
          const count = Math.round(((this.percentage || 0) / 100) * totalPosts);
          return `<span style="color:${this.color}">●</span> <b>${this.name}</b>: ${(this.percentage || 0).toFixed(1)}%<br/>${count.toLocaleString("vi-VN")} bài viết`;
        },
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
          type: "pie",
          name: "Tỷ lệ",
          data: highchartsData,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      ],
      credits: {
        enabled: false,
      },
    } as Highcharts.Options;
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
