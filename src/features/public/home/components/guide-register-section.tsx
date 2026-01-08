"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Flex } from "@/components/ui/flex";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TypographySpanSmall } from "@/components/ui/typography";
import Link from "next/link";
import { useSectionHeight } from "@/hooks/use-section-height";
import { useClientOnly } from "@/hooks/use-client-only";
import { cn } from "@/lib/utils";
import { HOME_ROUTES, HOME_RESPONSIVE_CONDITIONS } from "../constants";

const DEFAULT_IMAGE_HEIGHT = "h-[200px] sm:h-[250px] lg:h-[350px] xl:h-[400px]";

const GUIDE_DATA = {
  title: "Hướng dẫn Phụ huynh",
  description: "Tài liệu và hướng dẫn chi tiết giúp Quý phụ huynh dễ dàng tiếp cận và sử dụng các tiện ích của hệ thống.",
  image: {
    src: "https://fileserver2.hub.edu.vn/IMAGES/2024/12/31/20241231170332vehub.jpg",
    alt: "Hướng dẫn cho phụ huynh",
  },
  button: {
    href: HOME_ROUTES.help,
    text: "Xem hướng dẫn",
    variant: "outline" as const,
  },
} as const;

const REGISTER_DATA = {
  title: "Đăng ký nhận tin",
  description: "Để lại thông tin để nhận các bản tin quan trọng, thông báo sự kiện và hoạt động của trường sớm nhất.",
  image: {
    src: "https://hub.edu.vn/DATA/IMAGES/2025/06/06/20250606095214z6676928339374_824596735893cad9e9d4402075fcccd2.jpg",
    alt: "Đăng ký nhận tin tức",
  },
  button: {
    href: HOME_ROUTES.signUp,
    text: "Đăng ký ngay",
    variant: "default" as const,
  },
} as const;

interface CardWithImageProps {
  title: string;
  description: string;
  image: { src: string; alt: string };
  button?: { href: string; text: string; variant: "default" | "outline" };
  reverse?: boolean;
}

const CardWithImage = ({ title, description, image, button, reverse = false }: CardWithImageProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="h-full"
    >
      <Flex direction="col" align="center" fullWidth gap={6} className={cn("lg:flex-row lg:gap-8 h-full", reverse && "lg:flex-row-reverse")}>
        <motion.div
          className="flex-1 lg:max-w-lg xl:max-w-xl w-full group/card"
          initial={{ opacity: 0, x: reverse ? 30 : -30 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="relative p-[1px] rounded-xl bg-gradient-to-br from-primary/20 via-border to-primary/10 group-hover/card:from-primary/40 group-hover/card:to-primary/20 transition-all duration-300">
            <Card className="border-0 shadow-lg bg-background/95 backdrop-blur-sm group-hover/card:shadow-xl transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl md:text-2xl leading-tight">{title}</CardTitle>
                <CardDescription className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">{description}</CardDescription>
              </CardHeader>
              {button && (
                <CardContent>
                  <Button variant={button.variant} size="sm" className="hover:scale-[1.02] w-full sm:w-auto" asChild>
                    <Link href={button.href}>
                      <Flex align="center" gap={2}>
                        <TypographySpanSmall>{button.text}</TypographySpanSmall>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                      </Flex>
                    </Link>
                  </Button>
                </CardContent>
              )}
            </Card>
          </div>
        </motion.div>

        <motion.div
          className={cn("relative overflow-hidden w-full lg:flex-1 rounded-xl shadow-xl group", DEFAULT_IMAGE_HEIGHT)}
          initial={{ opacity: 0, x: reverse ? -30 : 30 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
          whileHover={{ scale: 1.02 }}
        >
          <Image
            src={image.src}
            alt={image.alt}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 1024px) 100vw, 50vw"
            quality={75}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.div>
      </Flex>
    </motion.div>
  );
};

export const GuideRegisterSection = ({ className }: { className?: string }) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isMounted = useClientOnly();

  const { sectionHeightClassName, sectionHeightStyle } = useSectionHeight({
    minHeight: 0,
    fullHeight: isMounted && HOME_RESPONSIVE_CONDITIONS.isDesktop(window.innerWidth),
  });

  return (
    <Flex
      as="section"
      ref={sectionRef}
      fullWidth
      container
      direction="col"
      align="center"
      justify="center"
      bg="background"
      className={cn(sectionHeightClassName, "px-4 sm:px-8 md:px-12 py-8 sm:py-12 md:py-16 lg:py-20", className)}
      style={sectionHeightStyle}
    >
      <div className="grid xl:grid-cols-2 gap-8 items-stretch w-full">
        <CardWithImage {...GUIDE_DATA} />
        <CardWithImage {...REGISTER_DATA} reverse />
      </div>
    </Flex>
  );
};
