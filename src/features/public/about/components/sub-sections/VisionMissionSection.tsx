import Image from "next/image";
import { TypographyH2, TypographyH3, TypographyDescriptionLarge } from "@/components/ui/typography";

export const VisionMissionSection = () => {
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section - 2 columns */}
        <div className="border-b-2 border-primary mb-6 sm:mb-8 pb-6 sm:pb-8">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
            <div>
              <TypographyH2>
                Tầm nhìn - Sứ mệnh
              </TypographyH2>
            </div>
            <div>
              <div className="prose prose-sm sm:prose-base text-foreground leading-relaxed dark:prose-invert">
                <TypographyDescriptionLarge>
                  Đại học Ngân hàng hướng đến mục tiêu hiện thực hóa tầm nhìn
                  và sứ mệnh theo định hướng đề ra, góp phần xây dựng một
                  trường đại học uy tín trong khu vực và trường quốc tế.
                </TypographyDescriptionLarge>
              </div>
            </div>
          </div>
        </div>

        {/* Image and Content - 2 columns */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
          {/* Image */}
          <div className="relative w-full overflow-hidden rounded-xl sm:rounded-2xl border border-border">
            <div className="aspect-[4/3] relative w-full">
              <Image
                src="https://fileserver2.hub.edu.vn/IMAGES/2025/04/10/2025041010270420250326090935tamhhinsumenh.jpg"
                alt="Tầm nhìn - Sứ mệnh"
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 50vw"
              />
            </div>
          </div>

          {/* Content */}
          <div className="space-y-6 sm:space-y-8">
            <div>
              <TypographyH3 className="mb-3 sm:mb-4">
                Tầm nhìn
              </TypographyH3>
              <TypographyDescriptionLarge className="leading-relaxed">
                <span className="text-secondary font-bold text-lg sm:text-xl">HUB</span> định
                hướng trở thành đại học đa ngành và liên ngành nằm trong nhóm
                các đại học có uy tín ở khu vực Đông Nam Á.{" "}
                <span className="text-secondary font-bold text-lg sm:text-xl">HUB</span> tiên
                phong ứng dụng công nghệ số trong đào tạo, nghiên cứu và giải
                quyết các vấn đề liên ngành.
              </TypographyDescriptionLarge>
            </div>

            <div>
              <TypographyH3 className="mb-3 sm:mb-4">
                Sứ mệnh
              </TypographyH3>
              <TypographyDescriptionLarge className="leading-relaxed">
                <span className="text-secondary font-bold text-lg sm:text-xl">HUB</span> cung cấp
                cho xã hội và ngành ngân hàng nguồn nhân lực chất lượng cao,
                các nghiên cứu có tầm ảnh hưởng, cùng với dịch vụ tư vấn và
                hoạt động phục vụ cộng đồng.{" "}
                <span className="text-secondary font-bold text-lg sm:text-xl">HUB</span> kiến tạo
                hệ sinh thái giáo dục, mang đến cơ hội học tập suốt đời, phát
                triển tiềm năng của người học trong môi trường giáo dục khai
                phóng, trải nghiệm, ứng dụng thành tựu khoa học công nghệ vào
                hoạt động quản trị và đào tạo.
              </TypographyDescriptionLarge>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
