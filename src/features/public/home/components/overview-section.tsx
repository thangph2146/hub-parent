"use client";

import { useRef } from "react";
import { Quote } from "lucide-react";
import { Flex } from "@/components/ui/flex";
import { TypographyH2, TypographyP } from "@/components/ui/typography";
import { PointerHighlight } from "@/components/ui/pointer-highlight";
import { ContainerTextFlip } from "@/components/ui/container-text-flip";
import { useSectionHeight } from "@/hooks/use-section-height";
import { useClientOnly } from "@/hooks/use-client-only";
import { cn } from "@/lib/utils";
import { ScrollIndicator } from "./scroll-indicator";
import { HOME_RESPONSIVE_CONDITIONS } from "../constants";

export const OverviewSection = ({ className }: { className?: string }) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isMounted = useClientOnly();
  const { sectionHeightClassName, sectionHeightStyle } = useSectionHeight({
    minHeight: 0,
    fullHeight: true,
  });

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
      <Flex direction="col" container padding="responsive-lg" className="h-full items-center justify-center space-y-8">
        <PointerHighlight containerClassName="w-fit" rectangleClassName="border-primary/50" pointerClassName="text-primary">
          <TypographyH2>
            <div className="text-2xl sm:text-2xl font-bold flex items-center gap-2">
              Về <ContainerTextFlip words={["Chúng Tôi", "Tương Lai", "Cam Kết"]} className="text-inherit font-bold" />
            </div>
          </TypographyH2>
        </PointerHighlight>

        <div className="w-full relative px-8 py-6 rounded-xl bg-gradient-to-br from-primary/5 to-transparent">
          <Quote className="absolute top-1 left-1 fill-primary/10 w-8 h-8 rotate-180" />
          <TypographyP className="text-justify text-base md:text-lg lg:text-xl leading-relaxed">
            Hệ thống kết nối Phụ huynh và Nhà trường được xây dựng để kiến tạo cầu nối, gắn kết giữa phụ huynh, gia đình và nhà trường trong suốt hành trình học tập của sinh viên tại trường Đại học Ngân hàng Tp. Hồ Chí Minh. Chúng tôi hiểu rằng sự tham gia tích cực của gia đình đóng vai trò quan trọng trong thành tích, tiến độ học tập của sinh viên. Thông qua nền tảng này, phụ huynh có thể theo dõi tiến độ học tập, điểm số, lịch học và lịch thi của sinh viên. Đồng thời, phụ huynh có thể trao đổi thông tin trực tiếp với giảng viên, cố vấn học tập và nhận thông báo quan trọng từ nhà trường. Chúng tôi mong muốn được quý phụ huynh đồng hành trong hành trình học tập, sáng tạo và trưởng thành của các em.
          </TypographyP>
          <Quote className="absolute bottom-1 right-1 fill-primary/10 w-8 h-8" />
        </div>

        {isMounted && HOME_RESPONSIVE_CONDITIONS.showScrollIndicator(window.innerWidth, window.innerHeight) && (
          <ScrollIndicator variant="dark" containerRef={sectionRef} />
        )}
      </Flex>
    </Flex>
  );
};
