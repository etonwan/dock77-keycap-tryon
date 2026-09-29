import { useEffect, useState } from "react"
import type { Preset } from "@/lib/try-on"

// Keycap sets from the brands' own catalogs, so a visitor can try a set
// without hunting down its renders. Each brand is one folder in
// public/keycaps/<id>/: index.json, the renders as <image id>.webp, and
// their thumbnails in thumbs/. Adding a brand means adding a folder and a
// line to BRANDS; the library UI does not change.

/** One keycap set. The first base kit is the usual pick; some sets come in
 *  more than one (a light and a dark theme, say). */
export type KeycapSet = {
  id: string
  name: string
  year: number
  colors: ColorFamily[]
  bases: string[]
  addons: string[]
}

export type Brand = { id: string; name: string }

export const BRANDS: Brand[] = [{ id: "gmk", name: "GMK" }]

// The color families of the GMK color guide the GMK data comes from,
// with a swatch for each.
export const COLOR_FAMILIES = [
  { name: "白", swatch: "oklch(0.95 0.012 90)" },
  { name: "灰", swatch: "oklch(0.64 0.004 260)" },
  { name: "黑", swatch: "oklch(0.22 0.004 260)" },
  { name: "棕", swatch: "oklch(0.52 0.07 55)" },
  { name: "橙", swatch: "oklch(0.72 0.16 50)" },
  { name: "红", swatch: "oklch(0.6 0.19 25)" },
  { name: "蓝", swatch: "oklch(0.62 0.14 250)" },
  { name: "绿", swatch: "oklch(0.64 0.13 150)" },
  { name: "黄", swatch: "oklch(0.87 0.15 95)" },
  { name: "紫", swatch: "oklch(0.6 0.14 300)" },
  { name: "粉", swatch: "oklch(0.82 0.08 350)" },
  {
    name: "拼色",
    swatch:
      "conic-gradient(oklch(0.6 0.19 25) 0 25%, oklch(0.87 0.15 95) 0 50%, oklch(0.64 0.13 150) 0 75%, oklch(0.62 0.14 250) 0)",
  },
] as const

export type ColorFamily = (typeof COLOR_FAMILIES)[number]["name"]

/** A set's image as a preset, ready for a slot. */
export function imagePreset(brand: Brand, set: KeycapSet, image: string, part: string): Preset {
  return {
    name: `${brand.name} ${set.name} ${part}`,
    src: `/keycaps/${brand.id}/${image}.webp`,
    thumb: `/keycaps/${brand.id}/thumbs/${image}.webp`,
  }
}

export type Library = { status: "loading" } | { status: "error" } | { status: "ready"; sets: KeycapSet[] }

// Loaded once per brand, the first time the library opens.
const loads = new Map<string, Promise<KeycapSet[]>>()

function loadBrand(brand: Brand) {
  let load = loads.get(brand.id)
  if (!load) {
    load = fetch(`/keycaps/${brand.id}/index.json`)
      .then((response) => {
        if (!response.ok) throw new Error(response.statusText)
        return response.json() as Promise<{ sets: KeycapSet[] }>
      })
      .then(({ sets }) => sets)
    // A failed load is forgotten so that retrying fetches again.
    load.catch(() => loads.delete(brand.id))
    loads.set(brand.id, load)
  }
  return load
}

export function useLibrary(brand: Brand, active: boolean) {
  const [library, setLibrary] = useState<Library>({ status: "loading" })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (!active) return
    let current = true
    setLibrary({ status: "loading" })
    loadBrand(brand).then(
      (sets) => current && setLibrary({ status: "ready", sets }),
      () => current && setLibrary({ status: "error" }),
    )
    return () => {
      current = false
    }
  }, [brand, active, attempt])
  return { library, retry: () => setAttempt((n) => n + 1) }
}
