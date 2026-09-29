// Grades the images produced by eval/run.js with a vision model:
//
//   node eval/grade.js baseline                  # the eval/out/<name> folder
//   node eval/grade.js two-step --case dracula --regrade
//
// For each output the model first lists every key it sees in the result, row
// by row (which forces it to count instead of guess), then judges each check
// from the case's expected.json. A run passes when the row counts match and
// every check passes. Grades are saved next to the images as .grade.json and
// reused unless --regrade is given.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import OpenAI from "openai";
import { inBatches, loadCases, outDir } from "./cases.js";

const GRADER_MODEL = "gpt-6-astra";
const openai = new OpenAI();

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    case: { type: "string" },
    concurrency: { type: "string", default: "3" },
    regrade: { type: "boolean", default: false },
  },
});
const [variant] = positionals;
const dir = variant && path.join(outDir, variant);
if (!dir || !existsSync(dir)) {
  console.error("usage: node eval/grade.js <variant> [--case name] [--concurrency N] [--regrade]");
  process.exit(1);
}

function image(png) {
  return { type: "image_url", image_url: { url: `data:image/png;base64,${png.toString("base64")}`, detail: "high" } };
}

function instructions(checks) {
  const list = checks.map((check, i) => `${i + 1}. ${check}`).join("\n");
  return `图A是一把机械键盘的原图，图B是用图像模型把图A的键帽换成另一套键帽后生成的结果。请检查图B生成得对不对。

第一步，仔细读图B：从上到下逐排，每排从左到右，列出每一颗键（用键名或键上印的字；艺术帽用简短描述）。机身上的铭牌、指示灯、旋钮、logo 不是键。不要按标准配列去猜，以图B实际画出来的为准，每颗都数到。

第二步，逐条判断下面的检查项在图B里是否成立。只有明确看到才算成立；看不清、不确定或部分成立都算不成立，并在 note 里用一句话说明看到了什么。
${list}

只输出下面格式的 JSON，不要加解释或代码块标记：
{"rows": [["Esc","F1","F2"],["\`","1","2"]], "checks": [{"pass": true, "note": "……"}, {"pass": false, "note": "……"}]}

rows 是图B每一排的键名列表；checks 与检查项一一对应，顺序相同。`;
}

function parseGrade(text, checkCount) {
  const json = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const grade = JSON.parse(json);
  if (!Array.isArray(grade.rows) || !Array.isArray(grade.checks)) throw new Error("grade has no rows/checks");
  if (grade.checks.length !== checkCount) throw new Error(`grade has ${grade.checks.length} checks, expected ${checkCount}`);
  return grade;
}

async function grade(c, png) {
  const content = [image(c.keyboard.png), image(png), { type: "text", text: instructions(c.expected.checks) }];
  let lastError;
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await openai.chat.completions.create({ model: GRADER_MODEL, messages: [{ role: "user", content }] });
    try {
      return parseGrade(res.choices[0].message.content, c.expected.checks.length);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

function summarize(c, g) {
  const counts = g.rows.map((row) => row.length);
  const rowsOk = counts.join("/") === c.expected.rows.join("/");
  const failed = g.checks.map((check, i) => (check.pass ? null : i + 1)).filter(Boolean);
  return { counts, rowsOk, failed, pass: rowsOk && failed.length === 0 };
}

const cases = await loadCases(values.case);
const runs = cases.flatMap((c) =>
  readdirSync(dir)
    .filter((file) => file.startsWith(`${c.name}-`) && file.endsWith(".png"))
    .sort()
    .map((file) => ({ c, stem: path.join(dir, path.parse(file).name) })),
);

await inBatches(runs, Number(values.concurrency), async ({ c, stem }) => {
  const gradeFile = `${stem}.grade.json`;
  if (values.regrade || !existsSync(gradeFile)) {
    try {
      const g = await grade(c, readFileSync(`${stem}.png`));
      writeFileSync(gradeFile, JSON.stringify(g, null, 1));
    } catch (err) {
      console.error(`${path.basename(stem)}: grading failed: ${err.message}`);
    }
  }
});

// Report: one line per run, then pass rates per case and per check.
console.log(`\n${variant} (rows expected → seen; failed check numbers)`);
const results = [];
for (const { c, stem } of runs) {
  const gradeFile = `${stem}.grade.json`;
  if (!existsSync(gradeFile)) continue;
  const g = JSON.parse(readFileSync(gradeFile, "utf8"));
  const s = summarize(c, g);
  results.push({ c, g, s });
  const rows = `${c.expected.rows.join("/")} → ${s.counts.join("/")}${s.rowsOk ? " ✓" : " ✗"}`;
  const checks = s.failed.length === 0 ? "checks ✓" : `failed #${s.failed.join(" #")}`;
  console.log(`${path.basename(stem).padEnd(12)} ${s.pass ? "PASS" : "FAIL"}  rows ${rows}  ${checks}`);
  for (const i of s.failed) console.log(`${"".padEnd(12)}   #${i} ${g.checks[i - 1].note}`);
}

const pct = (n, d) => `${n}/${d} (${d === 0 ? 0 : Math.round((100 * n) / d)}%)`;
console.log(`\nfull pass: ${pct(results.filter((r) => r.s.pass).length, results.length)}`);
for (const c of cases) {
  const own = results.filter((r) => r.c === c);
  if (own.length === 0) continue;
  console.log(`\n${c.name}: full pass ${pct(own.filter((r) => r.s.pass).length, own.length)}, rows ok ${pct(own.filter((r) => r.s.rowsOk).length, own.length)}`);
  c.expected.checks.forEach((check, i) => {
    console.log(`  #${i + 1} ${pct(own.filter((r) => r.g.checks[i].pass).length, own.length).padEnd(11)} ${check}`);
  });
}
