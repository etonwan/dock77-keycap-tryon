import { useMemo, useRef, useState } from "react"
import { Check, Search } from "lucide-react"
import { menuTile } from "@/components/image-drop"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { Spinner } from "@/components/ui/spinner"
import {
  BRANDS,
  COLOR_FAMILIES,
  imagePreset,
  useLibrary,
  type Brand,
  type ColorFamily,
  type KeycapSet,
} from "@/lib/keycap-library"
import { MAX_ADDONS, type Preset } from "@/lib/try-on"
import { cn } from "@/lib/utils"

/** The picked set: one of its base kits and the add-ons to go with it. */
type Selection = { set: KeycapSet; base: string; addons: string[] }

// Picking a set takes its first base kit and every add-on the slot can hold.
function select(set: KeycapSet): Selection {
  return { set, base: set.bases[0], addons: set.addons.slice(0, MAX_ADDONS) }
}

// A pressed filter reads like a lit key: raised surface, bright text.
const filterButton =
  "flex items-center gap-2 rounded-lg text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-pressed:bg-muted aria-pressed:text-foreground"

function Swatch({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      className="size-3 shrink-0 rounded-full shadow-[inset_0_0_0_1px_oklch(1_0_0/0.14)]"
      style={{ background: color }}
    />
  )
}

type KeycapLibraryProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called with the picked base kit and add-ons; the library then closes. */
  onUse: (base: Preset, addons: Preset[]) => void
}

// A drawer for browsing a brand's keycap sets: filter by name, color, and
// year, pick a set, then choose which of its images go into the slots.
export function KeycapLibrary({ open, onOpenChange, onUse }: KeycapLibraryProps) {
  const [brand, setBrand] = useState<Brand>(BRANDS[0])
  const { library, retry } = useLibrary(brand, open)
  const [query, setQuery] = useState("")
  const [color, setColor] = useState<ColorFamily | null>(null)
  const [year, setYear] = useState<number | null>(null)
  const [selection, setSelection] = useState<Selection | null>(null)
  const drawer = useRef<HTMLDivElement>(null)

  const sets = library.status === "ready" ? library.sets : []
  const years = useMemo(() => [...new Set(sets.map((set) => set.year))].sort(), [sets])
  // Newest first; within a year, in the order of the brand's catalog.
  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return sets
      .filter(
        (set) =>
          (!needle || set.name.toLowerCase().includes(needle)) &&
          (!color || set.colors.includes(color)) &&
          (!year || set.year === year),
      )
      .sort((a, b) => b.year - a.year)
  }, [sets, query, color, year])
  const filtered = Boolean(query.trim() || color || year)
  const caption = [color ?? "全部", ...(year ? [year] : [])].join(" · ")

  function switchBrand(next: Brand) {
    setBrand(next)
    setSelection(null)
  }

  function clearFilters() {
    setQuery("")
    setColor(null)
    setYear(null)
  }

  function use() {
    if (!selection) return
    const { set, base, addons } = selection
    onUse(
      imagePreset(brand, set, base, "base kit"),
      addons.map((addon, index) => imagePreset(brand, set, addon, `add-on ${index + 1}`)),
    )
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        ref={drawer}
        // On touch screens, focusing the search field would pop up the
        // on-screen keyboard over the sets, so focus the drawer itself.
        initialFocus={() => (matchMedia("(pointer: coarse)").matches ? drawer.current : true)}
        side="right"
        className="w-full gap-0 border-0 bg-case p-0 shadow-[inset_1px_0_0_oklch(1_0_0/0.07),-24px_0_48px_-28px_oklch(0_0_0/0.9)] data-[side=right]:w-full sm:rounded-l-[20px] data-[side=right]:sm:max-w-3xl"
      >
        <header className="flex flex-col gap-3 px-5 pt-5 pb-4">
          <div className="flex items-baseline gap-3 pr-10">
            <SheetTitle className="text-base font-semibold tracking-tight">键帽库</SheetTitle>
            <SheetDescription className="text-xs">
              {brand.name}
              {library.status === "ready" && ` · ${sets.length} 套`}
            </SheetDescription>
          </div>
          {/* Brand tabs appear once there is more than one brand. */}
          {BRANDS.length > 1 && (
            <div className="flex gap-1">
              {BRANDS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={item.id === brand.id}
                  onClick={() => switchBrand(item)}
                  className={cn(filterButton, "h-8 px-3")}
                >
                  {item.name}
                </button>
              ))}
            </div>
          )}
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto md:flex-row md:overflow-hidden">
          <aside className="flex shrink-0 flex-col gap-4 px-5 pb-4 md:w-48 md:overflow-y-auto md:pr-2">
            <div className="relative">
              <Search aria-hidden className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索名称"
                aria-label="搜索键帽名称"
                className="h-9 rounded-lg border-0 bg-well pl-8 shadow-[inset_0_2px_5px_oklch(0_0_0/0.55),inset_0_0_0_1px_oklch(1_0_0/0.06)] focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring dark:bg-well"
              />
            </div>

            <div role="group" aria-label="颜色" className="flex flex-col gap-1.5">
              <div className="px-0.5 text-xs text-muted-foreground">颜色</div>
              {/* A scrolling row on phones, a list beside the grid on wider screens. */}
              <div className="-mx-5 flex gap-1 overflow-x-auto px-5 md:mx-0 md:flex-col md:overflow-visible md:px-0">
                <button type="button" aria-pressed={color === null} onClick={() => setColor(null)} className={cn(filterButton, "h-8 shrink-0 px-2.5")}>
                  <Swatch color="conic-gradient(oklch(0.95 0.012 90) 0 50%, oklch(0.22 0.004 260) 0)" />
                  全部
                </button>
                {COLOR_FAMILIES.map((family) => (
                  <button
                    key={family.name}
                    type="button"
                    aria-pressed={color === family.name}
                    onClick={() => setColor(color === family.name ? null : family.name)}
                    className={cn(filterButton, "h-8 shrink-0 px-2.5")}
                  >
                    <Swatch color={family.swatch} />
                    {family.name}
                  </button>
                ))}
              </div>
            </div>

            {years.length > 0 && (
              <div role="group" aria-label="年份" className="flex flex-col gap-1.5">
                <div className="px-0.5 text-xs text-muted-foreground">年份</div>
                <div className="grid grid-cols-6 gap-1 md:grid-cols-2">
                  {years.map((item) => (
                    <button
                      key={item}
                      type="button"
                      aria-pressed={year === item}
                      onClick={() => setYear(year === item ? null : item)}
                      className={cn(filterButton, "h-8 justify-center tabular-nums")}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>

          <section aria-label="键帽" className="flex min-w-0 flex-1 flex-col gap-3 px-5 pb-5 md:overflow-y-auto md:pl-3">
            {library.status === "loading" && (
              <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
                <Spinner /> 正在加载键帽库…
              </div>
            )}
            {library.status === "error" && (
              <div className="flex flex-col items-start gap-3 py-12 text-sm">
                <span className="text-destructive">键帽库加载失败，请检查网络后重试。</span>
                <Button variant="secondary" className="h-9 px-4" onClick={retry}>
                  重试
                </Button>
              </div>
            )}
            {library.status === "ready" && (
              <>
                <div className="px-0.5 text-sm">
                  {caption}
                  <span className="text-muted-foreground"> · {shown.length} 套</span>
                </div>
                {shown.length === 0 ? (
                  <div className="flex flex-col items-start gap-3 py-8 text-sm text-muted-foreground">
                    没有符合条件的键帽。
                    {filtered && (
                      <Button variant="secondary" className="h-9 px-4" onClick={clearFilters}>
                        清除筛选
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-x-3 gap-y-4 lg:grid-cols-3">
                    {shown.map((set) => {
                      const selected = selection?.set.id === set.id
                      return (
                        <button
                          key={set.id}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => setSelection(selected ? null : select(set))}
                          className="group/tile flex min-w-0 flex-col gap-1.5 rounded-lg text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        >
                          <span
                            className={cn(
                              menuTile,
                              "block",
                              // Drawn outside the image: renders are mostly light, so an inner edge would vanish.
                              selected && "outline-2 outline-offset-2 outline-primary",
                            )}
                          >
                            <img
                              src={`/keycaps/${brand.id}/thumbs/${set.bases[0]}.webp`}
                              alt=""
                              loading="lazy"
                              className="aspect-[16/9] w-full object-cover"
                            />
                          </span>
                          <span className="flex min-w-0 items-baseline gap-2 px-0.5">
                            <span className={cn("truncate text-sm", selected ? "text-foreground" : "text-foreground/85")}>{set.name}</span>
                            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{set.year}</span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </section>
        </div>

        <SelectionBar brand={brand} selection={selection} onChange={setSelection} onUse={use} />
      </SheetContent>
    </Sheet>
  )
}

// The drawer's footer: the picked set's base kits (pick one) and add-ons
// (toggle each), and the key that puts them into the slots.
function SelectionBar({
  brand,
  selection,
  onChange,
  onUse,
}: {
  brand: Brand
  selection: Selection | null
  onChange: (selection: Selection) => void
  onUse: () => void
}) {
  const full = selection !== null && selection.addons.length >= MAX_ADDONS
  function toggleAddon(addon: string) {
    if (!selection) return
    const { set, addons } = selection
    const next = addons.includes(addon) ? addons.filter((item) => item !== addon) : [...addons, addon]
    // Keep the catalog's order, so add-on 1 is always the same image.
    onChange({ ...selection, addons: set.addons.filter((item) => next.includes(item)) })
  }

  return (
    <footer className="flex flex-col gap-3 bg-case px-5 py-4 shadow-[inset_0_1px_0_oklch(1_0_0/0.07)] sm:flex-row sm:items-end sm:gap-5 sm:rounded-bl-[20px]">
      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        {selection ? (
          <>
            <div className="min-w-0 truncate text-sm">
              <span className="font-medium">{selection.set.name}</span>
              <span className="text-muted-foreground">
                {" · base kit"}
                {selection.addons.length > 0 && ` + ${selection.addons.length} 个 add-on`}
                {selection.set.addons.length > MAX_ADDONS && ` · add-on 最多 ${MAX_ADDONS} 张`}
              </span>
            </div>
            <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pt-1 pb-1">
              {selection.set.bases.map((base, index) => (
                <Thumb
                  key={base}
                  src={`/keycaps/${brand.id}/thumbs/${base}.webp`}
                  label={selection.set.bases.length > 1 ? `base kit ${index + 1}` : "base kit"}
                  on={selection.base === base}
                  // With one base kit there is nothing to choose.
                  onClick={selection.set.bases.length > 1 ? () => onChange({ ...selection, base }) : undefined}
                />
              ))}
              {selection.set.addons.map((addon, index) => {
                const on = selection.addons.includes(addon)
                return (
                  <Thumb
                    key={addon}
                    src={`/keycaps/${brand.id}/thumbs/${addon}.webp`}
                    label={`add-on ${index + 1}`}
                    on={on}
                    check
                    disabled={!on && full}
                    onClick={() => toggleAddon(addon)}
                  />
                )
              })}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">选一套键帽，它的 base kit 和 add-on 会一起放进上方的槽位。</p>
        )}
      </div>
      <Button className="h-11 shrink-0 px-5" disabled={!selection} onClick={onUse}>
        使用这套
      </Button>
    </footer>
  )
}

function Thumb({
  src,
  label,
  on,
  check = false,
  disabled = false,
  onClick,
}: {
  src: string
  label: string
  on: boolean
  /** Shows a check mark when on, for images that are toggled one by one. */
  check?: boolean
  disabled?: boolean
  onClick?: () => void
}) {
  const image = (
    <>
      <span
        className={cn(
          menuTile,
          "block w-20 transition-opacity duration-150",
          on ? "outline-2 outline-offset-2 outline-primary" : "opacity-45",
        )}
      >
        <img src={src} alt="" className="aspect-[16/9] w-full object-cover" />
        {check && on && (
          <span aria-hidden className="absolute top-1 right-1 grid size-4 place-items-center rounded-full bg-primary text-primary-foreground">
            <Check className="size-3" strokeWidth={3} />
          </span>
        )}
      </span>
      <span className={cn("text-xs", on ? "text-foreground" : "text-muted-foreground")}>{label}</span>
    </>
  )
  if (!onClick) return <span className="flex shrink-0 flex-col gap-1">{image}</span>
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="group/tile flex shrink-0 flex-col gap-1 rounded-lg text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed"
    >
      {image}
    </button>
  )
}
