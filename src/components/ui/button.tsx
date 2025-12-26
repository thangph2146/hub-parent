import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";
import { iconSizes, responsiveTextSizes, fontWeights, lineHeights } from "@/lib/typography";

const buttonBodySmall = `${responsiveTextSizes.small} ${fontWeights.normal} ${lineHeights.relaxed}`

const buttonVariants = cva(
  `inline-flex items-center justify-center whitespace-nowrap rounded-lg ${buttonBodySmall} font-medium transition-colors outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 cursor-pointer`,
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm shadow-black/5 hover:bg-primary/90 cusor-pointer",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm shadow-black/5 hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm shadow-black/5 hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm shadow-black/5 hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 min-h-[44px] px-4 py-2", // 44px minimum for mobile touch targets
        sm: `h-8 min-h-[44px] rounded-lg px-3 ${buttonBodySmall}`, // Ensure mobile-friendly
        lg: "h-10 min-h-[44px] rounded-lg px-8",
        icon: `${iconSizes["3xl"]} min-h-[44px] min-w-[44px]`, // 44x44px minimum for icon buttons
        "icon-absolute": "absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      fullWidth: false,
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, fullWidth, asChild = false, type = "button", ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    const componentProps = asChild ? props : { type, ...props };

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        {...componentProps}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
