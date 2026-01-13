"use client";

import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { TypographyH1, TypographyDescriptionLarge, TypographyPSmallMuted, TypographyPMuted, TypographySpanSmall, IconSize } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";

/**
 * Global Error Boundary Component
 *
 * Theo Next.js 16 conventions:
 * - File global-error.tsx được đặt ở app directory để handle errors toàn cục
 * - Phải là Client Component ("use client")
 * - Phải include <html> và <body> tags vì nó wrap toàn bộ app
 * - Chỉ được đặt ở root layout level
 * - Tắt static generation để tránh lỗi build
 *
 * Xem thêm: https://nextjs.org/docs/app/api-reference/file-conventions/error
 */

// Tắt static generation cho global error page
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'
export const fetchCache = 'force-no-store'

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
    },
  },
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-background via-muted/20 to-background">
          <motion.div
            className="w-full"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="rounded-xl border border-destructive/50 bg-card shadow-lg p-6 md:p-8">
              {/* Icon */}
              <motion.div
                variants={itemVariants}
                className="flex justify-center mb-6"
              >
                <div className="rounded-full bg-destructive/10 p-4">
                  <IconSize size="3xl" className="text-destructive">
                    <AlertTriangle />
                  </IconSize>
                </div>
              </motion.div>

              {/* Title & Description */}
              <motion.div
                variants={itemVariants}
                className="text-center space-y-3 mb-6"
              >
                <TypographyH1>
                  Đã xảy ra lỗi nghiêm trọng
                </TypographyH1>
                <TypographyDescriptionLarge>
                  {error.message || "Đã xảy ra lỗi không mong muốn"}
                </TypographyDescriptionLarge>
              </motion.div>

              {/* Error Details */}
              {error.digest && (
                <motion.div
                  variants={itemVariants}
                  className="rounded-lg bg-muted p-4 border mb-6"
                >
                  <TypographyPSmallMuted className="font-mono text-center">
                    <TypographySpanSmall>Error ID:</TypographySpanSmall>{" "}
                    {error.digest}
                  </TypographyPSmallMuted>
                </motion.div>
              )}

              {/* Help Text */}
              <motion.div
                variants={itemVariants}
                className="rounded-lg bg-muted p-4 border border-destructive/20 mb-6"
              >
                <TypographyPMuted className="text-center">
                  Đã xảy ra lỗi nghiêm trọng trong ứng dụng. Vui lòng thử lại
                  hoặc quay về trang chủ. Nếu vấn đề vẫn tiếp tục, vui lòng liên
                  hệ với bộ phận hỗ trợ kỹ thuật.
                </TypographyPMuted>
              </motion.div>

              {/* Actions */}
              <motion.div
                variants={itemVariants}
                className="flex flex-col sm:flex-row gap-3 justify-center"
              >
                <Button
                  onClick={reset}
                  size="lg"
                  className="w-full sm:w-auto"
                  variant="default"
                >
                  <IconSize size="sm" className="mr-2">
                    <RefreshCw />
                  </IconSize>
                  Thử lại
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <Link href="/">
                    <IconSize size="sm" className="mr-2">
                      <Home />
                    </IconSize>
                    Về trang chủ
                  </Link>
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </body>
    </html>
  );
}
