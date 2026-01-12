import type { Metadata } from "next"
import { AdminHeader } from "@/components/layout/headers"
import { AccountProfileView } from "@/features/admin/accounts/components"
import { getOpenGraphConfig, getTwitterConfig } from "@/constants"
import { createListBreadcrumbs } from "@/features/admin/resources/utils"

/**
 * Accounts Page Metadata
 * 
 * Theo Next.js 16 best practices:
 * - Metadata được merge với admin layout và root layout
 * - Title sử dụng template từ root: "Tài khoản | CMS"
 * - Open Graph và Twitter Card cho social sharing
 */
export const metadata: Metadata = {
  title: "Tài khoản",
  description: "Quản lý thông tin cá nhân của bạn - cập nhật tên, số điện thoại, địa chỉ, mật khẩu và các thông tin khác",
  openGraph: {
    ...getOpenGraphConfig(),
    title: "Tài khoản - CMS",
    description: "Quản lý thông tin cá nhân của bạn - cập nhật tên, số điện thoại, địa chỉ, mật khẩu và các thông tin khác",
  },
  twitter: {
    ...getTwitterConfig(),
    title: "Tài khoản - CMS",
    description: "Quản lý thông tin cá nhân của bạn - cập nhật tên, số điện thoại, địa chỉ, mật khẩu và các thông tin khác",
  },
}

/**
 * Accounts Page
 * 
 * Trang quản lý thông tin cá nhân của user hiện tại
 * Theo Next.js 16 best practices về Server Components
 */
export default async function AccountsPage() {
  return (
    <>
      <AdminHeader breadcrumbs={createListBreadcrumbs({ listLabel: "Tài khoản" })} />
      <div className="flex flex-1 flex-col gap-6 p-6 mx-auto w-full">
        <AccountProfileView variant="page" />
      </div>
    </>
  )
}

