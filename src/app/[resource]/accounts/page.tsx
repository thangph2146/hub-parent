import type { Metadata } from "next"
import { AdminHeader } from "@/components/layouts/headers"
import { AccountProfile } from "@/features/admin/accounts/components"
import { appConfig } from "@/lib/config"

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
    ...appConfig.openGraph,
    title: "Tài khoản - CMS",
    description: "Quản lý thông tin cá nhân của bạn - cập nhật tên, số điện thoại, địa chỉ, mật khẩu và các thông tin khác",
  },
  twitter: {
    ...appConfig.twitter,
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
      <AdminHeader
        breadcrumbs={[
          { label: "Tài khoản", isActive: true },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <AccountProfile variant="page" />
      </div>
    </>
  )
}

