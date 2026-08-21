"use client"

import { useForm } from "@tanstack/react-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  renameThreadMutationOptions,
  threadsQueryKey,
} from "@/lib/queries/threads"

const schema = z.object({
  title: z.string().min(1),
})

export function RenameThreadDialog({
  open,
  onOpenChange,
  agentId,
  threadId,
  resourceId,
  title,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  agentId: string
  threadId: string
  resourceId: string
  title: string
}) {
  const t = useTranslations("thread")
  const queryClient = useQueryClient()
  const rename = useMutation({
    ...renameThreadMutationOptions,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: threadsQueryKey(agentId) })
      onOpenChange(false)
    },
  })

  const form = useForm({
    defaultValues: { title },
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      await rename.mutateAsync({
        agentId,
        threadId,
        resourceId,
        title: value.title,
      })
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("renameTitle")}</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            void form.handleSubmit()
          }}
        >
          <form.Field name="title">
            {(field) => (
              <Input
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder={t("renamePlaceholder")}
              />
            )}
          </form.Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button disabled={rename.isPending} type="submit">
              {t("renameSubmit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
