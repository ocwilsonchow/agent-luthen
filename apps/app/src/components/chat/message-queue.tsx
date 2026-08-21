"use client"

import {
  Queue,
  QueueItem,
  QueueItemContent,
  QueueItemIndicator,
  QueueList,
  QueueSection,
  QueueSectionContent,
  QueueSectionLabel,
  QueueSectionTrigger,
  type QueueMessage,
} from "@/components/ai-elements/queue"
import { cn } from "@/lib/utils"

function queuedText(message: QueueMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join(" ")
    .trim()
}

export function MessageQueue({
  messages,
  label,
  className,
}: {
  messages: QueueMessage[]
  label: string
  className?: string
}) {
  if (messages.length === 0) return null

  return (
    <Queue
      className={cn(
        "rounded-b-none border-input border-b-0 shadow-none",
        className
      )}
    >
      <QueueSection>
        <QueueSectionTrigger>
          <QueueSectionLabel count={messages.length} label={label} />
        </QueueSectionTrigger>
        <QueueSectionContent>
          <QueueList>
            {messages.map((message) => (
              <QueueItem key={message.id}>
                <div className="flex items-center gap-2">
                  <QueueItemIndicator />
                  <QueueItemContent>
                    {queuedText(message) || message.id}
                  </QueueItemContent>
                </div>
              </QueueItem>
            ))}
          </QueueList>
        </QueueSectionContent>
      </QueueSection>
    </Queue>
  )
}
