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
      overflow="hidden"
      border="all"
      bg="card"
      height="screen"
      className="min-h-[480px]"
    >
      {/* Chat window */}
      <Flex direction="col" flex="1" fullWidth>
        <Flex align="center" justify="between" border="bottom" className="px-4 py-3" fullWidth>
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

        <Flex direction="col" flex="1" gap={3} overflow="auto" className="min-h-[calc(100dvh-64px)]" padding="md" fullWidth>
          <Flex direction="col" gap={4} fullWidth>
            {Array.from({ length: 6 }).map((_, index) => (
              <Flex
                key={`message-skeleton-${index}`}
                justify={index % 2 === 0 ? "start" : "end"}
                fullWidth
              >
                <Skeleton
                  className={`h-16 w-[65%] rounded-2xl ${index % 2 === 0 ? "rounded-tl-none" : "rounded-tr-none"}`}
                />
              </Flex>
            ))}
          </Flex>
        </Flex>

        <Flex align="center" gap={3} fullWidth border="top" className="px-4 py-3">
          <Skeleton className="h-12 flex-1 rounded-2xl" />
          <Skeleton className="h-10 w-10 rounded-full shrink" />
        </Flex>
      </Flex>
    </Flex>
  )
}
