"use client";

import { useRef } from "react";
import { Quote } from "lucide-react";
import { Flex } from "@/components/ui/flex";
import { TypographyH2, TypographyP } from "@/components/ui/typography";
import { ContainerTextFlip } from "@/components/ui/container-text-flip";

import { ScrollIndicator } from "./scroll-indicator";

export const OverviewSection = ({ className }: { className?: string }) => {
  const sectionRef = useRef<HTMLDivElement>(null);

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
      className={className}
    >
      <Flex
        direction="col"
        container
        padding="responsive-lg"
        className="h-full items-center justify-center space-y-8"
      >
        <TypographyH2>
          <div className="text-xl md:text-2xl font-bold flex items-center gap-2">
            Về{" "}
            <ContainerTextFlip
              words={["Chúng Tôi", "Tương Lai", "Cam Kết"]}
              className="text-2xl md:text-3xl font-bold text-primary"
            />
          </div>
        </TypographyH2>

        <div className="w-full relative px-9 py-6 rounded-xl bg-gradient-to-br from-primary/5 to-transparent">
          <Quote className="absolute top-1 left-1 fill-primary/10 w-6 h-6 rotate-180" />
          <TypographyP className="text-justify text-base md:text-lg lg:text-xl leading-relaxed text-balance">
            Hệ thống kết nối Phụ huynh và Nhà trường được xây dựng để kiến tạo
            cầu nối, gắn kết giữa phụ huynh, gia đình và nhà trường trong suốt
            hành trình học tập của sinh viên tại trường Đại học Ngân hàng Tp. Hồ
            Chí Minh. Chúng tôi hiểu rằng sự tham gia tích cực của gia đình đóng
            vai trò quan trọng trong thành tích, tiến độ học tập của sinh viên.
            Thông qua nền tảng này, phụ huynh có thể theo dõi tiến độ học tập,
            điểm số, lịch học và lịch thi của sinh viên. Đồng thời, phụ huynh có
            thể trao đổi thông tin trực tiếp với giảng viên, cố vấn học tập và
            nhận thông báo quan trọng từ nhà trường. Chúng tôi mong muốn được
            quý phụ huynh đồng hành trong hành trình học tập, sáng tạo và trưởng
            thành của các em.
          </TypographyP>
          <Quote className="absolute bottom-1 right-1 fill-primary/10 w-6 h-6" />
        </div>
      </Flex>
      <ScrollIndicator variant="dark" containerRef={sectionRef} />
    </Flex>
  );
};
