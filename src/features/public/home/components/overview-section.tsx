"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Quote } from "lucide-react";
import { Flex } from "@/components/ui/flex";
import { TypographyH2, TypographyP } from "@/components/ui/typography";
import { PointerHighlight } from "@/components/ui/pointer-highlight";
import { ContainerTextFlip } from "@/components/ui/container-text-flip";
import { useSectionHeight } from "@/hooks/use-section-height";
import { cn } from "@/lib/utils";
import { ScrollIndicator } from "./scroll-indicator";

export interface OverviewSectionProps {
  className?: string;
}

interface ParagraphItem {
  text: string;
  className?: string;
}

const PARAGRAPHS: (string | ParagraphItem)[] = [
  "Hệ thống kết nối Phụ huynh và Nhà trường được xây dựng để kiến tạo cầu nối, gắn kết giữa phụ huynh, gia đình và nhà trường trong suốt hành trình học tập của sinh viên tại trường Đại học Ngân hàng Tp. Hồ Chí Minh. Chúng tôi hiểu rằng sự tham gia tích cực của gia đình đóng vai trò quan trọng trong thành tích, tiến độ học tập của sinh viên.",
  "Thông qua nền tảng này, phụ huynh có thể theo dõi tiến độ học tập, điểm số, lịch học và lịch thi của sinh viên. Đồng thời, phụ huynh có thể trao đổi thông tin trực tiếp với giảng viên, cố vấn học tập và nhận thông báo quan trọng từ nhà trường.",
  {
    text: "Chúng tôi mong muốn được quý phụ huynh đồng hành trong hành trình học tập, sáng tạo và trưởng thành của các em.",
    className: "text-secondary font-semibold pl-6 py-4 pr-4 text-lg",
  },
];

export const OverviewSection = ({ className }: OverviewSectionProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const { sectionHeightClassName, sectionHeightStyle, scrollToNextSection } = useSectionHeight({
    minHeight: 600,
    fullHeight: true,
  });

  const titleContent = (
    <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold flex items-center gap-2">
      Về <ContainerTextFlip words={["Chúng Tôi", "Tương Lai", "Cam Kết"]} />
    </div>
  );

  const titleElement = (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, ease: "easeOut" }}>
      <TypographyH2>{titleContent}</TypographyH2>
    </motion.div>
  );

  return (
    <Flex
      as="section"
      ref={sectionRef}
      fullWidth
      position="relative"
      bg="background"
      className={cn(sectionHeightClassName, className)}
      style={sectionHeightStyle}
    >
      <Flex container padding="responsive-lg" className="h-full items-center justify-center py-8 sm:py-12 md:py-16 lg:py-20">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
          <Flex direction="col" gap={2} className="relative w-full items-center justify-center" ref={containerRef}>
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <motion.div
                className="absolute -left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-primary/50 to-transparent rounded-full"
                initial={{ height: 0 }}
                animate={isInView ? { height: "100%" } : {}}
                transition={{ duration: 0.8, delay: 0.2 }}
              />
              <PointerHighlight containerClassName="w-fit" rectangleClassName="border-primary/50" pointerClassName="text-primary">
                {titleElement}
              </PointerHighlight>
            </div>
            <Flex direction="col" gap={2} className="max-w-4xl mx-auto w-full">
              {PARAGRAPHS.map((item, index) => {
                const content = typeof item === "string" ? item : item.text;
                const itemClassName = typeof item === "string" ? undefined : item.className;
                const isHighlighted = typeof item === "object" && itemClassName?.includes("text-secondary");
                const combinedClassName = cn("text-sm sm:text-base md:text-lg leading-relaxed tracking-wide text-muted-foreground transition-colors duration-300", itemClassName);

                const wrapper = isHighlighted ? (
                  <div className="group relative p-5 sm:p-6 rounded-xl bg-gradient-to-br from-white/5 to-transparent border border-primary/10 hover:border-primary/30 shadow-sm hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1">
                    <Flex gap={4} align="start">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300 shrink-0 mt-1">
                        <Quote className="w-4 h-4 fill-primary/20" />
                      </div>
                      <TypographyP className={cn(combinedClassName, "font-medium text-foreground/90")}>{content}</TypographyP>
                    </Flex>
                    <div className="absolute bottom-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                  </div>
                ) : (
                  <div className="group relative pl-4 border-l-2 border-transparent hover:border-primary/30 transition-all duration-300">
                    <TypographyP className={cn(combinedClassName, "group-hover:text-foreground/80")}>{content}</TypographyP>
                  </div>
                );

                return (
                  <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}>
                    {wrapper}
                  </motion.div>
                );
              })}
            </Flex>
          </Flex>
        </div>
      </Flex>

      <ScrollIndicator variant="dark" onScroll={() => scrollToNextSection(sectionRef.current)} />
    </Flex>
  );
};

