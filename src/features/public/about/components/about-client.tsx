"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  GraduationCap, 
  Target,
  Eye,
  Users,
  Building2,
  Award,
  BookOpen,
  MapPin,
  Phone,
  Mail,
  Clock,
  ArrowRight,
  CheckCircle2,
  ChevronDown
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { appFeatures } from "@/lib/config/app-features"
import { getResourceMainRoute } from "@/lib/permissions/route-helpers"
import { Logo } from "../../../../../public/svg/Logo"

/**
 * Helper function để lấy route từ appFeatures
 */
function getRouteFromFeature(key: string): string | null {
  const feature = appFeatures.find((f) => f.key === key)
  if (!feature?.navigation) return null

  const nav = feature.navigation
  if (nav.href) return nav.href

  if (nav.resourceName) {
    const route = getResourceMainRoute(nav.resourceName)
    return route?.path || null
  }

  return null
}

// Routes constants - Lấy từ appFeatures
const ABOUT_ROUTES = {
  home: getRouteFromFeature("home") || "/",
  contact: getRouteFromFeature("contact") || "/lien-he",
  blog: getRouteFromFeature("blog") || "/bai-viet",
} as const

export interface AboutClientProps {
  // Có thể thêm props từ server component nếu cần
}

export function AboutClient({}: AboutClientProps) {
  const [showMoreDialog, setShowMoreDialog] = useState(false)

  const campuses = [
    {
      name: "Trụ sở chính",
      address: "36 Tôn Thất Đạm, Phường Sài Gòn, TP.Hồ Chí Minh",
      icon: Building2,
    },
    {
      name: "Cơ sở Hàm Nghi",
      address: "39 Hàm Nghi, Phường Sài Gòn, TP. Hồ Chí Minh",
      icon: Building2,
    },
    {
      name: "Cơ sở Hoàng Diệu",
      address: "56 Hoàng Diệu 2, Phường Thủ Đức, TP. Hồ Chí Minh",
      icon: Building2,
    },
  ]

  const achievements = [
    {
      title: "Chứng nhận kiểm định Chương trình đào tạo",
      description: "Theo tiêu chuẩn AUN-QA",
      icon: Award,
    },
    {
      title: "Chứng nhận kiểm định Cơ sở giáo dục",
      description: "Theo tiêu chuẩn MOET",
      icon: Award,
    },
    {
      title: "Chứng nhận hệ thống quản lý",
      description: "Theo tiêu chuẩn ISO 21001:2018",
      icon: Award,
    },
  ]

  const coreValues = [
    {
      title: "CHÍNH TRỰC",
      description: "Chính trực trong mọi hành động. HUB luôn nhất quán giữa Tư duy - Lời nói - Hành động.",
      color: "#A41034",
    },
    {
      title: "ĐOÀN KẾT",
      description: "Đoàn kết tạo nên sự thống nhất để có sức mạnh tổng hợp. HUB lấy phương châm đảm bảo sự hài hòa lợi ích giữa các bên có liên quan để cùng nhau phát triển.",
      color: "#1F3368",
    },
    {
      title: "TIÊN PHONG",
      description: "Tiên phong để tạo ra và dẫn dắt xu hướng. HUB tiên phong trong ứng dụng thành tựu khoa học công nghệ vào các hoạt động đào tạo, nghiên cứu, quản lý, điều hành.",
      color: "#CE395D",
    },
  ]

  const educationPhilosophy = [
    {
      title: "Khai phóng",
      description: "HUB tạo môi trường giáo dục giúp người học tự khai phá tiềm năng của bản thân; lĩnh hội kiến thức chuyên môn sâu của ngành học trên nền tảng kiến thức tổng quát toàn diện; phát triển năng lực trí tuệ và kỹ năng cá nhân; định hình các giá trị sống tích cực hướng tới giáo dục con người tự chủ, sáng tạo, công dân có trách nhiệm.",
      color: "#A41034",
    },
    {
      title: "Liên ngành",
      description: "HUB hướng đến đào tạo người học có hiểu biết liên ngành nhằm tránh những thiên kiến trong việc ra quyết định, tăng khả năng kết nối các chuyên gia, mở rộng cơ hội việc làm.",
      color: "#1F3368",
    },
    {
      title: "Trải nghiệm",
      description: "HUB triển khai mô hình đào tạo \"trưởng thành qua trải nghiệm\". Qua trải nghiệm, người học sẽ hiểu biết sâu sắc hơn về lý thuyết, hình thành tư duy thực tiễn, năng lực thực thi, từ đó thích nghi và cải tạo môi trường.",
      color: "#CE395D",
    },
  ]

  const facilities = [
    { number: "3", label: "Cơ sở đào tạo" },
    { number: "131", label: "Giảng đường" },
    { number: "328", label: "Phòng KTX" },
    { number: "15", label: "Phòng máy thực hành" },
  ]

  return (
    <div className="relative isolate bg-background">
      {/* Overview Section */}
      <section className="py-6">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Header Section - 2 columns */}
            <div className="border-b-2 border-primary mb-8 pb-8">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div>
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
                    Tổng quan về HUB
                  </h2>
                </div>
                <div>
                  <div className="prose prose-sm sm:prose-base text-foreground leading-relaxed dark:prose-invert mb-4">
                    <p className="text-base sm:text-lg text-muted-foreground">
                      Trường Đại học Ngân hàng Thành phố Hồ Chí Minh (Ho Chi Minh University of Banking - HUB) 
                      là trường đại học công lập trực thuộc Ngân hàng Nhà nước Việt Nam được thành lập từ ngày <strong className="text-foreground">16/12/1976</strong>.
                    </p>
                  </div>
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-foreground mt-4">
                    <span className="text-primary">H</span>EIGHTENING{" "}
                    <span className="text-primary">U</span>NIQUE{" "}
                    <span className="text-primary">B</span>RILLIANCE
                  </h3>
                </div>
              </div>
            </div>

            {/* Image and Statistics - 2 columns */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 lg:gap-12">
              {/* Image */}
              <div className="relative w-full overflow-hidden rounded-2xl border border-border">
                <div className="aspect-[4/3] relative w-full">
                  <Image
                    src="https://fileserver2.hub.edu.vn/IMAGES/2025/03/26/2025032609060018.jpg"
                    alt="Tổng quan về HUB"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1280px) 100vw, 50vw"
                    priority
                  />
                </div>
              </div>

              {/* Statistics List */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-primary mb-2">
                    49<span className="text-2xl sm:text-3xl lg:text-4xl">+ năm</span>
                  </h2>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    Xây dựng và phát triển với 16 ngành và 03 cơ sở sở đào tạo!
                  </p>
                </div>

                <div>
                  <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-primary mb-2">
                    17.500<span className="text-2xl sm:text-3xl lg:text-4xl">+</span>
                  </h2>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    Sinh viên đang theo học ở các bậc đào tạo từ đại học, thạc sĩ, tiến sĩ
                  </p>
                </div>

                <div>
                  <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-primary mb-2">
                    500
                  </h2>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    Cán bộ, giảng viên, nhân viên, trong đó có 38 Giáo sư, Phó Giáo sư, 197 Tiến sĩ và 238 Thạc sĩ
                  </p>
                </div>

                <div>
                  <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-primary mb-2">
                    66.000<span className="text-2xl sm:text-3xl lg:text-4xl">+</span>
                  </h2>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    Cử nhân, thạc sĩ, tiến sĩ đã được HUB đào tạo
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About HUB Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground uppercase mb-8">
              Về HUB
            </h2>
            
            <div className="mb-8">
              <div className="prose prose-sm sm:prose-base md:prose-lg text-foreground leading-relaxed dark:prose-invert">
                <p className="text-base sm:text-lg text-muted-foreground mb-4">
                  Trường Đại học Ngân hàng TPHCM với truyền thống gần 50 năm hình thành và phát triển và là Trường Đại học công lập trực thuộc Ngân hàng nhà nước Việt Nam. Với đội ngũ Giáo sư – Phó giáo sư – Tiến sĩ đạt hơn 54% tổng số giảng viên của trường tham gia giảng dạy trong 16 ngành đại học, 09 Chương trình thạc sĩ và 03 Ngành tiến sĩ. Đặc biệt, 100% CTĐT của Trường Đại học Ngân hàng Tp.HCM đã được kiểm định chất lượng giáo dục theo chuẩn trong nước và quốc tế ( MOET, AUN - QA). HUB đã ký kết hợp tác chiến lược về đào tạo và liên kết quốc tế với hơn 80 trường danh tiếng trên thế giới như ĐH Quốc gia Singapore, ĐH Bolton (Anh),  Adelaide (Úc), Toulon Pháp, City U (Mỹ)…. và hơn 200 doanh nghiệp, hiệp hội nghề nghiệp trong nước. HUB đầu tư 03 cơ sở đào tạo (02 tại trung tâm Q1, 01 tại Thủ Đức) rộng hơn 11ha đã hoàn thiện cơ sở vật chất để phục vụ người học bao gồm: 131 giảng đường, 328 phòng KTX và hệ sinh thái sân thi đấu bóng đá, bóng chuyền, bóng rổ, tennis, Pickle ball, bóng bàn, cầu lông và hồ bơi có mái che, phòng học thông minh, 100% phòng học có điều hòa, cùng hệ thống căn tin chất lượng cao đảm bảo một môi trường học tập – vui chơi – rèn luyện đầy đủ và an toàn cho người học. Đảm bảo cho sinh viên 1 ngôi trường học tập hạnh phúc!
                </p>
              </div>
              <button
                onClick={() => setShowMoreDialog(true)}
                className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium mt-4"
              >
                <span>Xem thêm</span>
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            <div className="relative w-full overflow-hidden rounded-2xl border border-border">
              <div className="aspect-video relative w-full">
                <Image
                  src="https://fileserver2.hub.edu.vn/IMAGES/2024/12/31/20241231170332vehub.jpg"
                  alt="Về HUB"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dialog for "Xem thêm" */}
        <Dialog open={showMoreDialog} onOpenChange={setShowMoreDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl sm:text-3xl font-bold text-foreground uppercase">
                Về HUB
              </DialogTitle>
            </DialogHeader>
            <DialogDescription asChild>
              <div className="prose prose-sm sm:prose-base md:prose-lg text-foreground leading-relaxed dark:prose-invert max-w-none">
                <p className="text-base sm:text-lg text-muted-foreground mb-4">
                  Trường Đại học Ngân hàng TP. Hồ Chí Minh đang đào tạo 16 ngành đại học với hơn 16.000 sinh viên, 09 Chương trình Thạc sĩ với gần 2000 học viên cao học và nghiên cứu sinh, 03 ngành Tiến sĩ với 50 nghiên cứu sinh; có gần 108 đối tác quốc tế là các Trường đại học lớn trên thế giới như Đại học Bolton, Angela Ruskin, Posmouth (UK) đều thuộc top 30 nước Anh, EM Normandie (Ý), Tuolouse (Pháp), Monash, Griffit, Macquire và Addelaide (Úc), đều là các trường top 1.5% thế giới, đặc biệt là trường Đại học Quốc gia Singapore (NUS) và Đại học Hong Kong (HKU) là top 5 Châu Á; và các tổ chức, cơ quan ngoại giao như: Hội đồng Anh, ACCA, lãnh sự quán Anh, Pháp, Luxemburg, DSIK…, cùng nhiều hiệp hội nghề nghiệp: Hiệp hội Ngân hàng, Hiệp hội Block chain, Logistics, Internet, Thương mại điện tử cũng như hệ thống Ngân hàng – doanh nghiệp rộng lớn và hơn 60.000 cựu người học trong mạng lưới HUB Alumni thành đạt. Mạng lưới cựu người học cửa Trường rộng khắp góp phần tạo nên hệ giá trị sinh thái bền vững hỗ trợ nhiều hoạt động thiết thực, mang lại giá trị thực tiễn cao.
                </p>
                <p className="text-base sm:text-lg text-muted-foreground mb-4">
                  Đội ngũ nhân sự của HUB với trên 500 cán bộ, giảng viên, nhân viên. Trong đó, 235 giảng viên có chức danh Giáo sư/Phó Giáo sư/Tiến sĩ, thuộc Top 3 trường khối kinh tế về số lượng Giáo sư/Phó Giáo sư/Tiến sĩ. Đội ngũ Giảng viên HUB vừa là các chuyên gia, nhà nghiên cứu, nhà quản lý giàu kinh nghiệm, vừa là những thầy cô tận tâm với sinh viên. Quan trọng hơn là đội ngũ chất lượng cao này được phát triển đồng đều ở tất cả các lĩnh vực đào tạo của Trường. Theo đó, Trường không chỉ có số lượng lớn GS-TS kinh tế mà còn có số lượng GS-TS cao bậc nhất Việt Nam chuyên sâu về AI, Khoa học dữ liệu, Công nghệ tài chính (38 GS-TS). Điều này giúp phục vụ hiệu quả quá trình đào tạo chuyển đổi số cho đất nước và ngành Ngân hàng.
                </p>
                <p className="text-base sm:text-lg text-muted-foreground mb-4">
                  HUB có 03 cơ sở đào tạo với 02 cơ sở tại trung tâm Q1 TP. HCM và 01 cơ sở tại Thủ Đức có tổng diện tích lên đến hơn 11 hecta được đầu tư xây dựng khang trang – hiện đại theo chiến lược Xanh – Hiện đại – Bề thế: từ hệ thống giảng đường, phòng Lab thực hành, chuyển đổi số, thư viện thực – thư viện số, phòng học thông minh, đến nhà thi đấu cũng như sân vận động đạt chuẩn quốc tế. Trường đã và đang thực hiện đúng định hướng mô hình "công viên trong đại học" – sẵn sàng hướng tới là một trong những Đại học đầu tiên thực hiện báo cáo quản trị theo chuẩn ESG.
                </p>
                <p className="text-base sm:text-lg text-muted-foreground mb-4">
                  Trường Đại học Ngân hàng TP. Hồ Chí Minh đã kiểm định 100% chương trình đào tạo theo tiêu chuẩn quốc tế AUN – QA và MOET. Không dừng lại ở kiểm định cấp CTĐT, Trường đã hoàn thành những bước cuối cùng để kiểm định cấp CSGD theo chuẩn quốc tế AUN-QA vào tháng 6/2025, trở thành top 11 trường đạt chuẩn kiểm định quốc tế cấp CSGD trong 224 Đại học tại Việt Nam. Đi theo đúng định hướng "đào tạo công dân chuẩn toàn cầu, am hiểu Việt Nam". Chứng nhận Hệ thống quản lý chất lượng theo tiêu chuẩn ISO 9001:2015 của Tổ chức Afnor Cộng hòa Pháp.
                </p>
                <p className="text-base sm:text-lg text-muted-foreground">
                  Trường Đại học Ngân hàng TP. Hồ Chí Minh tiếp tục khẳng định vị thế là Trường Đại học lớn ở Việt Nam, đào tạo đa ngành, xây dựng hệ sinh thái hạnh phúc trong cộng đồng người học và cung ứng nguồn nhân lực chất lượng cao cho ngành Ngân hàng, doanh nghiệp và xã hội.
                </p>
              </div>
            </DialogDescription>
          </DialogContent>
        </Dialog>
      </section>

      {/* Vision & Mission Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Header Section - 2 columns */}
            <div className="border-b-2 border-primary mb-8 pb-8">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div>
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
                    Tầm nhìn - Sứ mệnh
                  </h2>
                </div>
                <div>
                  <div className="prose prose-sm sm:prose-base text-foreground leading-relaxed dark:prose-invert">
                    <p className="text-base sm:text-lg text-muted-foreground">
                      Đại học Ngân hàng hướng đến mục tiêu hiện thực hóa tầm nhìn và sứ mệnh theo định hướng đề ra, góp phần xây dựng một trường đại học uy tín trong khu vực và trường quốc tế.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Image and Content - 2 columns */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 lg:gap-12">
              {/* Image */}
              <div className="relative w-full overflow-hidden rounded-2xl border border-border">
                <div className="aspect-[4/3] relative w-full">
                  <Image
                    src="https://fileserver2.hub.edu.vn/IMAGES/2025/04/10/2025041010270420250326090935tamhhinsumenh.jpg"
                    alt="Tầm nhìn - Sứ mệnh"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1280px) 100vw, 50vw"
                  />
                </div>
              </div>

              {/* Content */}
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                    Tầm nhìn
                  </h3>
                  <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                    HUB định hướng trở thành đại học đa ngành và liên ngành nằm trong nhóm các đại học có uy tín ở khu vực Đông Nam Á. HUB tiên phong ứng dụng công nghệ số trong đào tạo, nghiên cứu và giải quyết các vấn đề liên ngành.
                  </p>
                </div>

                <div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                    Sứ mệnh
                  </h3>
                  <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                    HUB cung cấp cho xã hội và ngành ngân hàng nguồn nhân lực chất lượng cao, các nghiên cứu có tầm ảnh hưởng, cùng với dịch vụ tư vấn và hoạt động phục vụ cộng đồng. HUB kiến tạo hệ sinh thái giáo dục, mang đến cơ hội học tập suốt đời, phát triển con người toàn diện, sáng tạo, với tinh thần phụng sự.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 lg:gap-12 items-end">
              {/* Content */}
              <div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-6">
                  Hệ giá trị cốt lõi
                </h2>
                <div className="space-y-6">
                  {coreValues.map((value, index) => (
                    <div key={index} className={index < coreValues.length - 1 ? "pb-6 border-b border-border" : ""}>
                      <h3 
                        className="text-xl sm:text-2xl font-bold mb-3"
                        style={{ color: value.color }}
                      >
                        {value.title}
                      </h3>
                      <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                        {value.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Image */}
              <div className="relative w-full overflow-hidden rounded-2xl p-2">
                <div className="aspect-[9/10] relative w-full">
                  <Image
                    src="https://fileserver2.hub.edu.vn/IMAGES/2025/03/26/2025032609105720241231170442trietlygiaoduc.png"
                    alt="Hệ giá trị cốt lõi"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1280px) 100vw, 50vw"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Education Philosophy Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 lg:gap-12 items-end">
              {/* Content */}
              <div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-6">
                  Triết lý giáo dục
                </h2>
                <div className="space-y-6">
                  {educationPhilosophy.map((philosophy, index) => (
                    <div key={index} className={index < educationPhilosophy.length - 1 ? "pb-6 border-b border-border" : ""}>
                      <h3 
                        className="text-xl sm:text-2xl font-bold mb-3"
                        style={{ color: philosophy.color }}
                      >
                        {philosophy.title}
                      </h3>
                      <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                        {philosophy.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Image */}
              <div className="relative w-full overflow-hidden rounded-2xl p-2">
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
        </div>
      </section>

      {/* Organization Structure Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Header Section - 2 columns */}
            <div className="border-b-2 border-primary mb-8 pb-8">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div>
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
                    Bộ máy tổ chức
                  </h2>
                </div>
                <div>
                  <div className="prose prose-sm sm:prose-base text-foreground leading-relaxed dark:prose-invert">
                    <p className="text-base sm:text-lg text-muted-foreground">
                      Bộ máy tổ chức của Đại học Ngân hàng TP.HCM được xây dựng theo hướng tinh gọn, hiệu lực, hiệu quả, phù hợp với quy định của pháp luật và điều kiện thực tiễn của trường.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Image */}
            <div className="relative w-full overflow-hidden rounded-2xl border border-border">
              <div className="aspect-video relative w-full">
                <Image
                  src="https://fileserver2.hub.edu.vn/IMAGES/2025/09/22/20250922082406Bộ-máy-tổ-chức-2.png"
                  alt="Bộ máy tổ chức"
                  fill
                  className="object-contain bg-muted/30"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Facilities Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Header Section - 2 columns */}
            <div className="border-b-2 border-primary mb-8 pb-8">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div>
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
                    Cơ sở vật chất
                  </h2>
                </div>
                <div>
                  <div className="prose prose-sm sm:prose-base text-foreground leading-relaxed dark:prose-invert mb-4">
                    <p className="text-base sm:text-lg text-muted-foreground">
                      Trường Đại học Ngân hàng TP.HCM (HUB) có cơ sở vật chất khang trang, hiện đại với không gian xanh, thoáng mát, đáp ứng nhu cầu học tập, nghiên cứu, sinh hoạt, rèn luyện thể thao… của hơn 12.000 người
                    </p>
                  </div>
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-foreground mt-4">
                    <span className="text-primary">H</span>EIGHTENING{" "}
                    <span className="text-primary">U</span>NIQUE{" "}
                    <span className="text-primary">B</span>RILLIANCE
                  </h3>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-8">
              {facilities.map((facility, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl sm:text-5xl lg:text-6xl font-bold text-primary mb-2">
                    {facility.number}
                  </div>
                  <div className="text-sm sm:text-base text-muted-foreground">
                    {facility.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Content */}
            <div className="prose prose-sm sm:prose-base md:prose-lg text-foreground leading-relaxed dark:prose-invert max-w-4xl">
              <p className="text-base sm:text-lg text-muted-foreground mb-4">
                Trường Đại học Ngân hàng TP.HCM (HUB) có 3 cơ sở đào tạo, gồm 02 cơ sở tọa lạc tại Trung tâm Quận 1, Tp. Hồ Chí Minh và 01 cơ sở tại Quận Thủ Đức với tổng diện tích đất hơn 9,4 ha, diện tích xây dựng hơn 52,000 m2 đảm bảo nhu cầu dạy và học của hơn 12.000 người.
              </p>
              <p className="text-base sm:text-lg text-muted-foreground mb-4">
                HUB tự hào về cơ sở vật chất khang trang, hiện đại với không gian xanh, sạch, thoáng mát, đáp ứng việc học tập, nghiên cứu, sinh hoạt, rèn luyện văn thể mỹ. Với gần 150 phòng học, phòng máy giảng đường đều được trang bị đầy đủ thiết bị căn bản cho việc học tập, hệ thống điều hòa không khí, tivi/máy chiếu hiện đại, trang thiết bị được tăng cường đầu tư theo hướng tích hợp, tăng tương tác giữa giáo viên với người học nhằm xây dựng không gian lớp học thân hiện và hiệu quả.
              </p>
              <p className="text-base sm:text-lg text-muted-foreground mb-4">
                Ngoài không gian học tập, Nhà trường có hệ thống phụ trợ phục vụ công tác học tập, rèn luyện thể dục thể thao (cụm khu liên hợp thể dục thi thao, sân bóng đá, hồ bơi, tennis, cầu lông, pickleball...), căn tin, siêu thị tiện ích, Hội trường lớn hiện đại tại cơ sở Thủ Đức với sức chứa 900 chỗ là nơi tổ chức các sự kiện lớn của Trường, các Khoa, các CLB, Trung tâm Thông tin Thư viện hiện đại, trẻ trung, Ký túc xá rộng rãi và tiện nghi.
              </p>
              <p className="text-base sm:text-lg text-muted-foreground">
                Thư viện, trung tâm học liệu với diện tích sàn 6,666 m2 ; với gần 47,000 đầu sách, giáo trình, tài liệu tham khảo tiếng Việt và tiếng nước ngoài, gần 359,000 bản sách các loại, 20 máy tính trang bị riêng cho Thư viện được nối mạng tốc độ cao dùng để tra cứu internet và truy cập các cơ sở dữ liệu, phục vụ 600 người đọc cùng một thời điểm.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Campuses Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Cơ sở đào tạo
              </h2>
              <p className="text-lg text-muted-foreground">
                HUB có 3 cơ sở đào tạo tại TP. Hồ Chí Minh
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {campuses.map((campus, index) => {
                const Icon = campus.icon
                return (
                  <Card key={index} className="border-border">
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-lg font-semibold text-card-foreground">
                          {campus.name}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <p className="text-muted-foreground leading-relaxed">
                          {campus.address}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <Card className="border-border bg-background">
              <CardHeader className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6 mx-auto">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl sm:text-3xl font-bold text-card-foreground mb-4">
                  Liên hệ với chúng tôi
                </CardTitle>
                <CardDescription className="text-lg text-muted-foreground">
                  Có câu hỏi? Chúng tôi luôn sẵn sàng hỗ trợ bạn
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 dark:bg-muted border border-border">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Phone className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-card-foreground">Hotline Đào tạo</p>
                      <p className="text-muted-foreground">(028) 38 212 430</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 dark:bg-muted border border-border">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-card-foreground">Email</p>
                      <p className="text-muted-foreground">dhnhtphcm@hub.edu.vn</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" asChild>
                    <Link href={ABOUT_ROUTES.contact}>
                      <Mail className="h-4 w-4 mr-2" />
                      Gửi tin nhắn
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link href={ABOUT_ROUTES.home}>
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Về trang chủ
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}

