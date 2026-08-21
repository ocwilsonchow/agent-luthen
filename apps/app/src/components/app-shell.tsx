"use client"

import { ThreadConnectionStatus } from "@/components/chat/thread-connection-status"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

export function AppShell({
  agentId,
  threadId,
  children,
}: {
  agentId?: string
  threadId?: string
  children?: React.ReactNode
}) {
  return (
    <SidebarProvider className="h-svh overflow-hidden">
      <AppSidebar agentId={agentId} threadId={threadId} />
      <SidebarInset className="min-h-0 overflow-hidden">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
          <SidebarTrigger />
          {agentId && threadId ? (
            <ThreadConnectionStatus agentId={agentId} threadId={threadId} />
          ) : null}
        </header>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
