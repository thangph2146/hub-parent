import Image from "next/image";
import { TypographyH2, TypographyDescriptionLarge } from "@/components/ui/typography";

export const OrganizationStructureSection = () => {
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section - 2 columns */}
        <div className="border-b-2 border-primary mb-6 sm:mb-8 pb-6 sm:pb-8">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
            <div>
              <TypographyH2>
                Bộ máy tổ chức
              </TypographyH2>
            </div>
            <div>
              <div className="prose prose-sm sm:prose-base text-foreground leading-relaxed dark:prose-invert">
                <TypographyDescriptionLarge>
                  Bộ máy tổ chức của Đại học Ngân hàng TP.HCM được xây dựng
                  theo hướng tinh gọn, hiệu lực, hiệu quả, phù hợp với quy
                  định của pháp luật và điều kiện thực tiễn của trường.
                </TypographyDescriptionLarge>
              </div>
            </div>
          </div>
        </div>

        {/* Image */}
        <div className="relative w-full overflow-hidden rounded-xl sm:rounded-2xl p-1 sm:p-2">
          <div className="relative w-full aspect-[16/12]">
            <Image
              src="https://fileserver2.hub.edu.vn/IMAGES/2025/09/22/20250922082406Bộ-máy-tổ-chức-2.png"
              alt="Bộ máy tổ chức"
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
