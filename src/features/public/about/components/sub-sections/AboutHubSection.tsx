import Image from "next/image";
import { TypographyH2, TypographyH3, TypographyDescriptionLarge, TypographyPSmall, IconSize } from "@/components/ui/typography";
import { ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";

export const AboutHubSection = () => {
  const [showMoreDialog, setShowMoreDialog] = useState(false);

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <TypographyH2 className="uppercase">
          Về <span className="text-secondary font-bold text-xl sm:text-2xl">HUB</span>
        </TypographyH2>

        <div className="mb-6 sm:mb-8">
          <div className="prose prose-sm sm:prose-base md:prose-lg text-foreground leading-relaxed dark:prose-invert">
            <TypographyDescriptionLarge className="mb-4">
              Trường Đại học Ngân hàng TPHCM với truyền thống gần 50 năm hình
              thành và phát triển và là Trường Đại học công lập trực thuộc
              Ngân hàng nhà nước Việt Nam. Với đội ngũ Giáo sư – Phó giáo sư –
              Tiến sĩ đạt hơn 54% tổng số giảng viên của trường tham gia giảng
              dạy trong 16 ngành đại học, 09 Chương trình thạc sĩ và 03 Ngành
              tiến sĩ. Đặc biệt, 100% CTĐT của Trường Đại học Ngân hàng Tp.HCM
              đã được kiểm định chất lượng giáo dục theo chuẩn trong nước và
              quốc tế ( MOET, AUN - QA).{" "}
              <span className="text-secondary font-bold text-lg sm:text-xl">HUB</span> đã ký kết
              hợp tác chiến lược về đào tạo và liên kết quốc tế với hơn 80
              trường danh tiếng trên thế giới như ĐH Quốc gia Singapore, ĐH
              Bolton (Anh), Adelaide (Úc), Toulon Pháp, City U (Mỹ)…. và hơn
              200 doanh nghiệp, hiệp hội nghề nghiệp trong nước.{" "}
              <span className="text-secondary font-bold text-lg sm:text-xl">HUB</span> đầu tư 03
              cơ sở đào tạo (02 tại trung tâm Q1, 01 tại Thủ Đức) rộng hơn
              11ha đã hoàn thiện cơ sở vật chất để phục vụ người học bao gồm:
              131 giảng đường, 328 phòng KTX và hệ sinh thái sân thi đấu bóng
              đá, bóng chuyền, bóng rổ, tennis, Pickle ball, bóng bàn, cầu
              lông và hồ bơi có mái che, phòng học thông minh, 100% phòng học
              có điều hòa, cùng hệ thống căn tin chất lượng cao đảm bảo một
              môi trường học tập – vui chơi – rèn luyện đầy đủ và an toàn cho
              người học. Đảm bảo cho sinh viên 1 ngôi trường học tập hạnh
              phúc!
            </TypographyDescriptionLarge>
          </div>
          <button
            onClick={() => setShowMoreDialog(true)}
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mt-4"
          >
            <TypographyPSmall>Xem thêm</TypographyPSmall>
            <IconSize size="sm">
              <ChevronDown />
            </IconSize>
          </button>
        </div>

        <div className="relative w-full overflow-hidden rounded-xl sm:rounded-2xl border border-border">
          <div className="aspect-video relative w-full">
            <Image
              src="https://fileserver2.hub.edu.vn/IMAGES/2024/12/31/20241231170332vehub.jpg"
              alt="Về HUB"
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1200px) 90vw, 1200px"
            />
          </div>
        </div>
      </div>

      {/* Dialog for "Xem thêm" */}
      <Dialog open={showMoreDialog} onOpenChange={setShowMoreDialog}>
        <DialogContent className="max-w-[90vw] lg:max-w-4xl">
          <DialogHeader>
            <DialogTitle asChild>
              <TypographyH3 className="uppercase">Về <span className="text-secondary font-bold text-xl sm:text-2xl">HUB</span></TypographyH3>
            </DialogTitle>
          </DialogHeader>
          <DialogDescription asChild>
            <ScrollArea className="max-h-[calc(70vh)] px-2 overflow-y-auto">
            <div className="prose prose-sm sm:prose-base md:prose-lg text-foreground leading-relaxed dark:prose-invert max-w-none">
              <TypographyDescriptionLarge className="mb-4">
                Trường Đại học Ngân hàng TP. Hồ Chí Minh đang đào tạo 16 ngành đại học với hơn 16.000 sinh viên, 09 Chương trình Thạc sĩ với gần 2000 học viên cao học và nghiên cứu sinh, 03 ngành Tiến sĩ với 50 nghiên cứu sinh; có gần 108 đối tác quốc tế là các Trường đại học lớn trên thế giới như Đại học Bolton, Angela Ruskin, Posmouth (UK) đều thuộc top 30 nước Anh, EM Normandie (Ý), Tuolouse (Pháp), Monash, Griffit, Macquire và Addelaide (Úc), đều là các trường top 1.5% thế giới, đặc biệt là trường Đại học Quốc gia Singapore (NUS) và Đại học Hong Kong (HKU) là top 5 Châu Á; và các tổ chức, cơ quan ngoại giao như: Hội đồng Anh, ACCA, lãnh sự quán Anh, Pháp, Luxemburg, DSIK…, cùng nhiều hiệp hội nghề nghiệp: Hiệp hội Ngân hàng, Hiệp hội Block chain, Logistics, Internet, Thương mại điện tử cũng như hệ thống Ngân hàng – doanh nghiệp rộng lớn và hơn 60.000 cựu người học trong mạng lưới <span className="text-secondary font-bold text-lg sm:text-xl">HUB</span> Alumni thành đạt. Mạng lưới cựu người học cửa Trường rộng khắp góp phần tạo nên hệ giá trị sinh thái bền vững hỗ trợ nhiều hoạt động thiết thực, mang lại giá trị thực tiễn cao.
              </TypographyDescriptionLarge>
              <TypographyDescriptionLarge className="mb-4">
                Đội ngũ nhân sự của <span className="text-secondary font-bold text-lg sm:text-xl">HUB</span> với trên 500 cán bộ, giảng viên, nhân viên. Trong đó, 235 giảng viên có chức danh Giáo sư/Phó Giáo sư/Tiến sĩ, thuộc Top 3 trường khối kinh tế về số lượng Giáo sư/Phó Giáo sư/Tiến sĩ. Đội ngũ Giảng viên <span className="text-secondary font-bold text-lg sm:text-xl">HUB</span> vừa là các chuyên gia, nhà nghiên cứu, nhà quản lý giàu kinh nghiệm, vừa là những thầy cô tận tâm với sinh viên. Quan trọng hơn là đội ngũ chất lượng cao này được phát triển đồng đều ở tất cả các lĩnh vực đào tạo của Trường. Theo đó, Trường không chỉ có số lượng lớn GS-TS kinh tế mà còn có số lượng GS-TS cao bậc nhất Việt Nam chuyên sâu về AI, Khoa học dữ liệu, Công nghệ tài chính (38 GS-TS). Điều này giúp phục vụ hiệu quả quá trình đào tạo chuyển đổi số cho đất nước và ngành Ngân hàng.
              </TypographyDescriptionLarge>
              <TypographyDescriptionLarge className="mb-4">
                <span className="text-secondary font-bold text-lg sm:text-xl">HUB</span> có 03 cơ sở đào tạo với 02 cơ sở tại trung tâm Q1 TP. HCM và 01 cơ sở tại Thủ Đức có tổng diện tích lên đến hơn 11 hecta được đầu tư xây dựng khang trang – hiện đại theo chiến lược Xanh – Hiện đại – Bề thế: từ hệ thống giảng đường, phòng Lab thực hành, chuyển đổi số, thư viện thực – thư viện số, phòng học thông minh, đến nhà thi đấu cũng như sân vận động đạt chuẩn quốc tế. Trường đã và đang thực hiện đúng định hướng mô hình &quot;công viên trong đại học&quot; – sẵn sàng hướng tới là một trong những Đại học đầu tiên thực hiện báo cáo quản trị theo chuẩn ESG.
              </TypographyDescriptionLarge>
              <TypographyDescriptionLarge className="mb-4">
                Trường Đại học Ngân hàng TP. Hồ Chí Minh đã kiểm định 100% chương trình đào tạo theo tiêu chuẩn quốc tế AUN – QA và MOET. Không dừng lại ở kiểm định cấp CTĐT, Trường đã hoàn thành những bước cuối cùng để kiểm định cấp CSGD theo chuẩn quốc tế AUN-QA vào tháng 6/2025, trở thành top 11 trường đạt chuẩn kiểm định quốc tế cấp CSGD trong 224 Đại học tại Việt Nam. Đi theo đúng định hướng &quot;đào tạo công dân chuẩn toàn cầu, am hiểu Việt Nam&quot;. Chứng nhận Hệ thống quản lý chất lượng theo tiêu chuẩn ISO 9001:2015 của Tổ chức Afnor Cộng hòa Pháp.
              </TypographyDescriptionLarge>
              <TypographyDescriptionLarge>
                Trường Đại học Ngân hàng TP. Hồ Chí Minh tiếp tục khẳng định
                vị thế là Trường Đại học lớn ở Việt Nam, đào tạo đa ngành, xây
                dựng hệ sinh thái hạnh phúc trong cộng đồng người học và cung
                ứng nguồn nhân lực chất lượng cao cho ngành Ngân hàng, doanh
                nghiệp và xã hội.
              </TypographyDescriptionLarge>
            </div>
            </ScrollArea>
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </section>
  );
};
