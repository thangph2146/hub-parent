import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Flex } from "@/components/ui/flex";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
  headerClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  contentClassName?: string;
  titleDefaultClasses?: string;
  descriptionDefaultClasses?: string;
  children?: ReactNode;
}

export const ContentCard = ({
  title,
  description,
  button,
  buttons,
  cardClassName,
  headerClassName,
  titleClassName,
  descriptionClassName,
  contentClassName,
  titleDefaultClasses = "text-card-foreground",
  descriptionDefaultClasses = "text-muted-foreground",
  children,
}: ContentCardProps) => {
  const buttonsToRender = buttons || (button ? [button] : []);

  return (
    <Card className={cardClassName}>
      <CardHeader className={headerClassName}>
        <CardTitle
          className={cn("leading-tight", titleClassName || titleDefaultClasses)}
        >
          {title}
        </CardTitle>
        <CardDescription
          className={cn("leading-relaxed", descriptionClassName || descriptionDefaultClasses)}
        >
          {description}
        </CardDescription>
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
                  className={buttonsToRender.length === 1 ? "w-full sm:w-auto" : ""}
                  asChild
                >
                  <Link href={btn.href}>
                    <Flex align="center" gap={2}>
                      {btn.leftIcon}
                      {btn.responsiveText ? (
                        <>
                          <TypographySpanSmall className="hidden xs:inline">
                            {btn.responsiveText.desktop}
                          </TypographySpanSmall>
                          <TypographySpanSmall className="xs:hidden">
                            {btn.responsiveText.mobile}
                          </TypographySpanSmall>
                        </>
                      ) : (
                        <TypographySpanSmall>{btn.text}</TypographySpanSmall>
                      )}
                      {btn.rightIcon}
                      {btn.showArrowRight && !btn.rightIcon && (
                        <IconSize size="sm">
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

