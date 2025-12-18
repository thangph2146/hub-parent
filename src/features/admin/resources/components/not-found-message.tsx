import { typography } from "@/lib/typography"

interface NotFoundMessageProps {
  title?: string
  description?: string
  resourceName?: string
}

export const NotFoundMessage = ({
  title,
  description,
  resourceName = "dữ liệu",
}: NotFoundMessageProps) => {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4 md:p-6 lg:p-8">
      <div className="text-center">
        <h2 className={`mb-2 ${typography.heading.h2}`}>
          {title || `Không tìm thấy ${resourceName}`}
        </h2>
        <p className={typography.body.muted.medium}>
          {description || `${resourceName.charAt(0).toUpperCase() + resourceName.slice(1)} không tồn tại hoặc bạn không có quyền truy cập.`}
        </p>
      </div>
    </div>
  )
}

