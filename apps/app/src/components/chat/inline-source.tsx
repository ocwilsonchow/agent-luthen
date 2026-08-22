"use client"

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { faviconSrc, parseRefUrl } from "@/lib/chat/inline-source"
import {
  hostnameFromHref,
  sourceDisplay,
  type ChatSource,
} from "@/lib/chat/message-sources"
import { cn } from "@/lib/utils"
import { ArrowUpRightIcon, GlobeIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type { ExtraProps } from "streamdown"

const SourceLookupContext = createContext<ReadonlyMap<string, ChatSource>>(
  new Map()
)

export function SourceLookupProvider({
  sources,
  children,
}: {
  sources: ChatSource[]
  children: ReactNode
}) {
  const map = useMemo(() => {
    const next = new Map<string, ChatSource>()
    for (const source of sources) next.set(source.href, source)
    return next
  }, [sources])

  return (
    <SourceLookupContext.Provider value={map}>
      {children}
    </SourceLookupContext.Provider>
  )
}

function useSourceByHref(href: string | undefined) {
  const map = useContext(SourceLookupContext)
  if (!href) return undefined
  return map.get(href)
}

function textFromNode(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return ""
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(textFromNode).join("")
  return ""
}

function SourceFavicon({
  hostname,
  className,
}: {
  hostname: string
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  if (failed || !hostname) {
    return <GlobeIcon aria-hidden className={className} />
  }
  return (
    <img
      alt=""
      className={cn("rounded-full bg-muted", className)}
      height={16}
      onError={() => setFailed(true)}
      src={faviconSrc(hostname)}
      width={16}
    />
  )
}

export function RefChip({
  url,
  children,
}: Record<string, unknown> &
  ExtraProps & {
    url?: string
    children?: ReactNode
  }) {
  const t = useTranslations("chat")
  const href = parseRefUrl(url)
  const source = useSourceByHref(href)
  const hostname = href ? hostnameFromHref(href) : ""
  const display = source ? sourceDisplay(source) : undefined
  const articleTitle = display?.title
  const childText = textFromNode(children).trim()

  if (!href) {
    return childText ? children : null
  }

  const publisher = childText || articleTitle || hostname
  const showArticleTitle = Boolean(
    articleTitle && articleTitle !== hostname && articleTitle !== publisher
  )

  return (
    <HoverCard closeDelay={100} openDelay={200}>
      <HoverCardTrigger asChild>
        <span
          className={cn(
            "mx-[0.12em] inline-flex cursor-pointer items-center gap-1 rounded-full px-1.5 py-[0.14em] align-baseline font-medium leading-none",
            "bg-muted/75 text-[0.85em] text-foreground whitespace-nowrap",
            "shadow-[inset_0_0_0_1px] shadow-border/70",
            "transition-colors hover:bg-muted hover:shadow-border",
            "outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          )}
          tabIndex={0}
        >
          <SourceFavicon className="size-3 shrink-0" hostname={hostname} />
          {publisher}
        </span>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 p-3" side="top" sideOffset={8}>
        <div className="flex items-center gap-2">
          <SourceFavicon className="size-4 shrink-0" hostname={hostname} />
          <span className="min-w-0 truncate font-medium text-sm">
            {publisher}
          </span>
        </div>
        <a
          className="mt-2 block font-medium text-foreground text-sm leading-snug outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/50"
          href={href}
          rel="noreferrer"
          target="_blank"
        >
          {showArticleTitle ? articleTitle : t("openSource")}
          <ArrowUpRightIcon className="ml-0.5 inline size-3.5 align-text-top text-muted-foreground" />
        </a>
        {source?.snippet ? (
          <p className="mt-2 line-clamp-4 text-muted-foreground text-xs leading-relaxed">
            {source.snippet}
          </p>
        ) : null}
        <p className="mt-2 truncate text-[11px] text-muted-foreground">
          {hostname}
        </p>
      </HoverCardContent>
    </HoverCard>
  )
}
