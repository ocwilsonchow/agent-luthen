"use client"

import { CornerDownRightIcon } from "lucide-react"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function FollowUpList({
  title,
  items,
  pending = false,
  disabled = false,
  skeletonCount = 5,
  headerAction,
  onSelect,
  className,
}: {
  title: string
  items: string[]
  pending?: boolean
  disabled?: boolean
  skeletonCount?: number
  headerAction?: ReactNode
  onSelect: (item: string) => void
  className?: string
}) {
  const showSkeleton = pending && items.length === 0
  if (!showSkeleton && items.length === 0 && !headerAction) return null

  return (
    <section className={cn("w-full text-left", className)}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <h3 className="font-semibold text-sm">{title}</h3>
        {headerAction}
      </div>
      {showSkeleton || items.length > 0 ? (
        <ul className={cn("border-border border-t", pending && "opacity-60")}>
          {showSkeleton
            ? Array.from({ length: skeletonCount }, (_, index) => (
                <li className="border-border border-b" key={index}>
                  <div className="flex w-full items-start gap-3 py-3">
                    <CornerDownRightIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <span className="mt-0.5 h-4 w-3/4 animate-pulse rounded-md bg-muted" />
                  </div>
                </li>
              ))
            : items.map((item) => (
                <li className="border-border border-b" key={item}>
                  <button
                    className="flex w-full items-start gap-3 py-3 text-left text-sm transition-colors hover:bg-muted/40 disabled:pointer-events-none"
                    disabled={disabled || pending}
                    type="button"
                    onClick={() => onSelect(item)}
                  >
                    <CornerDownRightIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 text-pretty">{item}</span>
                  </button>
                </li>
              ))}
        </ul>
      ) : null}
    </section>
  )
}
