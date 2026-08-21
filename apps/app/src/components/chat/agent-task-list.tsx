"use client"

import {
  Task,
  TaskContent,
  TaskItem,
  TaskTrigger,
} from "@/components/ai-elements/task"
import type { AgentTask, AgentTaskStatus } from "@/lib/chat/agent-tasks"
import { cn } from "@/lib/utils"
import {
  CheckCircle2Icon,
  ChevronDownIcon,
  CircleIcon,
  ListTodoIcon,
  LoaderCircleIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"
import type { ReactNode } from "react"

const statusIcon: Record<AgentTaskStatus, ReactNode> = {
  pending: <CircleIcon className="size-3.5 shrink-0 text-muted-foreground" />,
  in_progress: (
    <LoaderCircleIcon className="size-3.5 shrink-0 animate-spin text-sky-600" />
  ),
  completed: (
    <CheckCircle2Icon className="size-3.5 shrink-0 text-emerald-600" />
  ),
}

export function AgentTaskList({ tasks }: { tasks: AgentTask[] }) {
  const t = useTranslations("chat")
  if (tasks.length === 0) return null

  const completed = tasks.filter((task) => task.status === "completed").length
  const title = t("taskProgress", { completed, total: tasks.length })

  return (
    <div className="mb-3">
      <Task defaultOpen>
        <TaskTrigger title={title}>
          <div className="flex w-full cursor-pointer items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground">
            <ListTodoIcon className="size-4" />
            <p className="text-sm">{title}</p>
            <ChevronDownIcon className="ml-auto size-4 transition-transform group-data-[state=open]:rotate-180" />
          </div>
        </TaskTrigger>
        <TaskContent>
          <div className="max-h-40 space-y-2 overflow-y-auto">
            {tasks.map((task) => {
              const label =
                task.status === "in_progress" && task.activeForm
                  ? task.activeForm
                  : task.content
              return (
                <TaskItem
                  key={task.id}
                  className="flex items-start gap-2 text-sm"
                >
                  <span className="mt-0.5" aria-hidden>
                    {statusIcon[task.status]}
                  </span>
                  <span
                    className={cn(
                      "min-w-0",
                      task.status === "completed" &&
                        "text-muted-foreground line-through"
                    )}
                  >
                    {label || task.id}
                  </span>
                </TaskItem>
              )
            })}
          </div>
        </TaskContent>
      </Task>
    </div>
  )
}
