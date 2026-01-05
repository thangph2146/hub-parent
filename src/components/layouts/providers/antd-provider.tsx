"use client"

import { AntdRegistry } from "@ant-design/nextjs-registry"
import { ConfigProvider, theme } from "antd"
import { useTheme } from "next-themes"
import type { ReactNode } from "react"

/**
 * Ant Design Registry Provider
 * 
 * Cần thiết cho Next.js App Router để hỗ trợ SSR với Ant Design.
 * AntdRegistry quản lý styles và context của Ant Design components.
 * 
 * ConfigProvider được sử dụng để đồng bộ theme colors với globals.css:
 * - Background colors sử dụng --background, --card, --popover
 * - Text colors sử dụng --foreground, --muted-foreground
 * - Primary colors sử dụng --primary
 * - Border colors sử dụng --border
 * 
 * Lưu ý: 
 * - Sử dụng hardcoded colors từ globals.css để tránh hydration mismatch
 * - Colors được sync với :root và .dark trong globals.css
 * - resolvedTheme sẽ là undefined trên server, mặc định là light
 * - AntdRegistry tự động xử lý SSR và hydration
 * 
 * @see https://ant.design/docs/react/use-with-next
 * @see https://github.com/ant-design/nextjs-registry
 * @see https://ant.design/docs/react/customize-theme
 */
export function AntdProvider({ children }: { children: ReactNode }) {
  const { theme: nextTheme, resolvedTheme } = useTheme()

  // Xác định theme mode (light/dark)
  // resolvedTheme sẽ là undefined trên server, mặc định là light
  // Điều này đảm bảo server và client render giống nhau ban đầu
  const isDark = resolvedTheme === "dark" || nextTheme === "dark"

  // Colors từ globals.css - sync với :root và .dark
  // Light theme colors (từ :root)
  const lightColors = {
    primary: "#1f3368",
    secondary: "#a71b29",
    destructive: "#a71b29",
    background: "#ffffff",
    card: "#ffffff",
    popover: "#ffffff",
    foreground: "#3b3939",
    mutedForeground: "#6b6b6b",
    border: "#e5e5e5",
  }

  // Dark theme colors (từ .dark)
  const darkColors = {
    primary: "#3d5a9e",
    secondary: "#c9444f",
    destructive: "#c9444f",
    background: "#1a1a1a",
    card: "#2a2a2a",
    popover: "#2a2a2a",
    foreground: "#ffffff",
    mutedForeground: "#b0b0b0",
    border: "#404040",
  }

  const colors = isDark ? darkColors : lightColors

  const themeConfig = {
    algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      // Primary colors
      colorPrimary: colors.primary,
      colorSuccess: colors.primary,
      colorWarning: colors.secondary,
      colorError: colors.destructive,
      colorInfo: colors.primary,
      // Background colors
      colorBgBase: colors.background,
      colorBgContainer: colors.card,
      colorBgElevated: colors.popover,
      // Text colors
      colorText: colors.foreground,
      colorTextSecondary: colors.mutedForeground,
      colorTextTertiary: colors.mutedForeground,
      // Border colors
      colorBorder: colors.border,
      colorBorderSecondary: colors.border,
      // Other
      borderRadius: 8,
      fontFamily: "var(--font-geist-sans)",
    },
    components: {
      // Flex component - transparent background
      Flex: {
        colorBgContainer: "transparent",
      },
      // Row và Col - transparent background
      Row: {
        colorBgContainer: "transparent",
      },
      Col: {
        colorBgContainer: "transparent",
      },
    },
  }

  return (
    <AntdRegistry>
      <ConfigProvider theme={themeConfig}>
        {children}
      </ConfigProvider>
    </AntdRegistry>
  )
}

