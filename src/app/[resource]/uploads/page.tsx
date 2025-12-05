import type { Metadata } from "next"
import { AdminHeader } from "@/components/layouts/headers"
import { PERMISSIONS } from "@/lib/permissions"
import { getTablePermissionsAsync } from "@/features/admin/resources/server"
import { createListBreadcrumbs } from "@/features/admin/resources/utils"
import { UploadsPageClient } from "../../../features/admin/uploads/components/uploads-page-client"

/**
 * Uploads Page Metadata
 */
export const metadata: Metadata = {
  title: "Upload hình ảnh",
  description: "Upload và quản lý hình ảnh",
}

/**
 * Uploads Page với permissions check
 */
async function UploadsContent() {
  // Check permissions - yêu cầu quyền posts để upload
  const permissions = await getTablePermissionsAsync({
    delete: [],
    restore: [],
    manage: PERMISSIONS.POSTS_MANAGE,
    create: PERMISSIONS.POSTS_CREATE,
  })

  if (!permissions.canCreate && !permissions.canManage) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Bạn không có quyền upload hình ảnh</p>
      </div>
    )
  }

  return <UploadsPageClient />
}

export default async function UploadsPage() {
  return (
    <>
      <AdminHeader breadcrumbs={createListBreadcrumbs({ listLabel: "Upload hình ảnh" })} />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <UploadsContent />
      </div>
    </>
  )
}

