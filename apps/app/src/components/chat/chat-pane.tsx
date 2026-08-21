"use client"

import { useChat } from "@ai-sdk/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  getToolName,
  isReasoningUIPart,
  isToolUIPart,
  type UIMessage,
} from "ai"
import { useMemo, useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import {
  Confirmation,
  ConfirmationAccepted,
  ConfirmationAction,
  ConfirmationActions,
  ConfirmationRejected,
  ConfirmationRequest,
  ConfirmationTitle,
} from "@/components/ai-elements/confirmation"
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation"
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message"
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input"
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning"
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool"
import type { QueueMessage } from "@/components/ai-elements/queue"
import { Badge } from "@/components/ui/badge"
import { AgentTaskList } from "@/components/chat/agent-task-list"
import { MessageFollowUps } from "@/components/chat/message-follow-ups"
import { assistantMedMarkdown } from "@/components/chat/clinical-callout"
import { SourceLookupProvider } from "@/components/chat/inline-source"
import { MessageQueue } from "@/components/chat/message-queue"
import { MessageSources } from "@/components/chat/message-sources"
import { MessageUsage } from "@/components/chat/message-usage"
import { ThinkingIndicator } from "@/components/chat/thinking-indicator"
import {
  isTaskToolPart,
  tasksFromMessages,
  hasVisibleChatParts,
} from "@/lib/chat/agent-tasks"
import { closeIncompleteClinicalTags } from "@/lib/chat/clinical-tags"
import { sourcesFromMessage } from "@/lib/chat/message-sources"
import { MastraThreadTransport } from "@/lib/chat/mastra-thread-transport"
import { getMastraClient } from "@/lib/mastra/client"
import {
  userMessageFromData,
  userTextFromMessage,
} from "@/lib/chat/mastra-chunks"
import { toUiMessages } from "@/lib/chat/to-ui-messages"
import { agentQueryOptions } from "@/lib/queries/agents"
import { toolApprovalMutationOptions } from "@/lib/queries/chat"
import { sessionQueryOptions } from "@/lib/queries/session"
import {
  threadMessagesQueryOptions,
  threadsQueryKey,
} from "@/lib/queries/threads"

function MessageParts({
  message,
  agentId,
  threadId,
  resourceId,
  modelId,
  provider,
}: {
  message: UIMessage
  agentId: string
  threadId: string
  resourceId: string
  modelId?: string
  provider?: string
}) {
  const t = useTranslations("chat")
  const approval = useMutation(toolApprovalMutationOptions)
  const sources = useMemo(() => sourcesFromMessage(message), [message])

  return (
    <SourceLookupProvider sources={sources}>
      {message.parts.map((part, index) => {
        if (part.type === "text") {
          const isAssistant = message.role === "assistant"
          return (
            <MessageContent key={`${message.id}-text-${index}`}>
              <MessageResponse {...(isAssistant ? assistantMedMarkdown : {})}>
                {isAssistant
                  ? closeIncompleteClinicalTags(part.text)
                  : part.text}
              </MessageResponse>
            </MessageContent>
          )
        }

        if (isReasoningUIPart(part)) {
          return (
            <Reasoning
              key={`${message.id}-reasoning-${index}`}
              isStreaming={part.state === "streaming"}
            >
              <ReasoningTrigger />
              <ReasoningContent>{part.text}</ReasoningContent>
            </Reasoning>
          )
        }

        if (isToolUIPart(part)) {
          if (isTaskToolPart(part)) return null
          return (
            <div key={`${message.id}-tool-${index}`} className="space-y-2">
              <Tool>
                {part.type === "dynamic-tool" ? (
                  <ToolHeader
                    type="dynamic-tool"
                    state={part.state}
                    toolName={getToolName(part)}
                  />
                ) : (
                  <ToolHeader type={part.type} state={part.state} />
                )}
                <ToolContent>
                  <ToolInput input={part.input} />
                  <ToolOutput output={part.output} errorText={part.errorText} />
                </ToolContent>
              </Tool>
              {"approval" in part && part.approval ? (
                <Confirmation approval={part.approval} state={part.state}>
                  <ConfirmationTitle>{t("toolApproval")}</ConfirmationTitle>
                  <ConfirmationRequest>
                    <ConfirmationActions>
                      <ConfirmationAction
                        disabled={approval.isPending}
                        onClick={() =>
                          approval.mutate({
                            agentId,
                            threadId,
                            resourceId,
                            toolCallId: part.toolCallId ?? getToolName(part),
                            approved: false,
                          })
                        }
                        variant="outline"
                      >
                        {t("decline")}
                      </ConfirmationAction>
                      <ConfirmationAction
                        disabled={approval.isPending}
                        onClick={() =>
                          approval.mutate({
                            agentId,
                            threadId,
                            resourceId,
                            toolCallId: part.toolCallId ?? getToolName(part),
                            approved: true,
                          })
                        }
                      >
                        {t("approve")}
                      </ConfirmationAction>
                    </ConfirmationActions>
                  </ConfirmationRequest>
                  <ConfirmationAccepted>
                    <Badge variant="secondary">{t("approve")}</Badge>
                  </ConfirmationAccepted>
                  <ConfirmationRejected>
                    <Badge variant="destructive">{t("decline")}</Badge>
                  </ConfirmationRejected>
                </Confirmation>
              ) : null}
            </div>
          )
        }

        return null
      })}
      <MessageSources message={message} />
      <MessageUsage message={message} modelId={modelId} provider={provider} />
    </SourceLookupProvider>
  )
}

export function ChatPane({
  agentId,
  threadId,
  pendingPrompt,
}: {
  agentId: string
  threadId: string
  pendingPrompt?: string
}) {
  const sessionQuery = useQuery(sessionQueryOptions)
  const messagesQuery = useQuery(threadMessagesQueryOptions(agentId, threadId))
  const resourceId = sessionQuery.data?.user?.id

  if (!resourceId || messagesQuery.isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
        …
      </div>
    )
  }

  return (
    <ChatPaneReady
      agentId={agentId}
      threadId={threadId}
      resourceId={resourceId}
      pendingPrompt={pendingPrompt}
      initialMessages={toUiMessages(messagesQuery.data?.messages ?? [])}
    />
  )
}

function ChatPaneReady({
  agentId,
  threadId,
  resourceId,
  initialMessages,
  pendingPrompt,
}: {
  agentId: string
  threadId: string
  resourceId: string
  initialMessages: UIMessage[]
  pendingPrompt?: string
}) {
  const t = useTranslations("thread")
  const queryClient = useQueryClient()
  const router = useRouter()
  const agentQuery = useQuery(agentQueryOptions(agentId))
  const sentPending = useRef(false)
  const resumeStreamRef = useRef(async () => {})
  const stopRef = useRef(async () => {})
  const pendingLocalTexts = useRef<string[]>([])
  const [queuedMessages, setQueuedMessages] = useState<QueueMessage[]>([])
  const transport = useMemo(
    () => new MastraThreadTransport(agentId, threadId, resourceId),
    [agentId, threadId, resourceId]
  )

  const { messages, sendMessage, resumeStream, setMessages, status, stop } =
    useChat({
      id: threadId,
      messages: initialMessages,
      transport,
      onFinish: () => {
        void queryClient.invalidateQueries({
          queryKey: threadsQueryKey(agentId),
        })
      },
      onData: (part) => {
        if (part.type !== "data-user-message") return
        const incoming = userMessageFromData(part.data)
        if (!incoming) return

        setQueuedMessages((current) => {
          const index = current.findIndex((message) =>
            message.parts.some(
              (queued) =>
                queued.type === "text" && queued.text === incoming.text
            )
          )
          if (index < 0) return current
          return [...current.slice(0, index), ...current.slice(index + 1)]
        })

        const localIndex = pendingLocalTexts.current.indexOf(incoming.text)
        if (localIndex >= 0) {
          pendingLocalTexts.current.splice(localIndex, 1)
          return
        }

        setMessages((current) => {
          if (current.some((message) => message.id === incoming.id)) {
            return current
          }
          const observed: UIMessage = {
            id: incoming.id,
            role: "user",
            parts: [{ type: "text", text: incoming.text }],
          }
          const last = current.at(-1)
          if (last?.role === "assistant") {
            return [...current.slice(0, -1), observed, last]
          }
          return [...current, observed]
        })
      },
    })

  resumeStreamRef.current = resumeStream
  stopRef.current = stop

  useEffect(() => {
    let cancelled = false
    const watch = async () => {
      while (!cancelled) {
        await resumeStreamRef.current()
      }
    }
    void watch()
    return () => {
      cancelled = true
      void stopRef.current()
    }
  }, [threadId])

  const isBusy = status === "submitted" || status === "streaming"
  const visibleMessages = useMemo(
    () => messages.filter(hasVisibleChatParts),
    [messages]
  )
  const showThinking = isBusy && visibleMessages.at(-1)?.role !== "assistant"

  const submitPrompt = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return

    if (isBusy) {
      const queued: QueueMessage = {
        id: crypto.randomUUID(),
        parts: [{ type: "text", text: trimmed }],
      }
      setQueuedMessages((current) => [...current, queued])
      try {
        await getMastraClient().getAgent(agentId).queueMessage({
          message: trimmed,
          threadId,
          resourceId,
        })
      } catch {
        setQueuedMessages((current) =>
          current.filter((message) => message.id !== queued.id)
        )
        pendingLocalTexts.current.push(trimmed)
        await sendMessage({ text: trimmed })
      }
      return
    }

    pendingLocalTexts.current.push(trimmed)
    await sendMessage({ text: trimmed })
  }

  useEffect(() => {
    setQueuedMessages([])
  }, [threadId])

  useEffect(() => {
    if (!pendingPrompt || sentPending.current) return
    sentPending.current = true
    pendingLocalTexts.current.push(pendingPrompt.trim())
    void sendMessage({ text: pendingPrompt })
    router.replace(`/agents/${agentId}/${threadId}`)
  }, [agentId, pendingPrompt, router, sendMessage, threadId])

  const tasks = useMemo(() => tasksFromMessages(messages), [messages])
  const lastVisible = visibleMessages.at(-1)
  const lastUserText = useMemo(() => {
    for (let index = visibleMessages.length - 1; index >= 0; index -= 1) {
      const message = visibleMessages[index]
      if (message?.role === "user") return userTextFromMessage(message)
    }
    return ""
  }, [visibleMessages])

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex min-h-0 w-full flex-1 flex-col">
        <Conversation className="min-h-0">
          <ConversationContent>
            {visibleMessages.length === 0 && !showThinking ? (
              <ConversationEmptyState
                title={t("emptyTitle")}
                description={t("emptyDescription")}
              />
            ) : (
              <>
                {visibleMessages.map((message) => {
                  const isLastAssistant =
                    message.role === "assistant" &&
                    message.id === lastVisible?.id &&
                    !isBusy
                  return (
                    <Message from={message.role} key={message.id}>
                      <MessageParts
                        message={message}
                        agentId={agentId}
                        threadId={threadId}
                        resourceId={resourceId}
                        modelId={agentQuery.data?.modelId}
                        provider={agentQuery.data?.provider}
                      />
                      {isLastAssistant ? (
                        <MessageFollowUps
                          agentId={agentId}
                          threadId={threadId}
                          messageId={message.id}
                          userText={lastUserText}
                          assistantText={userTextFromMessage(message)}
                          onSelect={submitPrompt}
                        />
                      ) : null}
                    </Message>
                  )
                })}
                {showThinking ? <ThinkingIndicator /> : null}
              </>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
        <div className="mx-auto w-full max-w-prose shrink-0 border-t bg-background py-3">
          <AgentTaskList tasks={tasks} />
          <MessageQueue label={t("queued")} messages={queuedMessages} />
          <PromptInput
            className={queuedMessages.length > 0 ? "rounded-t-none" : undefined}
            onSubmit={async ({ text }) => {
              if (!text?.trim()) return
              await submitPrompt(text)
            }}
          >
            <PromptInputBody>
              <PromptInputTextarea placeholder={t("promptPlaceholder")} />
            </PromptInputBody>
            <PromptInputFooter>
              <PromptInputSubmit onStop={stop} status={status} />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </div>
  )
}
