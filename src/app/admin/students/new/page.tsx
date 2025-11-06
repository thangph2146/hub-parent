import { AdminHeader } from "@/components/headers"
import { StudentCreate } from "@/features/admin/students/components/student-create"

export default async function StudentCreatePage() {
  return (
    <>
      <AdminHeader
        breadcrumbs={[
          { label: "Học sinh", href: "/admin/students" },
          { label: "Tạo mới", isActive: true },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <StudentCreate />
      </div>
    </>
  )
}

