import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { IconSize } from "@/components/ui/typography";
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
            <div className={cn(
              "flex gap-2 sm:gap-3",
              buttonsToRender.length > 1 ? "flex-col sm:flex-row" : ""
            )}>
              {buttonsToRender.map((btn, index) => (
                <Button
                  key={index}
                  variant={btn.variant || "outline"}
                  size={btn.size || "sm"}
                  className={buttonsToRender.length === 1 ? "w-full sm:w-auto" : ""}
                  asChild
                >
                  <Link href={btn.href}>
                    {btn.leftIcon && (
                      <span className="mr-1 sm:mr-2">{btn.leftIcon}</span>
                    )}
                    {btn.responsiveText ? (
                      <>
                        <span className="hidden xs:inline">
                          {btn.responsiveText.desktop}
                        </span>
                        <span className="xs:hidden">
                          {btn.responsiveText.mobile}
                        </span>
                      </>
                    ) : (
                      btn.text
                    )}
                    {btn.rightIcon && (
                      <span className="ml-1 sm:ml-2">{btn.rightIcon}</span>
                    )}
                    {btn.showArrowRight && !btn.rightIcon && (
                      <IconSize size="sm" className="ml-2">
                        <ArrowRight />
                      </IconSize>
                    )}
                  </Link>
                </Button>
              ))}
            </div>
          )}
          {children}
        </CardContent>
      )}
    </Card>
  );
}

