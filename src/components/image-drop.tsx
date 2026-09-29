import { useId, useRef, useState, type DragEvent } from "react"
import { ImageUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { Preset } from "@/lib/try-on"
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

type ImageDropProps = {
  label: string
  /** Preview URLs of the picked images; several are shown as a mosaic. */
  previews: string[]
  onFiles: (files: File[]) => void
  multiple?: boolean
  /** Icon only, for small thumbnail-sized drop targets. */
  compact?: boolean
  /** Ready-made images. Clicking then opens a menu with these and uploading
   *  your own; dropping a file still works. */
  presets?: { title: string; items: Preset[]; onPick: (preset: Preset) => void }
  className?: string
}

// Click to pick or drag images in; shows the picked images as a preview.
export function ImageDrop({ label, previews, onFiles, multiple = false, compact = false, presets, className }: ImageDropProps) {
  const [dragging, setDragging] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const presetsTitleId = useId()
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
      type="file"
      accept="image/jpeg,image/png,image/webp"
      multiple={multiple}
      aria-label={label}
      // With presets the menu opens the file picker, so the input itself
      // stays out of the tab order.
      tabIndex={presets ? -1 : undefined}
      aria-hidden={presets ? true : undefined}
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

  if (!presets) {
    return (
      <label {...socket}>
        {input}
        {preview}
      </label>
    )
  }

  // The socket becomes a menu button: pick a preset, or upload your own.
  return (
    <Popover open={menuOpen} onOpenChange={setMenuOpen}>
      <PopoverTrigger aria-label={label} {...socket}>
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
        className="w-[min(22rem,calc(100vw-2rem))] gap-3 rounded-[14px] p-3 shadow-[inset_0_1px_0_oklch(1_0_0/0.07),0_24px_48px_-24px_oklch(0_0_0/0.9)] motion-reduce:data-closed:animate-none motion-reduce:data-open:animate-none"
      >
        <div role="group" aria-labelledby={presetsTitleId} className="flex flex-col gap-2">
          <div id={presetsTitleId} className="px-0.5 text-xs text-muted-foreground">
            {presets.title}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {presets.items.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  presets.onPick(preset)
                }}
                className="group/preset flex min-w-0 flex-col gap-1.5 rounded-lg text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {/* Framed like the stage; the frame lights up bone on hover. */}
                <span className="relative block overflow-hidden rounded-lg bg-well after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:shadow-[inset_0_0_0_1px_oklch(1_0_0/0.07)] after:transition-shadow after:duration-150 group-hover/preset:after:shadow-[inset_0_0_0_1px_var(--ring)]">
                  <img src={preset.thumb} alt="" className="aspect-[3/2] w-full object-cover" />
                </span>
                <span className="truncate px-0.5 text-xs text-muted-foreground transition-colors duration-150 group-hover/preset:text-foreground">
                  {preset.name}
                </span>
              </button>
            ))}
          </div>
        </div>
        <Button
          variant="secondary"
          className="h-10 w-full gap-2"
          onClick={() => {
            setMenuOpen(false)
            fileInput.current?.click()
          }}
        >
          <ImageUp className="opacity-60" aria-hidden />
          上传自己的照片
        </Button>
      </PopoverContent>
    </Popover>
  )
}
