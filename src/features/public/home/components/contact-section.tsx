"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Flex } from "@/components/ui/flex";
import { TypographyH3, TypographyPSmallMuted } from "@/components/ui/typography";
import { EncryptedText } from "@/components/ui/encrypted-text";
import { ContactForm } from "@/components/forms/contact-form";
import { useSectionHeight } from "@/hooks/use-section-height";
import { cn } from "@/lib/utils";

export interface ContactInfoItem {
  icon: React.ReactNode;
  text: string;
}

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
  const { sectionHeightClassName, sectionHeightStyle } = useSectionHeight({
    minHeight: 0,
    fullHeight: false,
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
                  <Flex direction="col" gap={3} className="sm:gap-4">
                    <TypographyH3 className="text-lg sm:text-xl md:text-2xl">Tại sao chọn chúng tôi?</TypographyH3>
                    <TypographyPSmallMuted className="text-sm sm:text-base">
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
              </Flex>

              <motion.div variants={itemVariants} className="flex-1 lg:w-3/5">
                <ContactForm title="Liên hệ hỗ trợ" />
              </motion.div>
            </Flex>
          </motion.div>
        </div>
      </Flex>
    </Flex>
  );
};
