"use client"

import { Shield, FileText, Calendar, Clock, CheckCircle2, XCircle, ArrowLeft, Edit } from "lucide-react"
import { ResourceDetailPage, type ResourceDetailField } from "@/features/admin/resources/components"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { formatDateVi } from "../utils"

export interface RoleDetailData {
  id: string
  name: string
  displayName: string
  description: string | null
  permissions: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  [key: string]: unknown
}

export interface RoleDetailClientProps {
  roleId: string
  role: RoleDetailData
  backUrl?: string
}

export function RoleDetailClient({ roleId, role, backUrl = "/admin/roles" }: RoleDetailClientProps) {
  const router = useRouter()

  const detailFields: ResourceDetailField<RoleDetailData>[] = [
    {
      name: "name",
      label: "Tên vai trò",
      type: "custom",
      render: (value) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div className="font-medium">{String(value || "—")}</div>
        </div>
      ),
    },
    {
      name: "displayName",
      label: "Tên hiển thị",
      type: "custom",
      render: (value) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-1/10">
            <FileText className="h-5 w-5 text-chart-1" />
          </div>
          <div className="font-medium">{String(value || "—")}</div>
        </div>
      ),
    },
    {
      name: "description",
      label: "Mô tả",
      type: "custom",
      render: (value) => (
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/10">
            <FileText className="h-5 w-5 text-chart-2" />
          </div>
          <div className="flex-1">
            <div className="text-sm text-muted-foreground">{String(value || "—")}</div>
          </div>
        </div>
      ),
    },
    {
      name: "permissions",
      label: "Quyền",
      type: "custom",
      render: (value) => {
        if (!value || !Array.isArray(value)) return <span className="text-muted-foreground">—</span>
        return (
          <div className="flex flex-wrap gap-2">
            {value.map((perm: string) => (
              <Badge key={perm} variant="outline" className="text-xs">
                {perm}
              </Badge>
            ))}
          </div>
        )
      },
    },
    {
      name: "isActive",
      label: "Trạng thái",
      type: "custom",
      render: (value) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-3/10">
            {value ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
          </div>
          <div>
            <div className="font-medium">{value ? "Hoạt động" : "Tạm khóa"}</div>
          </div>
        </div>
      ),
    },
    {
      name: "createdAt",
      label: "Ngày tạo",
      type: "custom",
      render: (value) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-4/10">
            <Calendar className="h-5 w-5 text-chart-4" />
          </div>
          <div>
            <div className="font-medium">{value ? formatDateVi(String(value)) : "—"}</div>
          </div>
        </div>
      ),
    },
    {
      name: "updatedAt",
      label: "Cập nhật lần cuối",
      type: "custom",
      render: (value) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-5/10">
            <Clock className="h-5 w-5 text-chart-5" />
          </div>
          <div>
            <div className="font-medium">{value ? formatDateVi(String(value)) : "—"}</div>
          </div>
        </div>
      ),
    },
  ]

  return (
    <ResourceDetailPage<RoleDetailData>
      data={role}
      fields={detailFields}
      title={role.displayName}
      description={`Chi tiết vai trò ${role.name}`}
      backUrl={backUrl}
      backLabel="Quay lại danh sách"
      actions={
        <Button
          variant="outline"
          onClick={() => router.push(`/admin/roles/${roleId}/edit`)}
          className="gap-2"
        >
          <Edit className="h-4 w-4" />
          Chỉnh sửa
        </Button>
      }
    />
  )
}

