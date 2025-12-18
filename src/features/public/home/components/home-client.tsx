"use client";

import { typography, headerConfig, responsiveIconSizes } from "@/lib/typography";

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
import { PostCard } from "@/components/public/post/post-card";
import Link from "next/link";
import type { Post } from "@/features/public/post/types";

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
    <div className="relative isolate bg-background">
      {/* Hero Section */}
      <HeroSection
        title="Hệ thống Kết nối Phụ huynh"
        description="Kết nối phụ huynh với Trường Đại học Ngân hàng Thành phố Hồ Chí Minh"
        backgroundImage={{
          src: "/images/hero-section.jpg",
          alt: "Trường Đại học Ngân hàng TP.HCM",
          width: 1920,
          height: 1080,
        }}
        buttons={[
          {
            href: HOME_ROUTES.signIn,
            text: "Đăng nhập ngay",
            variant: "default",
            size: "sm",
            leftIcon: <Users className={responsiveIconSizes.small} />,
            rightIcon: <ArrowRight className={responsiveIconSizes.small} />,
            responsiveText: {
              mobile: "Đăng nhập",
              desktop: "Đăng nhập ngay",
            },
          },
          {
            href: HOME_ROUTES.signUp,
            text: "Đăng ký",
            variant: "outline",
            size: "sm",
            leftIcon: <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />,
          },
        ]}
      />

      {/* Overview Section */}
      <Section>
        <SectionText
          title="Giới thiệu"
          paragraphs={[
            "Hệ thống kết nối Phụ huynh và Nhà trường được xây dựng để kiến tạo cầu nối, gắn kết giữa phụ huynh, gia đình và nhà trường trong suốt hành trình học tập của sinh viên tại trường Đại học Ngân hàng Tp. Hồ Chí Minh. Chúng tôi hiểu rằng sự tham gia tích cực của gia đình đóng vai trò quan trọng trong thành tích, tiến độ học tập của sinh viên và góp phần vào thành công của các em sau khi rời khỏi giảng đường đại học.",
            "Thông qua nền tảng này, phụ huynh có thể theo dõi tiến độ học tập, điểm số, lịch học và lịch thi của sinh viên. Đồng thời, phụ huynh có thể trao đổi thông tin trực tiếp với giảng viên, cố vấn học tập và nhận thông báo quan trọng từ nhà trường.",
            {
              text: "Chúng tôi mong muốn được quý phụ huynh đồng hành trong hành trình học tập, sáng tạo và trưởng thành của các em.",
              className: "text-secondary font-bold",
            },
          ]}
        />
      </Section>

      {/* Guide & Register Section */}
      <Section padding="py-0">
        {/* Top Row - Guide Section */}
        <SectionWithImage
          title="Hướng dẫn cho Phụ huynh"
          description="Khám phá hướng dẫn toàn diện với thông tin cần thiết và tài nguyên dành cho phụ huynh sinh viên Trường Đại học Ngân hàng TP.HCM."
          image={{
            src: "https://hub.edu.vn/DATA/IMAGES/2025/06/06/20250606095355z6676952814172_23a84367b5e409bfcea8b8e95ac6ba4c.jpg",
            alt: "Hướng dẫn cho phụ huynh",
          }}
          button={{
            href: HOME_ROUTES.help,
            text: "Tìm hiểu ngay",
            variant: "outline",
            size: "sm",
          }}
        />

        {/* Bottom Row - Register Section */}
        <SectionWithImage
          title="Đăng ký nhận tin tức"
          description="Cập nhật thông tin mới nhất về hoạt động của trường, bản tin phụ huynh và các sự kiện dành cho phụ huynh sinh viên Trường Đại học Ngân hàng TP.HCM."
          image={{
            src: "https://hub.edu.vn/DATA/IMAGES/2025/06/06/20250606095214z6676928339374_824596735893cad9e9d4402075fcccd2.jpg",
            alt: "Đăng ký nhận tin tức",
          }}
          button={{
            href: HOME_ROUTES.signUp,
            text: "Đăng ký ngay",
            variant: "outline",
            size: "sm",
          }}
          reverse
        />
      </Section>

      {/* Featured Posts Section */}
      {featuredPosts.length > 0 && (
        <Section padding="py-12" background="bg-background">
          <div className="flex flex-col gap-8">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div>
                  <h2 className={`${headerConfig.section.className} tracking-tight`}>
                    Bài viết nổi bật
                  </h2>
                  <p className={`${typography.description.small} mt-1`}>
                    Các bài viết mới nhất từ nhà trường
                  </p>
                </div>
              </div>
              <Link
                href="/bai-viet"
                className="hidden sm:flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Xem tất cả
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Posts Grid */}
            <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
              {featuredPosts.map((post, index) => (
                <PostCard
                  key={post.id}
                  post={post}
                  priority={index < 3}
                />
              ))}
            </div>

            {/* Mobile View All Button */}
            <div className="flex sm:hidden justify-center">
              <Link
                href="/bai-viet"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                Xem tất cả bài viết
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </Section>
      )}

      {/* Registration Form Section */}
      <Section padding="py-12" background="bg-background">
        <ContactSection
          title="Tại sao chọn chúng tôi?"
          description="Chúng tôi cam kết mang đến trải nghiệm tốt nhất cho phụ huynh và sinh viên."
          contactInfo={{
            title: "Thông tin liên hệ",
            items: [
              {
                icon: <Phone className="h-5 w-5 text-primary" />,
                text: "(028) 38 212 430",
              },
              {
                icon: <Mail className="h-5 w-5 text-primary" />,
                text: "dhnhtphcm@hub.edu.vn",
              },
              {
                icon: <GraduationCap className="h-5 w-5 text-primary" />,
                text: "Trường Đại học Ngân hàng TP.HCM",
              },
            ],
          }}
          formComponent={<ContactForm />}
        />
      </Section>
    </div>
  );
}
