import { AdminHeader } from "@/components/headers"
import { StudentDetail } from "@/features/admin/students/components/student-detail"
import { validateRouteId } from "@/lib/validation/route-params"

interface StudentDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function StudentDetailPage({ params }: StudentDetailPageProps) {
  const { id } = await params
  
  // Validate route ID
  const validatedId = validateRouteId(id, "Học sinh")
  if (!validatedId) {
    return (
      <>
        <AdminHeader
          breadcrumbs={[
            { label: "Học sinh", href: "/admin/students" },
            { label: "Chi tiết", href: `/admin/students/${id}` },
          ]}
        />
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex min-h-[400px] flex-1 items-center justify-center">
            <div className="text-center">
              <h2 className="mb-2 text-2xl font-bold">ID không hợp lệ</h2>
              <p className="text-muted-foreground">
                ID học sinh không hợp lệ.
              </p>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <AdminHeader
        breadcrumbs={[
          { label: "Học sinh", href: "/admin/students" },
          { label: "Chi tiết", isActive: true },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <StudentDetail studentId={validatedId} backUrl="/admin/students" />
      </div>
    </>
  )
}

