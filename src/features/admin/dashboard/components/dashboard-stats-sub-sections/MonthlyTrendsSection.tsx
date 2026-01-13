import { BarChart3, LineChart } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { TypographyP, TypographyTitleLarge } from "@/components/ui/typography";
import { Flex } from "@/components/ui/flex";
import { HighchartsMonthlyChart } from "../highcharts-monthly-chart.client";
import type { DashboardStatsData } from "../../queries";

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

interface MonthlyTrendsSectionProps {
  monthlyData: DashboardStatsData["monthlyData"];
  availableResources: any[];
  selectedResources: Set<string>;
  hiddenSeries: Set<string>;
  chartType: "line" | "bar" | "composed";
  setChartType: (type: "line" | "bar" | "composed") => void;
  toggleResource: (key: string) => void;
  toggleSeriesVisibility: (key: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
}

export const MonthlyTrendsSection = ({
  monthlyData,
  availableResources,
  selectedResources,
  hiddenSeries,
  chartType,
  setChartType,
  toggleResource,
  toggleSeriesVisibility,
  selectAll,
  deselectAll,
}: MonthlyTrendsSectionProps) => {
  return (
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
                        className="flex items-center gap-2.5 cursor-pointer hover:bg-muted rounded-md p-2 -mx-2 transition-colors"
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
            <div className="inline-flex items-center gap-1 rounded-lg border bg-muted p-1 shadow-sm">
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
                monthlyData={monthlyData}
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
  );
};
