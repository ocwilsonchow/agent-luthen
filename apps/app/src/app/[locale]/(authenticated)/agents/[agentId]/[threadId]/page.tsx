import { AppShell } from "@/components/app-shell"
import { ChatPane } from "@/components/chat/chat-pane"

export default async function ThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ agentId: string; threadId: string }>
  searchParams: Promise<{ prompt?: string }>
}) {
  const { agentId, threadId } = await params
  const { prompt } = await searchParams

  return (
    <AppShell agentId={agentId} threadId={threadId}>
      <ChatPane agentId={agentId} threadId={threadId} pendingPrompt={prompt} />
    </AppShell>
  )
}
