import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IconSize } from "@/components/ui/typography";
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
  className?: string;
}

export const ContactSection = ({
  title,
  description,
  contactInfo,
  formComponent,
  titleClassName,
  descriptionClassName,
  className,
}: ContactSectionProps) => {
  return (
    <div className={cn("flex flex-col lg:flex-row gap-8 lg:gap-16", className)}>
      {/* Left Side - Features & Contact Info - 1/3 */}
      <div className="w-full lg:w-1/3">
        <div className="mb-6 sm:mb-8">
          <TypographyH3
            className={cn("mb-3 sm:mb-4", titleClassName)}
          >
            {title}
          </TypographyH3>
          <TypographyPSmallMuted className={descriptionClassName}>
            {description}
          </TypographyPSmallMuted>
        </div>
        <div className="space-y-4 sm:space-y-6">
          {/* Contact Info */}
          {contactInfo && (
            <Card className="bg-muted/50 dark:bg-muted rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-border">
              <CardHeader className="px-0">
                <CardTitle className="text-card-foreground">
                  {contactInfo.title}
                </CardTitle>
              </CardHeader>
              <div className="space-y-2 sm:space-y-3">
                {contactInfo.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 sm:gap-3">
                    <div className="sm:block hidden text-primary flex-shrink-0">
                      <div className="hidden sm:block">
                        <IconSize size="md">{item.icon}</IconSize>
                      </div>
                      <div className="block sm:hidden">
                        <IconSize size="sm">{item.icon}</IconSize>
                      </div>
                    </div>
                    <TypographySpanSmall className="break-words">{item.text}</TypographySpanSmall>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Right Side - Form - 2/3 */}
      {formComponent && <div className="w-full lg:w-2/3">{formComponent}</div>}
    </div>
  );
}

