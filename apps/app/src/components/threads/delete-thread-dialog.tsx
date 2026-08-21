"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useRouter } from "@/i18n/navigation"
import {
  deleteThreadMutationOptions,
  threadsQueryKey,
} from "@/lib/queries/threads"

export function DeleteThreadDialog({
  open,
  onOpenChange,
  agentId,
  threadId,
  isCurrent,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  agentId: string
  threadId: string
  isCurrent: boolean
}) {
  const t = useTranslations("thread")
  const router = useRouter()
  const queryClient = useQueryClient()
  const remove = useMutation({
    ...deleteThreadMutationOptions,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: threadsQueryKey(agentId) })
      onOpenChange(false)
      if (isCurrent) {
        router.replace(`/agents/${agentId}`)
      }
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("deleteTitle")}</DialogTitle>
          <DialogDescription>{t("deleteDescription")}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button
            disabled={remove.isPending}
            variant="destructive"
            onClick={() =>
              remove.mutate({ agentId, threadId })
            }
          >
            {t("deleteConfirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
