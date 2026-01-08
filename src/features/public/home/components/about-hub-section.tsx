"use client";

import React, { useEffect, useRef, useState } from "react";
import { Building2, GraduationCap, Users, Award, ArrowRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { Flex } from "@/components/ui/flex";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSectionHeight } from "@/hooks/use-section-height";
import { useClientOnly } from "@/hooks/use-client-only";
import { ScrollIndicator } from "./scroll-indicator";
import { motion, useInView } from "framer-motion";
import { HOME_ROUTES, HOME_RESPONSIVE_CONDITIONS } from "../constants";

interface StatisticItem {
  icon: LucideIcon;
  count: number;
  suffix?: string;
  caption: string;
}

const statistics: StatisticItem[] = [
  { icon: Building2, count: 50, suffix: "+ năm", caption: "Xây dựng và phát triển" },
  { icon: GraduationCap, count: 500, suffix: "+", caption: "Giảng viên cơ hữu trong đó có 62 Giáo sư, Phó Giáo sư, 208 Tiến sĩ" },
  { icon: Users, count: 20000, suffix: "+", caption: "Sinh viên đang theo học ở các bậc đào tạo từ đại học, thạc sĩ, tiến sĩ" },
  { icon: Award, count: 70000, suffix: "+", caption: "Cử nhân, thạc sĩ, tiến sĩ đã được HUB đào tạo" },
];

const CountUp = ({ value, duration = 2000, isInView }: { value: number; duration?: number; isInView: boolean }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let startTime: number;
    let animationFrame: number;

    const updateCount = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(value * easeOutQuart));
      if (progress < 1) animationFrame = requestAnimationFrame(updateCount);
    };

    animationFrame = requestAnimationFrame(updateCount);
    return () => cancelAnimationFrame(animationFrame);
  }, [isInView, value, duration]);

  return <span>{count.toLocaleString("vi-VN")}</span>;
};

export const AboutHubSection = ({ className }: { className?: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const isMounted = useClientOnly();
  const { sectionHeightClassName, sectionHeightStyle} = useSectionHeight({
    minHeight: 0,
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
      <Flex container padding="responsive-lg" className="h-full items-center justify-center py-6 sm:py-12">
        <div className="w-full max-w-7xl mx-auto">
          <div className="grid md:grid-cols-12 gap-8 items-center">
            {/* Left column */}
            <motion.div 
              className="md:col-span-4 space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
            >
              <div className="space-y-4">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight uppercase tracking-tight">
                  <span>H</span><span className="text-brand-yellow">eightening</span><br/>
                  <span>U</span><span className="text-brand-yellow">nique</span><br/>
                  <span>B</span><span className="text-brand-yellow">rilliance</span><br/>
                </h1>
                <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-white/90">
                  Trường Đại học Ngân hàng Thành phố Hồ Chí Minh
                </h2>
              </div>
              <Button asChild variant="outline" className="group">
                <Link href={HOME_ROUTES.aboutHub}>
                  <Flex align="center" gap={2}>
                    <span className="uppercase font-semibold">VỀ HUB</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Flex>
                </Link>
              </Button>
            </motion.div>

            {/* Right column */}
            <div className="md:col-span-8 grid grid-cols-2 gap-4">
              {statistics.map((stat, index) => (
                <motion.div
                  key={index}
                  className="flex flex-col space-y-2 p-4 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow"
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Flex align="center" gap={2}>  
                    <stat.icon className="w-8 h-8 md:w-10 md:h-10 text-secondary" strokeWidth={1.5} />
                    <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold text-secondary">
                      <CountUp value={stat.count} isInView={isInView} />
                      {stat.suffix && <span className="text-sm sm:text-lg ml-1 text-secondary font-semibold">{stat.suffix}</span>}
                    </h2>
                  </Flex>
                  <p className="text-xs sm:text-sm lg:text-base text-gray-600 line-clamp-3">{stat.caption}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </Flex>

      {isMounted && HOME_RESPONSIVE_CONDITIONS.showScrollIndicator(window.innerWidth) && (
        <ScrollIndicator variant="light" containerRef={containerRef} />
      )}
    </Flex>
  );
};
