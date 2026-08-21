"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { MoreHorizontalIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Link, useRouter } from "@/i18n/navigation"
import { DeleteThreadDialog } from "@/components/threads/delete-thread-dialog"
import { RenameThreadDialog } from "@/components/threads/rename-thread-dialog"
import {
  cloneThreadMutationOptions,
  threadsQueryKey,
} from "@/lib/queries/threads"

type Thread = {
  id: string
  title?: string | null
  resourceId: string
}

export function ThreadListItem({
  agentId,
  thread,
  isActive,
}: {
  agentId: string
  thread: Thread
  isActive: boolean
}) {
  const t = useTranslations("nav")
  const untitled = useTranslations("thread")
  const router = useRouter()
  const queryClient = useQueryClient()
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const title = thread.title?.trim() || untitled("untitled")
  const clone = useMutation({
    ...cloneThreadMutationOptions,
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: threadsQueryKey(agentId) })
      if (result.thread?.id) {
        router.push(`/agents/${agentId}/${result.thread.id}`)
      }
    },
  })

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive}>
        <Link href={`/agents/${agentId}/${thread.id}`}>{title}</Link>
      </SidebarMenuButton>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction showOnHover>
            <MoreHorizontalIcon />
            <span className="sr-only">{title}</span>
          </SidebarMenuAction>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setRenameOpen(true)}>
            {t("rename")}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={clone.isPending}
            onSelect={() => clone.mutate({ agentId, threadId: thread.id })}
          >
            {t("clone")}
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setDeleteOpen(true)}
          >
            {t("delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <RenameThreadDialog
        open={renameOpen}
        onOpenChange={setRenameOpen}
        agentId={agentId}
        threadId={thread.id}
        resourceId={thread.resourceId}
        title={thread.title ?? ""}
      />
      <DeleteThreadDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        agentId={agentId}
        threadId={thread.id}
        isCurrent={isActive}
      />
    </SidebarMenuItem>
  )
}
