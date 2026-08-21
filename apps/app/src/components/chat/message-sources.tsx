"use client"

import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources"
import {
  sourceDisplay,
  sourcesFromMessage,
} from "@/lib/chat/message-sources"
import type { UIMessage } from "ai"
import { ArrowUpRightIcon, ChevronDownIcon, Link2Icon } from "lucide-react"
import { useTranslations } from "next-intl"

export function MessageSources({ message }: { message: UIMessage }) {
  const t = useTranslations("chat")
  if (message.role !== "assistant") return null
  const sources = sourcesFromMessage(message)
  if (sources.length === 0) return null

  return (
    <Sources>
      <SourcesTrigger count={sources.length}>
        <Link2Icon className="size-3.5" />
        <span className="font-medium">{t("sources")}</span>
        <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-muted px-1 font-medium text-[10px] text-muted-foreground tabular-nums">
          {sources.length}
        </span>
        <ChevronDownIcon className="size-3.5 transition-transform group-data-[state=open]/sources:rotate-180" />
      </SourcesTrigger>
      <SourcesContent>
        {sources.map((source, index) => {
          const { title, hostname } = sourceDisplay(source)
          return (
            <Source
              className="items-start gap-2.5"
              href={source.href}
              key={source.id}
              title={title}
            >
              <span className="mt-px flex size-5 shrink-0 items-center justify-center rounded-md bg-muted font-mono text-[10px] text-muted-foreground tabular-nums">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-foreground text-xs">
                  {title}
                </span>
                {hostname !== title ? (
                  <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                    {hostname}
                  </span>
                ) : null}
              </span>
              <ArrowUpRightIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/source:opacity-100" />
            </Source>
          )
        })}
      </SourcesContent>
    </Sources>
  )
}
