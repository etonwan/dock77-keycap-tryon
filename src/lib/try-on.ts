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

// Preview URLs for picked files, released when the files change.
function useObjectUrls(files: readonly File[]) {
  const [urls, setUrls] = useState<string[]>([])
  useEffect(() => {
    const created = files.map((file) => URL.createObjectURL(file))
    setUrls(created)
    return () => created.forEach((url) => URL.revokeObjectURL(url))
  }, [files])
  return urls
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
  // Each slot holds a list: keyboard and keycaps hold at most one file.
  const [keyboard, setKeyboard] = useState<File[]>([])
  const [keycaps, setKeycaps] = useState<File[]>([])
  const [addons, setAddons] = useState<File[]>([])
  const [addonsTrimmed, setAddonsTrimmed] = useState(false)
  const [phase, setPhase] = useState<Phase>({ kind: "idle" })
  const keyboardUrls = useObjectUrls(keyboard)
  const keycapsUrls = useObjectUrls(keycaps)
  const addonUrls = useObjectUrls(addons)
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

  async function generate() {
    if (!canGenerate) return
    setPhase({ kind: "running", startedAt: Date.now() })
    try {
      const body = new FormData()
      body.append("keyboard", keyboard[0])
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
  }
}

export type TryOn = ReturnType<typeof useTryOn>

export const copy = {
  title: "键帽试戴",
  intro: "上传你的键盘照片和一套键帽的 base kit 图（增补套件图可选），AI 会生成这把键盘换上这套键帽后的样子。",
  keyboard: { label: "键盘照片" },
  keycaps: { label: "键帽 base kit 图" },
  addons: { label: "增补套件图", optional: "可选" },
  duration: "大约需要 1–2 分钟",
  download: "下载 PNG",
  buttonLabel(phase: Phase) {
    if (phase.kind === "running") return "生成中…"
    return phase.kind === "idle" ? "生成效果图" : "重新生成"
  },
  resultInfo(phase: Extract<Phase, { kind: "done" }>) {
    return `${phase.width} × ${phase.height} · 用时 ${phase.seconds} 秒`
  },
}
