import { TypographyH2, TypographyPMuted } from "@/components/ui/typography"

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
        <TypographyH2 className="mb-2">
          {title || `Không tìm thấy ${resourceName}`}
        </TypographyH2>
        <TypographyPMuted>
          {description || `${resourceName.charAt(0).toUpperCase() + resourceName.slice(1)} không tồn tại hoặc bạn không có quyền truy cập.`}
        </TypographyPMuted>
      </div>
    </div>
  )
}

