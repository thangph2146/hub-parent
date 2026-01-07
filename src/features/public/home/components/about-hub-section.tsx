"use client";

import React, { useEffect, useRef, useState } from "react";
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

// Custom hook để detect khi element vào viewport
const useInView = (ref: React.RefObject<HTMLElement | null>, options?: { once?: boolean; margin?: string }) => {
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (options?.once) {
            observer.disconnect();
          }
        } else if (!options?.once) {
          setIsInView(false);
        }
      },
      {
        rootMargin: options?.margin || "0px",
      }
    );

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [ref, options?.once, options?.margin]);

  return isInView;
};

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
      <Flex container padding="responsive-lg" className="h-full items-center justify-center py-6 sm:py-8 md:py-10 lg:py-12 px-0 sm:px-0 md:px-0 lg:px-0">
        <div className="w-full mx-auto">
          <div className="grid md:grid-cols-12 gap-4 sm:gap-5 lg:gap-6 items-center">
          {/* Left column */}
            <div className="w-full sm:col-span-4 lg:col-span-4 xl:col-span-4">
              <div
                className={cn(
                  "space-y-4 sm:space-y-5 md:space-y-6",
                  isInView && "animate-in fade-in slide-in-from-bottom-4 duration-[600ms]"
                )}
              >
                <div className="space-y-2 sm:space-y-3 md:space-y-4">
                  <h1 className="text-lg sm:text-xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white leading-[1.1] uppercase tracking-tight break-words">
                    <span>H</span><span className="text-brand-yellow">eightening</span><br/>
                    <span>U</span><span className="text-brand-yellow">nique</span><br/>
                    <span>B</span><span className="text-brand-yellow">rilliance</span><br/>
                  </h1>
                  <h2 className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-white/90 leading-relaxed break-words">
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
              </div>
            </div>

            {/* Right column */}
            <div className="w-full sm:col-span-8 lg:col-span-8 xl:col-span-8">
              <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 lg:gap-5">
                {statistics.map((stat, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex flex-col items-start space-y-1.5 sm:space-y-2 p-2 sm:p-3 md:p-3.5 lg:p-4 bg-white rounded-lg sm:rounded-xl shadow-md sm:shadow-lg hover:shadow-xl sm:hover:shadow-2xl transition-all duration-300",
                      isInView && "animate-in fade-in slide-in-from-bottom-4 duration-[600ms]"
                    )}
                    style={{
                      animationDelay: `${index * 100}ms`
                    }}
                  >
                    <Flex direction="row" gap={1} align="center">  
                      <stat.icon className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-secondary flex-shrink-0" strokeWidth={1.5} />
                      <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-secondary leading-tight break-words">
                      <CountUp value={stat.count} isInView={isInView} />
                      {stat.suffix && <span className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl ml-1 sm:ml-2 text-secondary font-semibold whitespace-nowrap">{stat.suffix}</span>}
                    </h2></Flex>
                    <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-gray-600 leading-relaxed pt-0.5 w-full break-words line-clamp-2 sm:line-clamp-3">{stat.caption}</p>
                  </div>
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

