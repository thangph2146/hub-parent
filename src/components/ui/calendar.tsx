"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  responsiveTextSizes,
  fontWeights,
  lineHeights,
  iconSizes,
} from "@/constants";

const calendarBodySmall = `${responsiveTextSizes.small} ${fontWeights.normal} ${lineHeights.relaxed}`;
const calendarIconSizeXl = iconSizes.xl;

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  components: userComponents,
  ...props
}: CalendarProps) {
  const defaultClassNames = {
    months: "relative flex flex-col sm:flex-row gap-4",
    month: "w-full",
    nav: "flex items-center",
    button_previous: cn(
      buttonVariants({ variant: "ghost" }),
      `h-9 w-9 text-muted-foreground/80 hover:bg-accent/20 hover:text-foreground focus:bg-accent/20 active:bg-accent/20 p-0 absolute left-1 top-1 z-30`,
    ),
    button_next: cn(
      buttonVariants({ variant: "ghost" }),
      `h-9 w-9 text-muted-foreground/80 hover:bg-accent/20 hover:text-foreground focus:bg-accent/20 active:bg-accent/20 p-0 absolute right-1 top-1 z-30`,
    ),
    weekday: `h-9 w-9 p-0 font-medium text-muted-foreground/80 ${calendarBodySmall}`,
    day_button:
      "relative flex size-9 items-center justify-center whitespace-nowrap p-0 text-foreground outline-offset-2 group-[[data-selected]:not(.range-middle)]:[transition-property:color,background-color,border-radius,box-shadow] group-[[data-selected]:not(.range-middle)]:duration-150 focus:outline-none group-data-[disabled]:pointer-events-none focus-visible:z-10 hover:bg-accent/20 hover:text-foreground focus:bg-accent/20 active:bg-accent/20 data-[selected]:bg-primary/20 data-[selected]:text-primary-foreground group-data-[selected]:bg-primary/20 group-data-[selected]:text-primary-foreground group-data-[selected]:hover:bg-primary/20 group-data-[selected]:hover:text-primary-foreground group-data-[disabled]:text-foreground/30 group-data-[disabled]:line-through group-data-[outside]:text-foreground/30 group-data-[outside]:group-data-[selected]:text-primary-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 group-[.range-start:not(.range-end)]:rounded-e-none group-[.range-end:not(.range-start)]:rounded-s-none group-[.range-middle]:rounded-none group-data-[selected]:group-[.range-middle]:bg-accent/20 group-data-[selected]:group-[.range-middle]:text-foreground",
    day: `group h-9 w-9 px-0 ${calendarBodySmall}`,
    range_start: "range-start",
    range_end: "range-end",
    range_middle: "range-middle",
    today:
      "*:after:pointer-events-none *:after:absolute *:after:bottom-1 *:after:start-1/2 *:after:z-10 *:after:size-[3px] *:after:-translate-x-1/2 *:after:rounded-full *:after:bg-primary/20/30 [&[data-selected]:not(.range-middle)>*]:after:bg-background [&[data-disabled]>*]:after:bg-foreground/30 *:after:transition-colors",
    outside: "text-muted-foreground data-selected:bg-accent/20",
    hidden: "invisible",
    week_number: `h-9 w-9 p-0 font-medium text-muted-foreground/80 ${calendarBodySmall}`,
    selected:
      "bg-primary/20 text-primary-foreground hover:bg-primary/20 hover:text-primary-foreground focus:bg-primary/20 focus:text-primary-foreground",
    disabled: "text-muted-foreground opacity-50",
  };

  const mergedClassNames: Record<string, string> = { ...defaultClassNames };
  if (classNames) {
    for (const key in classNames) {
      const k = key as keyof typeof classNames;
      const dk = key as string;
      if (defaultClassNames[dk as keyof typeof defaultClassNames]) {
        mergedClassNames[dk] = cn(
          defaultClassNames[dk as keyof typeof defaultClassNames],
          classNames[k],
        );
      } else {
        mergedClassNames[dk] = classNames[k] as string;
      }
    }
  }

  const defaultComponents = {
    Chevron: (props: {
      className?: string;
      size?: number;
      disabled?: boolean;
      orientation?: "left" | "right" | "up" | "down";
    }) => {
      // Use iconSizes.xl (h-7 w-7 = 28px) for calendar navigation icons
      const iconSize = 28; // 28px matches iconSizes.xl
      if (props.orientation === "left") {
        return (
          <ChevronLeft
            size={iconSize}
            strokeWidth={2.5}
            className={calendarIconSizeXl}
            {...props}
            aria-hidden="true"
          />
        );
      }
      return (
        <ChevronRight
          size={iconSize}
          strokeWidth={2.5}
          className={calendarIconSizeXl}
          {...props}
          aria-hidden="true"
        />
      );
    },
  };

  const mergedComponents = {
    ...defaultComponents,
    ...userComponents,
  };

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("w-fit p-2", className)}
      classNames={mergedClassNames}
      components={mergedComponents}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
