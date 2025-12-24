import { ReactNode } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Flex } from "@/components/ui/flex";
import { TypographyH3, TypographyPSmallMuted, TypographySpanSmall } from "@/components/ui/typography";

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
  title: string;
  description: string;
  contactInfo?: {
    title: string;
    items: ContactInfoItem[];
  };
  formComponent?: ReactNode;
  titleClassName?: string;
  descriptionClassName?: string;
}

export const ContactSection = ({
  title,
  description,
  contactInfo,
  formComponent,
  titleClassName,
  descriptionClassName,
}: ContactSectionProps) => {
  return (
    <Flex direction="col" gap={6} fullWidth className="lg:flex-row lg:gap-8">
      {/* Left Side - Features & Contact Info - 1/3 */}
      <Flex direction="col" gap={6} fullWidth className="lg:w-1/3">
        <Flex direction="col" gap={4}>
          <TypographyH3 className={titleClassName}>
            {title}
          </TypographyH3>
          <TypographyPSmallMuted className={descriptionClassName}>
            {description}
          </TypographyPSmallMuted>
        </Flex>
        {/* Contact Info */}
        {contactInfo && (
          <Card>
            <CardContent>
              <Flex direction="col" gap={3}>
                {contactInfo.items.map((item, index) => (
                  <Flex key={index} align="center" gap={3}>
                    {item.icon}
                    <TypographySpanSmall>{item.text}</TypographySpanSmall>
                  </Flex>
                ))}
              </Flex>
            </CardContent>
          </Card>
        )}
      </Flex>

      {/* Right Side - Form - 2/3 */}
      {formComponent && (
        <Flex direction="col" fullWidth className="lg:w-2/3">
          {formComponent}
        </Flex>
      )}
    </Flex>
  );
}

