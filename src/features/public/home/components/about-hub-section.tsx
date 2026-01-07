"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Building2, GraduationCap, Users, Award, ArrowRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { Flex } from "@/components/ui/flex";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSectionHeight } from "@/hooks/use-section-height";
import { ScrollIndicator } from "./scroll-indicator";

interface StatisticItem {
  icon: LucideIcon;
  count: number;
  suffix?: string;
  caption: string;
}

export interface AboutHubSectionProps {
  className?: string;
}

const statistics: StatisticItem[] = [
  {
    icon: Building2,
    count: 50,
    suffix: "+ năm",
    caption: "Xây dựng và phát triển",
  },
  {
    icon: GraduationCap,
    count: 500,
    suffix: "+",
    caption: "Giảng viên cơ hữu trong đó có 62 Giáo sư, Phó Giáo sư, 208 Tiến sĩ",
  },
  {
    icon: Users,
    count: 20000,
    suffix: "+",
    caption: "Sinh viên đang theo học ở các bậc đào tạo từ đại học, thạc sĩ, tiến sĩ",
  },
  {
    icon: Award,
    count: 70000,
    suffix: "+",
    caption: "Cử nhân, thạc sĩ, tiến sĩ đã được HUB đào tạo",
  },
];

const CountUp = ({ value, duration = 2000, isInView }: { value: number; duration?: number; isInView: boolean }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);

  useEffect(() => {
    if (!isInView) return;
    const startTime = Date.now();
    const updateCount = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.floor(value * easeOutQuart);
      if (currentValue !== countRef.current) {
        countRef.current = currentValue;
        setCount(currentValue);
      }
      if (progress < 1) requestAnimationFrame(updateCount);
      else setCount(value);
    };
    requestAnimationFrame(updateCount);
  }, [isInView, value, duration]);

  return <span>{count.toLocaleString("vi-VN")}</span>;
};

export const AboutHubSection = ({ className }: AboutHubSectionProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const { sectionHeightClassName, sectionHeightStyle, scrollToNextSection } = useSectionHeight({
    minHeight: 600,
    fullHeight: true,
  });

  return (
    <Flex
      as="section"
      fullWidth
      position="relative"
      className={cn("bg-secondary", sectionHeightClassName, className)}
      style={sectionHeightStyle}
      ref={containerRef}
    >
      <Flex container padding="responsive-lg" className="h-full items-center justify-center py-8 sm:py-12 md:py-16 lg:py-20">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-12 gap-6 items-center">
            <div className="w-full lg:col-span-5 xl:col-span-5">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6 }}
                className="space-y-6 sm:space-y-8"
              >
                <div className="space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6">
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white leading-[1.1] uppercase tracking-tight break-words">
                    <span>H</span><span className="text-brand-yellow">eightening</span>{" "}
                    <span>U</span><span className="text-brand-yellow">nique</span>{" "}
                    <span>B</span><span className="text-brand-yellow">rilliance</span>
                  </h1>
                  <h2 className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-semibold text-white/90 leading-relaxed break-words">
                    Trường Đại học Ngân hàng Thành phố Hồ Chí Minh
                  </h2>
                </div>
                <Button asChild variant="outline">
                  <Link href="/about-hub">
                    <Flex align="center" gap={2}>
                      <span className="uppercase font-semibold text-sm sm:text-base">VỀ HUB</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Flex>
                  </Link>
                </Button>
              </motion.div>
            </div>

            <div className="w-full lg:col-span-7 xl:col-span-7">
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:gap-8">
                {statistics.map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="flex flex-col items-start space-y-2 sm:space-y-3 p-2 sm:p-3 md:p-4 lg:p-5 bg-white rounded-lg sm:rounded-xl shadow-md sm:shadow-lg hover:shadow-xl sm:hover:shadow-2xl transition-all duration-300"
                  >
                    <stat.icon className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 text-secondary flex-shrink-0" strokeWidth={1.5} />
                    <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-secondary leading-tight break-words">
                      <CountUp value={stat.count} isInView={isInView} />
                      {stat.suffix && <span className="text-base sm:text-lg md:text-xl lg:text-2xl ml-1 sm:ml-2 text-secondary font-semibold whitespace-nowrap">{stat.suffix}</span>}
                    </h2>
                    <p className="text-xs sm:text-sm md:text-base text-gray-600 leading-relaxed pt-0.5 sm:pt-1 w-full break-words line-clamp-3 sm:line-clamp-none">{stat.caption}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Flex>

      <ScrollIndicator variant="light" onScroll={() => scrollToNextSection(containerRef.current)} />
    </Flex>
  );
};

