import { TypographyH2, TypographyDescriptionLarge } from "@/components/ui/typography";
import dynamic from "next/dynamic";
import { HISTORY_TIMELINE, getTimelineData } from "../../constants";

// Lazy load Timeline component (contains framer-motion) to reduce initial bundle size
const Timeline = dynamic(() => import("@/components/ui/timeline").then(mod => ({ default: mod.Timeline })), {
  ssr: true, // Keep SSR for SEO
  loading: () => <div className="h-96 flex items-center justify-center">Đang tải...</div>,
});

export const HistorySection = () => {
  const timelineData = getTimelineData(HISTORY_TIMELINE);

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center mb-8 sm:mb-12">
          <TypographyH2 className="mb-4 sm:mb-6">
            Lịch sử hình thành & Phát triển
          </TypographyH2>
          <TypographyDescriptionLarge>
            Chặng đường gần 50 năm xây dựng và phát triển của Trường Đại học
            Ngân hàng Thành phố Hồ Chí Minh.
          </TypographyDescriptionLarge>
        </div>

        <div className="max-w-7xl mx-auto">
          <Timeline data={timelineData} />
        </div>
      </div>
    </section>
  );
};
