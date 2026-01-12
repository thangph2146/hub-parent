import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { useSocket } from "@/hooks"

export const useSocketConnection = () => {
  const { data: session } = useSession()
  const primaryRole = useMemo(() => session?.roles?.[0]?.name ?? null, [session?.roles])
  const [cacheVersion, setCacheVersion] = useState(0)

  const { socket, on } = useSocket({
    userId: session?.user?.id,
    role: primaryRole,
  })

  const [isConnected, setIsConnected] = useState<boolean>(() => Boolean(socket?.connected))

  useEffect(() => {
    if (!socket) return

    const handleConnect = () => setIsConnected(true)
    const handleDisconnect = () => setIsConnected(false)

    socket.on("connect", handleConnect)
    socket.on("disconnect", handleDisconnect)

    return () => {
      socket.off("connect", handleConnect)
      socket.off("disconnect", handleDisconnect)
    }
  }, [socket])

  return {
    socket,
    on,
    isConnected,
    cacheVersion,
    setCacheVersion,
    sessionUserId: session?.user?.id,
  }
}

