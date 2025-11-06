import { AdminHeader } from "@/components/headers"
import { StudentEdit } from "@/features/admin/students/components/student-edit"

interface StudentEditPageProps {
  params: Promise<{ id: string }>
}

export default async function StudentEditPage({ params }: StudentEditPageProps) {
  const { id } = await params

  return (
    <>
      <AdminHeader
        breadcrumbs={[
          { label: "Học sinh", href: "/admin/students" },
          { label: "Chỉnh sửa", isActive: true },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <StudentEdit studentId={id} variant="page" backUrl={`/admin/students/${id}`} />
      </div>
    </>
  )
}

