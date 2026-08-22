import {
  getToolName,
  isReasoningUIPart,
  isToolUIPart,
  type UIMessage,
} from "ai"

export const TASK_TOOL_IDS = [
  "task_write",
  "task_update",
  "task_complete",
  "task_check",
] as const

export type TaskToolId = (typeof TASK_TOOL_IDS)[number]
export type AgentTaskStatus = "pending" | "in_progress" | "completed"

export type AgentTask = {
  id: string
  content: string
  status: AgentTaskStatus
  activeForm?: string
}

const TASK_TOOL_ID_SET = new Set<string>(TASK_TOOL_IDS)

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

export function isTaskToolName(name: string): name is TaskToolId {
  return TASK_TOOL_ID_SET.has(name)
}

export function isTaskToolPart(part: UIMessage["parts"][number]) {
  return isToolUIPart(part) && isTaskToolName(getToolName(part))
}

export function hasVisibleChatParts(message: UIMessage) {
  if (message.role === "user") return true
  return message.parts.some((part) => {
    if (part.type === "text") return Boolean(part.text.trim())
    if (isReasoningUIPart(part)) return true
    if (part.type === "source-url" || part.type === "source-document")
      return true
    if (isToolUIPart(part)) return !isTaskToolPart(part)
    return false
  })
}

function parseStatus(value: unknown): AgentTaskStatus {
  if (value === "in_progress" || value === "completed" || value === "pending") {
    return value
  }
  return "pending"
}

function parseTask(value: unknown): AgentTask | null {
  if (!isRecord(value)) return null
  const content =
    typeof value.content === "string"
      ? value.content
      : typeof value.title === "string"
        ? value.title
        : ""
  const id = typeof value.id === "string" && value.id ? value.id : content
  if (!id && !content) return null
  return {
    id: id || content,
    content,
    status: parseStatus(value.status),
    activeForm:
      typeof value.activeForm === "string" ? value.activeForm : undefined,
  }
}

function tasksFromPayload(value: unknown): AgentTask[] | null {
  if (Array.isArray(value)) {
    const tasks = value.flatMap((item) => {
      const task = parseTask(item)
      return task ? [task] : []
    })
    if (value.length === 0 || tasks.length > 0) return tasks
    return null
  }
  if (!isRecord(value)) return null
  if (Array.isArray(value.tasks)) return tasksFromPayload(value.tasks)
  return null
}

function applyUpdate(list: AgentTask[], payload: unknown): AgentTask[] {
  if (!isRecord(payload) || typeof payload.id !== "string" || !payload.id) {
    return list
  }
  const nextStatus =
    payload.status !== undefined ? parseStatus(payload.status) : undefined
  return list.map((task) => {
    if (task.id === payload.id) {
      return {
        ...task,
        content:
          typeof payload.content === "string" ? payload.content : task.content,
        status: nextStatus ?? task.status,
        activeForm:
          typeof payload.activeForm === "string"
            ? payload.activeForm
            : task.activeForm,
      }
    }
    if (nextStatus === "in_progress" && task.status === "in_progress") {
      return { ...task, status: "pending" }
    }
    return task
  })
}

function applyComplete(list: AgentTask[], payload: unknown): AgentTask[] {
  if (!isRecord(payload) || typeof payload.id !== "string" || !payload.id) {
    return list
  }
  return list.map((task) =>
    task.id === payload.id ? { ...task, status: "completed" } : task
  )
}

function partPayloads(part: UIMessage["parts"][number]) {
  if (!isToolUIPart(part)) return []
  const payloads: unknown[] = []
  if (part.input !== undefined) payloads.push(part.input)
  if ("output" in part && part.output !== undefined) payloads.push(part.output)
  return payloads
}

export function tasksFromMessages(messages: UIMessage[]): AgentTask[] {
  let list: AgentTask[] = []

  for (const message of messages) {
    for (const part of message.parts) {
      if (!isToolUIPart(part) || !isTaskToolName(getToolName(part))) continue
      const name = getToolName(part)
      for (const payload of partPayloads(part)) {
        if (name === "task_write" || name === "task_check") {
          list = tasksFromPayload(payload) ?? list
        } else if (name === "task_update") {
          list = applyUpdate(list, payload)
          list = tasksFromPayload(payload) ?? list
        } else if (name === "task_complete") {
          list = applyComplete(list, payload)
          list = tasksFromPayload(payload) ?? list
        }
      }
    }
  }

  return list
}
