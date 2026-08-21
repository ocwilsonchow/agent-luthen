"use client"

import { useEffect, useState } from "react"
import {
  acquireThreadHub,
  displayThreadStatus,
  releaseThreadHub,
  type ThreadDisplayStatus,
} from "@/lib/chat/mastra-thread-transport"

export function useThreadConnection(
  agentId: string,
  threadId: string,
  resourceId: string | undefined
): ThreadDisplayStatus {
  const [status, setStatus] = useState<ThreadDisplayStatus>(
    resourceId ? "connecting" : "disconnected"
  )

  useEffect(() => {
    if (!resourceId) {
      setStatus("disconnected")
      return
    }

    const hub = acquireThreadHub(agentId, threadId, resourceId)
    setStatus(displayThreadStatus(hub.snapshot()))
    const unsubscribe = hub.subscribeStatus(() => {
      setStatus(displayThreadStatus(hub.snapshot()))
    })

    return () => {
      unsubscribe()
      releaseThreadHub(agentId, threadId)
    }
  }, [agentId, resourceId, threadId])

  return status
}
