import { PieChart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TypographyH4, TypographyP } from "@/components/ui/typography";
import { Flex } from "@/components/ui/flex";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HighchartsPieChart } from "../highcharts-pie-chart.client";

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

interface CategoryDistributionItem {
  name: string;
  value: number;
  color: string;
}

interface CategoryDistributionSectionProps {
  categoryData: CategoryDistributionItem[];
  totalPosts: number;
}

export const CategoryDistributionSection = ({
  categoryData,
  totalPosts,
}: CategoryDistributionSectionProps) => {
  return (
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
          {categoryData.length === 0 ? (
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
                  categoryData={categoryData}
                  totalPosts={totalPosts}
                />
              </div>

              {/* Enhanced Legend with values and animations */}
              <div className="border-t pt-4">
                <ScrollArea className="h-[220px]">
                  <div className="space-y-2 pr-4">
                    <AnimatePresence>
                      {categoryData.map((item, index) => {
                        const count = Math.round(
                          (item.value / 100) * totalPosts
                        );
                        const percentage = item.value;
                        return (
                          <motion.div
                            key={item.name}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ delay: index * 0.03 }}
                            className="group relative p-3 rounded-lg bg-muted/30 hover:bg-muted border border-transparent hover:border-border/50 transition-all cursor-pointer"
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
  );
};
