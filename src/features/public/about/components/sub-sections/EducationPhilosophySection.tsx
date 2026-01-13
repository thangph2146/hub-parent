import Image from "next/image";
import { TypographyH2, TypographyH3, TypographyDescriptionLarge } from "@/components/ui/typography";
import { highlightHUB } from "../../utils";
import { EDUCATION_PHILOSOPHY } from "../../constants";

export const EducationPhilosophySection = () => {
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-end">
          {/* Content */}
          <div>
            <TypographyH2 className="mb-4 sm:mb-6">
              Triết lý giáo dục
            </TypographyH2>
            <div className="space-y-4 sm:space-y-6">
              {EDUCATION_PHILOSOPHY.map((philosophy, index) => (
                <div
                  key={index}
                  className={
                    index < EDUCATION_PHILOSOPHY.length - 1
                      ? "pb-4 sm:pb-6 border-b border-border"
                      : ""
                  }
                >
                  <TypographyH3
                    className="mb-2 sm:mb-3"
                    style={{ color: philosophy.color }}
                  >
                    {philosophy.title}
                  </TypographyH3>
                  <TypographyDescriptionLarge className="leading-relaxed" suppressHydrationWarning>
                    {highlightHUB(philosophy.description)}
                  </TypographyDescriptionLarge>
                </div>
              ))}
            </div>
          </div>

          {/* Image - Only show on xl screens */}
          <div className="hidden xl:block relative w-full overflow-hidden rounded-2xl p-2">
            <div className="aspect-[9/10] relative w-full">
              <Image
                src="https://fileserver2.hub.edu.vn/IMAGES/2025/03/26/2025032609084220241231170442trietlygiaoduc.png"
                alt="Triết lý giáo dục"
                fill
                className="object-cover"
                sizes="(max-width: 1280px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
