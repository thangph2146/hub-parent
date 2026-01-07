import { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Flex } from "@/components/ui/flex";
import { IconSize, TypographySpanSmall } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

export interface ContentCardButton {
  href: string;
  text: string;
  variant?: "default" | "outline" | "destructive" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  responsiveText?: {
    mobile: string;
    desktop: string;
  };
  showArrowRight?: boolean;
}

export interface ContentCardProps {
  title: string;
  description: string;
  button?: ContentCardButton;
  buttons?: ContentCardButton[];
  cardClassName?: string;
  cardOverlay?: "white-90" | "none";
  cardMaxWidth?: "sm" | "md" | "lg" | "hero" | "none";
  cardPadding?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "default" | "hero";
  headerClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  contentClassName?: string;
  titleDefaultClasses?: string;
  descriptionDefaultClasses?: string;
  children?: ReactNode;
  /** Enable hover lift effect */
  enableHover?: boolean;
}

export const ContentCard = ({
  title,
  description,
  button,
  buttons,
  cardClassName,
  cardOverlay = "none",
  cardMaxWidth = "none",
  cardPadding = "default",
  headerClassName,
  titleClassName,
  descriptionClassName,
  contentClassName,
  titleDefaultClasses = "text-card-foreground dark:text-foreground",
  descriptionDefaultClasses = "text-muted-foreground",
  children,
  enableHover = false,
}: ContentCardProps) => {
  const buttonsToRender = buttons || (button ? [button] : []);

  return (
    <Card
      className={cn(enableHover && "transition-all duration-300 hover:-translate-y-1 hover:shadow-xl", cardClassName)}
      overlay={cardOverlay}
      maxWidth={cardMaxWidth}
      padding={cardPadding}
    >
      <CardHeader className={headerClassName}>
        <CardTitle className={cn("leading-tight", titleClassName || titleDefaultClasses)}>{title}</CardTitle>
        <CardDescription className={cn("leading-relaxed", descriptionClassName || descriptionDefaultClasses)}>{description}</CardDescription>
      </CardHeader>
      {(buttonsToRender.length > 0 || children) && (
        <CardContent className={contentClassName}>
          {buttonsToRender.length > 0 && (
            <Flex gap={3}>
              {buttonsToRender.map((btn, index) => (
                <Button
                  key={index}
                  variant={btn.variant || "outline"}
                  size={btn.size || "sm"}
                  className={cn("transition-all duration-200 hover:scale-[1.02]", buttonsToRender.length === 1 && "w-full sm:w-auto")}
                  asChild
                >
                  <Link href={btn.href}>
                    <Flex align="center" gap={2}>
                      {btn.leftIcon}
                      {btn.responsiveText ? (
                        <>
                          <TypographySpanSmall className="hidden xs:inline">{btn.responsiveText.desktop}</TypographySpanSmall>
                          <TypographySpanSmall className="xs:hidden">{btn.responsiveText.mobile}</TypographySpanSmall>
                        </>
                      ) : (
                        <TypographySpanSmall>{btn.text}</TypographySpanSmall>
                      )}
                      {btn.rightIcon}
                      {btn.showArrowRight && !btn.rightIcon && (
                        <IconSize size="sm" className="transition-transform duration-200 group-hover:translate-x-0.5">
                          <ArrowRight />
                        </IconSize>
                      )}
                    </Flex>
                  </Link>
                </Button>
              ))}
            </Flex>
          )}
          {children}
        </CardContent>
      )}
    </Card>
  );
}

