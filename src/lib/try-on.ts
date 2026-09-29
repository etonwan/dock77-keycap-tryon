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

/** A ready-made image the visitor can pick instead of uploading their own. */
export type Preset = { name: string; src: string; thumb: string }

// Dock77 in its six colorways, for visitors without a photo of their own
// board. Each name is a file name: the render in public/presets/dock77/ and
// its menu thumbnail in public/presets/dock77/thumbs/.
export const DOCK77 = {
  title: "Dock77 配色套件",
  items: ["银色", "深灰", "蓝紫", "冰粉", "浅灰", "冰蓝"].map(
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
  if (!response.ok) throw new Error("键盘图加载失败，请重试。")
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
  // Each slot holds a list: keyboard and keycaps hold at most one file. The
  // keyboard can also be a preset.
  const [keyboard, setKeyboard] = useState<(File | Preset)[]>([])
  const [keycaps, setKeycaps] = useState<File[]>([])
  const [addons, setAddons] = useState<File[]>([])
  const [addonsTrimmed, setAddonsTrimmed] = useState(false)
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
  function pickAddons(files: File[]) {
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
      body.append("keycaps", keycaps[0])
      for (const addon of addons) body.append("addons[]", addon)
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
    phase,
    elapsed,
    canGenerate,
    generate,
    canClear,
    clear,
  }
}

export type TryOn = ReturnType<typeof useTryOn>

export const copy = {
  title: "键帽试衣间",
  keyboard: { label: "键盘/套件照片" },
  keycaps: { label: "键帽 base kit 图" },
  addons: { label: "键帽 add-on kit 图", optional: "可选" },
  download: "下载 PNG",
  buttonLabel(phase: Phase) {
    if (phase.kind === "running") return "安装中…"
    return phase.kind === "idle" ? "开始安装键帽" : "重新安装"
  },
  /** One line above the stage; `missing` lists the labels of empty required slots. */
  status(phase: Phase, missing: string[]) {
    if (phase.kind === "running") return "正在安装键帽"
    if (phase.kind === "done") return "安装完成"
    if (phase.kind === "error") return phase.message
    return missing.length > 0 ? `还需要：${missing.join("、")}` : "准备就绪"
  },
  resultInfo(phase: Extract<Phase, { kind: "done" }>) {
    return `${phase.width} × ${phase.height} · 用时 ${phase.seconds} 秒`
  },
}
