"use client"

import { User, Mail, Hash, Calendar, Clock, CheckCircle2, XCircle, Edit } from "lucide-react"
import { ResourceDetailPage, type ResourceDetailField, type ResourceDetailSection } from "@/features/admin/resources/components"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { formatDateVi } from "../utils"

export interface StudentDetailData {
  id: string
  userId: string | null
  name: string | null
  email: string | null
  studentCode: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  userName: string | null
  userEmail: string | null
  [key: string]: unknown
}

export interface StudentDetailClientProps {
  studentId: string
  student: StudentDetailData
  backUrl?: string
}

export function StudentDetailClient({ studentId, student, backUrl = "/admin/students" }: StudentDetailClientProps) {
  const router = useRouter()

  const detailFields: ResourceDetailField<StudentDetailData>[] = [
    {
      name: "studentCode",
      label: "Mã học sinh",
      type: "custom",
      section: "basic",
      render: (value) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Hash className="h-5 w-5 text-primary" />
          </div>
          <div className="font-medium">{String(value || "—")}</div>
        </div>
      ),
    },
    {
      name: "name",
      label: "Tên học sinh",
      type: "custom",
      section: "basic",
      render: (value) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-1/10">
            <User className="h-5 w-5 text-chart-1" />
          </div>
          <div className="font-medium">{String(value || "—")}</div>
        </div>
      ),
    },
    {
      name: "email",
      label: "Email",
      type: "custom",
      section: "basic",
      render: (value) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/10">
            <Mail className="h-5 w-5 text-chart-2" />
          </div>
          <div className="font-medium">{String(value || "—")}</div>
        </div>
      ),
    },
    {
      name: "userId",
      label: "Tài khoản liên kết",
      type: "custom",
      section: "basic",
      render: (value, data) => {
        if (!value || !data.userName) {
          return <span className="text-muted-foreground">—</span>
        }
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-3/10">
              <User className="h-5 w-5 text-chart-3" />
            </div>
            <div>
              <div className="font-medium">{data.userName}</div>
              {data.userEmail && (
                <div className="text-sm text-muted-foreground">{data.userEmail}</div>
              )}
            </div>
          </div>
        )
      },
    },
    {
      name: "isActive",
      label: "Trạng thái",
      type: "custom",
      section: "status",
      render: (value) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-4/10">
            {value ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
          </div>
          <div>
            <Badge variant={value ? "default" : "secondary"}>
              {value ? "Hoạt động" : "Tạm khóa"}
            </Badge>
          </div>
        </div>
      ),
    },
    {
      name: "createdAt",
      label: "Ngày tạo",
      type: "custom",
      section: "status",
      render: (value) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-5/10">
            <Calendar className="h-5 w-5 text-chart-5" />
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
      section: "status",
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

  const detailSections: ResourceDetailSection<StudentDetailData>[] = [
    {
      id: "basic",
      title: "Thông tin cơ bản",
      description: "Thông tin chính về học sinh",
    },
    {
      id: "status",
      title: "Trạng thái và thời gian",
      description: "Trạng thái hoạt động và thông tin thời gian",
    },
  ]

  return (
    <ResourceDetailPage<StudentDetailData>
      data={student}
      fields={detailFields}
      detailSections={detailSections}
      title={student.name || student.studentCode}
      description={`Chi tiết học sinh ${student.studentCode}`}
      backUrl={backUrl}
      backLabel="Quay lại danh sách"
      actions={
        <Button
          variant="outline"
          onClick={() => router.push(`/admin/students/${studentId}/edit`)}
          className="gap-2"
        >
          <Edit className="h-4 w-4" />
          Chỉnh sửa
        </Button>
      }
    />
  )
}

