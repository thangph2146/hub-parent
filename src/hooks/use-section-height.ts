"use client";

import { useMemo } from "react";
import { useHeaderHeight } from "./use-header-height";
import { useClientOnly } from "./use-client-only";
import { cn } from "@/lib/utils";

export interface UseSectionHeightOptions {
  /** Min height cho section (px), mặc định 600px */
  minHeight?: number | "fit-content";
  /** Có sử dụng full viewport height không */
  fullHeight?: boolean;
}

export interface UseSectionHeightReturn {
  /** Header height hiện tại (px) */
  headerHeight: number;
  /** CSS className cho section height */
  sectionHeightClassName: string;
  /** CSS style object cho section height */
  sectionHeightStyle: React.CSSProperties;
  /** Offset để scroll (header height) */
  scrollOffset: number;
  /** Function để scroll đến section tiếp theo */
  scrollToNextSection: (currentElement: HTMLElement | null) => void;
  /** Function để scroll với offset */
  scrollTo: (top: number, behavior?: ScrollBehavior) => void;
}

/**
 * Hook để tính toán height cho section dựa trên header height
 * Tự động cập nhật khi header thay đổi kích thước
 */
export function useSectionHeight(
  options: UseSectionHeightOptions = {}
): UseSectionHeightReturn {
  const { minHeight = 600, fullHeight = true } = options;
  const { headerHeight } = useHeaderHeight();
  const isMounted = useClientOnly();

  // Tính toán section height className (chỉ cho các class tĩnh)
  const sectionHeightClassName = useMemo(() => {
    if (!fullHeight) {
      return "";
    }
    
    // Sử dụng min-h-[100svh] làm fallback khi SSR để tránh CLS
    return cn("w-full relative overflow-hidden", !isMounted && "min-h-[100svh]");
  }, [fullHeight, isMounted]);

  // Tính toán section height style với CSS variable động
  const sectionHeightStyle = useMemo(() => {
    if (!fullHeight) {
      return {};
    }

    // Nếu chưa mounted (SSR), không trả về style động để tránh mismatch
    if (!isMounted) {
      return {};
    }

    // Đảm bảo headerHeight luôn là số dương
    let actualHeaderHeight = headerHeight;
    
    if (actualHeaderHeight <= 0 && typeof document !== "undefined") {
      const header = document.querySelector<HTMLElement>('header[data-public-header="true"]') || 
                     document.querySelector<HTMLElement>("header");
      if (header) {
        const rect = header.getBoundingClientRect();
        actualHeaderHeight = rect.height > 0 ? rect.height : 56; // Fallback to default
      } else {
        actualHeaderHeight = 56; // Fallback to default
      }
    }

    // Đảm bảo height luôn chính xác là 100vh - headerHeight
    const calculatedHeight = `calc(100vh - ${actualHeaderHeight}px)`;
    
    const style: React.CSSProperties = {
      height: calculatedHeight,
      maxHeight: calculatedHeight,
      minHeight: typeof minHeight === "number" && minHeight > 0 ? `${Math.max(minHeight, 0)}px` : calculatedHeight,
    };
    
    return style;
  }, [fullHeight, headerHeight, minHeight, isMounted]);

  // Scroll đến section tiếp theo
  const scrollToNextSection = (currentElement: HTMLElement | null) => {
    if (!currentElement) return;

    let currentSection: HTMLElement | null = null;
    let element: HTMLElement | null = currentElement;
    
    while (element) {
      if (element.tagName === "SECTION" || element.getAttribute("as") === "section") {
        currentSection = element;
        break;
      }
      element = element.parentElement;
    }

    if (!currentSection) return;

    const nextSection = currentSection.nextElementSibling as HTMLElement;
    if (nextSection) {
      const top = nextSection.offsetTop - headerHeight;
      window.scrollTo({
        top,
        behavior: "smooth",
      });
    }
  };

  const scrollTo = (top: number, behavior: ScrollBehavior = "smooth") => {
    window.scrollTo({
      top: top - headerHeight,
      behavior,
    });
  };

  return {
    headerHeight,
    sectionHeightClassName,
    sectionHeightStyle,
    scrollOffset: headerHeight,
    scrollToNextSection,
    scrollTo,
  };
}
