import OpenAI, { toFile } from "openai";
import { describeKeys } from "./describe.js";
import { outputSize } from "./image.js";
import { buildPrompt } from "./prompt.js";

// Sunburst is the GPT Image 2.5 variant tuned for precise edits: we want the
// photo kept as-is and only the keycaps changed.
const MODEL = "gpt-image-2.5-sunburst";
const QUALITY = "high";

const openai = new OpenAI();

// Sends the prepared PNGs (keyboard first, then kits) and the prompt to the
// image model. Returns the PNG at the keyboard photo's aspect ratio.
export async function editImage(images, prompt, keyboard) {
  const { width, height } = outputSize(keyboard.width, keyboard.height);
  const result = await openai.images.edit({
    model: MODEL,
    image: await Promise.all(images.map((image, i) => toFile(image.png, `image-${i + 1}.png`, { type: "image/png" }))),
    prompt,
    size: `${width}x${height}`,
    quality: QUALITY,
  });
  return { png: Buffer.from(result.data[0].b64_json, "base64"), width, height, usage: result.usage };
}

// The whole try-on: read the keys (describe.js), write the prompt (prompt.js),
// paint (editImage). Inputs are prepared images from image.js.
export async function renderTryOn(keyboard, keycaps, addons) {
  const { manifest, usage: describeUsage } = await describeKeys(
    keyboard.png,
    keycaps.png,
    addons.map((addon) => addon.png),
  );
  const prompt = buildPrompt(manifest, addons.length);
  const image = await editImage([keyboard, keycaps, ...addons], prompt, keyboard);
  return { ...image, manifest, prompt, describeUsage };
}
