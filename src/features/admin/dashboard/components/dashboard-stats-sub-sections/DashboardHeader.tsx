import { TypographyH1, TypographyDescription } from "@/components/ui/typography";
import { Flex } from "@/components/ui/flex";
import { Calendar, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

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

export const DashboardHeader = () => {
  return (
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
  );
};
