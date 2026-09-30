import { useEffect, useState } from "react"

export type Phase =
  | { kind: "idle" }
  | { kind: "running"; startedAt: number }
  | { kind: "done"; imageUrl: string; fileName: string; width: number; height: number; seconds: number }
  | { kind: "error"; message: string }

type FinishedJob =
  | { status: "done"; width: number; height: number; seconds: number }
  | { status: "error"; error: string }

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Generation takes a minute or two, so the server runs it as a job and we poll.
async function waitForJob(id: string): Promise<FinishedJob> {
  for (;;) {
    await sleep(2000)
    try {
      const job = await (await fetch(`/api/jobs/${id}`)).json()
      if (job.status !== "running") return job
    } catch {
      // Network blip: keep waiting, the job is still running on the server.
    }
  }
}

function loadImage(url: string) {
  return new Promise<void>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => reject(new Error("效果图加载失败，请重试。"))
    img.src = url
  })
}

function timestamp() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`
}

export function formatElapsed(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
}

// Must match MAX_ADDONS in server.js.
export const MAX_ADDONS = 4

/** Whether to use the kit's spare keys: accent-colored duplicates of Esc,
 *  Enter, arrows and the like, and novelties (pictures instead of key names).
 *  Sent to the server as form fields of the same names. */
export type Options = { accents: boolean; novelties: boolean }

/** A ready-made image the visitor can pick instead of uploading their own. */
export type Preset = { name: string; src: string; thumb: string }

// Dock77 in its six colorways, for visitors without a photo of their own
// board. Each name is a file name: the render in public/presets/dock77/ and
// its menu thumbnail in public/presets/dock77/thumbs/.
export const DOCK77 = {
  title: "Dock77配色",
  items: ["浅灰", "深灰", "银色", "冰蓝", "冰粉", "蓝紫"].map(
    (name): Preset => ({ name, src: `/presets/dock77/${name}.webp`, thumb: `/presets/dock77/thumbs/${name}.webp` }),
  ),
}

// Preview URLs for picked images, released when the picks change. A preset
// is already a served file, so it previews from its own URL.
function usePreviewUrls(picks: readonly (File | Preset)[]) {
  const [urls, setUrls] = useState<string[]>([])
  useEffect(() => {
    const created = picks.map((pick) => (pick instanceof File ? URL.createObjectURL(pick) : pick.src))
    setUrls(created)
    return () => {
      for (const url of created) if (url.startsWith("blob:")) URL.revokeObjectURL(url)
    }
  }, [picks])
  return urls
}

// The server only takes uploads, so a preset is downloaded and sent as one.
async function asFile(pick: File | Preset) {
  if (pick instanceof File) return pick
  const response = await fetch(pick.src)
  if (!response.ok) throw new Error(`${pick.name} 图片加载失败，请重试。`)
  return new File([await response.blob()], `${pick.name}.webp`, { type: "image/webp" })
}

function useElapsedSeconds(startedAt: number | null) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (startedAt === null) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [startedAt])
  return startedAt === null ? 0 : Math.max(0, Math.floor((now - startedAt) / 1000))
}

export function useTryOn() {
  // Each slot holds a list: keyboard and keycaps hold at most one image. Any
  // slot can hold presets: Dock77 for the keyboard, keycap library sets for
  // the other two.
  const [keyboard, setKeyboard] = useState<(File | Preset)[]>([])
  const [keycaps, setKeycaps] = useState<(File | Preset)[]>([])
  const [addons, setAddons] = useState<(File | Preset)[]>([])
  const [addonsTrimmed, setAddonsTrimmed] = useState(false)
  // The kit's spare keys are the buyer's choice, so both start off: the
  // official main layout only. Kept across 重置, like a preference.
  const [options, setOptions] = useState<Options>({ accents: false, novelties: false })
  const [phase, setPhase] = useState<Phase>({ kind: "idle" })
  const keyboardUrls = usePreviewUrls(keyboard)
  const keycapsUrls = usePreviewUrls(keycaps)
  const addonUrls = usePreviewUrls(addons)
  const elapsed = useElapsedSeconds(phase.kind === "running" ? phase.startedAt : null)
  const running = phase.kind === "running"

  // Leaving mid-generation would throw away an image that is already being made.
  useEffect(() => {
    if (!running) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [running])

  // Picking add-ons replaces the previous set, like the other two slots.
  function pickAddons(files: (File | Preset)[]) {
    setAddons(files.slice(0, MAX_ADDONS))
    setAddonsTrimmed(files.length > MAX_ADDONS)
  }

  function clearAddons() {
    setAddons([])
    setAddonsTrimmed(false)
  }

  const canGenerate = keyboard.length === 1 && keycaps.length === 1 && !running
  const canClear = !running && (keyboard.length > 0 || keycaps.length > 0 || addons.length > 0 || phase.kind !== "idle")

  function clear() {
    if (!canClear) return
    setKeyboard([])
    setKeycaps([])
    clearAddons()
    setPhase({ kind: "idle" })
  }

  async function generate() {
    if (!canGenerate) return
    setPhase({ kind: "running", startedAt: Date.now() })
    try {
      const body = new FormData()
      body.append("keyboard", await asFile(keyboard[0]))
      body.append("keycaps", await asFile(keycaps[0]))
      for (const addon of await Promise.all(addons.map(asFile))) body.append("addons[]", addon)
      if (options.accents) body.append("accents", "1")
      if (options.novelties) body.append("novelties", "1")
      const response = await fetch("/api/jobs", { method: "POST", body })
      const created = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(created.error ?? "上传失败，请重试。")

      const job = await waitForJob(created.id)
      if (job.status === "error") throw new Error(job.error)

      const imageUrl = `/api/jobs/${created.id}/image.png`
      await loadImage(imageUrl)
      setPhase({ kind: "done", imageUrl, fileName: `keycap-tryon-${timestamp()}.png`, ...job })
    } catch (error) {
      // fetch() rejects with a TypeError when the connection itself fails.
      const message = error instanceof TypeError ? "网络连接失败，请重试。" : (error as Error).message
      setPhase({ kind: "error", message })
    }
  }

  return {
    keyboard,
    keycaps,
    addons,
    addonsTrimmed,
    keyboardUrls,
    keycapsUrls,
    addonUrls,
    setKeyboard,
    setKeycaps,
    pickAddons,
    clearAddons,
    options,
    setOptions,
    phase,
    elapsed,
    canGenerate,
    generate,
    canClear,
    clear,
  }
}

export type TryOn = ReturnType<typeof useTryOn>

// Playful lines shown while generating, one every 5 seconds across the
// usual ~1 minute. They set the mood; they are not real progress.
const WAITING_TIPS = [
  "开工啦，先去倒杯水吧",
  "正在拔下旧键帽…",
  "正在清点新键帽，一颗都不能少",
  "正在对准十字轴…",
  "正在逐颗按上新键帽",
  "正在核对每颗键的字符位置",
  "空格键比较长，得多花点功夫",
  "正在调教大键卫星轴",
  "正在打磨光影和反光",
  "好饭不怕晚，马上就好",
  "最后检查一遍有没有装反",
  "正在擦掉指纹，准备交付",
]

export const copy = {
  eta: "全程约 1-2 分钟",
  title: "键帽试衣间",
  keyboard: { label: "键盘/套件照片" },
  keycaps: { label: "键帽 base kit 图" },
  addons: { label: "键帽 add-on kit 图", optional: "可选" },
  options: {
    title: "安装选项",
    accents: { label: "用替换色键", hint: "套件附带的另一种颜色的 Esc、Enter、方向键等" },
    novelties: { label: "用 novelty 键", hint: "把图案键装到 Esc、Enter、Shift 等修饰键上" },
  },
  download: "下载 PNG",
  buttonLabel(phase: Phase) {
    if (phase.kind === "running") return "安装中…"
    return phase.kind === "idle" ? "开始安装键帽" : "重新安装"
  },
  /** One line above the stage; `missing` lists the labels of empty required slots. */
  status(phase: Phase, missing: string[], elapsed: number) {
    if (phase.kind === "running") {
      if (elapsed >= 90) return "这把键盘有点讲究，再给师傅一点时间"
      if (elapsed >= 60) return "比预计慢一点，好饭不怕晚"
      return WAITING_TIPS[Math.floor(elapsed / 5)]
    }
    if (phase.kind === "done") return "安装完成"
    if (phase.kind === "error") return phase.message
    return missing.length > 0 ? `还需要：${missing.join("、")}` : "准备就绪"
  },
  resultInfo(phase: Extract<Phase, { kind: "done" }>) {
    return `${phase.width} × ${phase.height} · 用时 ${phase.seconds} 秒`
  },
}
