import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { prepareImage } from "../image.js";

export const casesDir = new URL("./cases/", import.meta.url).pathname;
export const outDir = new URL("./out/", import.meta.url).pathname;

function findFile(dir, stem) {
  const name = readdirSync(dir).find((file) => path.parse(file).name === stem);
  if (!name) throw new Error(`${dir} has no ${stem}.* image`);
  return path.join(dir, name);
}

// Each case is a folder under eval/cases with keyboard.*, kit.* and
// expected.json ({ note, rows: [counts per row], checks: [sentences] }).
export async function loadCases(only) {
  const names = readdirSync(casesDir).filter((name) => !only || name === only);
  if (names.length === 0) throw new Error(`no case named ${only}`);
  return Promise.all(
    names.sort().map(async (name) => {
      const dir = path.join(casesDir, name);
      return {
        name,
        keyboard: await prepareImage(readFileSync(findFile(dir, "keyboard"))),
        kit: await prepareImage(readFileSync(findFile(dir, "kit"))),
        expected: JSON.parse(readFileSync(path.join(dir, "expected.json"), "utf8")),
      };
    }),
  );
}

// Runs `worker` over `items` with at most `limit` in flight.
export async function inBatches(items, limit, worker) {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: limit }, async () => {
      while (queue.length > 0) await worker(queue.shift());
    }),
  );
}
