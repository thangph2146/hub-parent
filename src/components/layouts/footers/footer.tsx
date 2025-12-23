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

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16">
          {/* Company Info - Takes 2 columns on large screens */}
          <div className="lg:col-span-2 space-y-8">
            {/* Logo and Brand */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="flex-shrink-0 bg-white p-4 rounded-lg">
                <Logo className="h-28 w-28 text-blue-100" />
              </div>
              <div className="space-y-2">
                <TypographyH3>
                  Trường Đại học Ngân hàng
                </TypographyH3>
                <TypographyP>
                  Thành Phố Hồ Chí Minh
                </TypographyP>
                <TypographyPSmall>
                  {appConfig.description}
                </TypographyPSmall>
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Locations */}
              <div className="space-y-2">
                <TypographyH4 className="text-white flex items-center gap-2 mb-1">
                  <IconSize size="md">
                    <Building2 className="text-blue-400" />
                  </IconSize>
                  Cơ sở đào tạo
                </TypographyH4>
                <div className="space-y-4">
                  <div className="group mb-1">
                    <TypographyP className="text-blue-200 mb-1">Trụ sở chính</TypographyP>
                    <div className="flex items-start gap-3 text-white/80 group-hover:text-white transition-colors">
                      <IconSize size="sm" className="flex-shrink-0 mt-0.5">
                        <MapPin className="text-blue-400" />
                      </IconSize>
                      <TypographyP className="leading-relaxed">36 Tôn Thất Đạm, Phường Sài Gòn, TP.Hồ Chí Minh</TypographyP>
                    </div>
                  </div>

                  <div className="group mb-1">
                    <TypographyP className="text-blue-200 mb-1">Cơ sở Hàm Nghi</TypographyP>
                    <div className="flex items-start gap-3 text-white/80 group-hover:text-white transition-colors">
                      <IconSize size="sm" className="flex-shrink-0 mt-0.5">
                        <MapPin className="text-blue-400" />
                      </IconSize>
                      <TypographyP className="leading-relaxed">39 Hàm Nghi, Phường Sài Gòn, TP. Hồ Chí Minh</TypographyP>
                    </div>
                  </div>

                  <div className="group mb-1">
                    <TypographyP className="text-blue-200 mb-1">Cơ sở Hoàng Diệu</TypographyP>
                    <div className="flex items-start gap-3 text-white/80 group-hover:text-white transition-colors">
                      <IconSize size="sm" className="flex-shrink-0 mt-0.5">
                        <MapPin className="text-blue-400" />
                      </IconSize>
                      <TypographyP className="leading-relaxed">56 Hoàng Diệu 2, Phường Thủ Đức, TP. Hồ Chí Minh</TypographyP>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Details */}
              <div className="space-y-2">
                <TypographyH4 className="text-white flex items-center gap-2 mb-2">
                  <IconSize size="md">
                    <GraduationCap className="text-blue-400" />
                  </IconSize>
                  Liên hệ
                </TypographyH4>
                <div className="space-y-4">
                  <Link
                    href="mailto:dhnhtphcm@hub.edu.vn"
                    className="group flex items-start gap-3 text-white/80 hover:text-white transition-all duration-200"
                  >
                    <div className="flex-shrink-0 rounded-lg bg-white/10 p-2 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                      <IconSize size="md">
                        <Mail className="text-blue-400" />
                      </IconSize>
                    </div>
                    <div>
                      <TypographyP className="text-blue-200 mb-1">Email</TypographyP>
                      <TypographyP className="leading-relaxed">dhnhtphcm@hub.edu.vn</TypographyP>
                    </div>
                  </Link>

                  <Link
                    href="tel:0888353488"
                    className="group flex items-start gap-3 text-white/80 hover:text-white transition-all duration-200"
                  >
                    <div className="flex-shrink-0 rounded-lg bg-white/10 p-2 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                      <IconSize size="md">
                        <Phone className="text-blue-400" />
                      </IconSize>
                    </div>
                    <div>
                      <TypographyP className="text-blue-200 mb-1">Tuyển sinh</TypographyP>
                      <TypographyP className="leading-relaxed">0888353488</TypographyP>
                    </div>
                  </Link>

                  <Link
                    href="tel:02838212430"
                    className="group flex items-start gap-3 text-white/80 hover:text-white transition-all duration-200"
                  >
                    <div className="flex-shrink-0 rounded-lg bg-white/10 p-2 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                      <IconSize size="md">
                        <Phone className="text-blue-400" />
                      </IconSize>
                    </div>
                    <div>
                      <TypographyP className="text-blue-200 mb-1">Đào tạo</TypographyP>
                      <TypographyP className="leading-relaxed">(028) 38 212 430</TypographyP>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links & Social */}
          <div className="space-y-2 mb-2">
            {/* Quick Links */}
            <div className="space-y-6">
              <TypographyH4 className="text-white flex items-center gap-2 mb-1">
                <div className="h-1 w-8 rounded-full bg-white" />
                Liên kết nhanh
              </TypographyH4>
              <nav className="space-y-3">
                <Link
                  href={FOOTER_ROUTES.home}
                  className="flex items-center gap-2 text-white/80 hover:text-white transition-all duration-200 group mb-1"
                >
                  <IconSize size="sm" className="group-hover:translate-x-1 transition-transform">
                    <ArrowRight />
                  </IconSize>
                  <TypographySpan>Trang chủ</TypographySpan>
                </Link>
                <Link
                  href={FOOTER_ROUTES.blog}
                  className="flex items-center gap-2 text-white/80 hover:text-white transition-all duration-200 group mb-1"
                >
                  <IconSize size="sm" className="group-hover:translate-x-1 transition-transform">
                    <ArrowRight />
                  </IconSize>
                  <TypographySpan>Blog</TypographySpan>
                </Link>
                <Link
                  href={FOOTER_ROUTES.categories}
                  className="flex items-center gap-2 text-white/80 hover:text-white transition-all duration-200 group mb-1"
                >
                  <IconSize size="sm" className="group-hover:translate-x-1 transition-transform">
                    <ArrowRight />
                  </IconSize>
                  <TypographySpan>Danh mục</TypographySpan>
                </Link>
              </nav>
            </div>

            {/* Resources */}
            <div className="space-y-2 mb-2">
              <TypographyH4 className="text-white flex items-center gap-2 mb-1">
                <div className="h-1 w-8 rounded-full bg-white" />
                Tài nguyên
              </TypographyH4>
              <nav className="space-y-3">
                <Link
                  href={FOOTER_ROUTES.admin}
                  className="flex items-center gap-2 text-white/80 hover:text-white transition-all duration-200 group mb-1"
                >
                  <IconSize size="sm" className="group-hover:translate-x-1 transition-transform">
                    <ArrowRight />
                  </IconSize>
                  <TypographySpan>Quản trị</TypographySpan>
                </Link>
                <Link
                  href="#"
                  className="flex items-center gap-2 text-white/80 hover:text-white transition-all duration-200 group mb-1"
                >
                  <IconSize size="sm" className="group-hover:translate-x-1 transition-transform">
                    <ArrowRight />
                  </IconSize>
                  <TypographySpan>Hướng dẫn sử dụng</TypographySpan>
                </Link>
                <Link
                  href="#"
                  className="flex items-center gap-2 text-white/80 hover:text-white transition-all duration-200 group mb-1"
                >
                  <IconSize size="sm" className="group-hover:translate-x-1 transition-transform">
                    <ArrowRight />
                  </IconSize>
                  <TypographySpan>Điều khoản dịch vụ</TypographySpan>
                </Link>
                <Link
                  href="#"
                  className="flex items-center gap-2 text-white/80 hover:text-white transition-all duration-200 group mb-1"
                >
                  <IconSize size="sm" className="group-hover:translate-x-1 transition-transform">
                    <ArrowRight />
                  </IconSize>
                  <TypographySpan>Chính sách bảo mật</TypographySpan>
                </Link>
              </nav>
            </div>

            {/* Social Media */}
            <div className="space-y-2 mb-2">
              <TypographyH4 className="text-white flex items-center gap-2 mb-1">
                <div className="h-1 w-8 rounded-full bg-white" />
                Kết nối
              </TypographyH4>
              <div className="flex items-center gap-3">
                {appConfig.social.facebook && (
                  <Link
                    href={`https://facebook.com/${appConfig.social.facebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook - Trường Đại học Ngân hàng TP.HCM"
                    className="group flex items-center justify-center h-12 w-12 rounded-xl bg-white/10 hover:bg-blue-500/20 transition-all duration-300 hover:scale-110"
                  >
                    <IconSize size="md">
                      <Facebook className="text-white/80 group-hover:text-white" />
                    </IconSize>
                  </Link>
                )}
                {appConfig.social.twitter && (
                  <Link
                    href={`https://twitter.com/${appConfig.social.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Twitter - Trường Đại học Ngân hàng TP.HCM"
                    className="group flex items-center justify-center h-12 w-12 rounded-xl bg-white/10 hover:bg-sky-500/20 transition-all duration-300 hover:scale-110"
                  >
                    <IconSize size="md">
                      <Twitter className="text-white/80 group-hover:text-white" />
                    </IconSize>
                  </Link>
                )}
                {appConfig.social.linkedin && (
                  <Link
                    href={`https://linkedin.com/company/${appConfig.social.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn - Trường Đại học Ngân hàng TP.HCM"
                    className="group flex items-center justify-center h-12 w-12 rounded-xl bg-white/10 hover:bg-blue-600/20 transition-all duration-300 hover:scale-110"
                  >
                    <IconSize size="md">
                      <Linkedin className="text-white/80 group-hover:text-white" />
                    </IconSize>
                  </Link>
                )}
                <Link
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram - Trường Đại học Ngân hàng TP.HCM"
                  className="group flex items-center justify-center h-12 w-12 rounded-xl bg-white/10 hover:bg-pink-500/20 transition-all duration-300 hover:scale-110"
                >
                    <IconSize size="md">
                      <Instagram className="text-white/80 group-hover:text-white" />
                    </IconSize>
                </Link>
                <Link
                  href={appConfig.social.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube - Trường Đại học Ngân hàng TP.HCM"
                  className="group flex items-center justify-center h-12 w-12 rounded-xl bg-white/10 hover:bg-red-500/20 transition-all duration-300 hover:scale-110"
                >
                    <IconSize size="md">
                      <Youtube className="text-white/80 group-hover:text-white" />
                    </IconSize>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-8" />

        {/* Bottom Footer */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 text-white/60">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <TypographySpan>© {currentYear} {appConfig.namePublic}.</TypographySpan>
            <TypographySpan className="hidden sm:inline">Được phát triển bởi</TypographySpan>
            <TypographySpan className="text-white hover:text-blue-300 transition-colors cursor-pointer">
              {appConfig.company}
            </TypographySpan>
            <TypographySpan className="text-white hover:text-blue-300 transition-colors cursor-pointer">Trường Đại học Ngân hàng TP.Hồ Chí Minh</TypographySpan>
          </div>


          <div className="flex items-center gap-6">
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
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <TypographySpan>Trợ giúp</TypographySpan>
              <IconSize size="xs">
                <ExternalLink />
              </IconSize>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
