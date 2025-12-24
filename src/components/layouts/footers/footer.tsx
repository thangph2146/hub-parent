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
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TypographyH3, TypographyH4, TypographyP, TypographyPSmall, TypographySpan, TypographySpanMuted, IconSize } from "@/components/ui/typography";
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
    <footer>
      <Flex direction="col" position="relative" container padding="responsive-lg" fullWidth bg="primary" className="mt-auto overflow-hidden">
        {/* Main Footer Content */}
        <Grid cols={3} gap={8} fullWidth>
          {/* Company Info - Takes 2 columns on large screens */}
          {/* Logo and Brand */}
          <Flex direction="col" align="start" justify="start" gap={6}>
            <Card>
              <Flex align="center" justify="center" padding="md">
                <Logo className="h-28 w-28 text-blue-100" />
              </Flex>
            </Card>
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
            {/* Contact Information */}
            {/* Locations */}
            <Flex direction="col" gap={4}>
              <Flex align="center" gap={2}>
                <IconSize size="md">
                  <Building2 />
                </IconSize>
                <TypographyH4>Cơ sở đào tạo</TypographyH4>
              </Flex>
              <Flex direction="col" gap={1}>
                <TypographyP>Trụ sở chính</TypographyP>
                <Flex align="start" gap={3}>
                  <IconSize size="sm">
                    <MapPin />
                  </IconSize>
                  <TypographyP>36 Tôn Thất Đạm, Phường Sài Gòn, TP.Hồ Chí Minh</TypographyP>
                </Flex>
              </Flex>

              <Flex direction="col" gap={1}>
                <TypographyP>Cơ sở Hàm Nghi</TypographyP>
                <Flex align="start" gap={3}>
                  <IconSize size="sm">
                    <MapPin />
                  </IconSize>
                  <TypographyP>39 Hàm Nghi, Phường Sài Gòn, TP. Hồ Chí Minh</TypographyP>
                </Flex>
              </Flex>

              <Flex direction="col" gap={1}>
                <TypographyP>Cơ sở Hoàng Diệu</TypographyP>
                <Flex align="start" gap={3}>
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
              <Link href="mailto:dhnhtphcm@hub.edu.vn">
                <Flex align="start" gap={3}>
                  <Flex align="center" justify="center" padding="sm" shrink rounded="lg" bg="white-10">
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

              <Link href="tel:0888353488">
                <Flex align="start" gap={3}>
                  <Flex align="center" justify="center" padding="sm" shrink rounded="lg" bg="white-10">
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

              <Link href="tel:02838212430">
                <Flex align="start" gap={3}>
                  <Flex align="center" justify="center" padding="sm" shrink rounded="lg" bg="white-10">
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
            {/* Social Media */}
            <Flex direction="col" gap={2}>
              <Flex align="center" gap={2}>
                <Flex height="16" maxWidth="32" rounded="full" bg="white" />
                <TypographyH4>Kết nối</TypographyH4>
              </Flex>
              <Flex align="center" gap={3}>
                {appConfig.social.facebook && (
                  <Link
                    href={`https://facebook.com/${appConfig.social.facebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook - Trường Đại học Ngân hàng TP.HCM"
                  >
                    <Flex align="center" justify="center" height="64" rounded="xl" bg="white-10" fullWidth>
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
                  >
                    <Flex align="center" justify="center" height="64" rounded="xl" bg="white-10" fullWidth>
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
                  >
                    <Flex align="center" justify="center" height="64" rounded="xl" bg="white-10" fullWidth>
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
                >
                  <Flex align="center" justify="center" height="64" rounded="xl" bg="white-10">
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
                >
                  <Flex align="center" justify="center" height="64" rounded="xl" bg="white-10">
                    <IconSize size="md">
                      <Youtube />
                    </IconSize>
                  </Flex>
                </Link>
              </Flex>
            </Flex>
          </Flex>

          {/* Quick Links & Social */}
          <Flex direction="col" gap={2}>
            {/* Quick Links */}
            <Flex direction="col" gap={6}>
              <Flex align="center" gap={2}>
                <Flex height="16" maxWidth="32" rounded="full" bg="white" />
                <TypographyH4>Liên kết nhanh</TypographyH4>
              </Flex>
              <nav>
                <Flex direction="col" gap={3}>
                  <Link
                    href={FOOTER_ROUTES.home}
                    className="text-white/80 hover:text-white transition-all duration-200"
                  >
                    <Flex align="center" gap={2}>
                      <IconSize size="sm">
                        <ArrowRight />
                      </IconSize>
                      <TypographySpan>Trang chủ</TypographySpan>
                    </Flex>
                  </Link>
                  <Link
                    href={FOOTER_ROUTES.blog}
                    className="text-white/80 hover:text-white transition-all duration-200"
                  >
                    <Flex align="center" gap={2}>
                      <IconSize size="sm">
                        <ArrowRight />
                      </IconSize>
                      <TypographySpan>Blog</TypographySpan>
                    </Flex>
                  </Link>
                  <Link
                    href={FOOTER_ROUTES.categories}
                    className="text-white/80 hover:text-white transition-all duration-200"
                  >
                    <Flex align="center" gap={2}>
                      <IconSize size="sm">
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
                <Flex height="16" maxWidth="32" rounded="full" bg="white" />
                <TypographyH4>Tài nguyên</TypographyH4>
              </Flex>
              <nav>
                <Flex direction="col" gap={3}>
                  <Link
                    href={FOOTER_ROUTES.admin}
                    className="text-white/80 hover:text-white transition-all duration-200"
                  >
                    <Flex align="center" gap={2}>
                      <IconSize size="sm">
                        <ArrowRight />
                      </IconSize>
                      <TypographySpan>Quản trị</TypographySpan>
                    </Flex>
                  </Link>
                  <Link
                    href="#"
                    className="text-white/80 hover:text-white transition-all duration-200"
                  >
                    <Flex align="center" gap={2}>
                      <IconSize size="sm">
                        <ArrowRight />
                      </IconSize>
                      <TypographySpan>Hướng dẫn sử dụng</TypographySpan>
                    </Flex>
                  </Link>
                  <Link
                    href="#"
                    className="text-white/80 hover:text-white transition-all duration-200"
                  >
                    <Flex align="center" gap={2}>
                      <IconSize size="sm">
                        <ArrowRight />
                      </IconSize>
                      <TypographySpan>Điều khoản dịch vụ</TypographySpan>
                    </Flex>
                  </Link>
                  <Link
                    href="#"
                    className="text-white/80 hover:text-white transition-all duration-200"
                  >
                    <Flex align="center" gap={2}>
                      <IconSize size="sm">
                        <ArrowRight />
                      </IconSize>
                      <TypographySpan>Chính sách bảo mật</TypographySpan>
                    </Flex>
                  </Link>
                </Flex>
              </nav>
            </Flex>

            
          </Flex>
        </Grid>

        {/* Divider */}
        <Separator variant="gradientWhite" />

        {/* Bottom Footer */}
        <Flex
          direction="col"
          align="center"
          justify="between"
          gap={4}
          fullWidth
        >
          <Flex
            direction="col"
            align="center"
            gap={2}
            fullWidth
          >
            <TypographySpan>
              © {currentYear} {appConfig.namePublic}.
            </TypographySpan>
            <TypographySpan>
              Được phát triển bởi
            </TypographySpan>
            <TypographySpan>
              {appConfig.company}
            </TypographySpan>
            <TypographySpan>
              Trường Đại học Ngân hàng TP.Hồ Chí Minh
            </TypographySpan>
          </Flex>

          <Flex
            align="center"
            justify="center"
            gap={4}
            wrap
            fullWidth
          >
            <Link href={FOOTER_ROUTES.about}>
              <TypographySpan>Về chúng tôi</TypographySpan>
            </Link>
            <TypographySpanMuted>•</TypographySpanMuted>
            <Link href={FOOTER_ROUTES.contact}>
              <TypographySpan>Liên hệ</TypographySpan>
            </Link>
            <TypographySpanMuted>•</TypographySpanMuted>
            <Link href={FOOTER_ROUTES.help}>
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
