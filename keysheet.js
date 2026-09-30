import sharp from "sharp";
import { dataUrl, describeModel, openai } from "./describe.js";

// Given the whole kit render, the painter copies its layout: it dropped the
// Insert/Delete beside Enter (a full-size board has nothing there), shifted the
// nav block, doubled arrows and zoomed the photo. So instead of the render we
// show it a sheet of single keycaps cut out of it, in a shuffled order, which
// carries the colors, legends and material but no layout to copy. In the eval
// this took Dock77 + Serika from 6/20 to 11/20 full passes and Dracula from 10/20
// to 20/20, at the same speed (eval/README.md, 2026-09-30).

// The keys we cut out, in the order they go on the sheet: nav and arrow keys
// never sit next to each other, so the sheet has no nav block or inverted T.
// Two alphas and a number stand for the rest of their group.
const SHEET_KEYS = [
  "Home", "Q", "Enter", "←", "F5", "Delete", "Tab", "↑", "1", "PgDn", "Esc", "Caps Lock", "→", "F1",
  "Insert", "Space", "End", "A", "↓", "Win", "PgUp", "左 Shift", "Backspace", "`", "Fn", "左 Alt", "右 Shift",
  "F9", "左 Ctrl", "\\",
];
// Novelty kits draw a different picture beside each alpha or number. The
// painter needs to see those, so when the kit has them we cut out every alpha
// and number too, in a scrambled order so they don't read as keyboard rows.
const ART_KEYS = [
  "K", "7", "Z", "W", "3", "P", "H", "0", "D", "X", "M", "5", "T", "B", "9", "G", "E", "2", "L", "V", "S",
  "8", "N", "I", "4", "C", "F", "Y", "6", "R", "J", "O", "U",
];
// Fewer keys found than this means the render is not a normal kit layout (or
// the answer is off), and the whole render is the safer reference.
const MIN_KEYS = 15;

const TILE_HEIGHT = 120;
const GAP = 50;
const SHEET_WIDTH = 900;
// Portrait on purpose: with a sheet in the photo's own 16:9, the painter often
// took the sheet's framing and zoomed the keyboard, cropping its lower corner.
const MIN_SHEET_HEIGHT = 1200;

function instructions(width, height) {
  return `这是一套键帽的官方键位图，尺寸 ${width}×${height} 像素。按功能找出下面每颗键在图里的位置，给出键帽外轮廓的像素框 [左, 上, 右, 下]。
- 用主排版里的那颗；图里另有补充键区（额外尺寸、替换键）的，不要用补充键区里的。
- 修饰键按位置找：Esc 是 F 排最左，Backspace 是数字排最右，Tab 是 Q 排最左，Caps Lock 和 Enter 是 A 排两头，两个 Shift 是 Z 排两头，Ctrl、Win、Alt、Fn 在空格排，它们可能印着别的词或图标。
- 找不到的键不写。

只输出一个 JSON 对象，不要加解释或代码块标记，键名用下面的名字，例如 {"Esc": [96, 124, 135, 164]}：
${SHEET_KEYS.join("、")}

另外，如果这套键帽的字母或数字键上除了字符还画了小图画、符号或涂鸦（只算画出来的图案，不算第二种文字，例如假名、韩文、俄文），把下面这些键也全部框出来，键名就用字母或数字；没有这类图案就不要写它们：
${ART_KEYS.join("、")}`;
}

// Keeps boxes that are inside the image and plausibly one keycap.
export function validBoxes(raw, width, height) {
  const boxes = {};
  for (const name of [...SHEET_KEYS, ...ART_KEYS]) {
    const box = raw?.[name];
    if (!Array.isArray(box) || box.length !== 4 || !box.every(Number.isFinite)) continue;
    const [l, t, r, b] = box.map(Math.round);
    const left = Math.max(0, l);
    const top = Math.max(0, t);
    const right = Math.min(width, r);
    const bottom = Math.min(height, b);
    const w = right - left;
    const h = bottom - top;
    if (h < 12 || w < h * 0.6 || w > h * 12 || h > height / 4) continue;
    boxes[name] = { left, top, width: w, height: h };
  }
  return boxes;
}

// Cuts the boxed keys out of the kit render and packs them into a portrait
// sheet. `kit` is a prepared image; returns PNG bytes.
export async function composeSheet(kit, boxes, background) {
  const tiles = [];
  for (const name of [...SHEET_KEYS, ...ART_KEYS]) {
    if (!boxes[name]) continue;
    const input = await sharp(kit.png)
      .extract(boxes[name])
      .resize({ width: SHEET_WIDTH - 2 * GAP, height: TILE_HEIGHT, fit: "inside" })
      .png()
      .toBuffer();
    tiles.push({ input, width: (await sharp(input).metadata()).width });
  }
  const composites = [];
  let x = GAP;
  let y = GAP;
  for (const tile of tiles) {
    if (x + tile.width + GAP > SHEET_WIDTH) {
      x = GAP;
      y += TILE_HEIGHT + GAP;
    }
    composites.push({ input: tile.input, left: x, top: y });
    x += tile.width + GAP;
  }
  const height = Math.max(y + TILE_HEIGHT + GAP, MIN_SHEET_HEIGHT);
  // No alpha channel: the image API wants the same plain RGB as prepareImage makes.
  return sharp({ create: { width: SHEET_WIDTH, height, channels: 3, background } })
    .composite(composites)
    .removeAlpha()
    .png()
    .toBuffer();
}

// The render's own background (its top-left pixel), so the sheet looks like it.
async function backgroundOf(kit) {
  const { data } = await sharp(kit.png).extract({ left: 0, top: 0, width: 1, height: 1 }).raw().toBuffer({ resolveWithObject: true });
  return { r: data[0], g: data[1], b: data[2] };
}

// `kit` is a prepared image. Returns the sheet as a prepared image, or null
// when the keys could not be found; the caller then uses the whole render.
export async function buildKeySheet(kit, { model = describeModel } = {}) {
  try {
    const res = await openai.chat.completions.create({
      model,
      messages: [{ role: "user", content: [dataUrl(kit.png), { type: "text", text: instructions(kit.width, kit.height) }] }],
    });
    const text = res.choices[0].message.content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    const boxes = validBoxes(JSON.parse(text), kit.width, kit.height);
    const found = Object.keys(boxes).length;
    if (found < MIN_KEYS) {
      console.warn(`key sheet: only ${found} keys found, using the whole kit render`);
      return null;
    }
    const png = await composeSheet(kit, boxes, await backgroundOf(kit));
    const { width, height } = await sharp(png).metadata();
    return { png, width, height, found, usage: res.usage };
  } catch (err) {
    console.warn("key sheet failed, using the whole kit render:", err.message);
    return null;
  }
}

