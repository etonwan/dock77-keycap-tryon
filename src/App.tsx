import { useEffect, useState, type ComponentProps } from "react"
import { CornerDownLeft, Download, LibraryBig, Plus } from "lucide-react"
import { ImageDrop, MenuAction, MenuSection, PresetGrid } from "@/components/image-drop"
import { KeycapLibrary } from "@/components/keycap-library"
import { KeyboardArt } from "@/components/keyboard-art"
import { Button, buttonVariants } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { BRANDS } from "@/lib/keycap-library"
import { copy, DOCK77, formatElapsed, MAX_ADDONS, useTryOn } from "@/lib/try-on"
import { cn } from "@/lib/utils"

type Slot = {
  label: string
  previews: string[]
  onFiles: (files: File[]) => void
  status: string
  multiple?: boolean
  menu?: ComponentProps<typeof ImageDrop>["menu"]
  onClear?: () => void
}

// The status LED, like a keyboard's lock indicator: off until both required
// images are in, amber while installing, green when done, red on failure.
const LED = {
  off: "text-foreground/20 shadow-none",
  ready: "text-led-ready",
  running: "text-led-busy animate-led-pulse motion-reduce:animate-none",
  done: "text-led-done",
  error: "text-led-error",
}

// Image-first: the inputs sit on a keyboard-case bar at the top so the photo
// and the result get the rest of the page.
export default function App() {
  const tryOn = useTryOn()
  const [libraryOpen, setLibraryOpen] = useState(false)
  const { phase } = tryOn
  const running = phase.kind === "running"
  const addonStatus = tryOn.addonsTrimmed
    ? `只保留了前 ${MAX_ADDONS} 张`
    : tryOn.addons.length > 0
      ? `${tryOn.addons.length} 张`
      : `${copy.addons.optional} · 最多 ${MAX_ADDONS} 张`
  const slots: Slot[] = [
    {
      ...copy.keyboard,
      previews: tryOn.keyboardUrls,
      onFiles: tryOn.setKeyboard,
      status: tryOn.keyboard.length > 0 ? "点击更换" : "点击或拖入",
      menu: {
        sources: (close) => (
          <MenuSection title={DOCK77.title}>
            <PresetGrid
              items={DOCK77.items}
              onPick={(preset) => {
                close()
                tryOn.setKeyboard([preset])
              }}
            />
          </MenuSection>
        ),
        own: { title: "自己的套件", action: "上传照片" },
      },
    },
    {
      ...copy.keycaps,
      previews: tryOn.keycapsUrls,
      onFiles: tryOn.setKeycaps,
      status: tryOn.keycaps.length > 0 ? "点击更换" : "点击或拖入",
      menu: {
        sources: (close) => (
          <MenuSection title="键帽库">
            <MenuAction
              icon={<LibraryBig className="size-6" strokeWidth={1.5} aria-hidden />}
              title={BRANDS.length === 1 ? `打开 ${BRANDS[0].name} 键帽库` : "打开键帽库"}
              hint="按颜色、年份挑选，add-on 一起带上"
              onClick={() => {
                close()
                setLibraryOpen(true)
              }}
            />
          </MenuSection>
        ),
        own: { title: "自己的键帽", action: "上传图片" },
      },
    },
    {
      ...copy.addons,
      previews: tryOn.addonUrls,
      onFiles: tryOn.pickAddons,
      status: addonStatus,
      multiple: true,
      onClear: tryOn.addons.length > 0 ? tryOn.clearAddons : undefined,
    },
  ]
  const missing = [
    ...(tryOn.keyboard.length === 0 ? [copy.keyboard.label] : []),
    ...(tryOn.keycaps.length === 0 ? [copy.keycaps.label] : []),
  ]
  const led = phase.kind === "idle" ? (tryOn.canGenerate ? "ready" : "off") : phase.kind
  const stageImage = phase.kind === "done" ? phase.imageUrl : tryOn.keyboardUrls[0]

  // The install key is the Enter key: pressing Enter on the real keyboard
  // presses it on screen. Focused controls, open menus, and IME composition
  // keep Enter.
  const { canGenerate, generate } = tryOn
  useEffect(() => {
    if (!canGenerate) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Enter" || event.repeat || event.isComposing) return
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return
      if (event.target instanceof Element && event.target.closest("button, a, input, textarea, select, [contenteditable], [role=dialog]")) return
      event.preventDefault()
      generate()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [canGenerate, generate])

  return (
    <div className="mx-auto flex min-h-svh max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6">
      <header className="rounded-[20px] bg-case p-4 shadow-[inset_0_1px_0_oklch(1_0_0/0.07),0_1px_0_oklch(0_0_0/0.4),0_24px_48px_-28px_oklch(0_0_0/0.9)] sm:p-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:gap-6">
          <div className="flex items-center gap-3 xl:mr-auto">
            {/* Brand keycap with a hanger legend: the fitting room (试衣间) for
                keycaps. public/favicon.svg draws the same cap. */}
            <span aria-hidden className="keycap keycap-bone grid size-9 place-items-center [--cap-depth:4px] [--cap-radius:8px]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="size-5">
                <path d="M10 6.5a2 2 0 1 1 2.8 1.8c-.5.3-.8.8-.8 1.3v.9" />
                <path d="M12 10.5 3.5 16.6a.8.8 0 0 0 .5 1.4h16a.8.8 0 0 0 .5-1.4z" />
              </svg>
            </span>
            <h1 className="text-base font-semibold tracking-tight">{copy.title}</h1>
          </div>
          <div className="grid grid-cols-3 gap-3 xl:flex xl:items-center xl:gap-4">
            {slots.map((slot, index) => (
              <div key={slot.label} className="flex min-w-0 flex-col gap-2 xl:flex-row xl:items-center xl:gap-3">
                {index > 0 && <Plus className="hidden size-3.5 shrink-0 text-muted-foreground/60 xl:block" aria-hidden />}
                <ImageDrop
                  compact
                  label={slot.label}
                  previews={slot.previews}
                  onFiles={slot.onFiles}
                  multiple={slot.multiple}
                  menu={slot.menu}
                  className="aspect-video w-full shrink-0 xl:aspect-auto xl:h-14 xl:w-24"
                />
                <div className="min-w-0 leading-tight">
                  <div className="text-sm font-medium">{slot.label}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {slot.status}
                    {slot.onClear && (
                      <>
                        {" · "}
                        <button type="button" onClick={slot.onClear} className="underline-offset-2 hover:text-foreground hover:underline">
                          清除
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 xl:shrink-0">
            <Button variant="secondary" className="h-11 px-4" disabled={!tryOn.canClear} onClick={tryOn.clear}>
              重置
            </Button>
            {/* Stays pressed down while the keycaps are being installed. */}
            <Button
              className="h-11 flex-1 gap-2.5 px-5 data-held:opacity-100 xl:w-44 xl:flex-none"
              data-held={running || undefined}
              aria-keyshortcuts="Enter"
              disabled={!tryOn.canGenerate}
              onClick={tryOn.generate}
            >
              {running ? <Spinner /> : <CornerDownLeft className="opacity-55" aria-hidden />}
              {copy.buttonLabel(phase)}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex flex-col gap-3 pb-10">
        <div className="flex min-h-10 flex-wrap items-center gap-x-4 gap-y-2 px-1">
          <p
            key={phase.kind === "error" ? "alert" : "status"}
            role={phase.kind === "error" ? "alert" : "status"}
            className="mr-auto flex min-w-0 items-center gap-2.5 text-sm"
          >
            <span aria-hidden className={cn("size-2 shrink-0 rounded-full bg-current shadow-[0_0_10px_currentColor]", LED[led])} />
            <span className={phase.kind === "error" ? "text-destructive" : undefined}>{copy.status(phase, missing)}</span>
          </p>
          {running && <span className="font-mono text-sm text-muted-foreground tabular-nums">{formatElapsed(tryOn.elapsed)}</span>}
          {phase.kind === "done" && (
            <div className="flex items-center gap-4 max-sm:w-full max-sm:justify-between">
              <span className="font-mono text-xs text-muted-foreground tabular-nums">{copy.resultInfo(phase)}</span>
              <a
                href={phase.imageUrl}
                download={phase.fileName}
                className={buttonVariants({ variant: "secondary", className: "h-10 gap-2 px-3.5" })}
              >
                <Download />
                {copy.download}
              </a>
            </div>
          )}
        </div>

        {stageImage ? (
          <figure className="relative overflow-hidden rounded-[18px] bg-well after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:shadow-[inset_0_0_0_1px_oklch(1_0_0/0.07)]">
            <img
              src={stageImage}
              alt={phase.kind === "done" ? "生成的效果图" : "键盘原图"}
              className={
                running
                  ? "w-full scale-[1.02] opacity-40 blur-md"
                  : "w-full transition-[filter,opacity,scale] duration-700 ease-out motion-reduce:transition-none"
              }
            />
            {running && (
              <div className="absolute inset-0 grid place-items-center px-6">
                <KeyboardArt swapping className="max-w-lg text-foreground/85" />
              </div>
            )}
          </figure>
        ) : (
          <div className="grid aspect-[16/8] place-items-center rounded-[18px] bg-well px-6 shadow-[inset_0_2px_8px_oklch(0_0_0/0.5),inset_0_0_0_1px_oklch(1_0_0/0.06)]">
            <KeyboardArt className="max-w-lg text-foreground/25" />
          </div>
        )}
      </main>

      <KeycapLibrary
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        onUse={(base, addons) => {
          tryOn.setKeycaps([base])
          // The set's add-ons replace whatever add-ons were there before.
          tryOn.pickAddons(addons)
        }}
      />
    </div>
  )
}
