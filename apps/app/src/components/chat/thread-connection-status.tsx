"use client"

import { useQuery } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { useThreadConnection } from "@/hooks/use-thread-connection"
import type { ThreadDisplayStatus } from "@/lib/chat/mastra-thread-transport"
import { sessionQueryOptions } from "@/lib/queries/session"
import { cn } from "@/lib/utils"

const statusDotClass: Record<ThreadDisplayStatus, string> = {
  connected: "bg-emerald-500",
  streaming: "bg-sky-500 animate-pulse",
  connecting: "bg-muted-foreground/60 animate-pulse",
  disconnected: "bg-destructive",
}

export function ThreadConnectionStatus({
  agentId,
  threadId,
}: {
  agentId: string
  threadId: string
}) {
  const t = useTranslations("thread")
  const sessionQuery = useQuery(sessionQueryOptions)
  const status = useThreadConnection(
    agentId,
    threadId,
    sessionQuery.data?.user?.id
  )

  return (
    <p
      aria-live="polite"
      className="ml-auto flex items-center gap-1.5 text-muted-foreground text-xs"
      role="status"
    >
      <span
        aria-hidden
        className={cn("size-1.5 rounded-full", statusDotClass[status])}
      />
      {t(`connection.${status}`)}
    </p>
  )
}
