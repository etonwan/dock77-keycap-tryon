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

// Each case is a folder under eval/cases with keyboard.*, kit.*, optional
// add-on kit renders addon1.*, addon2.*, … (sorted by name) and expected.json
// ({ note, rows: [counts per row], checks: [sentences] }).
export async function loadCases(only) {
  const names = readdirSync(casesDir).filter((name) => !only || name === only);
  if (names.length === 0) throw new Error(`no case named ${only}`);
  return Promise.all(
    names.sort().map(async (name) => {
      const dir = path.join(casesDir, name);
      const addonFiles = readdirSync(dir)
        .filter((file) => /^addon\d*\./.test(file))
        .sort();
      return {
        name,
        keyboard: await prepareImage(readFileSync(findFile(dir, "keyboard"))),
        kit: await prepareImage(readFileSync(findFile(dir, "kit"))),
        addons: await Promise.all(addonFiles.map((file) => prepareImage(readFileSync(path.join(dir, file))))),
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
