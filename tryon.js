import OpenAI, { toFile } from "openai";
import sharp from "sharp";
import { describeKeys } from "./describe.js";
import { outputSize } from "./image.js";
import { buildKeySheet } from "./keysheet.js";
import { buildPrompt } from "./prompt.js";

// GPT Image 2.5 Flare. We want the photo kept as-is and only the keycaps changed.
const MODEL = "gpt-image-2.5-flare";
const QUALITY = "high";

const openai = new OpenAI();

// Sends the prepared PNGs (keyboard first, then kits) and the prompt to the
// image model. Returns the PNG at the keyboard photo's aspect ratio.
export async function editImage(images, prompt, keyboard, { model = MODEL } = {}) {
  const { width, height } = outputSize(keyboard.width, keyboard.height);
  const result = await openai.images.edit({
    model,
    image: await Promise.all(images.map((image, i) => toFile(image.png, `image-${i + 1}.png`, { type: "image/png" }))),
    prompt,
    size: `${width}x${height}`,
    quality: QUALITY,
  });
  // The model returns a smaller image than asked for (about 1680 px long edge
  // for a 2048x1152 request), so report the size of what came back.
  const png = Buffer.from(result.data[0].b64_json, "base64");
  const actual = await sharp(png).metadata();
  return { png, width: actual.width, height: actual.height, usage: result.usage };
}

// The whole try-on: read the keys (describe.js) while cutting the kit render
// into a keycap sheet (keysheet.js, shorter, so it adds no wait), write the
// prompt (prompt.js), paint (editImage). Inputs are prepared images from
// image.js. `options` only exists so eval/run.js can A/B image models.
export async function renderTryOn(keyboard, keycaps, addons, options = {}) {
  const [{ manifest, usage: describeUsage }, sheet] = await Promise.all([
    describeKeys(keyboard.png, keycaps.png, addons.map((addon) => addon.png)),
    buildKeySheet(keycaps),
  ]);
  const prompt = buildPrompt(manifest, addons.length, { sheet: sheet !== null });
  const image = await editImage([keyboard, sheet ?? keycaps, ...addons], prompt, keyboard, options);
  return { ...image, manifest, prompt, describeUsage, sheetKeys: sheet?.found ?? 0, sheetUsage: sheet?.usage };
}
