import assert from "node:assert/strict";
import { test } from "node:test";
import sharp from "sharp";
import { composeSheet, validBoxes } from "./keysheet.js";

test("boxes outside the image are clipped; odd or unknown ones are dropped", () => {
  const boxes = validBoxes(
    {
      Esc: [10, 10, 50, 50],
      F1: [-5, 10, 30, 50], // clipped to the left edge
      Space: [100, 300, 600, 350], // wide keys are fine
      Enter: [0, 0, 5, 5], // too small
      Tab: [0, 0, 40, 400], // taller than a keycap can be
      Q: [1, 2, 3], // not a box
      A: "here",
      Numpad: [10, 10, 50, 50], // not a key we ask for
    },
    800,
    600,
  );
  assert.deepEqual(boxes, {
    Esc: { left: 10, top: 10, width: 40, height: 40 },
    F1: { left: 0, top: 10, width: 30, height: 40 },
    Space: { left: 100, top: 300, width: 500, height: 50 },
  });
  assert.deepEqual(validBoxes(null, 800, 600), {});
});

test("the sheet is portrait and holds a tile for each key", async () => {
  // A white render with one red "keycap".
  const png = await sharp({ create: { width: 400, height: 200, channels: 3, background: "#ffffff" } })
    .composite([{ input: { create: { width: 40, height: 40, channels: 3, background: "#ff0000" } }, left: 20, top: 20 }])
    .png()
    .toBuffer();
  const kit = { png, width: 400, height: 200 };
  const sheet = await composeSheet(kit, { Esc: { left: 20, top: 20, width: 40, height: 40 } }, "#ffffff");
  const { width, height } = await sharp(sheet).metadata();
  assert.ok(height > width, `${width}x${height} should be portrait`);
  // The tile is scaled to 120px high at the top-left margin.
  const { data } = await sharp(sheet).extract({ left: 100, top: 100, width: 1, height: 1 }).raw().toBuffer({ resolveWithObject: true });
  assert.deepEqual([...data], [255, 0, 0]);
});
