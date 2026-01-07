"use client";

import { ReactNode, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Flex } from "@/components/ui/flex";
import { TypographyH3, TypographyPSmallMuted, TypographySpanSmall } from "@/components/ui/typography";
import { motion, useInView } from "framer-motion";

export interface FeatureItem {
  icon: ReactNode;
  title: string;
  description: string;
  iconBg?: string;
}

export interface ContactInfoItem {
  icon: ReactNode;
  text: string;
}

export interface ContactSectionProps {
  title: ReactNode;
  description: ReactNode;
  contactInfo?: {
    title: string;
    items: ContactInfoItem[];
  };
  formComponent?: ReactNode;
  titleClassName?: string;
  descriptionClassName?: string;
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

export const ContactSection = ({
  title,
  description,
  contactInfo,
  formComponent,
  titleClassName,
  descriptionClassName,
}: ContactSectionProps) => {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={containerRef}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
    >
      <Flex direction="col-lg-row" gap="4-lg-8" fullWidth>
        {/* Left Side - Features & Contact Info - 2/5 */}
        <Flex direction="col" gap={6} className="lg:w-2/5 lg:min-w-[320px]">
          <motion.div variants={itemVariants}>
            <Flex direction="col" gap={4}>
              <TypographyH3 className={titleClassName}>
                {title}
              </TypographyH3>
              <TypographyPSmallMuted className={descriptionClassName}>
                {description}
              </TypographyPSmallMuted>
            </Flex>
          </motion.div>

          {/* Feature Highlights */}
          <motion.div variants={itemVariants}>
            <Flex gap={4} wrap={true} className="mt-2">
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
          {/* Contact Info with gradient accent */}
          {contactInfo && (
            <motion.div variants={itemVariants}>
              <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-primary/5 via-background to-background dark:from-primary/10">
                <CardHeader>
                  <TypographyH3>{contactInfo.title}</TypographyH3>
                </CardHeader>
                {/* Gradient accent line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/70 to-primary/40" />
                <CardContent>
                  <Flex direction="col" gap={3}>
                    {contactInfo.items.map((item, index) => (
                      <motion.div
                        key={index}
                        className="group"
                        whileHover={{ x: 4 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Flex
                          align="center"
                          gap={3}
                          className="p-2 -mx-2 rounded-lg transition-colors duration-200 hover:bg-primary/5 dark:hover:bg-primary/10"
                        >
                          <span className="text-primary transition-transform duration-200 group-hover:scale-110">
                            {item.icon}
                          </span>
                          <TypographySpanSmall className="transition-colors duration-200 group-hover:text-primary">
                            {item.text}
                          </TypographySpanSmall>
                        </Flex>
                      </motion.div>
                    ))}
                  </Flex>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </Flex>

        {/* Right Side - Form - 3/5 */}
        {formComponent && (
          <motion.div variants={itemVariants} className="flex-1 lg:w-3/5">
            {formComponent}
          </motion.div>
        )}
      </Flex>
    </motion.div>
  );
}


