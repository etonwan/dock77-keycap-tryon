import { useId, useRef, useState, type DragEvent, type ReactNode } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

// An empty switch seen from above: housing plus the cross-shaped MX stem,
// waiting for its keycap.
function SwitchStem({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" aria-hidden className={className}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3" opacity={0.55} />
      <path d="M10.5 7.25h3v3.25h3.25v3h-3.25v3.25h-3v-3.25H7.25v-3h3.25z" />
    </svg>
  )
}

// A tile in the preset menu, framed like the stage: well-dark with a faint
// inner edge that lights up bone when its button (a `group/tile`) is hovered.
export const menuTile =
  "relative overflow-hidden rounded-lg bg-well after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:shadow-[inset_0_0_0_1px_oklch(1_0_0/0.07)] after:transition-shadow after:duration-150 group-hover/tile:after:shadow-[inset_0_0_0_1px_var(--ring)]"

/** A captioned group in a slot menu. */
export function MenuSection({ title, children }: { title: string; children: ReactNode }) {
  const titleId = useId()
  return (
    <div role="group" aria-labelledby={titleId} className="flex flex-col gap-2">
      <div id={titleId} className="px-0.5 text-xs text-muted-foreground">
        {title}
      </div>
      {children}
    </div>
  )
}

/** A full-width menu tile that does something: an icon, what it does, and a hint. */
export function MenuAction({
  icon,
  title,
  hint,
  onClick,
  className,
}: {
  icon: ReactNode
  title: string
  hint: string
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        menuTile,
        "group/tile flex h-16 items-center gap-3 px-4 text-left text-muted-foreground transition-colors duration-150 hover:text-foreground",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className,
      )}
    >
      <span className="shrink-0 transition-transform duration-150 group-hover/tile:scale-110 motion-reduce:transition-none motion-reduce:group-hover/tile:scale-100">
        {icon}
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm font-medium text-foreground">{title}</span>
        <span className="truncate text-xs">{hint}</span>
      </span>
    </button>
  )
}

type ImageDropProps = {
  label: string
  /** Preview URLs of the picked images; several are shown as a mosaic. */
  previews: string[]
  onFiles: (files: File[]) => void
  multiple?: boolean
  /** Icon only, for small thumbnail-sized drop targets. */
  compact?: boolean
  /** Other sources for this slot. Clicking then opens a menu with these
   *  above uploading your own; dropping a file still works. `sources` gets a
   *  function that closes the menu. */
  menu?: { sources: (close: () => void) => ReactNode; own: { title: string; action: string } }
  /** Id of the control a caption beside the socket can point at with
   *  `<label htmlFor>`, so clicking the caption works like clicking the socket. */
  id?: string
  className?: string
}

// Click to pick or drag images in; shows the picked images as a preview.
export function ImageDrop({ label, previews, onFiles, multiple = false, compact = false, menu, id, className }: ImageDropProps) {
  const [dragging, setDragging] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const pick = (list: FileList | null) => {
    const files = [...(list ?? [])]
    if (files.length > 0) onFiles(multiple ? files : files.slice(0, 1))
  }

  const socket = {
    "data-dragging": dragging || undefined,
    "data-filled": previews.length > 0 ? "" : undefined,
    onDragOver: (event: DragEvent) => {
      event.preventDefault()
      setDragging(true)
    },
    onDragLeave: () => setDragging(false),
    onDrop: (event: DragEvent) => {
      event.preventDefault()
      setDragging(false)
      pick(event.dataTransfer.files)
    },
    // A socket recessed into the case: inner shadow from the top edge.
    className: cn(
      "group/drop relative flex cursor-pointer items-center justify-center overflow-hidden rounded-[10px] bg-well text-muted-foreground/70",
      "shadow-[inset_0_2px_5px_oklch(0_0_0/0.55),inset_0_0_0_1px_oklch(1_0_0/0.06)] transition-[color,box-shadow] duration-150",
      "hover:text-foreground hover:shadow-[inset_0_2px_5px_oklch(0_0_0/0.55),inset_0_0_0_1px_oklch(1_0_0/0.16)]",
      // Hovering a caption that labels the file input lights the socket too.
      "has-[input:hover]:text-foreground has-[input:hover]:shadow-[inset_0_2px_5px_oklch(0_0_0/0.55),inset_0_0_0_1px_oklch(1_0_0/0.16)]",
      // Stays lit while its menu is open.
      "data-popup-open:text-foreground data-popup-open:shadow-[inset_0_2px_5px_oklch(0_0_0/0.55),inset_0_0_0_1px_oklch(1_0_0/0.16)]",
      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
      "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
      "data-dragging:text-primary data-dragging:shadow-[inset_0_2px_5px_oklch(0_0_0/0.55),inset_0_0_0_1px_var(--primary)]",
      className,
    ),
  }
  const input = (
    <input
      ref={fileInput}
      id={menu ? undefined : id}
      type="file"
      accept="image/jpeg,image/png,image/webp"
      multiple={multiple}
      aria-label={label}
      // With a menu, the menu opens the file picker, so the input itself
      // stays out of the tab order.
      tabIndex={menu ? -1 : undefined}
      aria-hidden={menu ? true : undefined}
      className="sr-only"
      onChange={(event) => {
        pick(event.target.files)
        event.target.value = ""
      }}
    />
  )
  const preview = (
    <>
      {previews.length === 0 && (
        <span className="flex flex-col items-center gap-2 px-4 text-center">
          <SwitchStem className="size-6 transition-transform duration-150 group-hover/drop:scale-110 motion-reduce:transition-none motion-reduce:group-hover/drop:scale-100" />
          {!compact && <span className="text-sm">点击选择，或把图片拖到这里</span>}
        </span>
      )}
      {previews.length === 1 && <img src={previews[0]} alt="" className="size-full object-contain" />}
      {previews.length > 1 && (
        <span className="grid size-full grid-cols-2 gap-px">
          {previews.map((url) => (
            <img key={url} src={url} alt="" className="size-full min-h-0 object-cover" />
          ))}
        </span>
      )}
    </>
  )

  if (!menu) {
    return (
      <label {...socket}>
        {input}
        {preview}
      </label>
    )
  }

  // The socket becomes a menu button: pick from another source, or upload your own.
  return (
    <Popover open={menuOpen} onOpenChange={setMenuOpen}>
      <PopoverTrigger id={id} aria-label={label} {...socket}>
        {preview}
      </PopoverTrigger>
      {input}
      <PopoverContent
        // Opens below the socket's container (the socket and its caption), so
        // on narrow screens, where the caption sits under the socket, the
        // menu leaves it readable.
        anchor={() => fileInput.current?.parentElement ?? null}
        align="start"
        sideOffset={8}
        aria-label={label}
        className="w-[min(22rem,calc(100vw-2rem))] gap-4 rounded-[14px] p-3 shadow-[inset_0_1px_0_oklch(1_0_0/0.07),0_24px_48px_-24px_oklch(0_0_0/0.9)] motion-reduce:data-closed:animate-none motion-reduce:data-open:animate-none"
      >
        {/* Sibling sources for the same slot: each gets the same caption and
            the same kind of tile. */}
        {menu.sources(() => setMenuOpen(false))}
        <MenuSection title={menu.own.title}>
          {/* An empty socket, like the slot itself: bring your own. */}
          <MenuAction
            icon={<SwitchStem className="size-6" />}
            title={menu.own.action}
            hint="JPG、PNG 或 WebP，也可直接拖进上方的槽位"
            className="shadow-[inset_0_2px_5px_oklch(0_0_0/0.55)]"
            onClick={() => {
              setMenuOpen(false)
              fileInput.current?.click()
            }}
          />
        </MenuSection>
      </PopoverContent>
    </Popover>
  )
}
