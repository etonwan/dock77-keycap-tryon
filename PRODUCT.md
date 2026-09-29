# Product

<!-- impeccable:product-schema 1 -->

Facts below come from the code (`server.js`, `prompt.js`, `image.js`, `src/`) and the owner's requests. Lines marked *(inferred)* were not confirmed by the owner yet.

## Platform

web

## Users

Mechanical keyboard hobbyists deciding whether a keycap set suits their board, typically while a group buy or a set they are eyeing only exists as official renders *(inferred)*. They have a photo of their own keyboard (or a bare kit with switches or plate only) and the vendor's base kit render, sometimes plus add-on kit renders.

## Product Purpose

键帽试衣间 (keycap try-on) generates a realistic photo of the user's own keyboard wearing a chosen keycap set. Success is a result the user trusts enough to judge colors, legends, and fit on their board before buying.

## Positioning

It edits the user's real photo instead of rendering a generic board: camera angle, lighting, case, layout, artisans, and key positions stay; only the keycaps change, following the base kit (and add-on kits for matching keys such as Mac modifiers).

## Operating Context

- Inputs: 键盘/套件照片 (required, one), 键帽 base kit 图 (required, one), 键帽 add-on kit 图 (optional, up to 4).
- The keyboard slot also offers the Dock77 in six colorways (银色, 深灰, 蓝紫, 冰粉, 浅灰, 冰蓝; owner-supplied renders in `public/presets/dock77/`, named by file name) instead of uploading a photo.
- Generation runs as a server job with polling and takes about a minute or two; leaving the page mid-run is warned against.
- Output is a PNG at the keyboard photo's aspect ratio, long edge 2048 px, downloadable as `keycap-tryon-<timestamp>.png`.
- Community vocabulary used as-is in the UI: base kit, add-on kit, novelties, artisan (艺术帽), 轴体, 定位板.

## Capabilities and Constraints

- Uploads: JPG, PNG, or WebP, 60 MB total. Images are normalized server-side and never stored; results live in memory for one hour.
- Visitor-facing errors only say what the visitor can act on (e.g. moderation rejection, file unreadable); key, quota, and billing problems stay in the server log.
- Single page, Chinese UI (`zh-CN`), always dark.
- No accounts, history, or gallery.

## Brand Commitments

- Name: 键帽试衣间.
- Owner-pinned direction: 简洁但高级、极客、客制化键盘的感觉 (clean but premium, geeky, custom-keyboard vibe).

## Evidence on Hand

No real user photos, testimonials, or usage numbers are in the repo. Do not invent them. Screenshots and test images used during design work are synthetic and live outside the repo.

## Product Principles

- The photo is the product: the UI must not compete with the colors in the user's images.
- Show state plainly: what is missing, what is running, how long it has run, what failed.
- Keep the user's inputs; never silently drop or reorder them (trimmed add-ons are called out).
