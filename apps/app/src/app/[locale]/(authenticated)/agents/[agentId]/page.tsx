import { AppShell } from "@/components/app-shell"
import { AgentEmptyState } from "@/components/chat/agent-empty-state"

export default async function AgentPage({
  params,
}: {
  params: Promise<{ agentId: string }>
}) {
  const { agentId } = await params

  return (
    <AppShell agentId={agentId}>
      <AgentEmptyState agentId={agentId} />
    </AppShell>
  )
}
