"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Flex } from "@/components/ui/flex";
import { TypographyH3, TypographyPSmallMuted } from "@/components/ui/typography";
import { EncryptedText } from "@/components/ui/encrypted-text";
import { ContactForm } from "@/features/public/contact";
import { LifeBuoy, ShieldCheck, Zap } from "lucide-react";

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

  return (
    <Flex
      as="section"
      ref={sectionRef}
      fullWidth
      container
      direction="col"
      position="relative"
      bg="background"
      className={className}
    >
      <Flex container padding="responsive-lg" className="h-full items-center justify-center px-0 sm:px-0 md:px-0 lg:px-0 py-0 sm:py-0 md:py-0 lg:py-0">
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
                      <LifeBuoy className="w-4 h-4 animate-pulse" />
                      Hỗ trợ 24/7
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-medium">
                      <ShieldCheck className="w-4 h-4" />
                      Bảo mật cao
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-sm font-medium">
                      <Zap className="w-4 h-4" />
                      Đơn giản
                    </div>
                  </Flex>
                </motion.div>
              </Flex>

              <motion.div variants={itemVariants} className="flex-1 lg:w-3/5">
                <ContactForm title="Liên hệ hỗ trợ" headingLevel="h3" />
              </motion.div>
            </Flex>
          </motion.div>
        </div>
      </Flex>
    </Flex>
  );
};
