"use client"

import { useState } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import {
  Download,
  UserPlus,
  LogIn,
  LayoutDashboard,
  BarChart3,
  Users,
  Eye,
  FileEdit,
  Bell,
  BellRing,
  FileText,
  User,
  MessageSquare,
  ChevronRight,
} from "lucide-react"

import { TypographyH3, TypographyPSmallMuted } from "@/components/ui/typography"
import { Flex } from "@/components/ui/flex"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

const guideImages = [
  // Đăng nhập & Đăng ký
  {
    id: "dang-ky",
    title: "Hướng dẫn Đăng ký Hệ thống",
    description: "Các bước chi tiết để đăng ký tài khoản mới trên hệ thống",
    imagePath: "/huong-dan-su-dung/dang-ky-he-thong.png",
    icon: UserPlus,
    category: "Đăng nhập & Đăng ký",
  },
  {
    id: "dang-nhap",
    title: "Hướng dẫn Đăng nhập Hệ thống",
    description: "Cách đăng nhập vào hệ thống và quản lý tài khoản",
    imagePath: "/huong-dan-su-dung/dang-nhap-he-thong.png",
    icon: LogIn,
    category: "Đăng nhập & Đăng ký",
  },
  // Dashboard
  {
    id: "dashboard",
    title: "Dashboard Hệ thống",
    description: "Tổng quan về giao diện dashboard và các tính năng chính",
    imagePath: "/huong-dan-su-dung/dashboard-he-thong.png",
    icon: LayoutDashboard,
    category: "Dashboard",
  },
  {
    id: "dashboard-thong-ke",
    title: "Dashboard Thống kê Hệ thống",
    description: "Xem các thống kê và báo cáo tổng quan về hệ thống",
    imagePath: "/huong-dan-su-dung/dashboard-thong-ke-he-thong.png",
    icon: BarChart3,
    category: "Dashboard",
  },
  // Quản lý Student
  {
    id: "quan-ly-student",
    title: "Quản lý Student",
    description: "Hướng dẫn quản lý danh sách sinh viên trong hệ thống",
    imagePath: "/huong-dan-su-dung/quan-ly-student.png",
    icon: Users,
    category: "Quản lý Student",
  },
  {
    id: "quan-ly-student-chi-tiet",
    title: "Chi tiết Student",
    description: "Xem thông tin chi tiết của một sinh viên",
    imagePath: "/huong-dan-su-dung/quan-ly-student-chi-tiet.png",
    icon: Eye,
    category: "Quản lý Student",
  },
  {
    id: "quan-ly-student-chinh-sua",
    title: "Chỉnh sửa Student",
    description: "Cách chỉnh sửa thông tin sinh viên trong hệ thống",
    imagePath: "/huong-dan-su-dung/quan-ly-student-chinh-sua.png",
    icon: FileEdit,
    category: "Quản lý Student",
  },
  // Thông báo
  {
    id: "thong-bao-realtime",
    title: "Thông báo Realtime Hệ thống",
    description: "Nhận và quản lý thông báo realtime từ hệ thống",
    imagePath: "/huong-dan-su-dung/thong-bao-realtime-he-thong.png",
    icon: Bell,
    category: "Thông báo",
  },
  {
    id: "quan-ly-thong-bao",
    title: "Quản lý Thông báo",
    description: "Xem danh sách và quản lý tất cả thông báo trong hệ thống",
    imagePath: "/huong-dan-su-dung/quan-ly-thong-bao.png",
    icon: BellRing,
    category: "Thông báo",
  },
  {
    id: "quan-ly-thong-bao-chi-tiet",
    title: "Chi tiết Thông báo",
    description: "Xem nội dung chi tiết của một thông báo cụ thể",
    imagePath: "/huong-dan-su-dung/quan-ly-thong-bao-chi-tiet.png",
    icon: FileText,
    category: "Thông báo",
  },
  // Quản lý Tài khoản
  {
    id: "quan-ly-thong-tin-ca-nhan",
    title: "Quản lý Thông tin Cá nhân",
    description: "Cập nhật và quản lý thông tin cá nhân của bạn trong hệ thống",
    imagePath: "/huong-dan-su-dung/quan-ly-thong-tin-ca-nhan.png",
    icon: User,
    category: "Quản lý Tài khoản",
  },
  // Tin nhắn
  {
    id: "quan-ly-tin-nhan-realtime",
    title: "Quản lý Tin nhắn Realtime",
    description: "Gửi và nhận tin nhắn realtime trong hệ thống",
    imagePath: "/huong-dan-su-dung/quan-ly-tin-nhan-realtime.png",
    icon: MessageSquare,
    category: "Tin nhắn",
  },
]

export const GuideClient = () => {
  const [activeCategory, setActiveCategory] = useState("Đăng nhập & Đăng ký")

  const handleDownload = (imagePath: string, title: string) => {
    const link = document.createElement("a")
    link.href = imagePath
    link.download = `${title.replace(/\s+/g, "-").toLowerCase()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Group guides by category
  const groupedGuides = guideImages.reduce((acc, guide) => {
    const category = guide.category || "Khác"
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(guide)
    return acc
  }, {} as Record<string, typeof guideImages>)

  const categories = Object.keys(groupedGuides)

  // Filter guides based on active category
  const filteredGuides = activeCategory
    ? groupedGuides[activeCategory]
    : []

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 lg:py-12">
        <Flex className="flex-col lg:flex-row gap-8 lg:gap-12 items-start">

          {/* Sidebar Navigation - Desktop */}
          <aside className="hidden lg:block w-72 sticky top-24 shrink-0">
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <TypographyH3 className="mb-4 px-2 text-lg font-semibold">Danh mục</TypographyH3>
              <nav className="flex flex-col gap-1">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={cn(
                      "flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                      activeCategory === category
                        ? "bg-primary/10 text-primary shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <span className="truncate">{category}</span>
                    {activeCategory === category && (
                      <ChevronRight className="h-4 w-4 opacity-50" />
                    )}
                  </button>
                ))}
              </nav>
            </div>

            <div className="mt-6 rounded-xl bg-gradient-to-br from-primary/5 to-blue-500/5 border p-4">
              <Flex gap={3} align="start">
                <div className="mt-1 h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div>
                  <TypographyPSmallMuted className="font-semibold text-foreground mb-1">Cần hỗ trợ thêm?</TypographyPSmallMuted>
                  <TypographyPSmallMuted className="text-xs mb-2">Đội ngũ kỹ thuật luôn sẵn sàng hỗ trợ bạn.</TypographyPSmallMuted>
                  <Button variant="link" className="h-auto p-0 text-primary text-xs" asChild>
                    <a href="mailto:support@hub.edu.vn">Liên hệ ngay &rarr;</a>
                  </Button>
                </div>
              </Flex>
            </div>
          </aside>

          {/* Mobile Navigation */}
          <div className="lg:hidden w-full sticky top-[56px] z-20 bg-background/95 backdrop-blur pb-2 -mt-4 pt-4 border-b">
            <ScrollArea className="w-full whitespace-nowrap">
              <Flex className="pb-2 px-1" gap={2}>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                      activeCategory === category
                        ? "bg-primary text-primary-foreground border-primary shadow-md"
                        : "bg-background text-muted-foreground border-border hover:bg-muted"
                    )}
                  >
                    {category}
                  </button>
                ))}
              </Flex>
              <ScrollBar orientation="horizontal" className="h-1.5" />
            </ScrollArea>
          </div>

          {/* Main Content */}
          <main className="flex-1 w-full min-w-0">
            <div className="mb-6 flex items-center justify-between">
              <TypographyH3 className="text-2xl font-bold text-foreground">
                {activeCategory}
              </TypographyH3>
              <span className="text-sm text-muted-foreground">
                {filteredGuides.length} bài viết
              </span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="grid gap-6"
              >
                {filteredGuides.map((guide, index) => {
                  const Icon = guide.icon
                  return (
                    <motion.div
                      key={guide.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="h-full p-0 border-0 shadow-md bg-white/50 dark:bg-card/40 backdrop-blur-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group overflow-hidden flex flex-col">
                        <div className="relative aspect-video w-full overflow-hidden bg-muted">
                          <Image
                            src={guide.imagePath}
                            alt={guide.title}
                            fill
                            className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                        </div>

                        <CardContent className="flex flex-col flex-1 p-5">
                          <Flex align="center" gap={3} className="mb-3">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                              <Icon size={16} />
                            </div>
                            <div className="text-xs font-medium text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
                              {guide.category}
                            </div>
                          </Flex>

                          <h3 className="font-bold text-lg leading-tight mb-2 group-hover:text-primary transition-colors">
                            {guide.title}
                          </h3>

                          <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">
                            {guide.description}
                          </p>

                          <Button
                            className="w-full bg-background hover:bg-primary hover:text-primary-foreground text-foreground border border-input shadow-sm transition-all"
                            variant="outline"
                            onClick={() => handleDownload(guide.imagePath, guide.title)}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Tải tài liệu
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </motion.div>
            </AnimatePresence>

            {filteredGuides.length === 0 && (
              <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed">
                <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-foreground">Không có hướng dẫn</h3>
                <p className="text-muted-foreground">Chưa có hướng dẫn nào trong danh mục này.</p>
              </div>
            )}
          </main>
        </Flex>
      </div>
    </div>
  )
}
