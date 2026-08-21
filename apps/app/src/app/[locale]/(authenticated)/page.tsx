"use client"

import { useQuery } from "@tanstack/react-query"
import { useEffect } from "react"
import { AppShell } from "@/components/app-shell"
import { useRouter } from "@/i18n/navigation"
import { agentHttpId } from "@/lib/mastra/agent"
import { agentsQueryOptions } from "@/lib/queries/agents"

export default function AuthenticatedHomePage() {
  const router = useRouter()
  const agentsQuery = useQuery(agentsQueryOptions)

  useEffect(() => {
    const first = agentsQuery.data?.[0]
    if (!first) return
    router.replace(`/agents/${agentHttpId(first)}`)
  }, [agentsQuery.data, router])

  return <AppShell />
}
