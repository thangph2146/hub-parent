import Image from "next/image";
import { TypographyH2, TypographyDescriptionLarge } from "@/components/ui/typography";

export const FacultyScientistsSection = () => {
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section - 2 columns */}
        <div className="border-b-2 border-primary mb-6 sm:mb-8 pb-6 sm:pb-8">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
            <div>
              <TypographyH2>
                Đội ngũ Giảng viên - Nhà khoa học
              </TypographyH2>
            </div>
            <div>
              <div className="prose prose-sm sm:prose-base text-foreground leading-relaxed dark:prose-invert">
                <TypographyDescriptionLarge>
                  <span className="text-secondary font-bold text-lg sm:text-xl">HUB</span> có gần
                  500 cán bộ, giảng viên, nhân viên. Đội ngũ giảng viên bao
                  gồm: 38 Giáo sư, Phó Giáo sư, 184 Tiến sĩ và 238 Thạc sĩ
                  được đào tạo tại các trường đại học có uy tín trong và ngoài
                  nước, vừa là các chuyên gia, nhà nghiên cứu giàu kinh
                  nghiệm, vừa là những thầy cô tận tâm với sinh viên. Trường
                  có đội ngũ 100 giáo sư, tiến sĩ thỉnh giảng đến từ các
                  trường đại học, viện nghiên cứu, tổ chức tài chính, doanh
                  nghiệp trong và ngoài nước:
                </TypographyDescriptionLarge>
              </div>
            </div>
          </div>
        </div>

        {/* Image */}
        <div className="relative w-full overflow-hidden rounded-xl sm:rounded-2xl p-1 sm:p-2">
          <div className="relative w-full aspect-[16/10]">
            <Image
              src="https://fileserver2.hub.edu.vn/IMAGES/2025/03/26/2025032609070820241231170644doingu.jpg"
              alt="Đội ngũ Giảng viên - Nhà khoa học"
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1200px) 90vw, 1200px"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
