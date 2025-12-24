"use client";

import {
  Mail,
  MapPin,
  Phone,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
  ExternalLink,
  ArrowRight,
  Building2,
  GraduationCap,
} from "lucide-react";
import Link from "next/link";
import { appConfig } from "@/lib/config";
import { appFeatures } from "@/lib/config/app-features";
import { getResourceMainRoute } from "@/lib/permissions/route-helpers";
import { Flex } from "@/components/ui/flex";
import { Grid } from "@/components/ui/grid";
import { TypographyH3, TypographyH4, TypographyP, TypographyPSmall, TypographySpan, IconSize } from "@/components/ui/typography";
import { Logo } from "../../../../public/svg/Logo"

/**
 * Helper function để lấy route từ appFeatures
 */
function getRouteFromFeature(key: string): string | null {
  const feature = appFeatures.find((f) => f.key === key);
  if (!feature?.navigation) return null;

  const nav = feature.navigation;
  if (nav.href) return nav.href;

  if (nav.resourceName) {
    const route = getResourceMainRoute(nav.resourceName);
    return route?.path || null;
  }

  return null;
}

// Public routes constants - Lấy từ appFeatures
const FOOTER_ROUTES = {
  home: getRouteFromFeature("home") || "/",
  blog: getRouteFromFeature("blog") || "/bai-viet",
  categories: getRouteFromFeature("blog") || "/bai-viet", // Sử dụng blog route cho categories
  admin: getRouteFromFeature("dashboard") || "/admin/dashboard",
  about: getRouteFromFeature("about") || "/about",
  contact: getRouteFromFeature("contact") || "/contact",
  help: getRouteFromFeature("help") || "/help",
} as const;


export function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white mt-auto overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px] pointer-events-none" />
      <div className="absolute inset-0 bg-primary pointer-events-none" />

      <Flex direction="col" className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Main Footer Content */}
        <Grid cols={3} gap={8} className="mb-16">
          {/* Company Info - Takes 2 columns on large screens */}
          <Flex direction="col" gap={8} className="lg:col-span-2">
            {/* Logo and Brand */}
            <Flex direction="col" align="start" gap={6} className="sm:flex-row sm:items-center">
              <div className="flex-shrink-0 bg-white p-4 rounded-lg">
                <Logo className="h-28 w-28 text-blue-100" />
              </div>
              <Flex direction="col" gap={2}>
                <TypographyH3>
                  Trường Đại học Ngân hàng
                </TypographyH3>
                <TypographyP>
                  Thành Phố Hồ Chí Minh
                </TypographyP>
                <TypographyPSmall>
                  {appConfig.description}
                </TypographyPSmall>
              </Flex>
            </Flex>

            {/* Contact Information */}
            <Grid cols={2} gap={8}>
              {/* Locations */}
              <Flex direction="col" gap={2}>
                <Flex align="center" gap={2}>
                  <IconSize size="md">
                    <Building2 />
                  </IconSize>
                  <TypographyH4>Cơ sở đào tạo</TypographyH4>
                </Flex>
                <Flex direction="col" gap={4}>
                  <Flex direction="col" gap={1} className="group">
                    <TypographyP className="text-blue-200">Trụ sở chính</TypographyP>
                    <Flex align="start" gap={3} className="group-hover:text-white transition-colors">
                      <IconSize size="sm">
                        <MapPin />
                      </IconSize>
                      <TypographyP>36 Tôn Thất Đạm, Phường Sài Gòn, TP.Hồ Chí Minh</TypographyP>
                    </Flex>
                  </Flex>

                  <Flex direction="col" gap={1} className="group">
                    <TypographyP className="text-blue-200">Cơ sở Hàm Nghi</TypographyP>
                    <Flex align="start" gap={3} className="group-hover:text-white transition-colors">
                      <IconSize size="sm">
                        <MapPin />
                      </IconSize>
                      <TypographyP>39 Hàm Nghi, Phường Sài Gòn, TP. Hồ Chí Minh</TypographyP>
                    </Flex>
                  </Flex>

                  <Flex direction="col" gap={1} className="group">
                    <TypographyP className="text-blue-200">Cơ sở Hoàng Diệu</TypographyP>
                    <Flex align="start" gap={3} className="group-hover:text-white transition-colors">
                      <IconSize size="sm">
                        <MapPin />
                      </IconSize>
                      <TypographyP>56 Hoàng Diệu 2, Phường Thủ Đức, TP. Hồ Chí Minh</TypographyP>
                    </Flex>
                  </Flex>
                </Flex>
              </Flex>

              {/* Contact Details */}
              <Flex direction="col" gap={2}>
                <Flex align="center" gap={2}>
                  <IconSize size="md">
                    <GraduationCap />
                  </IconSize>
                  <TypographyH4>Liên hệ</TypographyH4>
                </Flex>
                <Flex direction="col" gap={4}>
                  <Link
                    href="mailto:dhnhtphcm@hub.edu.vn"
                    className="group text-white/80 hover:text-white transition-all duration-200"
                  >
                    <Flex align="start" gap={3}>
                      <Flex align="center" justify="center" className="flex-shrink-0 rounded-lg bg-white/10 p-2 group-hover:bg-white/20 transition-colors">
                        <IconSize size="md">
                          <Mail />
                        </IconSize>
                      </Flex>
                      <Flex direction="col" gap={1}>
                        <TypographyP>Email</TypographyP>
                        <TypographyP>dhnhtphcm@hub.edu.vn</TypographyP>
                      </Flex>
                    </Flex>
                  </Link>

                  <Link
                    href="tel:0888353488"
                    className="group text-white/80 hover:text-white transition-all duration-200"
                  >
                    <Flex align="start" gap={3}>
                      <Flex align="center" justify="center" className="flex-shrink-0 rounded-lg bg-white/10 p-2 group-hover:bg-white/20 transition-colors">
                        <IconSize size="md">
                          <Phone />
                        </IconSize>
                      </Flex>
                      <Flex direction="col" gap={1}>
                        <TypographyP>Tuyển sinh</TypographyP>
                        <TypographyP>0888353488</TypographyP>
                      </Flex>
                    </Flex>
                  </Link>

                  <Link
                    href="tel:02838212430"
                    className="group text-white/80 hover:text-white transition-all duration-200"
                  >
                    <Flex align="start" gap={3}>
                      <Flex align="center" justify="center" className="flex-shrink-0 rounded-lg bg-white/10 p-2 group-hover:bg-white/20 transition-colors">
                        <IconSize size="md">
                          <Phone />
                        </IconSize>
                      </Flex>
                      <Flex direction="col" gap={1}>
                        <TypographyP>Đào tạo</TypographyP>
                        <TypographyP>(028) 38 212 430</TypographyP>
                      </Flex>
                    </Flex>
                  </Link>
                </Flex>
              </Flex>
            </Grid>
          </Flex>

          {/* Quick Links & Social */}
          <Flex direction="col" gap={2}>
            {/* Quick Links */}
            <Flex direction="col" gap={6}>
              <Flex align="center" gap={2}>
                <div className="h-1 w-8 rounded-full bg-white" />
                <TypographyH4>Liên kết nhanh</TypographyH4>
              </Flex>
              <nav>
                <Flex direction="col" gap={3}>
                  <Link
                    href={FOOTER_ROUTES.home}
                    className="text-white/80 hover:text-white transition-all duration-200 group"
                  >
                    <Flex align="center" gap={2}>
                      <IconSize size="sm" className="transition-transform group-hover:translate-x-1">
                        <ArrowRight />
                      </IconSize>
                      <TypographySpan>Trang chủ</TypographySpan>
                    </Flex>
                  </Link>
                  <Link
                    href={FOOTER_ROUTES.blog}
                    className="text-white/80 hover:text-white transition-all duration-200 group"
                  >
                    <Flex align="center" gap={2}>
                      <IconSize size="sm" className="transition-transform group-hover:translate-x-1">
                        <ArrowRight />
                      </IconSize>
                      <TypographySpan>Blog</TypographySpan>
                    </Flex>
                  </Link>
                  <Link
                    href={FOOTER_ROUTES.categories}
                    className="text-white/80 hover:text-white transition-all duration-200 group"
                  >
                    <Flex align="center" gap={2}>
                      <IconSize size="sm" className="transition-transform group-hover:translate-x-1">
                        <ArrowRight />
                      </IconSize>
                      <TypographySpan>Danh mục</TypographySpan>
                    </Flex>
                  </Link>
                </Flex>
              </nav>
            </Flex>

            {/* Resources */}
            <Flex direction="col" gap={2}>
              <Flex align="center" gap={2}>
                <div className="h-1 w-8 rounded-full bg-white" />
                <TypographyH4>Tài nguyên</TypographyH4>
              </Flex>
              <nav>
                <Flex direction="col" gap={3}>
                  <Link
                    href={FOOTER_ROUTES.admin}
                    className="text-white/80 hover:text-white transition-all duration-200 group"
                  >
                    <Flex align="center" gap={2}>
                      <IconSize size="sm" className="transition-transform group-hover:translate-x-1">
                        <ArrowRight />
                      </IconSize>
                      <TypographySpan>Quản trị</TypographySpan>
                    </Flex>
                  </Link>
                  <Link
                    href="#"
                    className="text-white/80 hover:text-white transition-all duration-200 group"
                  >
                    <Flex align="center" gap={2}>
                      <IconSize size="sm" className="transition-transform group-hover:translate-x-1">
                        <ArrowRight />
                      </IconSize>
                      <TypographySpan>Hướng dẫn sử dụng</TypographySpan>
                    </Flex>
                  </Link>
                  <Link
                    href="#"
                    className="text-white/80 hover:text-white transition-all duration-200 group"
                  >
                    <Flex align="center" gap={2}>
                      <IconSize size="sm" className="transition-transform group-hover:translate-x-1">
                        <ArrowRight />
                      </IconSize>
                      <TypographySpan>Điều khoản dịch vụ</TypographySpan>
                    </Flex>
                  </Link>
                  <Link
                    href="#"
                    className="text-white/80 hover:text-white transition-all duration-200 group"
                  >
                    <Flex align="center" gap={2}>
                      <IconSize size="sm" className="transition-transform group-hover:translate-x-1">
                        <ArrowRight />
                      </IconSize>
                      <TypographySpan>Chính sách bảo mật</TypographySpan>
                    </Flex>
                  </Link>
                </Flex>
              </nav>
            </Flex>

            {/* Social Media */}
            <Flex direction="col" gap={2}>
              <Flex align="center" gap={2}>
                <div className="h-1 w-8 rounded-full bg-white" />
                <TypographyH4>Kết nối</TypographyH4>
              </Flex>
              <Flex align="center" gap={3}>
                {appConfig.social.facebook && (
                  <Link
                    href={`https://facebook.com/${appConfig.social.facebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook - Trường Đại học Ngân hàng TP.HCM"
                    className="group h-12 w-12 rounded-xl bg-white/10 hover:bg-blue-500/20 transition-all duration-300 hover:scale-110"
                  >
                    <Flex align="center" justify="center" className="h-full w-full">
                      <IconSize size="md">
                        <Facebook />
                      </IconSize>
                    </Flex>
                  </Link>
                )}
                {appConfig.social.twitter && (
                  <Link
                    href={`https://twitter.com/${appConfig.social.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Twitter - Trường Đại học Ngân hàng TP.HCM"
                    className="group h-12 w-12 rounded-xl bg-white/10 hover:bg-sky-500/20 transition-all duration-300 hover:scale-110"
                  >
                    <Flex align="center" justify="center" className="h-full w-full">
                      <IconSize size="md">
                        <Twitter />
                      </IconSize>
                    </Flex>
                  </Link>
                )}
                {appConfig.social.linkedin && (
                  <Link
                    href={`https://linkedin.com/company/${appConfig.social.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn - Trường Đại học Ngân hàng TP.HCM"
                    className="group h-12 w-12 rounded-xl bg-white/10 hover:bg-blue-600/20 transition-all duration-300 hover:scale-110"
                  >
                    <Flex align="center" justify="center" className="h-full w-full">
                      <IconSize size="md">
                        <Linkedin />
                      </IconSize>
                    </Flex>
                  </Link>
                )}
                <Link
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram - Trường Đại học Ngân hàng TP.HCM"
                    className="group h-12 w-12 rounded-xl bg-white/10 hover:bg-pink-500/20 transition-all duration-300 hover:scale-110"
                >
                  <Flex align="center" justify="center" className="h-full w-full">
                    <IconSize size="md">
                      <Instagram />
                    </IconSize>
                  </Flex>
                </Link>
                <Link
                  href={appConfig.social.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube - Trường Đại học Ngân hàng TP.HCM"
                    className="group h-12 w-12 rounded-xl bg-white/10 hover:bg-red-500/20 transition-all duration-300 hover:scale-110"
                >
                  <Flex align="center" justify="center" className="h-full w-full">
                    <IconSize size="md">
                      <Youtube />
                    </IconSize>
                  </Flex>
                </Link>
              </Flex>
            </Flex>
          </Flex>
        </Grid>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-8" />

        {/* Bottom Footer */}
        <Flex direction="col" align="center" justify="between" gap={6} className="lg:flex-row lg:items-center lg:justify-between">
          <Flex direction="col" align="center" gap={2} className="sm:flex-row sm:items-center">
            <TypographySpan>© {currentYear} {appConfig.namePublic}.</TypographySpan>
            <TypographySpan className="hidden sm:inline">Được phát triển bởi</TypographySpan>
            <TypographySpan className="text-white hover:text-blue-300 transition-colors cursor-pointer">
              {appConfig.company}
            </TypographySpan>
            <TypographySpan className="text-white hover:text-blue-300 transition-colors cursor-pointer">Trường Đại học Ngân hàng TP.Hồ Chí Minh</TypographySpan>
          </Flex>


          <Flex align="center" gap={6}>
            <Link href={FOOTER_ROUTES.about} className="hover:text-white transition-colors">
              <TypographySpan>Về chúng tôi</TypographySpan>
            </Link>
            <span className="text-white/20">•</span>
            <Link href={FOOTER_ROUTES.contact} className="hover:text-white transition-colors">
              <TypographySpan>Liên hệ</TypographySpan>
            </Link>
            <span className="text-white/20">•</span>
                  <Link
                    href={FOOTER_ROUTES.help}
                    className="hover:text-white transition-colors"
                  >
                    <Flex align="center" gap={1}>
                      <TypographySpan>Trợ giúp</TypographySpan>
                      <IconSize size="xs">
                        <ExternalLink />
                      </IconSize>
                    </Flex>
                  </Link>
          </Flex>
        </Flex>
      </Flex>
    </footer>
  );
}
