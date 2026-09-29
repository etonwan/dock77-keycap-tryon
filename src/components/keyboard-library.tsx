import { useState } from "react"
import { LibraryCard, LibraryFooter, LibrarySheet } from "@/components/library-sheet"
import { DOCK77, type Preset } from "@/lib/try-on"

// A drawer for picking a ready-made keyboard, laid out like the keycap
// library. Six colorways need no filters, so it is just the grid.
export function KeyboardLibrary({
  open,
  onOpenChange,
  onUse,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called with the picked keyboard; the library then closes. */
  onUse: (keyboard: Preset) => void
}) {
  const [selected, setSelected] = useState<Preset | null>(null)

  function use() {
    if (!selected) return
    onUse(selected)
    onOpenChange(false)
  }

  return (
    <LibrarySheet
      open={open}
      onOpenChange={onOpenChange}
      title="套件库"
      description={`${DOCK77.title} · ${DOCK77.items.length} 款`}
      footer={
        <LibraryFooter hint="选一款配色，它会放进上方的套件槽。" action="使用这款" onAction={selected ? use : undefined}>
          {selected && (
            <div className="min-w-0 truncate text-sm">
              <span className="font-medium">Dock77 {selected.name}</span>
            </div>
          )}
        </LibraryFooter>
      }
    >
      <section aria-label="套件" className="min-h-0 flex-1 overflow-y-auto px-5 pt-1 pb-5">
        <div className="grid grid-cols-2 gap-x-3 gap-y-4 lg:grid-cols-3">
          {DOCK77.items.map((preset) => {
            const on = selected?.name === preset.name
            return (
              <LibraryCard
                key={preset.name}
                src={preset.thumb}
                name={preset.name}
                selected={on}
                onClick={() => setSelected(on ? null : preset)}
              />
            )
          })}
        </div>
      </section>
    </LibrarySheet>
  )
}
