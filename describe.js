import OpenAI from "openai";

// Stage 1 of the try-on: a vision model reads the keyboard photo and the kit
// renders and writes down, key by key, what the image model should paint. The
// image model is bad at counting keys and matching them across images; this
// model is good at it, and its answer is plain text we can check.
const DESCRIBE_MODEL = "gpt-6-astra";

const openai = new OpenAI();

function instructions(addonCount) {
  const addons =
    addonCount === 0
      ? ""
      : `
图3${addonCount > 1 ? `到图${addonCount + 2}` : ""}是同一套键帽的增补套件（例如 Mac 修饰键、特殊尺寸键、novelties）。图1里的某颗键，如果增补套件里有功能和尺寸都对应的版本（例如 Mac 的 command、option），用增补套件里那颗的字符和颜色，否则用图2的。增补套件里对不上图1任何一颗键的键帽不要用。`;

  return `图1是一把机械键盘的照片，图2是一套键帽的官方键位图（base kit 渲染图）。${addons}

任务：列出图1上每一颗键，并为每颗键写出换上这套键帽后它应该是什么样子。结果会交给一个图像模型去画，所以每颗键都要写清楚。

第零步，先判断图1是不是一把电脑键盘（没装键帽的键盘套件也算）。计算器、手机、钢琴、遥控器等其他带按键的东西都不算。如果不是，只输出 {"is_keyboard": false, "rows": []}，不要做后面的步骤。

第一步，读图1：
- 从上到下逐排，每排从左到右，列出每颗键。用键的通用名字（Esc、F1、1、Q、Tab、Caps Lock、Shift、Ctrl、Win、Alt、Fn、Space、Enter、Backspace、Home、PgUp、Delete、←、↑ 等）。符号键用主字符（\`、-、=、[、]、\\、;、'、,、.、/）。
- 机身上的铭牌、指示灯、旋钮、屏幕、logo、线材不是键，不要列入。
- 造型特殊的装饰键帽（艺术帽、artisan）标记为保留。颜色和周围不同但轮廓普通的强调色键（常见于 Esc、Enter）不是艺术帽，要换。
- 键位不要按标准配列去猜，以图1实际看到的为准：右侧可能有一列或两列导航键，方向键旁边可能有空位。每排列完后数一遍数量。
- 如果图1是没装键帽的套件（只有轴体或定位板），把 bare 设为 true，按轴位和开孔列出每排的键位，键名按其配列推断。

第二步，为每颗键决定换上的键帽（在图2里找）：
- 字母、数字、符号、F 区、导航键（Home、End、PgUp、PgDn、Insert、Delete）、方向键：按功能在图2里找同一颗键，抄它的底色和字符颜色。这些键要印的字就是键名本身，上档字符不用写。
- 修饰键（Esc、Tab、Caps Lock、Shift、Ctrl、Win、Alt、Fn、Backspace、Enter、Space）：很多套件在这些键上印主题词、图标或 logo 而不是键名。在图2里按位置找对应的键：Esc 是 F 排最左，Backspace 是数字排最右，Tab 是 Q 排最左，Caps Lock 和 Enter 是 A 排两头，两个 Shift 是 Z 排两头，Ctrl、Win、Alt、Fn 在空格排。要印的字写图2那颗键实际印的词，一字不改（例如 "Git"、"Commit"、"Control"）；词旁边的小图标不用写；只有图标没有词时才描述图标（例如 "Git 分叉图标"）；空格键没有字就写空字符串。图1里的 Mac 修饰键（control、option、command）按位置对应图2的 Ctrl、Alt、Win。图1里修饰键位置上装的印装饰词的 novelty 键（例如印 hello 的 option 键）也按位置当修饰键处理，换成图2那颗。
- 图2里没有对应功能的键（例如地球键）：不要拿图2里别的键（Insert、Home 等）顶替。用图2同类键（修饰键或导航键）的底色和字符颜色，要印的字保留这颗键原本的图标或含义，例如 "地球图标"。
- 图2里多出来的键（小键盘、图1没有的导航键等）不要用。

第三步，只输出下面格式的 JSON，不要加任何解释或代码块标记：
{"is_keyboard": true, "bare": false, "rows": [[["Esc","Git","黑色","青色"],["F1","F1","蓝灰色","白色"]], [["\`","\`","蓝灰色","白色"]]]}

- rows 是排的数组，每排是键的数组，每颗键是 [键名, 要印的字, 底色, 字符颜色]。要印的字写在一行里，不要换行。
- 保留的艺术帽写成 [键名, "保留"]，例如 ["彩虹苹果艺术帽","保留"]。
- 颜色用简短的中文，例如 米白色、酒红色、金棕色、黑色、蓝灰色、青色、粉色。同一套件里同一种颜色始终用同一个词。`;
}

function dataUrl(png) {
  return { type: "image_url", image_url: { url: `data:image/png;base64,${png.toString("base64")}`, detail: "high" } };
}

function parseManifest(text) {
  const json = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const manifest = JSON.parse(json);
  if (manifest.is_keyboard === false) throw Object.assign(new Error("image 1 is not a keyboard"), { code: "not_keyboard" });
  if (!Array.isArray(manifest.rows) || manifest.rows.length === 0) throw new Error("manifest has no rows");
  for (const row of manifest.rows) {
    if (!Array.isArray(row) || row.length === 0) throw new Error("manifest has an empty row");
    for (const key of row) {
      if (!Array.isArray(key) || typeof key[0] !== "string") throw new Error("manifest key is not an array");
      if (key[1] !== "保留" && key.length < 4) throw new Error(`manifest key ${key[0]} is missing colors`);
    }
  }
  return { bare: manifest.bare === true, rows: manifest.rows };
}

// keyboard, keycaps and addons are prepared PNG buffers. Returns the manifest
// used by buildPrompt: { bare, rows: [[[name, legend, base, legendColor], ...]] }.
export async function describeKeys(keyboard, keycaps, addons, { model = DESCRIBE_MODEL } = {}) {
  const content = [dataUrl(keyboard), dataUrl(keycaps), ...addons.map(dataUrl), { type: "text", text: instructions(addons.length) }];
  let lastError;
  // The model occasionally wraps or truncates the JSON; one retry covers that.
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await openai.chat.completions.create({ model, messages: [{ role: "user", content }] });
    try {
      return { manifest: parseManifest(res.choices[0].message.content), usage: res.usage };
    } catch (err) {
      if (err.code === "not_keyboard") throw err;
      lastError = err;
    }
  }
  throw lastError;
}

export const describeModel = DESCRIBE_MODEL;
