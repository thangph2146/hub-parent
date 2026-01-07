"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Flex } from "@/components/ui/flex";
import { Button } from "@/components/ui/button";
import { Building2, GraduationCap, Users, Award, ArrowRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

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

const CountUp = ({
  value,
  duration = 2000,
  isInView,
}: {
  value: number;
  duration?: number;
  isInView: boolean;
}) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);

  useEffect(() => {
    if (!isInView) return;

    const startTime = Date.now();
    const startValue = 0;
    const endValue = value;

    const updateCount = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      
      const currentValue = Math.floor(startValue + (endValue - startValue) * easeOutQuart);
      
      if (currentValue !== countRef.current) {
        countRef.current = currentValue;
        setCount(currentValue);
      }

      if (progress < 1) {
        requestAnimationFrame(updateCount);
      } else {
        setCount(endValue);
      }
    };

    requestAnimationFrame(updateCount);
  }, [isInView, value, duration]);

  // Format number with thousand separators
  const formattedCount = count.toLocaleString("vi-VN");

  return <span>{formattedCount}</span>;
};

export const AboutHubSection = ({ className }: AboutHubSectionProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  return (
    <Flex
      as="section"
      fullWidth
      position="relative"
      className={cn("bg-secondary h-[calc(100dvh-55px)] min-h-[600px] w-full", className)}
      ref={containerRef}
    >
      <Flex container padding="responsive-lg" className="h-full items-center justify-center py-8 sm:py-12 md:py-16 lg:py-20">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-12 gap-6 items-center">
            {/* Left Column - Title and Button */}
            <div className="w-full lg:col-span-5 xl:col-span-5">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.6 }}
                className="space-y-6 sm:space-y-8"
              >
                <div className="space-y-4 sm:space-y-6">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold text-white leading-[1.1] uppercase tracking-tight break-words">
                    <span>H</span><span className="text-brand-yellow">eightening</span>{" "}
                    <span>U</span><span className="text-brand-yellow">nique</span>{" "}
                    <span>B</span><span className="text-brand-yellow">rilliance</span>
                  </h1>
                  <h2 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-semibold text-white/90 leading-relaxed break-words">
                    Trường Đại học Ngân hàng Thành phố Hồ Chí Minh
                  </h2>
                </div>
                  <Button
                    asChild
                    variant="outline"
                  >
                    <Link href="/about-hub">
                      <Flex align="center" gap={2}>
                        <span className="uppercase font-semibold text-sm sm:text-base">VỀ HUB</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </Flex>
                    </Link>
                  </Button>
              </motion.div>
            </div>

            {/* Right Column - Statistics */}
            <div className="w-full lg:col-span-7 xl:col-span-7">
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:gap-8">
                {statistics.map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="flex flex-col items-start space-y-2 sm:space-y-3 p-2 sm:p-3 md:p-4 lg:p-5 bg-white rounded-lg sm:rounded-xl shadow-md sm:shadow-lg hover:shadow-xl sm:hover:shadow-2xl transition-all duration-300"
                  >
                    <div className="flex-shrink-0 text-primary">
                      <stat.icon className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 text-secondary" strokeWidth={1.5} />
                    </div>
                    <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-secondary leading-tight break-words">
                      <CountUp value={stat.count} isInView={isInView} />
                      {stat.suffix && (
                        <span className="text-base sm:text-lg md:text-xl lg:text-3xl xl:text-4xl ml-1 sm:ml-2 text-secondary font-semibold whitespace-nowrap">
                          {stat.suffix}
                        </span>
                      )}
                    </h2>
                    <div className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-600 leading-relaxed pt-0.5 sm:pt-1 w-full">
                      <p className="break-words line-clamp-3 sm:line-clamp-none">{stat.caption}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Flex>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 sm:bottom-4 left-1/2 -translate-x-1/2 z-[60]"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2 text-white/70 hover:text-white transition-colors cursor-pointer group"
          onClick={() => {
            const currentSection = containerRef.current;
            if (!currentSection) return;

            // Tìm section tiếp theo (có thể là section hoặc div chứa section)
            let nextElement = currentSection.nextElementSibling as HTMLElement;
            
            // Nếu không tìm thấy section tiếp theo, tìm trong parent
            if (!nextElement) {
              const parent = currentSection.parentElement;
              if (parent) {
                const currentIndex = Array.from(parent.children).indexOf(currentSection);
                nextElement = parent.children[currentIndex + 1] as HTMLElement;
              }
            }

            if (nextElement) {
              // Tính toán vị trí scroll với offset cho header (55px)
              const headerHeight = 55;
              const elementPosition = nextElement.getBoundingClientRect().top + window.scrollY;
              const offsetPosition = elementPosition - headerHeight;

              window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
              });
            } else {
              // Nếu không có section tiếp theo, scroll xuống một viewport height
              const headerHeight = 55;
              const currentScrollY = window.scrollY;
              const viewportHeight = window.innerHeight;
              const nextScrollPosition = currentScrollY + viewportHeight - headerHeight;

              window.scrollTo({
                top: nextScrollPosition,
                behavior: "smooth"
              });
            }
          }}
        >
          <div className="relative px-4 sm:px-5 py-2 sm:py-2.5 rounded-full backdrop-blur-xl bg-white/10 border border-white/30 group-hover:bg-white/20 group-hover:border-white/40 transition-all duration-300 shadow-lg group-hover:shadow-xl">
            <span className="text-[10px] sm:text-xs tracking-[0.15em] sm:tracking-[0.2em] uppercase font-semibold drop-shadow-lg whitespace-nowrap">Cuộn xuống</span>
          </div>
          <div className="relative">
            <motion.div
              className="absolute inset-0 bg-primary/40 rounded-full blur-lg"
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.9, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <ChevronDown className="relative w-6 h-6 sm:w-7 sm:h-7 drop-shadow-lg group-hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.9)] transition-all" />
          </div>
        </motion.div>
      </motion.div>
    </Flex>
  );
};

