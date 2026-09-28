import assert from "node:assert/strict";
import { test } from "node:test";
import sharp from "sharp";
import { outputSize, prepareImage } from "./image.js";

// Limits from the OpenAI image generation guide (custom sizes).
function assertValidApiSize({ width, height }) {
  assert.equal(width % 16, 0, `width ${width} not a multiple of 16`);
  assert.equal(height % 16, 0, `height ${height} not a multiple of 16`);
  assert.ok(Math.max(width, height) / Math.min(width, height) <= 3, `${width}x${height} wider than 3:1`);
  assert.ok(Math.max(width, height) <= 3840);
  assert.ok(width * height >= 655_360 && width * height <= 8_294_400, `${width}x${height} pixel count`);
}

test("outputSize keeps the photo's ratio and orientation", () => {
  assert.deepEqual(outputSize(4753, 2674), { width: 2048, height: 1152 });
  assert.deepEqual(outputSize(2674, 4753), { width: 1152, height: 2048 });
  assert.deepEqual(outputSize(1200, 1200), { width: 2048, height: 2048 });
  // Small photos are still requested at full size.
  assert.deepEqual(outputSize(800, 600), { width: 2048, height: 1536 });
});

test("outputSize never rounds past 3:1", () => {
  // 2048 / 3.04 = 673.7 would round down to 672, i.e. 3.05:1.
  assert.deepEqual(outputSize(3040, 1000), { width: 2048, height: 688 });
  assert.deepEqual(outputSize(1000, 5000), { width: 688, height: 2048 });
});

test("outputSize is always accepted by the API", () => {
  for (let i = 0; i < 5000; i++) {
    const w = 50 + Math.floor(Math.random() * 12000);
    const h = 50 + Math.floor(Math.random() * 12000);
    assertValidApiSize(outputSize(w, h));
  }
});

test("prepareImage makes an upright, shrunk, opaque sRGB PNG", async () => {
  // A 4000x3000 JPEG stored sideways: EXIF orientation 6 means "rotate 90° clockwise to view".
  const sideways = await sharp({ create: { width: 4000, height: 3000, channels: 3, background: "#c04040" } })
    .jpeg()
    .withMetadata({ orientation: 6 })
    .toBuffer();
  const { png, width, height } = await prepareImage(sideways);
  const meta = await sharp(png).metadata();
  assert.equal(meta.format, "png");
  assert.equal(meta.space, "srgb");
  assert.equal(meta.channels, 3);
  assert.equal(meta.orientation, undefined);
  assert.deepEqual([width, height], [1536, 2048]);
  assert.deepEqual([meta.width, meta.height], [1536, 2048]);
});

test("prepareImage flattens transparency onto white", async () => {
  const transparent = await sharp({ create: { width: 10, height: 10, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .png()
    .toBuffer();
  const { png } = await prepareImage(transparent);
  const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
  assert.equal(info.channels, 3);
  assert.deepEqual([...data.subarray(0, 3)], [255, 255, 255]);
});

test("prepareImage rejects files that are not images", async () => {
  await assert.rejects(prepareImage(Buffer.from("not an image")));
});
