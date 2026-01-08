"use client";

import { Users, MessageSquare } from "lucide-react";
import { IconSize } from "@/components/ui/typography";
import { Flex } from "@/components/ui/flex";
import type { Post } from "@/features/public/post/types";
import type { HeroSectionProps } from "./hero-section";
import { HeroSection } from "./hero-section";
import { AboutHubSection } from "./about-hub-section";
import { OverviewSection } from "./overview-section";
import { GuideRegisterSection } from "./guide-register-section";
import { FeaturedPostsSection } from "./featured-posts-section";
import { ContactSection } from "./contact-section";
import { HOME_ROUTES } from "../constants";

const HERO_CONFIG: Omit<HeroSectionProps, "className" | "titleClassName" | "descriptionClassName" | "overlayClassName" | "children"> = {
  title: "Hệ thống Kết nối Phụ huynh",
  description: "Kiến tạo cầu nối vững chắc giữa Gia đình và Nhà trường, đồng hành cùng sinh viên trên con đường tri thức.",
  backgroundImage: {
    src: "https://fileserver2.hub.edu.vn/IMAGES/2025/12/16/20251216103027-101020.png",
    alt: "Trường Đại học Ngân hàng TP.HCM",
  },
  buttons: [
    {
      href: HOME_ROUTES.signIn,
      text: "Đăng nhập ngay",
      variant: "default",
      leftIcon: <IconSize size="sm"><Users /></IconSize>,
      responsiveText: { mobile: "Đăng nhập", desktop: "Đăng nhập ngay" },
    },
    {
      href: HOME_ROUTES.signUp,
      text: "Đăng ký thành viên",
      variant: "outline",
      leftIcon: <IconSize size="sm"><MessageSquare /></IconSize>,
      responsiveText: { mobile: "Đăng ký", desktop: "Tạo tài khoản mới" },
    },
  ],
};

export const HomeClient = ({ featuredPosts = [] }: { featuredPosts?: Post[] }) => (
  <Flex as="main" direction="col" position="relative" fullWidth bg="background" className="isolate">
    <HeroSection {...HERO_CONFIG} />
    <AboutHubSection />
    <OverviewSection className="min-h-[calc(100vh-56px)]" />
    <GuideRegisterSection />
    <FeaturedPostsSection featuredPosts={featuredPosts} />
    <ContactSection />
  </Flex>
);
