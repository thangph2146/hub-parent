/**
 * AlreadyAuthenticatedNotice Component
 * 
 * Component để hiển thị thông báo khi người dùng đã đăng nhập nhưng truy cập auth routes
 * Với các tùy chọn quay lại hoặc đi đến trang quản trị
 */

"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle2, ArrowLeft, LayoutDashboard } from "lucide-react"
import { motion } from "framer-motion"
import { typography, headerConfig } from "@/lib/typography"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface AlreadyAuthenticatedNoticeProps {
  adminUrl?: string
}

const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1] as const,
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15,
    },
  },
}

const iconVariants = {
  hidden: { opacity: 0, scale: 0, rotate: -180 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring" as const,
      stiffness: 200,
      damping: 15,
      delay: 0.2,
    },
  },
}

export function AlreadyAuthenticatedNotice({ adminUrl = "/admin/dashboard" }: AlreadyAuthenticatedNoticeProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleGoBack = () => {
    // Ưu tiên sử dụng callbackUrl từ query parameters
    const callbackUrl = searchParams?.get("callbackUrl")
    if (callbackUrl) {
      try {
        const decodedUrl = decodeURIComponent(callbackUrl)
        router.push(decodedUrl)
        return
      } catch (error) {
        // Nếu decode thất bại, fallback về logic cũ
        console.error("Failed to decode callbackUrl:", error)
      }
    }

    // Fallback: quay lại trang trước hoặc điều hướng đến adminUrl
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back()
    } else {
      router.push(adminUrl)
    }
  }

  const handleGoToAdmin = () => {
    router.push(adminUrl)
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4 md:p-6 lg:p-8 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-lg"
      >
        <Card className="relative overflow-hidden border-green-500/20 bg-gradient-to-br from-background via-background/98 to-background/95 shadow-2xl shadow-green-500/5 backdrop-blur-sm">
          {/* Decorative gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-green-500/5 pointer-events-none" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

          <CardContent className="relative pt-16 pb-10 px-6 md:px-10">
            <div className="flex flex-col items-center text-center space-y-8">
              {/* Animated Icon */}
              <motion.div variants={iconVariants} className="relative">
                {/* Outer pulsing ring */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.1, 0.3],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <div className="absolute inset-0 rounded-full bg-green-500/20" />
                </motion.div>

                {/* Middle ring */}
                <div className="absolute inset-0 rounded-full bg-green-500/10 animate-pulse" />

                {/* Icon container */}
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-green-500/20 via-green-500/10 to-green-500/5 border-2 border-green-500/30 shadow-lg shadow-green-500/20">
                  <motion.div
                    animate={{
                      rotate: [0, -10, 10, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 1,
                    }}
                  >
                    <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-500" strokeWidth={2.5} />
                  </motion.div>
                  
                  {/* Dashboard icon overlay */}
                  <motion.div
                    className="absolute -bottom-1 -right-1"
                    animate={{
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                    }}
                  >
                    <div className="rounded-full bg-background border-2 border-green-500/30 p-1.5 shadow-md">
                      <LayoutDashboard className="h-4 w-4 text-green-600 dark:text-green-500" strokeWidth={2} />
                    </div>
                  </motion.div>
                </div>
              </motion.div>

              {/* Title và Message */}
              <motion.div variants={itemVariants} className="space-y-4">
                <h1 className={`${headerConfig.main.className} tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text`}>
                  Đã đăng nhập
                </h1>
                <p className={`${typography.body.muted.medium} max-w-md leading-relaxed mx-auto`}>
                  Bạn đã đăng nhập. Vui lòng quay lại trang trước hoặc đi đến trang quản trị.
                </p>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                variants={itemVariants}
                className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto pt-2"
              >
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="outline"
                    onClick={handleGoBack}
                    className="w-full sm:w-auto min-w-[160px] h-11 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Quay lại
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="default"
                    onClick={handleGoToAdmin}
                    className="w-full sm:w-auto min-w-[160px] h-11 shadow-md hover:shadow-lg transition-shadow bg-green-600 hover:bg-green-700 text-white"
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Trang quản trị
                  </Button>
                </motion.div>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

