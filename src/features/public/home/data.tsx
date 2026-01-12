import { HOME_ROUTES } from "./constants";
import { Users, MessageSquare } from "lucide-react";
import React from "react";
import { IconSize } from "@/components/ui/typography";

// Dữ liệu cho HeroSection
export const HERO_DATA = {
  title: "Hệ thống Kết nối Phụ huynh",
  description: "Kiến tạo cầu nối vững chắc giữa Gia đình và Nhà trường, đồng hành cùng sinh viên trên con đường tri thức.",
  flipWords: ["Kết nối", "Đồng hành", "Phát triển", "Vươn xa"],
  quote: '"Tâm an lòng, con vững bước – Đồng hành cùng tương lai con tại HUB"',
  backgroundImage: {
    src: "https://fileserver2.hub.edu.vn/IMAGES/2025/12/16/20251216103027-101020.png",
    alt: "Trường Đại học Ngân hàng TP.HCM",
  },
  buttons: [
    {
      href: HOME_ROUTES.signIn,
      text: "Đăng nhập ngay",
      variant: "default" as const,
      leftIcon: <IconSize size="sm"><Users /></IconSize>,
      responsiveText: { mobile: "Đăng nhập", desktop: "Đăng nhập ngay" },
    },
    {
      href: HOME_ROUTES.signUp,
      text: "Đăng ký thành viên",
      variant: "outline" as const,
      leftIcon: <IconSize size="sm"><MessageSquare /></IconSize>,
      responsiveText: { mobile: "Đăng ký", desktop: "Tạo tài khoản mới" },
    },
  ],
};
