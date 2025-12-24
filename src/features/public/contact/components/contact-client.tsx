"use client"

import { IconSize, TypographyTitleLarge, TypographyTitleSmall, TypographyPSmall, TypographyPMuted } from "@/components/ui/typography"
import { Flex } from "@/components/ui/flex"
import { Grid } from "@/components/ui/grid"

import { ContactForm } from "@/components/forms/contact-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Mail,
  Phone,
  GraduationCap,
  MapPin,
  Clock,
} from "lucide-react"

export type ContactClientProps = Record<string, never>

export const ContactClient = ({ }: ContactClientProps) => {
  return (
    <Flex className="relative isolate bg-background">
      {/* Main Content */}
      <Flex direction="col" className="py-6">
        <Flex className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Grid cols={3} gap={8} className="lg:gap-12">
            {/* Left Side - Contact Information */}
            <Flex direction="col" gap={6}>
              <Card className="border-border">
                <CardHeader>
                  <CardTitle>
                    <Flex align="center" gap={3}>
                      <Flex align="center" justify="center" className="w-10 h-10 rounded-lg bg-primary/10">
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
                    <Flex align="start" gap={4}>
                      <Flex align="center" justify="center" className="w-10 h-10 rounded-lg bg-muted/50 dark:bg-muted flex-shrink-0">
                        <IconSize size="md">
                          <Phone />
                        </IconSize>
                      </Flex>
                      <Flex direction="col" gap={1}>
                        <TypographyPSmall>Điện thoại</TypographyPSmall>
                        <TypographyPMuted>(028) 38 212 430</TypographyPMuted>
                      </Flex>
                    </Flex>

                    <Flex align="start" gap={4}>
                      <Flex align="center" justify="center" className="w-10 h-10 rounded-lg bg-muted/50 dark:bg-muted flex-shrink-0">
                        <IconSize size="md">
                          <Mail />
                        </IconSize>
                      </Flex>
                      <Flex direction="col" gap={1}>
                        <TypographyPSmall>Email</TypographyPSmall>
                        <TypographyPMuted>dhnhtphcm@hub.edu.vn</TypographyPMuted>
                      </Flex>
                    </Flex>

                    <Flex align="start" gap={4}>
                      <Flex align="center" justify="center" className="w-10 h-10 rounded-lg bg-muted/50 dark:bg-muted flex-shrink-0">
                        <IconSize size="md">
                          <MapPin />
                        </IconSize>
                      </Flex>
                      <Flex direction="col" gap={1}>
                        <TypographyPSmall>Địa chỉ</TypographyPSmall>
                        <TypographyPMuted>
                          Trường Đại học Ngân hàng TP.HCM
                        </TypographyPMuted>
                      </Flex>
                    </Flex>

                    <Flex align="start" gap={4}>
                      <Flex align="center" justify="center" className="w-10 h-10 rounded-lg bg-muted/50 dark:bg-muted flex-shrink-0">
                        <IconSize size="md">
                          <Clock />
                        </IconSize>
                      </Flex>
                      <Flex direction="col" gap={1}>
                        <TypographyPSmall>Giờ làm việc</TypographyPSmall>
                        <TypographyPMuted>
                          Thứ 2 - Thứ 6: 7:30 - 17:00
                          <br />
                          Thứ 7: 7:30 - 12:00
                        </TypographyPMuted>
                      </Flex>
                    </Flex>
                  </Flex>
                </CardContent>
              </Card>

              <Card className="border-border bg-muted/30">
                <CardHeader>
                  <CardTitle>
                    <Flex align="center" gap={2}>
                      <IconSize size="md">
                        <GraduationCap />
                      </IconSize>
                      <TypographyTitleSmall>Về chúng tôi</TypographyTitleSmall>
                    </Flex>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Trường Đại học Ngân hàng TP.HCM cam kết mang đến dịch vụ tốt nhất cho
                    phụ huynh và sinh viên. Chúng tôi luôn sẵn sàng hỗ trợ và giải đáp mọi thắc mắc.
                  </CardDescription>
                </CardContent>
              </Card>
            </Flex>

            {/* Right Side - Contact Form */}
            <Flex>
              <ContactForm />
            </Flex>
          </Grid>
        </Flex>
      </Flex>
    </Flex>
  )
}

