"use client";

import { useMemo } from "react";
import { useHeaderHeight } from "./use-header-height";
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
 * 
 * @example
 * ```tsx
 * const { sectionHeightClassName, scrollToNextSection, scrollOffset } = useSectionHeight();
 * 
 * return (
 *   <section className={sectionHeightClassName} ref={ref}>
 *     <button onClick={() => scrollToNextSection(ref.current)}>Scroll</button>
 *   </section>
 * );
 * ```
 */
export function useSectionHeight(
  options: UseSectionHeightOptions = {}
): UseSectionHeightReturn {
  const { minHeight = 600, fullHeight = true } = options;
  const { headerHeight } = useHeaderHeight();

  // Tính toán section height className (chỉ cho các class tĩnh)
  const sectionHeightClassName = useMemo(() => {
    if (!fullHeight) {
      return "";
    }
    
    return cn("w-full");
  }, [fullHeight]);

  // Tính toán section height style với CSS variable động
  const sectionHeightStyle = useMemo(() => {
    if (!fullHeight) {
      return {};
    }

    // Đảm bảo headerHeight luôn là số dương
    // Nếu headerHeight = 0 hoặc chưa được đo, thử đo lại
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

    // Đảm bảo height luôn chính xác là 100dvh - headerHeight
    const calculatedHeight = `calc(100dvh - ${actualHeaderHeight}px)`;
    
    const style: React.CSSProperties = {
      height: calculatedHeight,
      maxHeight: calculatedHeight,
      minHeight: typeof minHeight === "number" && minHeight > 0 ? `${Math.max(minHeight, 0)}px` : calculatedHeight,
    };
    
    return style;
  }, [fullHeight, headerHeight, minHeight]);

  // Scroll đến section tiếp theo
  const scrollToNextSection = (currentElement: HTMLElement | null) => {
    if (!currentElement) return;

    // Tìm section element gần nhất (có thể là chính nó hoặc parent)
    let currentSection: HTMLElement | null = null;
    
    // Tìm section element từ currentElement hoặc parent
    let element: HTMLElement | null = currentElement;
    while (element && element !== document.body) {
      if (element.tagName === "SECTION") {
        currentSection = element;
        break;
      }
      element = element.parentElement;
    }

    // Nếu không tìm thấy section, sử dụng currentElement
    if (!currentSection) {
      currentSection = currentElement;
    }

    // Tìm tất cả các section elements trong document
    const allSections = Array.from(document.querySelectorAll("section")) as HTMLElement[];
    
    // Tìm index của section hiện tại
    const currentIndex = allSections.findIndex(section => 
      section === currentSection || section.contains(currentSection)
    );

    // Tìm section tiếp theo
    let nextSection: HTMLElement | null = null;
    
    if (currentIndex >= 0 && currentIndex < allSections.length - 1) {
      // Tìm section tiếp theo trong danh sách
      nextSection = allSections[currentIndex + 1];
    } else {
      // Nếu không tìm thấy trong danh sách, tìm bằng cách traverse DOM
      let element: HTMLElement | null = currentSection;
      while (element) {
        element = element.nextElementSibling as HTMLElement;
        if (element && element.tagName === "SECTION") {
          nextSection = element;
          break;
        }
        // Nếu không tìm thấy sibling, tìm trong parent
        if (!element && currentSection.parentElement) {
          const parent = currentSection.parentElement;
          const currentIndex = Array.from(parent.children).indexOf(currentSection);
          if (currentIndex >= 0 && currentIndex < parent.children.length - 1) {
            const nextSibling = parent.children[currentIndex + 1] as HTMLElement;
            if (nextSibling.tagName === "SECTION") {
              nextSection = nextSibling;
              break;
            }
          }
        }
      }
    }

    // Scroll đến section tiếp theo
    if (nextSection) {
      const elementPosition = nextSection.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - headerHeight;

      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: "smooth",
      });
    } else {
      // Nếu không có section tiếp theo, scroll xuống một viewport height
      const currentScrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      const nextScrollPosition = currentScrollY + viewportHeight - headerHeight;

      window.scrollTo({
        top: Math.max(0, nextScrollPosition),
        behavior: "smooth",
      });
    }
  };

  // Scroll với offset tự động
  const scrollTo = (top: number, behavior: ScrollBehavior = "smooth") => {
    window.scrollTo({
      top: Math.max(0, top - headerHeight),
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

