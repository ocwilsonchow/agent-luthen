"use client"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { ArrowUpRightIcon, BookIcon, ChevronDownIcon } from "lucide-react"
import type { ComponentProps } from "react"

export type SourcesProps = ComponentProps<"div">

export const Sources = ({ className, ...props }: SourcesProps) => (
  <Collapsible
    className={cn("group/sources not-prose w-full text-xs", className)}
    {...props}
  />
)

export type SourcesTriggerProps = ComponentProps<typeof CollapsibleTrigger> & {
  count: number
}

export const SourcesTrigger = ({
  className,
  count,
  children,
  ...props
}: SourcesTriggerProps) => (
  <CollapsibleTrigger
    className={cn(
      "flex w-fit cursor-pointer items-center gap-1.5 rounded-md text-muted-foreground transition-colors",
      "hover:text-foreground",
      "outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
      className
    )}
    {...props}
  >
    {children ?? (
      <>
        <BookIcon className="size-3.5" />
        <span className="font-medium">Used {count} sources</span>
        <ChevronDownIcon className="size-3.5 transition-transform group-data-[state=open]/sources:rotate-180" />
      </>
    )}
  </CollapsibleTrigger>
)

export type SourcesContentProps = ComponentProps<typeof CollapsibleContent>

export const SourcesContent = ({
  className,
  ...props
}: SourcesContentProps) => (
  <CollapsibleContent
    className={cn(
      "mt-2 flex flex-col gap-0.5",
      "data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-1 data-[state=open]:slide-in-from-top-1 outline-none data-[state=closed]:animate-out data-[state=open]:animate-in",
      className
    )}
    {...props}
  />
)

export type SourceProps = ComponentProps<"a">

export const Source = ({
  href,
  title,
  className,
  children,
  ...props
}: SourceProps) => (
  <a
    className={cn(
      "group/source flex min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-foreground transition-colors",
      "hover:bg-muted/60",
      "outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
      className
    )}
    href={href}
    rel="noreferrer"
    target="_blank"
    {...props}
  >
    {children ?? (
      <>
        <BookIcon className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="min-w-0 truncate font-medium">{title}</span>
        <ArrowUpRightIcon className="ml-auto size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/source:opacity-100" />
      </>
    )}
  </a>
)
