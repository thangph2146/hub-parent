"use client";

import {
  IconSize,
  TypographyDescriptionSmall,
  TypographyH2,
  TypographySpan,
} from "@/components/ui/typography";
import { Button } from "@/components/ui/button";

import {
  Users,
  MessageSquare,
  ArrowRight,
  GraduationCap,
  Phone,
  Mail,
} from "lucide-react";
import { ContactForm } from "@/components/forms/contact-form";
import { getRouteFromFeature } from "@/lib/utils";
import { Section } from "./section";
import { SectionWithImage } from "./section-with-image";
import { SectionText } from "./section-text";
import { HeroSection } from "./hero-section";
import { ContactSection } from "./contact-section";
import { AboutHubSection } from "./about-hub-section";
import { PostCard } from "@/components/public/post/post-card";
import Link from "next/link";
import type { Post } from "@/features/public/post/types";
import { Flex } from "@/components/ui/flex";
import { Grid } from "@/components/ui/grid";
import { EncryptedText } from "@/components/ui/encrypted-text";
import { ContainerTextFlip } from "@/components/ui/container-text-flip";

// Routes constants - Lấy từ appFeatures
const HOME_ROUTES = {
  signIn: "/auth/sign-in",
  signUp: "/auth/sign-up",
  help: getRouteFromFeature("help") || "/help",
} as const;

export interface HomeClientProps {
  featuredPosts?: Post[];
}

export const HomeClient = ({ featuredPosts = [] }: HomeClientProps) => {
  return (
    <Flex
      direction="col"
      position="relative"
      fullWidth
      bg="background"
      className="isolate"
    >
      {/* Hero Section */}
      <HeroSection
        title="Hệ thống Kết nối Phụ huynh"
        description="Kiến tạo cầu nối vững chắc giữa Gia đình và Nhà trường, đồng hành cùng sinh viên trên con đường tri thức."
        backgroundImage={{
          src: "https://fileserver2.hub.edu.vn/IMAGES/2025/12/16/20251216103027-101020.png",
          alt: "Trường Đại học Ngân hàng TP.HCM",
          width: 1920,
          height: 1080,
        }}
        buttons={[
          {
            href: HOME_ROUTES.signIn,
            text: "Đăng nhập ngay",
            variant: "default",
            size: "default",
            leftIcon: (
              <IconSize size="sm">
                <Users />
              </IconSize>
            ),
            responsiveText: {
              mobile: "Đăng nhập",
              desktop: "Đăng nhập ngay",
            },
          },
          {
            href: HOME_ROUTES.signUp,
            text: "Đăng ký thành viên",
            variant: "outline",
            size: "default",
            leftIcon: (
              <IconSize size="sm">
                <MessageSquare />
              </IconSize>
            ),
            responsiveText: {
              mobile: "Đăng ký",
              desktop: "Tạo tài khoản mới",
            },
          },
        ]}
      />

      {/* About HUB Section */}
      <AboutHubSection />

      {/* Overview Section */}
      <Section padding="responsive-lg" background="background">
        <SectionText
          title={
            <div className="text-4xl md:text-5xl font-bold flex items-center gap-2">
              Về{" "}
              <ContainerTextFlip
                words={["Chúng Tôi", "Tương Lai", "Cam Kết"]}
              />
            </div>
          }
          // Use custom title component above instead of string
          useContainerTextFlip={false}
          usePointerHighlight={true}
          animateContent={true}
          useEncryptedText={false}
          paragraphs={[
            "Hệ thống kết nối Phụ huynh và Nhà trường được xây dựng để kiến tạo cầu nối, gắn kết giữa phụ huynh, gia đình và nhà trường trong suốt hành trình học tập của sinh viên tại trường Đại học Ngân hàng Tp. Hồ Chí Minh. Chúng tôi hiểu rằng sự tham gia tích cực của gia đình đóng vai trò quan trọng trong thành tích, tiến độ học tập của sinh viên.",
            "Thông qua nền tảng này, phụ huynh có thể theo dõi tiến độ học tập, điểm số, lịch học và lịch thi của sinh viên. Đồng thời, phụ huynh có thể trao đổi thông tin trực tiếp với giảng viên, cố vấn học tập và nhận thông báo quan trọng từ nhà trường.",
            {
              text: "Chúng tôi mong muốn được quý phụ huynh đồng hành trong hành trình học tập, sáng tạo và trưởng thành của các em.",
              className: "text-secondary font-semibold pl-6 py-4 pr-4 text-lg",
            },
          ]}
        />
      </Section>


      {/* Guide & Register Section - Redesigned to be side-by-side or stacked cleanly */}
      <Section padding="responsive-lg" background="background">
        <Flex direction="col" gap={16}>
          <div className="grid md:grid-cols-2 gap-8 items-stretch">
            {/* Guide Section */}
            <SectionWithImage
              title="Hướng dẫn Phụ huynh"
              description="Tài liệu và hướng dẫn chi tiết giúp Quý phụ huynh dễ dàng tiếp cận và sử dụng các tiện ích của hệ thống."
              image={{
                src: "https://fileserver2.hub.edu.vn/IMAGES/2024/12/31/20241231170332vehub.jpg",
                alt: "Hướng dẫn cho phụ huynh",
              }}
              button={{
                href: HOME_ROUTES.help,
                text: "Xem hướng dẫn",
                variant: "outline",
                size: "sm",
              }}
              className="h-full"
            />

            {/* Register Section */}
            <SectionWithImage
              title="Đăng ký nhận tin"
              description="Để lại thông tin để nhận các bản tin quan trọng, thông báo sự kiện và hoạt động của trường sớm nhất."
              image={{
                src: "https://hub.edu.vn/DATA/IMAGES/2025/06/06/20250606095214z6676928339374_824596735893cad9e9d4402075fcccd2.jpg",
                alt: "Đăng ký nhận tin tức",
              }}
              button={{
                href: HOME_ROUTES.signUp,
                text: "Đăng ký ngay",
                variant: "default", // Highlight this action
                size: "sm",
              }}
              // Actually original used reverse. Let's revert to reverse=true for visual interest but check implementation
              reverse
              className="h-full"
            />
          </div>
        </Flex>
      </Section>
      {/* Featured Posts Section */}
      {featuredPosts.length > 0 && (
        <Section
          padding="responsive-lg"
          background="none"
          className="bg-muted/30"
        >
          <Flex direction="col" gap={8} container>
            {/* Header */}
            <Flex
              align="center"
              justify="between"
              gap={4}
              fullWidth
              className="border-b pb-4 mb-4"
            >
              <Flex direction="col" gap={1}>
                <TypographyH2 className="text-3xl font-bold tracking-tight text-primary">
                  Tin tức & Sự kiện
                </TypographyH2>
                <TypographyDescriptionSmall className="text-base text-muted-foreground">
                  Cập nhật những thông tin mới nhất từ nhà trường
                </TypographyDescriptionSmall>
              </Flex>
              <Flex className="hidden md:flex">
                <Link href="/bai-viet">
                  <Button variant="ghost" className="group">
                    <Flex align="center" gap={2}>
                      <TypographySpan>Xem tất cả</TypographySpan>
                      <IconSize
                        size="sm"
                        className="transition-transform group-hover:translate-x-1"
                      >
                        <ArrowRight />
                      </IconSize>
                    </Flex>
                  </Button>
                </Link>
              </Flex>
            </Flex>

            {/* Posts Grid */}
            <Grid
              cols={3}
              gap={8}
              className="md:grid-cols-3 sm:grid-cols-2 grid-cols-1"
            >
              {featuredPosts.slice(0, 3).map((post, index) => (
                <PostCard
                  key={post.id}
                  post={post}
                  priority={index < 3}
                  className="h-full hover:-translate-y-1 transition-transform duration-300"
                />
              ))}
            </Grid>

            {/* Mobile View All Button */}
            <Flex justify="center" className="md:hidden mt-4">
              <Button
                asChild
                variant="outline"
                size="default"
                className="w-full"
              >
                <Link href="/bai-viet">
                  <Flex align="center" gap={2}>
                    <TypographySpan>Xem tất cả tin tức</TypographySpan>
                    <IconSize size="sm">
                      <ArrowRight />
                    </IconSize>
                  </Flex>
                </Link>
              </Button>
            </Flex>
          </Flex>
        </Section>
      )}

      {/* Registration Form / Contact Section */}
      <Section
        padding="responsive-lg"
        background="none"
        className="bg-muted/30"
      >
        <ContactSection
          title="Tại sao chọn chúng tôi?"
          description={
            <EncryptedText
              text="Cam kết chất lượng đào tạo và sự đồng hành chặt chẽ cùng gia đình."
              className="text-muted-foreground"
              revealDelayMs={10}
              flipDelayMs={10}
            />
          }
          contactInfo={{
            title: "Liên hệ hỗ trợ",
            items: [
              {
                icon: (
                  <IconSize size="md">
                    <Phone />
                  </IconSize>
                ),
                text: "(028) 38 212 430",
              },
              {
                icon: (
                  <IconSize size="md">
                    <Mail />
                  </IconSize>
                ),
                text: "dhnhtphcm@hub.edu.vn",
              },
              {
                icon: (
                  <IconSize size="md">
                    <GraduationCap />
                  </IconSize>
                ),
                text: "36 Tôn Thất Đạm, Quận 1, TP.HCM",
              },
            ],
          }}
          formComponent={<ContactForm />}
        />
      </Section>
    </Flex>
  );
};
