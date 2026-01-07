"use client";

import { useRef } from "react";
import { Quote } from "lucide-react";
import { Flex } from "@/components/ui/flex";
import { TypographyH2, TypographyP, IconSize } from "@/components/ui/typography";
import { PointerHighlight } from "@/components/ui/pointer-highlight";
import { ContainerTextFlip } from "@/components/ui/container-text-flip";
import { useSectionHeight } from "@/hooks/use-section-height";
import { cn } from "@/lib/utils";
import { ScrollIndicator } from "./scroll-indicator";

export interface OverviewSectionProps {
  className?: string;
}

export const OverviewSection = ({ className }: OverviewSectionProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { sectionHeightClassName, sectionHeightStyle, scrollToNextSection } = useSectionHeight({
    minHeight: 0,
    fullHeight: true,
  });

  const titleContent = (
    <div className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold flex items-center gap-2">
      Về <ContainerTextFlip words={["Chúng Tôi", "Tương Lai", "Cam Kết"]} className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold" />
    </div>
  );

  const titleElement = (
    <TypographyH2>{titleContent}</TypographyH2>
  );

  return (
    <Flex
      as="section"
      direction="col"
      container
      align="center"
      justify="center"
      ref={sectionRef}
      position="relative"
      bg="background"
      className={cn(sectionHeightClassName, className)}
      style={sectionHeightStyle}
    >
      <Flex direction="col" container padding="responsive-lg" className="h-full items-center justify-center py-8 sm:py-12 md:py-16 lg:py-20 px-0 sm:px-0 md:px-0 lg:px-0">
        <PointerHighlight containerClassName="w-fit" rectangleClassName="border-primary/50" pointerClassName="text-primary">
          {titleElement}
        </PointerHighlight>
        <div
          className="w-full relative p-3 sm:p-4 md:p-5 rounded-xl bg-gradient-to-br from-white/5 to-transparent flex align-center items-center justify-center"
        >
          <div className="absolute top-3 left-0 ">
            <IconSize size="sm">
              <Quote className="fill-primary/20 rotate-180" />
            </IconSize>
          </div>
          <TypographyP className="text-justify text-base md:text-lg lg:text-xl xl:text-2xl">
            Hệ thống kết nối Phụ huynh và Nhà trường được xây dựng để kiến tạo cầu nối, gắn kết giữa phụ huynh, gia đình và nhà trường trong suốt hành trình học tập của sinh viên tại trường Đại học Ngân hàng Tp. Hồ Chí Minh. Chúng tôi hiểu rằng sự tham gia tích cực của gia đình đóng vai trò quan trọng trong thành tích, tiến độ học tập của sinh viên.Thông qua nền tảng này, phụ huynh có thể theo dõi tiến độ học tập, điểm số, lịch học và lịch thi của sinh viên. Đồng thời, phụ huynh có thể trao đổi thông tin trực tiếp với giảng viên, cố vấn học tập và nhận thông báo quan trọng từ nhà trường.      Chúng tôi mong muốn được quý phụ huynh đồng hành trong hành trình học tập, sáng tạo và trưởng thành của các em.
          </TypographyP>
          <div className="absolute bottom-3 right-0 flex items-end justify-end">
            <IconSize size="sm">
              <Quote className="fill-primary/20" />
            </IconSize>
          </div>
        </div>
        <ScrollIndicator variant="dark" onScroll={() => scrollToNextSection(sectionRef.current)} />
      </Flex>
    </Flex>
  );
};
