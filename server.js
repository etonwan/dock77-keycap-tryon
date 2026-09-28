import { randomUUID } from "node:crypto";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import OpenAI, { toFile } from "openai";
import { outputSize, prepareImage } from "./image.js";
import { buildPrompt } from "./prompt.js";

// Sunburst is the GPT Image 2.5 variant tuned for precise edits: we want the
// photo kept as-is and only the keycaps changed.
const MODEL = "gpt-image-2.5-sunburst";
const QUALITY = "high";
const RESULT_TTL_MS = 60 * 60 * 1000;
// Optional add-on kit images (novelties, Mac mods, ...). The API takes up to
// 16 images; a few keeps the model focused on the base kit.
const MAX_ADDONS = 4;

// Reads OPENAI_API_KEY from the environment. The key stays on the server.
const openai = new OpenAI();

// Jobs live in memory only: uploads are never stored, and finished images are
// dropped after an hour or when the server restarts.
const jobs = new Map();

// Visitors only see what they can act on. Key, quota and billing problems are
// the operator's concern and stay in the server log.
function describeError(err) {
  if (err.code === "moderation_blocked") return "图片没有通过内容审核，请换一张图再试。";
  return "生成失败，请稍后再试。";
}

async function generate(id, keyboard, keycaps, addons) {
  const started = Date.now();
  const { width, height } = outputSize(keyboard.width, keyboard.height);
  try {
    const result = await openai.images.edit({
      model: MODEL,
      image: [
        await toFile(keyboard.png, "keyboard.png", { type: "image/png" }),
        await toFile(keycaps.png, "keycaps.png", { type: "image/png" }),
        ...(await Promise.all(addons.map((addon, i) => toFile(addon.png, `addon-${i + 1}.png`, { type: "image/png" })))),
      ],
      prompt: buildPrompt(addons.length),
      size: `${width}x${height}`,
      quality: QUALITY,
    });
    const seconds = Math.round((Date.now() - started) / 1000);
    jobs.set(id, { status: "done", png: Buffer.from(result.data[0].b64_json, "base64"), width, height, seconds });
    console.log(`job ${id} done: ${width}x${height} in ${seconds}s, usage ${JSON.stringify(result.usage)}`);
  } catch (err) {
    console.error(`job ${id} failed:`, err);
    jobs.set(id, { status: "error", error: describeError(err) });
  }
  setTimeout(() => jobs.delete(id), RESULT_TTL_MS).unref();
}

const app = new Hono();

app.post(
  "/api/jobs",
  bodyLimit({
    maxSize: 60 * 1024 * 1024,
    onError: (c) => c.json({ error: "图片太大了，所有图片加起来请小于 60 MB。" }, 413),
  }),
  async (c) => {
    const body = await c.req.parseBody();
    const required = [body.keyboard, body.keycaps];
    if (!required.every((file) => file instanceof File)) {
      return c.json({ error: "请同时上传键盘照片和键帽 base kit 图。" }, 400);
    }
    // Hono collects every "addons[]" field into an array; absent means none.
    const addons = [body["addons[]"] ?? []].flat();
    if (!addons.every((file) => file instanceof File)) {
      return c.json({ error: "增补套件图读取失败，请重新选择。" }, 400);
    }
    if (addons.length > MAX_ADDONS) {
      return c.json({ error: `增补套件图最多 ${MAX_ADDONS} 张。` }, 400);
    }
    let prepared;
    try {
      prepared = await Promise.all(
        [...required, ...addons].map(async (file) => prepareImage(Buffer.from(await file.arrayBuffer()))),
      );
    } catch {
      return c.json({ error: "有一张图片无法读取。请上传 JPG、PNG 或 WebP 格式的图片。" }, 400);
    }
    const [keyboard, keycaps, ...preparedAddons] = prepared;
    const id = randomUUID();
    jobs.set(id, { status: "running" });
    generate(id, keyboard, keycaps, preparedAddons);
    return c.json({ id }, 202);
  },
);

app.get("/api/jobs/:id", (c) => {
  const job = jobs.get(c.req.param("id"));
  if (!job) return c.json({ status: "error", error: "找不到这次生成的结果，可能已超过 1 小时或服务重启过。" }, 404);
  const { png, ...status } = job;
  return c.json(status);
});

app.get("/api/jobs/:id/image.png", (c) => {
  const job = jobs.get(c.req.param("id"));
  if (job?.status !== "done") return c.notFound();
  return c.body(job.png, 200, { "Content-Type": "image/png" });
});

// The page is built by Vite into dist/ (`npm run build`).
app.use("/*", serveStatic({ root: "./dist" }));

serve({ fetch: app.fetch, port: Number(process.env.PORT ?? 3000) }, (info) => {
  console.log(`键帽试戴 listening on port ${info.port}`);
});
