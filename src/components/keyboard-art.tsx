import { cn } from "@/lib/utils"

// Simplified 60% ANSI layout, widths in key units.
const ROWS = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
  [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5],
  [1.75, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.25],
  [2.25, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.75],
  [1.25, 1.25, 1.25, 6.25, 1.25, 1.25, 1.25, 1.25],
]
const U = 40
const GAP = 5
const PAD = 16

const keys = ROWS.flatMap((row, r) => {
  let x = 0
  return row.map((w) => {
    const key = { x: PAD + x * U, y: PAD + r * U, w: w * U - GAP, h: U - GAP, delay: (x + r * 1.5) * 0.12 }
    x += w
    return key
  })
})
const WIDTH = 15 * U - GAP + PAD * 2
const HEIGHT = ROWS.length * U - GAP + PAD * 2

// Line drawing of a keyboard kit. When `swapping`, keycaps lift off the
// switches and drop back in a wave, like someone swapping the set.
export function KeyboardArt({ swapping = false, className }: { swapping?: boolean; className?: string }) {
  return (
    <svg
      viewBox={`-2 -2 ${WIDTH + 4} ${HEIGHT + 4}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinejoin="round"
      aria-hidden
      className={cn("w-full", className)}
    >
      <rect width={WIDTH} height={HEIGHT} rx={14} />
      {keys.map((k, i) => {
        const cx = k.x + k.w / 2
        const cy = k.y + k.h / 2
        return (
          <g key={i}>
            {/* Switch stem, visible while the cap is off. */}
            <path d={`M${cx - 4} ${cy}h8M${cx} ${cy - 4}v8`} opacity={0.6} />
            <g
              className={swapping ? "animate-keycap-swap motion-reduce:animate-none" : undefined}
              style={swapping ? { animationDelay: `${k.delay}s` } : undefined}
            >
              <rect x={k.x} y={k.y} width={k.w} height={k.h} rx={5} className="fill-background" />
              <rect x={k.x + 5} y={k.y + 4} width={k.w - 10} height={k.h - 12} rx={3} opacity={0.5} />
            </g>
          </g>
        )
      })}
    </svg>
  )
}
