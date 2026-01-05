"use client"

import { AntdRegistry } from "@ant-design/nextjs-registry"
import type { ReactNode } from "react"

/**
 * Ant Design Registry Provider
 * 
 * Cần thiết cho Next.js App Router để hỗ trợ SSR với Ant Design.
 * AntdRegistry quản lý styles và context của Ant Design components.
 * 
 * @see https://ant.design/docs/react/use-with-next
 * @see https://github.com/ant-design/nextjs-registry
 */
export function AntdProvider({ children }: { children: ReactNode }) {
  return <AntdRegistry>{children}</AntdRegistry>
}

