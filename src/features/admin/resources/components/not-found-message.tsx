import { TypographyH2, TypographyPMuted } from "@/components/ui/typography"
import { Flex } from "@/components/ui/flex"

interface NotFoundMessageProps {
  title?: string
  description?: string
  resourceName?: string
}

export const NotFoundMessage = ({
  title,
  description,
  resourceName = "dữ liệu",
}: NotFoundMessageProps) => (
  <Flex direction="col" align="center" justify="center" gap={4} flex="1" padding="responsive-lg">
    <Flex direction="col" align="center" gap={2}>
      <TypographyH2>{title || `Không tìm thấy ${resourceName}`}</TypographyH2>
        <TypographyPMuted>
          {description || `${resourceName.charAt(0).toUpperCase() + resourceName.slice(1)} không tồn tại hoặc bạn không có quyền truy cập.`}
        </TypographyPMuted>
    </Flex>
    </Flex>
  )

