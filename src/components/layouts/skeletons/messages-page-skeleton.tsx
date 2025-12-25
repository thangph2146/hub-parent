import { Skeleton } from "@/components/ui/skeleton"
import { Flex } from "@/components/ui/flex"

/**
 * MessagesPageSkeleton
 *
 * Skeleton loading state cho trang admin/messages
 * Hiển thị 2 panel (contact list + chat window) để tránh layout shift
 */
export function MessagesPageSkeleton() {
  return (
    <Flex
      fullWidth
      className="overflow-hidden border bg-card"
      style={{
        height: "100dvh",
        minHeight: "480px",
      }}
    >
      {/* Contact list */}
      <Flex direction="col" fullWidth className="hidden max-w-xs border-r sm:flex" padding="md">
        <Flex align="center" justify="between" gap={2} marginBottom={4}>
          <Skeleton className="h-6 w-20" />
          <Flex align="center" gap={2}>
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </Flex>
        </Flex>
        <Flex direction="col" flex="1" gap={3}>
          {Array.from({ length: 8 }).map((_, index) => (
            <Flex key={`contact-skeleton-${index}`} align="center" gap={3} rounded="lg" border="all" paddingX={3} paddingY={2}>
              <Skeleton className="h-10 w-10 rounded-full" />
              <Flex direction="col" flex="1" gap={1}>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </Flex>
              <Skeleton className="h-3 w-8" />
            </Flex>
          ))}
        </Flex>
      </Flex>

      {/* Chat window */}
      <Flex direction="col" flex="1">
        <Flex align="center" justify="between" border="bottom" paddingX={4} paddingY={3} fullWidth>
          <Flex align="center" gap={3}>
            <Skeleton className="h-10 w-10 rounded-full" />
            <Flex direction="col" gap={1}>
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </Flex>
          </Flex>
          <Flex align="center" gap={2}>
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </Flex>
        </Flex>

        <Flex direction="col" flex="1" gap={3} className="overflow-hidden min-h-[calc(100dvh-64px)]" padding="md" fullWidth>
          <Flex direction="col" gap={4} className="overflow-y-hidden" fullWidth>
            {Array.from({ length: 6 }).map((_, index) => (
              <Flex
                key={`message-skeleton-${index}`}
                justify={index % 2 === 0 ? "start" : "end"}
              >
                <Skeleton
                  className={`h-16 w-[65%] rounded-2xl ${index % 2 === 0 ? "rounded-tl-none" : "rounded-tr-none"}`}
                />
              </Flex>
            ))}
          </Flex>
        </Flex>

        <Flex align="center" gap={3} border="top" paddingX={4} paddingY={3} fullWidth>
          <Skeleton className="h-12 flex-1 rounded-2xl" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </Flex>
      </Flex>
    </Flex>
  )
}
