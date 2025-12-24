"use client"

import { IconSize, TypographyH3, TypographyPSmallMuted, TypographyTitleLarge, TypographyPSmall, TypographyPMuted } from "@/components/ui/typography"
import { Flex } from "@/components/ui/flex"

import { ContactForm } from "@/components/forms/contact-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Mail,
  Phone,
  MapPin,
  Clock,
} from "lucide-react"
import { Section } from "@/features/public/home/components/section"

export type ContactClientProps = Record<string, never>

export const ContactClient = ({ }: ContactClientProps) => {
  return (
    <Section padding="responsive-lg" background="bg-background">
      <Flex direction="col" gap={6} className="w-full lg:flex-row lg:gap-8">
        {/* Left Side - Contact Information - 1/3 */}
        <Flex direction="col" gap={6} className="w-full lg:w-1/3">
          <Flex direction="col" gap={4}>
            <TypographyH3>
              Tại sao chọn chúng tôi?
            </TypographyH3>
            <TypographyPSmallMuted>
              Chúng tôi cam kết mang đến trải nghiệm tốt nhất cho phụ huynh và sinh viên.
            </TypographyPSmallMuted>
          </Flex>

          {/* Contact Info Card */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle>
                <Flex align="center" gap={3}>
                  <Flex align="center" justify="center" className="w-10 h-10 rounded-lg bg-primary/10 shrink-0">
                    <IconSize size="md">
                      <Phone />
                    </IconSize>
                  </Flex>
                  <TypographyTitleLarge>Thông tin liên hệ</TypographyTitleLarge>
                </Flex>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Flex direction="col" gap={4}>
                <Flex align="start" gap={4} className="w-full">
                  <Flex align="center" justify="center" className="w-10 h-10 rounded-lg bg-muted/50 dark:bg-muted flex-shrink-0">
                    <IconSize size="md">
                      <Phone />
                    </IconSize>
                  </Flex>
                  <Flex direction="col" gap={1} className="flex-1 min-w-0">
                    <TypographyPSmall className="font-medium">Điện thoại</TypographyPSmall>
                    <TypographyPMuted className="break-words">(028) 38 212 430</TypographyPMuted>
                  </Flex>
                </Flex>

                <Flex align="start" gap={4} className="w-full">
                  <Flex align="center" justify="center" className="w-10 h-10 rounded-lg bg-muted/50 dark:bg-muted flex-shrink-0">
                    <IconSize size="md">
                      <Mail />
                    </IconSize>
                  </Flex>
                  <Flex direction="col" gap={1} className="flex-1 min-w-0">
                    <TypographyPSmall className="font-medium">Email</TypographyPSmall>
                    <TypographyPMuted className="break-words">dhnhtphcm@hub.edu.vn</TypographyPMuted>
                  </Flex>
                </Flex>

                <Flex align="start" gap={4} className="w-full">
                  <Flex align="center" justify="center" className="w-10 h-10 rounded-lg bg-muted/50 dark:bg-muted flex-shrink-0">
                    <IconSize size="md">
                      <MapPin />
                    </IconSize>
                  </Flex>
                  <Flex direction="col" gap={1} className="flex-1 min-w-0">
                    <TypographyPSmall className="font-medium">Địa chỉ</TypographyPSmall>
                    <TypographyPMuted className="break-words">
                      Trường Đại học Ngân hàng TP.HCM
                    </TypographyPMuted>
                  </Flex>
                </Flex>

                <Flex align="start" gap={4} className="w-full">
                  <Flex align="center" justify="center" className="w-10 h-10 rounded-lg bg-muted/50 dark:bg-muted flex-shrink-0">
                    <IconSize size="md">
                      <Clock />
                    </IconSize>
                  </Flex>
                  <Flex direction="col" gap={1} className="flex-1 min-w-0">
                    <TypographyPSmall className="font-medium">Giờ làm việc</TypographyPSmall>
                    <TypographyPMuted className="break-words">
                      Thứ 2 - Thứ 6: 7:30 - 17:00
                      <br />
                      Thứ 7: 7:30 - 12:00
                    </TypographyPMuted>
                  </Flex>
                </Flex>
              </Flex>
            </CardContent>
          </Card>
        </Flex>

        {/* Right Side - Contact Form - 2/3 */}
        <Flex direction="col" className="w-full lg:w-2/3">
          <ContactForm className="w-full" />
        </Flex>
      </Flex>
    </Section>
  )
}

