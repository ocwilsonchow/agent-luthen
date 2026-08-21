"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { PlusIcon, SearchIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useMemo, useState } from "react"
import { LocaleSwitcher } from "@/components/chrome/locale-switcher"
import { ThemeToggle } from "@/components/chrome/theme-toggle"
import { ThreadListItem } from "@/components/threads/thread-list-item"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useRouter } from "@/i18n/navigation"
import { agentHttpId } from "@/lib/mastra/agent"
import { agentsQueryOptions } from "@/lib/queries/agents"
import { sessionQueryOptions, signOutMutationOptions } from "@/lib/queries/session"
import {
  createThreadMutationOptions,
  threadsQueryKey,
  threadsQueryOptions,
} from "@/lib/queries/threads"

export function AppSidebar({
  agentId,
  threadId,
}: {
  agentId?: string
  threadId?: string
}) {
  const t = useTranslations("nav")
  const router = useRouter()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const agentsQuery = useQuery(agentsQueryOptions)
  const sessionQuery = useQuery(sessionQueryOptions)
  const threadsQuery = useQuery(threadsQueryOptions(agentId ?? ""))
  const resourceId = sessionQuery.data?.user?.id ?? ""

  const createThread = useMutation({
    ...createThreadMutationOptions,
    onSuccess: async (thread) => {
      if (!agentId) return
      await queryClient.invalidateQueries({ queryKey: threadsQueryKey(agentId) })
      router.push(`/agents/${agentId}/${thread.id}`)
    },
  })

  const signOut = useMutation({
    ...signOutMutationOptions,
    onSuccess: () => {
      router.replace("/login")
    },
  })

  const threads = useMemo(() => {
    const list = threadsQuery.data ?? []
    const query = search.trim().toLowerCase()
    if (!query) return list
    return list.filter((thread) =>
      (thread.title ?? "").toLowerCase().includes(query)
    )
  }, [search, threadsQuery.data])

  return (
    <Sidebar>
      <SidebarHeader className="gap-2 p-2">
        <Select
          value={agentId}
          onValueChange={(next) => {
            router.push(`/agents/${next}`)
          }}
        >
          <SelectTrigger aria-label={t("agents")}>
            <SelectValue placeholder={t("agents")} />
          </SelectTrigger>
          <SelectContent>
            {(agentsQuery.data ?? []).map((agent) => (
              <SelectItem key={agentHttpId(agent)} value={agentHttpId(agent)}>
                {agent.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          disabled={!agentId || !resourceId || createThread.isPending}
          onClick={() => {
            if (!agentId || !resourceId) return
            createThread.mutate({ agentId, resourceId })
          }}
        >
          <PlusIcon />
          {t("newThread")}
        </Button>
        <div className="relative">
          <SearchIcon className="absolute top-2.5 left-2 size-4 text-muted-foreground" />
          <Input
            className="pl-8"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("searchThreads")}
          />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("threads")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {threads.length === 0 ? (
                <p className="px-2 text-muted-foreground text-sm">
                  {t("noThreads")}
                </p>
              ) : (
                threads.map((thread) => (
                  <ThreadListItem
                    key={thread.id}
                    agentId={agentId ?? ""}
                    thread={thread}
                    isActive={thread.id === threadId}
                  />
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="flex flex-row items-center justify-between gap-2 p-2">
        <LocaleSwitcher />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => signOut.mutate()}
          >
            {t("signOut")}
          </Button>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
