import Image from "next/image";
import { TypographyH2, TypographyDescriptionLarge, TypographyH3, TypographyPSmallMuted, IconSize } from "@/components/ui/typography";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { LEADER_GENERATIONS } from "../../constants";

export const LeadersSection = () => {
  const [currentLeaderIndex, setCurrentLeaderIndex] = useState(0);

  const nextLeader = () => {
    setCurrentLeaderIndex((prev) => (prev + 1) % LEADER_GENERATIONS.length);
  };

  const prevLeader = () => {
    setCurrentLeaderIndex((prev) => (prev - 1 + LEADER_GENERATIONS.length) % LEADER_GENERATIONS.length);
  };

  return (
    <section className="py-12 sm:py-16 lg:py-20 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center mb-10 sm:mb-16">
          <TypographyH2 className="mb-4 sm:mb-6">
            Lãnh đạo qua các thời kỳ
          </TypographyH2>
          <TypographyDescriptionLarge>
            Tri ân những đóng góp to lớn của các thế hệ lãnh đạo đã xây dựng
            và phát triển <span className="text-secondary font-bold text-lg sm:text-xl">HUB</span>.
          </TypographyDescriptionLarge>
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-12">
          <div className="flex transition-transform duration-500 ease-in-out">
            <div className="w-full flex-shrink-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {LEADER_GENERATIONS[currentLeaderIndex].leaders.map((leader, lIdx) => (
                  <div
                    key={lIdx}
                    className="flex flex-col items-center text-center p-4 sm:p-6 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors group"
                  >
                    <div className="relative w-32 h-32 sm:w-40 sm:h-40 mb-4 sm:mb-6 rounded-full overflow-hidden border-4 border-background shadow-lg group-hover:border-primary/30 transition-all">
                      <Image
                        src={leader.image}
                        alt={leader.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 128px, 160px"
                      />
                    </div>
                    <TypographyH3 className="mb-1 group-hover:text-primary transition-colors text-lg font-bold">
                      {leader.name}
                    </TypographyH3>
                    <TypographyPSmallMuted className="font-medium text-primary/80 mb-2 whitespace-pre-line">
                      {leader.position}
                    </TypographyPSmallMuted>
                    <div className="w-12 h-0.5 bg-primary/20 mb-3 group-hover:w-20 transition-all" />
                    <TypographyPSmallMuted className="italic">
                      Nhiệm kỳ: {LEADER_GENERATIONS[currentLeaderIndex].year}
                    </TypographyPSmallMuted>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex justify-center items-center gap-4 sm:gap-6 mt-8 sm:mt-12">
            <Button
              variant="outline"
              size="icon"
              onClick={prevLeader}
              className="rounded-full hover:bg-primary hover:text-white transition-all"
              aria-label="Thế hệ lãnh đạo trước"
            >
              <IconSize size="sm">
                <ChevronLeft />
              </IconSize>
            </Button>

            <div className="flex gap-2" role="group" aria-label="Chọn thế hệ lãnh đạo">
              {LEADER_GENERATIONS.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentLeaderIndex(index)}
                  aria-label={`Thế hệ lãnh đạo ${LEADER_GENERATIONS[index].year}`}
                  aria-current={index === currentLeaderIndex ? "true" : "false"}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentLeaderIndex
                      ? "bg-primary w-8"
                      : "bg-primary/20 w-2 hover:bg-primary/40"
                  }`}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={nextLeader}
              className="rounded-full hover:bg-primary hover:text-white transition-all"
              aria-label="Thế hệ lãnh đạo tiếp theo"
            >
              <IconSize size="sm">
                <ChevronRight />
              </IconSize>
            </Button>
          </div>

          <div className="text-center mt-6">
            <TypographyPSmallMuted className="font-bold text-primary uppercase tracking-widest">
              {LEADER_GENERATIONS[currentLeaderIndex].period}
            </TypographyPSmallMuted>
          </div>
        </div>
      </div>
    </section>
  );
};
