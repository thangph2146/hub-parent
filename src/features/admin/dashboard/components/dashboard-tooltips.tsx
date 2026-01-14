"use client";

import { Flex } from "@/components/ui/flex";
import { TypographyP, TypographySpanSmall, TypographySpanSmallMuted, TypographyPSmallMuted, IconSize } from "@/components/ui/typography";
import { motion } from "framer-motion";

// Enhanced Custom Tooltip component
export interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number;
    color?: string;
    dataKey?: string;
  }>;
  label?: string;
}

export const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
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
export interface CustomPieTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number;
    color?: string;
  }>;
}

export const CustomPieTooltip = ({ active, payload }: CustomPieTooltipProps) => {
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
