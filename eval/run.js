// Generates try-on images for every case with one pipeline variant, so the two
// can be graded side by side (eval/grade.js):
//
//   node eval/run.js baseline            # the single-step prompt from df5d259
//   node eval/run.js two-step            # describe.js + prompt.js + tryon.js
//   node eval/run.js two-step --runs 5 --case sparta --concurrency 3
//   node eval/run.js two-step --out two-step-v2   # after a prompt change
//
// Outputs go to eval/out/<out>/<case>-<i>.png (default <out> = variant) plus
// a .json with timing, usage and (for two-step) the manifest and prompt.
// Existing outputs are kept, so an interrupted run can be resumed.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { buildPrompt as baselinePrompt } from "./baseline-prompt.js";
import { inBatches, loadCases, outDir } from "./cases.js";
import { editImage, renderTryOn } from "../tryon.js";

const variants = {
  baseline: (kb, kit) => editImage([kb, kit], baselinePrompt(0), kb),
  "two-step": (kb, kit) => renderTryOn(kb, kit, []),
};

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    runs: { type: "string", default: "5" },
    case: { type: "string" },
    concurrency: { type: "string", default: "3" },
    out: { type: "string" },
  },
});
const [variant] = positionals;
if (!variants[variant]) {
  console.error(
    `usage: node eval/run.js <${Object.keys(variants).join("|")}> [--runs N] [--case name] [--concurrency N] [--out name]`,
  );
  process.exit(1);
}

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
    const { png, manifest, prompt, usage, describeUsage } = await variants[variant](c.keyboard, c.kit);
    const seconds = Math.round((Date.now() - started) / 1000);
    writeFileSync(`${stem}.png`, png);
    writeFileSync(`${stem}.json`, JSON.stringify({ seconds, usage, describeUsage, manifest, prompt }, null, 1));
    console.log(`${c.name}-${i}: done in ${seconds}s`);
  } catch (err) {
    console.error(`${c.name}-${i}: failed after ${Math.round((Date.now() - started) / 1000)}s: ${err.message}`);
  }
});
