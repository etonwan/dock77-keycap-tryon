import { useState } from "react"
import { ImagePlus } from "lucide-react"
import { cn } from "@/lib/utils"

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
      className={cn(
        "relative flex cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-input bg-muted/40 transition-colors",
        "hover:border-foreground/30 hover:bg-muted/70 has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
        "data-dragging:border-primary data-dragging:bg-primary/5 data-filled:border-solid data-filled:bg-muted",
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
        <span className="flex flex-col items-center gap-2 px-4 text-center text-muted-foreground">
          <ImagePlus className="size-5" aria-hidden />
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
