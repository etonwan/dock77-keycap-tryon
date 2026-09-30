// Generates try-on images for every case with one pipeline variant, so the two
// can be graded side by side (eval/grade.js):
//
//   node eval/run.js baseline            # the single-step prompt from df5d259
//   node eval/run.js two-step            # describe.js + prompt.js + tryon.js
//   node eval/run.js two-step --runs 5 --case sparta --concurrency 3
//   node eval/run.js two-step --out two-step-v2   # after a prompt change
//   node eval/run.js two-step --model gpt-image-2.5-flare --out flare
//   node eval/run.js pinned-nokit --case dock77-dark-serika --runs 20
//   node eval/run.js two-step --case sparta-addon --novelties --out addon-nov
//
// Outputs go to eval/out/<out>/<case>-<i>.png (default <out> = variant) plus
// a .json with timing, usage and (for two-step) the manifest and prompt.
// Existing outputs are kept, so an interrupted run can be resumed.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { buildPrompt } from "../prompt.js";
import { buildPrompt as baselinePrompt } from "./baseline-prompt.js";
import { casesDir, inBatches, loadCases, outDir } from "./cases.js";
import { prepareImage } from "../image.js";
import { editImage, renderTryOn } from "../tryon.js";

// The "pinned" variants skip describe.js and paint from eval/cases/<case>/manifest.json,
// so only the painting step varies between runs. "pinned-nokit" also leaves the kit
// image out, to test whether the painter copies the kit render's layout.
function pinnedManifest(name) {
  return JSON.parse(readFileSync(path.join(casesDir, name, "manifest.json"), "utf8"));
}

// Rewrites buildPrompt's text for a painter that only gets image 1. Each piece
// must be found, so a prompt.js change can't silently leave 图2 references behind.
function withoutKit(prompt) {
  const edits = [
    ["换成图2这套键帽", "换成下面清单里的这套键帽"],
    [/\n- 图2是[^\n]*/, ""],
    ["，不按图2的排法", ""],
    ["照图2里同一颗键的样子画，风格、颜色和位置都照图2", "按描述画"],
    ["与图2一致", "是真实双色注塑键帽的样子"],
  ];
  for (const [from, to] of edits) {
    const next = prompt.replace(from, to);
    if (next === prompt) throw new Error(`withoutKit: ${from} not found`);
    prompt = next;
  }
  if (prompt.includes("图2")) throw new Error("withoutKit: 图2 still mentioned");
  return prompt;
}

async function paint(images, prompt, kb, manifest, options) {
  return { ...(await editImage(images, prompt, kb, options)), manifest, prompt };
}

// `options` is { model } for the image model; omitted means tryon.js's default.
// Only two-step uses a case's add-on renders; the pinned variants paint from a
// manifest and image 2 alone.
const variants = {
  baseline: (kb, kit, options) => editImage([kb, kit], baselinePrompt(0), kb, options),
  "two-step": (kb, kit, options, name, addons) => renderTryOn(kb, kit, addons, options),
  pinned: (kb, kit, options, name) => {
    const manifest = pinnedManifest(name);
    return paint([kb, kit], buildPrompt(manifest, 0), kb, manifest, options);
  },
  "pinned-nokit": (kb, kit, options, name) => {
    const manifest = pinnedManifest(name);
    return paint([kb], withoutKit(buildPrompt(manifest, 0)), kb, manifest, options);
  },
  // Image 2 is eval/cases/<case>/sheet.png, cut by hand; two-step cuts its own (keysheet.js).
  "pinned-sheet": async (kb, kit, options, name) => {
    const manifest = pinnedManifest(name);
    const sheet = await prepareImage(readFileSync(path.join(casesDir, name, "sheet.png")));
    return paint([kb, sheet], buildPrompt(manifest, 0, { sheet: true }), kb, manifest, options);
  },
};

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    runs: { type: "string", default: "5" },
    case: { type: "string" },
    concurrency: { type: "string", default: "3" },
    out: { type: "string" },
    model: { type: "string" },
    // The visitor's spare-key switches (describe.js); two-step only.
    accents: { type: "boolean", default: false },
    novelties: { type: "boolean", default: false },
  },
});
const [variant] = positionals;
if (!variants[variant]) {
  console.error(
    `usage: node eval/run.js <${Object.keys(variants).join("|")}> [--runs N] [--case name] [--concurrency N] [--out name] [--model id] [--accents] [--novelties]`,
  );
  process.exit(1);
}
const options = { ...(values.model ? { model: values.model } : {}), accents: values.accents, novelties: values.novelties };

const cases = await loadCases(values.case);
const dir = path.join(outDir, values.out ?? variant);
mkdirSync(dir, { recursive: true });

const jobs = cases.flatMap((c) => Array.from({ length: Number(values.runs) }, (_, i) => ({ c, i: i + 1 })));
await inBatches(jobs, Number(values.concurrency), async ({ c, i }) => {
  const stem = path.join(dir, `${c.name}-${i}`);
  if (existsSync(`${stem}.png`)) {
    console.log(`${c.name}-${i}: exists, skipped`);
    return;
  }
  const started = Date.now();
  try {
    const { png, manifest, prompt, usage, describeUsage, sheetKeys } = await variants[variant](c.keyboard, c.kit, options, c.name, c.addons);
    const seconds = Math.round((Date.now() - started) / 1000);
    writeFileSync(`${stem}.png`, png);
    writeFileSync(`${stem}.json`, JSON.stringify({ ...options, seconds, sheetKeys, usage, describeUsage, manifest, prompt }, null, 1));
    console.log(`${c.name}-${i}: done in ${seconds}s`);
  } catch (err) {
    console.error(`${c.name}-${i}: failed after ${Math.round((Date.now() - started) / 1000)}s: ${err.message}`);
  }
});
