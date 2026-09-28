---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: ["src/components/image-drop.tsx","src/components/ui/button.tsx","src/index.css"]
---

## Scope

The whole app: one page (`src/App.tsx` and its components). Visitor mode: Operate. The visitor uploads a keyboard photo, a base kit render, optional add-on renders, presses one key, waits a minute or two, and downloads the result.

## Audience and task

Mechanical keyboard hobbyists checking a keycap set on their own board. Constraints: Chinese UI, always dark, photos must be judged for color, no invented claims. Owner brief: 简洁但高级、极客、客制化键盘的感觉. The owner delegated visual decisions ("发挥你的设计").

## Direction contract

THESIS: The controls are a small keyboard. Inputs are switch sockets waiting for caps, the actions are keycaps, and the install key is the Enter key. Refuses the category default of dashed dropzones, pill buttons, and a centered spinner card.

OWN-WORLD: Anodized graphite case (oklch 0.215) on a desk-dark ground (0.165), recessed sockets (0.125) with an inner shadow and an MX stem cross when empty. Keycaps drawn from above: lit top edge, side walls, a deeper front wall that shrinks when pressed. Bone PBT for the one action key, graphite for modifiers. The only hue is a lock-indicator LED: off, bone, amber pulse, green, red. Geist for text; system monospace only for measurements (timer, pixel size, seconds).

STORY: The visitor sees three empty sockets and a status line naming what is missing, fills them, watches the LED turn on, presses the Enter keycap (or Enter), sees the key stay held while the caps "install" over the blurred photo, then gets the result with its size, time, and a download key.

FIRST VIEWPORT: Top: the case bar, full content width (max 1280), brand keycap with a hanger legend (also the favicon) plus 键帽试衣间 at left, three sockets with labels in the middle, 重置 and the Enter keycap at right (on mobile: badge row, 3-column sockets, full-width keys). Below: one status line (LED + state at left, measurements and download at right). Below that: the stage, the photo at full width in a recessed frame, or the line-drawn 60% board when empty.

FORM: Brief-pinned custom-keyboard world (owner's own words), position 1 of 1; no concept-seed roll because the owner pinned the world and then delegated the rest. Seed key: none (owner-pinned). Signature interaction: the physical Enter key and the on-screen Enter keycap are the same control; the keycap stays held while running. Motion grammar: 90 ms keycap travel, LED pulse while running, keycap-lift wave on the stage while installing, 700 ms unblur when the result lands; all respect reduced motion.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved

- On 390 px wide phones the add-on label wraps with 图 alone on the second line (owner accepted).
