"use client"

import { TypographyH1, TypographyH2, TypographyPSmallMuted, TypographyTitleLarge, TypographyPSmall, TypographyPMuted } from "@/components/ui/typography"
import { Flex } from "@/components/ui/flex"

import { ContactForm } from "./contact-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Mail,
  Phone,
  MapPin,
  Clock,
} from "lucide-react"
import { Section } from "@/components/ui/section"

export type ContactClientProps = Record<string, never>

export const ContactClient = ({ }: ContactClientProps) => {
  return (
    <Section padding="responsive-lg" background="background" className="relative min-h-[calc(100vh-64px)] overflow-hidden">
      <div className="sr-only">
        <TypographyH1>Liên hệ với HUB - Trường Đại học Ngân hàng TP.HCM</TypographyH1>
      </div>
      <div className="relative z-10 container mx-auto">
        <Flex direction="col" gap={6} className="w-full lg:flex-row lg:gap-8 items-stretch">
          {/* Left Side - Contact Information */}
          <Flex direction="col" gap={6} className="w-full lg:w-1/3">
            <Card className="w-full h-full border-0 shadow-lg bg-white/80 dark:bg-card/50 backdrop-blur-md overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />

              <CardHeader className="pb-6 relative">
                <CardTitle>
                  <Flex align="center" gap={3}>
                    <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                      <Phone className="w-6 h-6" />
                    </div>
                    <div>
                      <TypographyTitleLarge className="text-xl">Thông tin liên hệ</TypographyTitleLarge>
                      <TypographyPSmallMuted className="text-xs font-normal mt-0.5">Kênh hỗ trợ chính thức</TypographyPSmallMuted>
                    </div>
                  </Flex>
                </CardTitle>
              </CardHeader>

              <CardContent className="relative">
                <Flex direction="col" gap={6}>
                  <div className="group flex items-start gap-4 p-3 rounded-xl hover:bg-primary/5 transition-colors duration-300">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <TypographyPSmall className="font-semibold text-foreground/80 mb-0.5">Điện thoại</TypographyPSmall>
                      <a 
                        href="tel:02838212430" 
                        className="text-base font-medium text-foreground hover:text-primary transition-colors cursor-pointer"
                        aria-label="Gọi điện thoại cho HUB: (028) 38 212 430"
                      >
                        (028) 38 212 430
                      </a>
                    </div>
                  </div>

                  <div className="group flex items-start gap-4 p-3 rounded-xl hover:bg-primary/5 transition-colors duration-300">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <TypographyPSmall className="font-semibold text-foreground/80 mb-0.5">Email</TypographyPSmall>
                      <a 
                        href="mailto:dhnhtphcm@hub.edu.vn" 
                        className="text-base font-medium text-foreground hover:text-primary transition-colors cursor-pointer break-words"
                        aria-label="Gửi email cho HUB: dhnhtphcm@hub.edu.vn"
                      >
                        dhnhtphcm@hub.edu.vn
                      </a>
                    </div>
                  </div>

                  <div className="group flex items-start gap-4 p-3 rounded-xl hover:bg-primary/5 transition-colors duration-300">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <TypographyPSmall className="font-semibold text-foreground/80 mb-0.5">Địa chỉ</TypographyPSmall>
                      <TypographyPMuted className="text-base font-medium text-foreground">
                        Trường Đại học Ngân hàng TP.HCM
                      </TypographyPMuted>
                    </div>
                  </div>

                  <div className="group flex items-start gap-4 p-3 rounded-xl hover:bg-primary/5 transition-colors duration-300">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <TypographyPSmall className="font-semibold text-foreground/80 mb-0.5">Giờ làm việc</TypographyPSmall>
                      <TypographyPMuted className="text-sm font-medium text-foreground leading-relaxed">
                        Thứ 2 - Thứ 6: 7:30 - 17:00<br />
                        Thứ 7: 7:30 - 12:00
                      </TypographyPMuted>
                    </div>
                  </div>
                </Flex>
              </CardContent>
            </Card>
          </Flex>

          {/* Right Side - Contact Form */}
          <Flex direction="col" className="w-full lg:w-2/3">
            <Card className="w-full h-full border-0 shadow-lg bg-white/80 dark:bg-card/50 backdrop-blur-md overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-bl from-blue-500/5 to-transparent pointer-events-none" />
              <CardContent className="h-full p-6 lg:p-8 relative">
                <Flex direction="col" gap={6} className="h-full">
                  <div>
                    <TypographyH2 className="text-xl font-bold">Gửi tin nhắn</TypographyH2>
                    <TypographyPMuted>Điền vào biểu mẫu bên dưới, chúng tôi sẽ liên hệ lại với bạn.</TypographyPMuted>
                  </div>
                  <div className="flex-1">
                    <ContactForm className="w-full" />
                  </div>
                </Flex>
              </CardContent>
            </Card>
          </Flex>
        </Flex>
      </div>
    </Section>
  )
}

