"use client";

import { useState, useEffect } from "react";
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
import {
  TypographyH3,
  TypographyH4,
  TypographyP,
  TypographySpan,
  TypographySpanMuted,
  TypographySpanWhite,
  IconSize,
  TypographyH5,
} from "@/components/ui/typography";
import { Logo } from "../../../public/svg/Logo";

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
      <Flex
        direction="col"
        position="relative"
        padding="responsive-lg"
        fullWidth
        bg="primary"
        margin="t-auto"
        overflow="hidden"
      >
        {/* Main Footer Content */}
        <Grid cols={3} gap={6} fullWidth>
          {/* Company Info - Takes 2 columns on large screens */}
          {/* Logo and Brand */}
          <Flex
            direction="col"
            align="start"
            justify="start"
            gap={4}
            className="min-w-0"
          >
            <Card className="w-full sm:w-fit p-2">
              <Flex
                align="center"
                justify="center"
                padding="md"
                gap={2}
                direction="row"
                className="flex-row w-full sm:w-fit"
              >
                <Logo className="h-16 w-16 sm:h-20 sm:w-20 text-blue-100 shrink-0" />
                <Flex
                  direction="col"
                  align="start"
                  justify="center"
                  className="items-center sm:items-start"
                >
                  <TypographyH3 className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-center sm:text-left break-words">
                    Trường Đại học Ngân hàng
                  </TypographyH3>
                  <TypographyH4 className="text-xs sm:text-xs md:text-sm lg:text-base text-center sm:text-left break-words">
                    Thành Phố Hồ Chí Minh
                  </TypographyH4>
                </Flex>
              </Flex>
            </Card>

            {/* Contact Information */}
            {/* Locations */}
            <Flex direction="col" gap={3} className="min-w-0 w-full">
              <Flex align="center" gap={2}>
                <IconSize size="md">
                  <Building2 />
                </IconSize>
                <TypographyH4 className="break-words">
                  Cơ sở đào tạo
                </TypographyH4>
              </Flex>
              <Flex direction="col" gap={1} className="min-w-0 w-full">
                <TypographyP className="break-words">Trụ sở chính</TypographyP>
                <Flex align="start" gap={3} className="min-w-0 w-full">
                  <IconSize size="sm" className="shrink-0">
                    <MapPin />
                  </IconSize>
                  <TypographyP className="break-words text-pretty min-w-0">
                    36 Tôn Thất Đạm, Phường Sài Gòn, TP.Hồ Chí Minh
                  </TypographyP>
                </Flex>
              </Flex>

              <Flex direction="col" gap={1} className="min-w-0 w-full">
                <TypographyP className="break-words">
                  Cơ sở Hàm Nghi
                </TypographyP>
                <Flex align="start" gap={3} className="min-w-0 w-full">
                  <IconSize size="sm" className="shrink-0">
                    <MapPin />
                  </IconSize>
                  <TypographyP className="break-words text-pretty min-w-0">
                    39 Hàm Nghi, Phường Sài Gòn, TP. Hồ Chí Minh
                  </TypographyP>
                </Flex>
              </Flex>

              <Flex direction="col" gap={1} className="min-w-0 w-full">
                <TypographyP className="break-words">
                  Cơ sở Hoàng Diệu
                </TypographyP>
                <Flex align="start" gap={3} className="min-w-0 w-full">
                  <IconSize size="sm" className="shrink-0">
                    <MapPin />
                  </IconSize>
                  <TypographyP className="break-words text-pretty min-w-0">
                    56 Hoàng Diệu 2, Phường Thủ Đức, TP. Hồ Chí Minh
                  </TypographyP>
                </Flex>
              </Flex>
            </Flex>
          </Flex>

          {/* Contact Details */}
          <Flex gap={2} className="min-w-0 flex-row sm:flex-col">
            <Flex direction="col" gap={2} className="min-w-0 w-full">
              <Flex align="center" gap={2} className="min-w-0 w-full">
                <GraduationCap />
                <TypographyH4 className="break-words">Liên hệ</TypographyH4>
              </Flex>
              <Flex direction="col" gap={3} className="min-w-0 w-full">
                <Link
                  href="mailto:dhnhtphcm@hub.edu.vn"
                  className="transition-all hover:opacity-80"
                >
                  <Flex align="start" gap={3}>
                    <Flex
                      align="center"
                      justify="center"
                      padding="sm"
                      shrink={false}
                      rounded="lg"
                      bg="white-10"
                      className="w-10 h-10 shrink-0"
                    >
                      <IconSize size="md">
                        <Mail />
                      </IconSize>
                    </Flex>
                    <Flex direction="col" gap={1} className="min-w-0">
                      <TypographyP className="break-words">Email</TypographyP>
                      <TypographyP className="break-words text-pretty">
                        dhnhtphcm@hub.edu.vn
                      </TypographyP>
                    </Flex>
                  </Flex>
                </Link>

                <Link
                  href="tel:0888353488"
                  className="transition-all hover:opacity-80"
                >
                  <Flex align="start" gap={3}>
                    <Flex
                      align="center"
                      justify="center"
                      padding="sm"
                      shrink={false}
                      rounded="lg"
                      bg="white-10"
                      className="w-10 h-10 shrink-0"
                    >
                      <IconSize size="md">
                        <Phone />
                      </IconSize>
                    </Flex>
                    <Flex direction="col" gap={1} className="min-w-0">
                      <TypographyP className="break-words">
                        Tuyển sinh
                      </TypographyP>
                      <TypographyP className="break-words text-pretty">
                        0888353488
                      </TypographyP>
                    </Flex>
                  </Flex>
                </Link>

                <Link
                  href="tel:02838212430"
                  className="transition-all hover:opacity-80"
                >
                  <Flex align="start" gap={3}>
                    <Flex
                      align="center"
                      justify="center"
                      padding="sm"
                      shrink={false}
                      rounded="lg"
                      bg="white-10"
                      className="w-10 h-10 shrink-0"
                    >
                      <IconSize size="md">
                        <Phone />
                      </IconSize>
                    </Flex>
                    <Flex direction="col" gap={1} className="min-w-0">
                      <TypographyP className="break-words">Đào tạo</TypographyP>
                      <TypographyP className="break-words text-pretty">
                        (028) 38 212 430
                      </TypographyP>
                    </Flex>
                  </Flex>
                </Link>
              </Flex>
            </Flex>
            {/* Social Media */}
            <Flex direction="col" gap={2} className="min-w-0 w-full">
              <Flex align="center" gap={2}>
                <TypographyH4 className="break-words">Kết nối</TypographyH4>
              </Flex>
              <Flex direction="row" align="center" gap={3} wrap>
                {appConfig.social.facebook && (
                  <Link
                    href={`https://facebook.com/${appConfig.social.facebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook - Trường Đại học Ngân hàng TP.HCM"
                    className="transition-all hover:scale-110 hover:opacity-80"
                  >
                    <Flex
                      align="center"
                      justify="center"
                      padding="sm"
                      rounded="lg"
                      bg="white-10"
                      shrink={false}
                      className="w-10 h-10"
                    >
                      <IconSize size="md" className="text-primary-foreground">
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
                    className="transition-all hover:scale-110 hover:opacity-80"
                  >
                    <Flex
                      align="center"
                      justify="center"
                      padding="sm"
                      rounded="lg"
                      bg="white-10"
                      shrink={false}
                      className="w-10 h-10"
                    >
                      <Twitter />
                    </Flex>
                  </Link>
                )}
                {appConfig.social.linkedin && (
                  <Link
                    href={`https://linkedin.com/company/${appConfig.social.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn - Trường Đại học Ngân hàng TP.HCM"
                    className="transition-all hover:scale-110 hover:opacity-80"
                  >
                    <Flex
                      align="center"
                      justify="center"
                      padding="sm"
                      rounded="lg"
                      bg="white-10"
                      shrink={false}
                      className="w-10 h-10"
                    >
                      <Linkedin />
                    </Flex>
                  </Link>
                )}
                <Link
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram - Trường Đại học Ngân hàng TP.HCM"
                  className="transition-all hover:scale-110 hover:opacity-80"
                >
                  <Flex
                    align="center"
                    justify="center"
                    padding="sm"
                    rounded="lg"
                    bg="white-10"
                    shrink={false}
                    className="w-10 h-10"
                  >
                    <Instagram />
                  </Flex>
                </Link>
                <Link
                  href={appConfig.social.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube - Trường Đại học Ngân hàng TP.HCM"
                  className="transition-all hover:scale-110 hover:opacity-80"
                >
                  <Flex
                    align="center"
                    justify="center"
                    padding="sm"
                    rounded="lg"
                    bg="white-10"
                    shrink={false}
                    className="w-10 h-10"
                  >
                    <Youtube />
                  </Flex>
                </Link>
              </Flex>
            </Flex>
          </Flex>

          {/* Quick Links & Social */}
          <Flex gap={2} className="min-w-0 flex-row sm:flex-col">
            {/* Quick Links */}
            <Flex direction="col" gap={3} className="min-w-0 w-full">
              <Flex align="center" gap={2}>
                <TypographyH4 className="break-words">
                  Liên kết nhanh
                </TypographyH4>
              </Flex>
              <nav>
                <Flex direction="col" gap={3}>
                  <Link href={FOOTER_ROUTES.home} prefetch={false}>
                    <Flex align="center" gap={2}>
                      <IconSize size="sm">
                        <ArrowRight />
                      </IconSize>
                      <TypographySpanWhite>Trang chủ</TypographySpanWhite>
                    </Flex>
                  </Link>
                  <Link href={FOOTER_ROUTES.blog} prefetch={false}>
                    <Flex align="center" gap={2}>
                      <IconSize size="sm">
                        <ArrowRight />
                      </IconSize>
                      <TypographySpanWhite>Blog</TypographySpanWhite>
                    </Flex>
                  </Link>
                  <Link href={FOOTER_ROUTES.categories} prefetch={false}>
                    <Flex align="center" gap={2}>
                      <IconSize size="sm">
                        <ArrowRight />
                      </IconSize>
                      <TypographySpanWhite>Danh mục</TypographySpanWhite>
                    </Flex>
                  </Link>
                </Flex>
              </nav>
            </Flex>

            {/* Resources */}
            <Flex direction="col" gap={2} className="min-w-0 w-full">
              <Flex align="center" gap={2}>
                <TypographyH4 className="break-words">Tài nguyên</TypographyH4>
              </Flex>
              <nav>
                <Flex direction="col" gap={3}>
                  <Link href={FOOTER_ROUTES.admin} prefetch={false}>
                    <Flex align="center" gap={2}>
                      <IconSize size="sm">
                        <ArrowRight />
                      </IconSize>
                      <TypographySpanWhite>Quản trị</TypographySpanWhite>
                    </Flex>
                  </Link>
                  <Link href="#">
                    <Flex align="center" gap={2}>
                      <IconSize size="sm">
                        <ArrowRight />
                      </IconSize>
                      <TypographySpanWhite>
                        Hướng dẫn sử dụng
                      </TypographySpanWhite>
                    </Flex>
                  </Link>
                  <Link href="#">
                    <Flex align="center" gap={2}>
                      <IconSize size="sm">
                        <ArrowRight />
                      </IconSize>
                      <TypographySpanWhite>
                        Điều khoản dịch vụ
                      </TypographySpanWhite>
                    </Flex>
                  </Link>
                  <Link href="#">
                    <Flex align="center" gap={2}>
                      <IconSize size="sm">
                        <ArrowRight />
                      </IconSize>
                      <TypographySpanWhite>
                        Chính sách bảo mật
                      </TypographySpanWhite>
                    </Flex>
                  </Link>
                </Flex>
              </nav>
            </Flex>
          </Flex>
        </Grid>

        {/* Divider */}
        <Separator variant="gradientWhite" margin="y-4" />

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
            className="min-w-0"
          >
            <TypographySpan className="break-words text-center text-pretty px-4" suppressHydrationWarning>
              © {currentYear} {appConfig.namePublic}. Được phát triển bởi {appConfig.company} Trường Đại học Ngân hàng TP.Hồ Chí Minh
            </TypographySpan>
          </Flex>

          <Flex align="center" justify="center" gap={4} wrap fullWidth>
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
