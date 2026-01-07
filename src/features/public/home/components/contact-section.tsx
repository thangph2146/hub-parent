"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Flex } from "@/components/ui/flex";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TypographyH3, TypographyPSmallMuted, TypographySpanSmall, IconSize } from "@/components/ui/typography";
import { Phone, Mail, GraduationCap, ChevronDown } from "lucide-react";
import { EncryptedText } from "@/components/ui/encrypted-text";
import { ContactForm } from "@/components/forms/contact-form";
import { useSectionHeight } from "@/hooks/use-section-height";
import { cn } from "@/lib/utils";

export interface ContactInfoItem {
  icon: React.ReactNode;
  text: string;
}

const CONTACT_INFO: { title: string; items: ContactInfoItem[] } = {
  title: "Liên hệ hỗ trợ",
  items: [
    { icon: <IconSize size="md"><Phone /></IconSize>, text: "(028) 38 212 430" },
    { icon: <IconSize size="md"><Mail /></IconSize>, text: "dhnhtphcm@hub.edu.vn" },
    { icon: <IconSize size="md"><GraduationCap /></IconSize>, text: "36 Tôn Thất Đạm, Quận 1, TP.HCM" },
  ],
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
  },
};

export interface ContactSectionProps {
  className?: string;
}

export const ContactSection = ({ className }: ContactSectionProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-50px" });
  const { sectionHeightClassName, sectionHeightStyle, scrollToNextSection } = useSectionHeight({
    minHeight: 600,
    fullHeight: true,
  });

  return (
    <Flex
      as="section"
      ref={sectionRef}
      fullWidth
      position="relative"
      className={cn("bg-muted/30", sectionHeightClassName, className)}
      style={sectionHeightStyle}
    >
      <Flex container padding="responsive-lg" className="h-full items-center justify-center py-8 sm:py-12 md:py-16 lg:py-20">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            ref={containerRef}
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
          >
            <Flex direction="col-lg-row" gap="4-lg-8" fullWidth>
              <Flex direction="col" gap={6} className="lg:w-2/5 lg:min-w-[320px]">
                <motion.div variants={itemVariants}>
                  <Flex direction="col" gap={4}>
                    <TypographyH3>Tại sao chọn chúng tôi?</TypographyH3>
                    <TypographyPSmallMuted>
                      <EncryptedText
                        text="Cam kết chất lượng đào tạo và sự đồng hành chặt chẽ cùng gia đình."
                        className="text-muted-foreground"
                        revealDelayMs={10}
                        flipDelayMs={10}
                      />
                    </TypographyPSmallMuted>
                  </Flex>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Flex gap={4} wrap className="mt-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-sm font-medium">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      Hỗ trợ 24/7
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-medium">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Bảo mật cao
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-sm font-medium">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Đơn giản
                    </div>
                  </Flex>
                </motion.div>

                {CONTACT_INFO && (
                  <motion.div variants={itemVariants}>
                    <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-primary/5 via-background to-background dark:from-primary/10">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/70 to-primary/40" />
                      <CardHeader>
                        <TypographyH3>{CONTACT_INFO.title}</TypographyH3>
                      </CardHeader>
                      <CardContent>
                        <Flex direction="col" gap={3}>
                          {CONTACT_INFO.items.map((item, index) => (
                            <motion.div key={index} className="group" whileHover={{ x: 4 }} transition={{ duration: 0.2 }}>
                              <Flex align="center" gap={3} className="p-2 -mx-2 rounded-lg transition-colors duration-200 hover:bg-primary/5 dark:hover:bg-primary/10">
                                <span className="text-primary transition-transform duration-200 group-hover:scale-110">{item.icon}</span>
                                <TypographySpanSmall className="transition-colors duration-200 group-hover:text-primary">{item.text}</TypographySpanSmall>
                              </Flex>
                            </motion.div>
                          ))}
                        </Flex>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </Flex>

              <motion.div variants={itemVariants} className="flex-1 lg:w-3/5">
                <ContactForm />
              </motion.div>
            </Flex>
          </motion.div>
        </div>
      </Flex>

      <motion.div
        className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 z-[60] hidden sm:block"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2 text-foreground/70 hover:text-foreground transition-colors cursor-pointer group"
          onClick={() => scrollToNextSection(sectionRef.current)}
        >
          <div className="relative px-4 sm:px-5 py-2 sm:py-2.5 rounded-full backdrop-blur-xl bg-background/80 border border-border/50 group-hover:bg-background group-hover:border-border transition-all duration-300 shadow-lg group-hover:shadow-xl">
            <span className="text-[10px] sm:text-xs tracking-[0.15em] sm:tracking-[0.2em] uppercase font-semibold whitespace-nowrap">Cuộn xuống</span>
          </div>
          <div className="relative">
            <motion.div
              className="absolute inset-0 bg-primary/20 rounded-full blur-lg"
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.9, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <ChevronDown className="relative w-6 h-6 sm:w-7 sm:h-7 drop-shadow-lg group-hover:drop-shadow-[0_0_12px_rgba(0,0,0,0.3)] transition-all" />
          </div>
        </motion.div>
      </motion.div>
    </Flex>
  );
};

