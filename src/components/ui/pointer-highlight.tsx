"use client";
import { cn } from "@/utils";
import { useRef, useEffect, useState } from "react";

export function PointerHighlight({
  children,
  rectangleClassName,
  pointerClassName,
  containerClassName,
}: {
  children: React.ReactNode;
  rectangleClassName?: string;
  pointerClassName?: string;
  containerClassName?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setDimensions({ width, height });
    }

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    });

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    const currentContainer = containerRef.current;

    if (currentContainer) {
      resizeObserver.observe(currentContainer);
      intersectionObserver.observe(currentContainer);
    }

    return () => {
      if (currentContainer) {
        resizeObserver.unobserve(currentContainer);
        intersectionObserver.unobserve(currentContainer);
      }
    };
  }, []);

  const rectangleWidth = dimensions.width + 24;
  const rectangleHeight = dimensions.height + 16;
  const pointerX = dimensions.width + 20;
  const pointerY = dimensions.height + 12;

  return (
    <div
      className={cn("relative w-fit p-2", containerClassName)}
      ref={containerRef}
    >
      {children}
      {dimensions.width > 0 && dimensions.height > 0 && (
        <div className={cn(
          "pointer-events-none absolute inset-0 z-0",
          isInView ? "opacity-100 scale-100" : "opacity-0 scale-95",
          "transition-all duration-500 ease-out origin-top-left"
        )}>
          <div
            className={cn(
              "absolute border border-neutral-800 dark:border-neutral-200",
              rectangleClassName
            )}
            style={{
              width: isInView ? `${rectangleWidth}px` : "0px",
              height: isInView ? `${rectangleHeight}px` : "0px",
              transition: "width 1s ease-in-out, height 1s ease-in-out",
            }}
          />
          <div
            className={cn(
              "pointer-events-none absolute transition-opacity duration-1000 ease-in-out",
              isInView ? "opacity-100" : "opacity-0"
            )}
            style={{
              left: `${pointerX}px`,
              top: `${pointerY}px`,
              transform: "rotate(-90deg)",
              transitionDelay: isInView ? "0.1s" : "0s",
            }}
          >
            <Pointer
              className={cn("h-5 w-5 text-blue-500", pointerClassName)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

const Pointer = ({ ...props }: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      stroke="currentColor"
      fill="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 16 16"
      height="1em"
      width="1em"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M14.082 2.182a.5.5 0 0 1 .103.557L8.528 15.467a.5.5 0 0 1-.917-.007L5.57 10.694.803 8.652a.5.5 0 0 1-.006-.916l12.728-5.657a.5.5 0 0 1 .556.103z"></path>
    </svg>
  );
};

