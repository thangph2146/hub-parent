"use client";

import { useMemo } from "react";
import { useHeaderHeight } from "./use-header-height";
import { cn } from "@/lib/utils";

export interface UseSectionHeightOptions {
  /** Min height cho section (px), mặc định 600px */
  minHeight?: number;
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

    return {
      height: `calc(100dvh - ${headerHeight}px)`,
      minHeight: `${minHeight}px`,
    } as React.CSSProperties;
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

