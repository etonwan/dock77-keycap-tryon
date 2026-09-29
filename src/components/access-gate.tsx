import { useEffect, useState, type FormEvent, type ReactNode } from "react"
import { CornerDownLeft } from "lucide-react"
import { BrandKeycap } from "@/components/brand-keycap"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { copy } from "@/lib/try-on"
import { cn } from "@/lib/utils"

type Gate =
  | { kind: "loading" }
  | { kind: "open" }
  | { kind: "locked"; checking: boolean; error?: string }

// When the server has an access password, the page asks for it before the
// app. The server remembers a correct password with a cookie, so a returning
// visitor goes straight in.
export function AccessGate({ children }: { children: ReactNode }) {
  const [gate, setGate] = useState<Gate>({ kind: "loading" })
  const [password, setPassword] = useState("")

  useEffect(() => {
    fetch("/api/session")
      .then((response) => setGate(response.ok ? { kind: "open" } : { kind: "locked", checking: false }))
      .catch(() => setGate({ kind: "locked", checking: false }))
  }, [])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (gate.kind !== "locked" || gate.checking || !password) return
    setGate({ kind: "locked", checking: true })
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      if (response.ok) return setGate({ kind: "open" })
      const body = await response.json().catch(() => ({}))
      setGate({ kind: "locked", checking: false, error: body.error ?? "验证失败，请重试。" })
    } catch {
      setGate({ kind: "locked", checking: false, error: "网络连接失败，请重试。" })
    }
  }

  if (gate.kind === "open") return children
  if (gate.kind === "loading") return null
  const { checking, error } = gate

  return (
    <div className="grid min-h-svh place-items-center px-4 py-10">
      <form onSubmit={submit} className="flex w-full max-w-sm flex-col gap-3">
        <div className="flex flex-col gap-5 rounded-[20px] bg-case p-5 shadow-[inset_0_1px_0_oklch(1_0_0/0.07),0_1px_0_oklch(0_0_0/0.4),0_24px_48px_-28px_oklch(0_0_0/0.9)]">
          <div className="flex items-center gap-3">
            <BrandKeycap />
            <h1 className="text-base font-semibold tracking-tight">{copy.title}</h1>
          </div>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">访问密码</span>
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoFocus
              autoComplete="current-password"
              aria-invalid={error ? true : undefined}
              aria-describedby="access-status"
              className="h-11 rounded-lg border-0 bg-well px-3 shadow-[inset_0_2px_5px_oklch(0_0_0/0.55),inset_0_0_0_1px_oklch(1_0_0/0.06)] focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-invalid:ring-0 dark:bg-well"
            />
          </label>
          {/* Same Enter keycap as the install key; held while checking. */}
          <Button type="submit" className="h-11 w-full gap-2.5 px-5 data-held:opacity-100" data-held={checking || undefined} disabled={!password && !checking}>
            {checking ? <Spinner /> : <CornerDownLeft className="opacity-55" aria-hidden />}
            {checking ? "核对中…" : "进入"}
          </Button>
        </div>
        <p id="access-status" role={error ? "alert" : "status"} className="flex min-h-10 items-center gap-2.5 px-1 text-sm">
          <span
            aria-hidden
            className={cn(
              "size-2 shrink-0 rounded-full bg-current shadow-[0_0_10px_currentColor]",
              error ? "text-led-error" : checking ? "text-led-busy animate-led-pulse motion-reduce:animate-none" : password ? "text-led-ready" : "text-foreground/20 shadow-none",
            )}
          />
          <span className={error ? "text-destructive" : undefined}>{error ?? (checking ? "正在核对密码" : "输入访问密码后开始试装")}</span>
        </p>
      </form>
    </div>
  )
}
