import { Download, Plus, TriangleAlert } from "lucide-react"
import { ImageDrop } from "@/components/image-drop"
import { KeyboardArt } from "@/components/keyboard-art"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button, buttonVariants } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { copy, formatElapsed, MAX_ADDONS, useTryOn } from "@/lib/try-on"

type Slot = {
  label: string
  previews: string[]
  onFiles: (files: File[]) => void
  status: string
  multiple?: boolean
  onClear?: () => void
}

// Image-first: the inputs sit in the top bar so the photo and the result get
// the whole page.
export default function App() {
  const tryOn = useTryOn()
  const { phase } = tryOn
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
    },
    {
      ...copy.keycaps,
      previews: tryOn.keycapsUrls,
      onFiles: tryOn.setKeycaps,
      status: tryOn.keycaps.length > 0 ? "点击更换" : "点击或拖入",
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
  const stageImage = phase.kind === "done" ? phase.imageUrl : tryOn.keyboardUrls[0]

  return (
    <div className="min-h-svh">
      <header className="border-b">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 xl:flex-row xl:items-center xl:gap-5">
          <div className="xl:mr-auto">
            <h1 className="text-lg font-semibold tracking-tight">{copy.title}</h1>
          </div>
          <div className="grid grid-cols-3 gap-3 xl:flex xl:items-center xl:gap-5">
            {slots.map((slot, index) => (
              <div key={slot.label} className="flex min-w-0 flex-col gap-2 xl:flex-row xl:items-center xl:gap-3">
                {index > 0 && <Plus className="hidden size-4 shrink-0 text-muted-foreground xl:block" aria-hidden />}
                <ImageDrop
                  compact
                  label={slot.label}
                  previews={slot.previews}
                  onFiles={slot.onFiles}
                  multiple={slot.multiple}
                  className="aspect-video w-full shrink-0 xl:aspect-auto xl:h-14 xl:w-24"
                />
                <div className="min-w-0 leading-tight">
                  <div className="text-sm font-medium">{slot.label}</div>
                  <div className="text-xs text-muted-foreground">
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
          <div className="flex items-center gap-2 xl:shrink-0">
            <Button variant="ghost" size="lg" className="h-10 px-3" disabled={!tryOn.canClear} onClick={tryOn.clear}>
              重置
            </Button>
            <Button size="lg" className="h-10 flex-1 px-5 xl:flex-none" disabled={!tryOn.canGenerate} onClick={tryOn.generate}>
              {phase.kind === "running" && <Spinner />}
              {copy.buttonLabel(phase)}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-4 px-6 pt-8 pb-16">
        {phase.kind === "error" && (
          <Alert variant="destructive">
            <TriangleAlert />
            <AlertDescription>{phase.message}</AlertDescription>
          </Alert>
        )}

        {stageImage ? (
          <figure className="relative overflow-hidden rounded-2xl bg-muted">
            <img
              src={stageImage}
              alt={phase.kind === "done" ? "生成的效果图" : "键盘原图"}
              className={
                phase.kind === "running"
                  ? "w-full scale-[1.02] opacity-40 blur-md"
                  : "w-full transition-[filter,opacity,scale] duration-700 ease-out"
              }
            />
            {phase.kind === "running" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-6">
                <KeyboardArt swapping className="max-w-lg text-muted-foreground" />
                <div className="rounded-full bg-background/90 px-5 py-2.5 text-sm font-medium">
                  正在安装键帽 <span className="tabular-nums">{formatElapsed(tryOn.elapsed)}</span>
                </div>
              </div>
            )}
          </figure>
        ) : (
          <div className="grid aspect-[16/8] place-items-center rounded-2xl border border-dashed px-6">
            <KeyboardArt className="max-w-lg text-muted-foreground" />
          </div>
        )}

        {phase.kind === "done" && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground tabular-nums">{copy.resultInfo(phase)}</span>
            <a href={phase.imageUrl} download={phase.fileName} className={buttonVariants({ variant: "secondary", size: "lg" })}>
              <Download />
              {copy.download}
            </a>
          </div>
        )}
      </main>
    </div>
  )
}
