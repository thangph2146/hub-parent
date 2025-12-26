"use client"

import { IconSize } from "@/components/ui/typography"
import { TypographyDescriptionSmall, TypographyH1 } from "@/components/ui/typography"
import { Flex } from "@/components/ui/flex"

/**
 * Guide Client Component
 * Hiển thị hướng dẫn sử dụng hệ thống với hình ảnh minh họa
 */

import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  UserPlus,
  LogIn,
  Download,
  LayoutDashboard,
  BarChart3,
  Users,
  FileEdit,
  Eye,
  Bell,
  User,
  BellRing,
  FileText,
  MessageSquare,
} from "lucide-react"

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
  const handleDownload = (imagePath: string, title: string) => {
    const link = document.createElement("a")
    link.href = imagePath
    link.download = `${title.replace(/\s+/g, "-").toLowerCase()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Nhóm các hướng dẫn theo category
  const groupedGuides = guideImages.reduce((acc, guide) => {
    const category = guide.category || "Khác"
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(guide)
    return acc
  }, {} as Record<string, typeof guideImages>)

  const categories = Object.keys(groupedGuides)
  const defaultCategory = categories[0] || ""

  return (
    <Flex direction="col" className="container mx-auto px-4 py-6">
      {/* Header */}
      <Flex direction="col" gap={2} className="mb-6">
        <TypographyH1>Hướng dẫn Sử dụng Hệ thống</TypographyH1>
        <TypographyDescriptionSmall>
          Khám phá các tính năng và cách sử dụng hệ thống
        </TypographyDescriptionSmall>
      </Flex>

      {/* Tabs Navigation */}
      <Tabs defaultValue={defaultCategory} className="w-full">
        <TabsList className="sticky top-[60px] z-10 w-full mb-6 overflow-x-auto flex-wrap h-auto backdrop-blur supports-[backdrop-filter]:bg-primary/20">
          {categories.map((category) => (
            <TabsTrigger key={category} value={category} className="whitespace-nowrap">
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Guide Cards by Category */}
        {categories.map((category) => (
          <TabsContent key={category} value={category}>
            <Flex direction="col" gap={4}>
            {groupedGuides[category].map((guide) => {
              const Icon = guide.icon
              return (
                <Card key={guide.id} className="border">
                  <CardHeader className="pb-3">
                    <Flex align="center" gap={3}>
                      <IconSize size="md">
                        <Icon />
                      </IconSize>
                      <Flex direction="col" gap={1}>
                        <CardTitle>{guide.title}</CardTitle>
                        <CardDescription>
                          {guide.description}
                        </CardDescription>
                      </Flex>
                    </Flex>
                  </CardHeader>
                  <CardContent>
                    <Flex direction="col" gap={3}>
                    {/* Image Preview */}
                    <div className="relative w-full aspect-video rounded border bg-muted overflow-hidden">
                      <Image
                        src={guide.imagePath}
                        alt={guide.title}
                        fill
                        className="object-contain p-2"
                        sizes="100vw"
                      />
                    </div>

                    {/* Action Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleDownload(guide.imagePath, guide.title)}
                    >
                      <Flex align="center" gap={2}>
                        <IconSize size="sm">
                          <Download />
                        </IconSize>
                        <span>Tải xuống</span>
                      </Flex>
                    </Button>
                    </Flex>
                  </CardContent>
                </Card>
              )
            })}
            </Flex>
          </TabsContent>
        ))}
      </Tabs>

      {/* Additional Info */}
      <Flex direction="col" align="center" gap={4} className="text-center border-t pt-4 mt-6">
        <p>Cần hỗ trợ thêm? Vui lòng liên hệ với chúng tôi</p>
        <Flex wrap={true} align="center" justify="center" gap={4}>
          <span>📧 Email: support@hub.edu.vn</span>
          <span>📞 Hotline: 1900-xxxx</span>
        </Flex>
      </Flex>
    </Flex>
  )
}
