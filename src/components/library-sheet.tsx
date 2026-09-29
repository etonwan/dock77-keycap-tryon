import { useRef, type ReactNode } from "react"
import { menuTile } from "@/components/image-drop"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

// The drawer shared by the keyboard and keycap libraries: a graphite panel
// from the right with a title, a body the library lays out, and a footer
// holding the pick and the key that uses it.
export function LibrarySheet({
  open,
  onOpenChange,
  title,
  description,
  header,
  footer,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  /** Extra rows under the title, such as brand tabs. */
  header?: ReactNode
  footer: ReactNode
  children: ReactNode
}) {
  const drawer = useRef<HTMLDivElement>(null)
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        ref={drawer}
        // On touch screens, focusing a search field would pop up the
        // on-screen keyboard over the pictures, so focus the drawer itself.
        initialFocus={() => (matchMedia("(pointer: coarse)").matches ? drawer.current : true)}
        side="right"
        className="w-full gap-0 border-0 bg-case p-0 shadow-[inset_1px_0_0_oklch(1_0_0/0.07),-24px_0_48px_-28px_oklch(0_0_0/0.9)] data-[side=right]:w-full sm:rounded-l-[20px] data-[side=right]:sm:max-w-3xl"
      >
        <header className="flex flex-col gap-3 px-5 pt-5 pb-4">
          <div className="flex items-baseline gap-3 pr-10">
            <SheetTitle className="text-base font-semibold tracking-tight">{title}</SheetTitle>
            <SheetDescription className="text-xs">{description}</SheetDescription>
          </div>
          {header}
        </header>
        {children}
        {footer}
      </SheetContent>
    </Sheet>
  )
}

/** A picture to pick in a library grid, with its name and a muted detail. */
export function LibraryCard({
  src,
  name,
  detail,
  selected,
  onClick,
}: {
  src: string
  name: string
  detail?: string | number
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      // Long names wrap to two lines; the tooltip shows the rest.
      title={name}
      onClick={onClick}
      className="group/tile flex min-w-0 flex-col gap-1.5 rounded-lg text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <span
        className={cn(
          menuTile,
          "block",
          // Drawn outside the picture: renders are mostly light, so an inner edge would vanish.
          selected && "outline-2 outline-offset-2 outline-primary",
        )}
      >
        <img src={src} alt="" loading="lazy" className="aspect-[16/9] w-full object-cover" />
      </span>
      <span className="flex min-w-0 items-baseline gap-2 px-0.5">
        <span className={cn("line-clamp-2 text-sm break-words", selected ? "text-foreground" : "text-foreground/85")}>{name}</span>
        {detail !== undefined && <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{detail}</span>}
      </span>
    </button>
  )
}

/** The drawer's footer: what is picked (or a hint) and the key that uses it. */
export function LibraryFooter({
  hint,
  action,
  onAction,
  children,
}: {
  /** Shown while nothing is picked. */
  hint: string
  action: string
  /** Absent while nothing is picked. */
  onAction?: () => void
  children?: ReactNode
}) {
  return (
    <footer className="flex flex-col gap-3 bg-case px-5 py-4 shadow-[inset_0_1px_0_oklch(1_0_0/0.07)] sm:flex-row sm:items-end sm:gap-5 sm:rounded-bl-[20px]">
      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        {onAction ? children : <p className="text-sm text-muted-foreground">{hint}</p>}
      </div>
      <Button className="h-11 shrink-0 px-5" disabled={!onAction} onClick={onAction}>
        {action}
      </Button>
    </footer>
  )
}
