import Image from "next/image";
import { TypographyH2, TypographyH3, TypographyDescriptionLarge, TypographySpanSmall, TypographyPSmallMuted } from "@/components/ui/typography";

export const OverviewSection = () => {
  return (
    <section className="py-8 sm:py-12 lg:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section - 2 columns */}
        <div className="border-b-2 border-primary mb-6 sm:mb-8 pb-6 sm:pb-8">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
            <div>
              <TypographyH2>
                Tổng quan về{" "}
                <span className="text-secondary font-bold text-2xl sm:text-3xl md:text-4xl">HUB</span>
              </TypographyH2>
            </div>
            <div>
              <div className="prose prose-sm sm:prose-base text-foreground leading-relaxed dark:prose-invert mb-4">
                <TypographyDescriptionLarge>
                  Trường Đại học Ngân hàng Thành phố Hồ Chí Minh (Ho Chi Minh
                  University of Banking -{" "}
                  <span className="text-secondary font-bold text-lg sm:text-xl">HUB</span>) là
                  trường đại học công lập trực thuộc Ngân hàng Nhà nước Việt
                  Nam được thành lập từ ngày{" "}
                  <strong className="text-foreground">16/12/1976</strong>.
                </TypographyDescriptionLarge>
              </div>
              <TypographyH3 className="mt-4 text-xl sm:text-2xl font-bold">
                <span className="text-secondary">H</span>EIGHTENING{" "}
                <span className="text-secondary">U</span>NIQUE{" "}
                <span className="text-secondary">B</span>RILLIANCE
              </TypographyH3>
            </div>
          </div>
        </div>

        {/* Image and Statistics - 2 columns */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
          {/* Image */}
          <div className="relative w-full overflow-hidden rounded-xl sm:rounded-2xl border border-border">
            <div className="aspect-[4/3] relative w-full">
              <Image
                src="https://fileserver2.hub.edu.vn/IMAGES/2025/03/26/2025032609060018.jpg"
                alt="Tổng quan về HUB"
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 50vw"
                quality={75}
                priority
              />
            </div>
          </div>

          {/* Statistics List */}
          <div className="space-y-4 sm:space-y-6">
            <div>
              <TypographyH3 className="mb-2 text-primary">
                49
                <TypographySpanSmall className="text-primary">
                  + năm
                </TypographySpanSmall>
              </TypographyH3>
              <TypographyPSmallMuted>
                Xây dựng và phát triển với 16 ngành và 03 cơ sở sở đào tạo!
              </TypographyPSmallMuted>
            </div>

            <div>
              <TypographyH3 className="mb-2 text-primary">
                17.500
                <TypographySpanSmall className="text-primary">
                  +
                </TypographySpanSmall>
              </TypographyH3>
              <TypographyPSmallMuted>
                Sinh viên đang theo học ở các bậc đào tạo từ đại học, thạc sĩ,
                tiến sĩ
              </TypographyPSmallMuted>
            </div>

            <div>
              <TypographyH3 className="mb-2 text-primary">
                500
              </TypographyH3>
              <TypographyPSmallMuted>
                Cán bộ, giảng viên, nhân viên, trong đó có 38 Giáo sư, Phó
                Giáo sư, 197 Tiến sĩ và 238 Thạc sĩ
              </TypographyPSmallMuted>
            </div>

            <div>
              <TypographyH3 className="mb-2 text-primary">
                66.000
                <TypographySpanSmall className="text-primary">
                  +
                </TypographySpanSmall>
              </TypographyH3>
              <TypographyPSmallMuted>
                Cử nhân, thạc sĩ, tiến sĩ đã được{" "}
                <span className="text-secondary font-bold text-lg sm:text-xl">HUB</span> đào tạo
              </TypographyPSmallMuted>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
