import sharp from "sharp";

// Long edge used both for the uploads we send and for the image we ask for.
// 2048 keeps legends readable and stays well inside the API's size limits.
const LONG_EDGE = 2048;

// Phone photos (EXIF rotation, Display P3, huge JPEGs) are rejected by the
// image API as "Invalid image file or mode". Normalize every upload to an
// upright, 8-bit sRGB PNG without alpha or metadata.
export async function prepareImage(input) {
  const { data, info } = await sharp(input)
    .autoOrient()
    .resize({ width: LONG_EDGE, height: LONG_EDGE, fit: "inside", withoutEnlargement: true })
    .flatten({ background: "#ffffff" })
    .toColourspace("srgb")
    .png()
    .toBuffer({ resolveWithObject: true });
  return { png: data, width: info.width, height: info.height };
}

// Output size with the same aspect ratio as the keyboard photo, within the API
// rules: both edges multiples of 16 and a ratio no wider than 3:1.
export function outputSize(width, height) {
  const minShort = Math.ceil(LONG_EDGE / 3 / 16) * 16;
  const exactShort = (LONG_EDGE * Math.min(width, height)) / Math.max(width, height);
  const short = Math.max(Math.round(exactShort / 16) * 16, minShort);
  return width >= height ? { width: LONG_EDGE, height: short } : { width: short, height: LONG_EDGE };
}
