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
- Two 安装选项 switches, both off by default (the official main layout only): 用替换色键 installs the accent-colored duplicates a kit ships alongside the main layout (Esc, Enter, arrows, ...); 用 novelty 键 puts novelties (pictures instead of key names, from the base render or add-ons) on modifier keys, matched by size and row. Owner-chosen after seeing GMK Nightshade come out all dark.
- The keyboard slot also offers the Dock77 in six colorways (浅灰, 深灰, 银色, 冰蓝, 冰粉, 蓝紫; owner-supplied renders in `public/presets/dock77/`, named by file name) instead of uploading a photo.
- The base kit slot also offers a keycap library: 335 GMK sets (2020–2025) from a community GMK color guide, filterable by name, 12 color families, and year. Picking a set fills the base kit slot and, by default, the add-on slot with the set's other renders (max 4). Some sets have two base kits (e.g. light and dark); the visitor picks one. Each brand is a folder in `public/keycaps/<brand>/` (index.json, renders, thumbs); more brands are planned. The owner decided to show the renders without source attribution.
- Generation runs as a server job with polling and takes about a minute or two; leaving the page mid-run is warned against.
- Output is a PNG at roughly the keyboard photo's aspect ratio, downloadable as `keycap-tryon-<timestamp>.png`. The server asks the image model for a 2048 px long edge, but the model returns less: about 1680 px for 16:9 photos (measured 1672–1683 px). The result screen shows the actual size.
- Community vocabulary used as-is in the UI: base kit, add-on kit, novelties, artisan (艺术帽), 轴体, 定位板.

## Capabilities and Constraints

- Uploads: JPG, PNG, or WebP, 60 MB total. Images are normalized server-side and never stored; results live in memory for one hour.
- Visitor-facing errors only say what the visitor can act on (e.g. moderation rejection, file unreadable); key, quota, and billing problems stay in the server log.
- Single page, Chinese UI (`zh-CN`), always dark.
- No accounts, history, or gallery. An optional shared access password (`ACCESS_PASSWORD`) gates generation for friends-only sharing; the page shows its own password screen and remembers a correct entry for 30 days.

## Brand Commitments

- Name: 键帽试衣间.
- Maker mark: the Overwrite Studio logo sits next to the app's hanger keycap, as a graphite keycap legend (owner-chosen).
- Owner-pinned direction: 简洁但高级、极客、客制化键盘的感觉 (clean but premium, geeky, custom-keyboard vibe).

## Evidence on Hand

No real user photos, testimonials, or usage numbers are in the repo. Do not invent them. Screenshots and test images used during design work are synthetic and live outside the repo.

## Product Principles

- The photo is the product: the UI must not compete with the colors in the user's images.
- Show state plainly: what is missing, what is running, how long it has run, what failed.
- Keep the user's inputs; never silently drop or reorder them (trimmed add-ons are called out).
