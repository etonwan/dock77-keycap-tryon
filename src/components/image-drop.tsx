import { useState } from "react"
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
  className?: string
}

// Click to pick or drag images in; shows the picked images as a preview.
export function ImageDrop({ label, previews, onFiles, multiple = false, compact = false, className }: ImageDropProps) {
  const [dragging, setDragging] = useState(false)
  const pick = (list: FileList | null) => {
    const files = [...(list ?? [])]
    if (files.length > 0) onFiles(multiple ? files : files.slice(0, 1))
  }

  return (
    <label
      data-dragging={dragging || undefined}
      data-filled={previews.length > 0 ? "" : undefined}
      onDragOver={(event) => {
        event.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault()
        setDragging(false)
        pick(event.dataTransfer.files)
      }}
      // A socket recessed into the case: inner shadow from the top edge.
      className={cn(
        "group/drop relative flex cursor-pointer items-center justify-center overflow-hidden rounded-[10px] bg-well text-muted-foreground/70",
        "shadow-[inset_0_2px_5px_oklch(0_0_0/0.55),inset_0_0_0_1px_oklch(1_0_0/0.06)] transition-[color,box-shadow] duration-150",
        "hover:text-foreground hover:shadow-[inset_0_2px_5px_oklch(0_0_0/0.55),inset_0_0_0_1px_oklch(1_0_0/0.16)]",
        "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
        "data-dragging:text-primary data-dragging:shadow-[inset_0_2px_5px_oklch(0_0_0/0.55),inset_0_0_0_1px_var(--primary)]",
        className,
      )}
    >
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple={multiple}
        aria-label={label}
        className="sr-only"
        onChange={(event) => {
          pick(event.target.files)
          event.target.value = ""
        }}
      />
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
    </label>
  )
}
