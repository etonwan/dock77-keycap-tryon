import assert from "node:assert/strict";
import { test } from "node:test";
import { buildPrompt } from "./prompt.js";

// A small keyboard: two rows, with an artisan, themed legends and a blank space bar.
const manifest = {
  bare: false,
  rows: [
    [
      ["Esc", "Git", "黑色", "青色"],
      ["F1", "F1", "蓝灰色", "白色"],
      ["F2", "F2", "蓝灰色", "白色"],
      ["F5", "F5", "黑色", "白色"],
      ["F6", "F6", "黑色", "白色"],
      ["F9", "F9", "蓝灰色", "白色"],
      ["彩虹苹果艺术帽", "保留"],
    ],
    [
      ["Ctrl", "Ctrl", "黑色", "白色"],
      ["Space", "", "蓝灰色", "白色"],
      ["Enter", "Commit", "黑色", "青色"],
      ["←", "←", "黑色", "白色"],
    ],
  ],
};

function rowLine(prompt, n) {
  const line = prompt.split("\n").find((l) => l.startsWith(`第${n}排`));
  assert.ok(line, `row ${n} missing`);
  return line;
}

test("every row is listed with its key count, and the total counts artisans too", () => {
  const prompt = buildPrompt(manifest, 0);
  assert.match(prompt, /共 2 排 11 颗键/);
  assert.match(rowLine(prompt, 1), /^第1排（7颗）：/);
  assert.match(rowLine(prompt, 2), /^第2排（4颗）：/);
  assert.equal(prompt.includes("第3排"), false);
});

test("only consecutive keys with the same colors are grouped", () => {
  const row = rowLine(buildPrompt(manifest, 0), 1);
  assert.match(row, /F1、F2（蓝灰色底，白色字）；F5、F6（黑色底，白色字）；F9（蓝灰色底，白色字）/);
  // F9 shares colors with F1/F2 but sits after F5/F6, so it must not join them.
  assert.doesNotMatch(row, /F1、F2、F9/);
});

test("legends that differ from the key name are quoted; blank legends are said outright", () => {
  const prompt = buildPrompt(manifest, 0);
  assert.match(rowLine(prompt, 1), /Esc→"Git"（黑色底，青色字）/);
  assert.match(rowLine(prompt, 2), /Enter→"Commit"（黑色底，青色字）/);
  assert.match(rowLine(prompt, 2), /Space（不印字）（蓝灰色底，白色字）/);
  // A legend equal to its name is not quoted.
  assert.match(rowLine(prompt, 2), /；←（黑色底，白色字）$/);
});

test("a plain key followed by a quoted one in the same group stays two keys", () => {
  // Rendered as `Backspace 地球键→"地球图标"`, the painter printed the legend on Backspace.
  const rows = [
    [
      ["Backspace", "Backspace", "酒红色", "金棕色"],
      ["地球键", "地球图标", "酒红色", "金棕色"],
    ],
  ];
  const prompt = buildPrompt({ bare: false, rows }, 0);
  assert.match(rowLine(prompt, 1), /：Backspace、地球键→"地球图标"（酒红色底，金棕色字）$/);
  assert.match(prompt, /顿号隔开的是不同的键/);
  assert.match(prompt, /写着"××图标"的画对应的图标/);
});

test("line breaks inside a legend are collapsed so the row stays on one line", () => {
  const rows = [[["Esc", "Git\n  Core", "黑色", "青色"]]];
  const prompt = buildPrompt({ bare: false, rows }, 0);
  assert.match(rowLine(prompt, 1), /Esc→"Git Core"（黑色底，青色字）$/);
});

test("art beside a legend is listed on its own key without splitting the color group", () => {
  const rows = [
    [
      ["Q", "Q", "米白色", "黑色"],
      ["W", "W", "米白色", "黑色", "字母右侧一个红色\n爱心涂鸦"],
      ["Shift", "Shift", "米灰色", "黑色", "向上箭头涂鸦"],
    ],
  ];
  const prompt = buildPrompt({ bare: false, rows }, 0);
  assert.match(rowLine(prompt, 1), /：Q、W［配图：字母右侧一个红色 爱心涂鸦］（米白色底，黑色字）；Shift［配图：向上箭头涂鸦］（米灰色底，黑色字）$/);
  assert.match(prompt, /［配图：…］是字符之外还要画在这颗键帽上的图案/);
  assert.match(prompt, /以"侧刻："开头的印在键帽朝前的侧壁上，不印在顶面/);
});

test("a kept artisan is listed as kept and never colored or merged into a group", () => {
  const row = rowLine(buildPrompt(manifest, 0), 1);
  assert.match(row, /；彩虹苹果艺术帽（原样保留）$/);
  assert.doesNotMatch(row, /艺术帽（[^）]*底/);
  assert.match(buildPrompt(manifest, 0), /清单里标"原样保留"的键/);
});

test("without add-ons the prompt only talks about images 1 and 2", () => {
  const prompt = buildPrompt(manifest, 0);
  assert.match(prompt, /图2是这套键帽的官方键位图/);
  assert.doesNotMatch(prompt, /图3|增补/);
});

test("add-on images are numbered from 3, one per upload", () => {
  const one = buildPrompt(manifest, 1);
  assert.match(one, /\n- 图3是同一套键帽的增补套件/);
  assert.doesNotMatch(one, /图4/);

  const three = buildPrompt(manifest, 3);
  assert.match(three, /\n- 图3、图4、图5是同一套键帽的增补套件/);
  assert.doesNotMatch(three, /图6/);
});

test("add-on renders keep their own role in sheet mode: colors only, never their layout", () => {
  const prompt = buildPrompt(manifest, 1, { sheet: true });
  // Image 2 is a shuffled sheet, but image 3 is still a whole render with a grid.
  assert.doesNotMatch(prompt, /用法和图2一样/);
  assert.match(prompt, /图3是同一套键帽的增补套件的官方图.*不用来看键的位置和数量.*不要照它的排法/);
  // A key that came from the add-on has its art on image 3, not on the sheet.
  assert.match(prompt, /样张或增补套件图里有同一颗键的，照它画/);
  assert.doesNotMatch(buildPrompt(manifest, 0, { sheet: true }), /增补套件图/);
});

test("a bare kit changes image 1's role and drops the keep-the-profile rule", () => {
  const dressed = buildPrompt(manifest, 0);
  assert.match(dressed, /图1是要编辑的照片。除了键帽，一切保持原样。/);
  assert.match(dressed, /键帽的高度和轮廓，看起来是真实拍摄的实物/);

  const bare = buildPrompt({ ...manifest, bare: true }, 0);
  assert.match(bare, /图1是没装键帽的键盘套件/);
  assert.match(bare, /给每个轴位装上一颗键帽/);
  assert.doesNotMatch(bare, /除了键帽，一切保持原样/);
  assert.doesNotMatch(bare, /键帽的高度和轮廓，看起来是真实拍摄的实物/);
  // The key list is the same either way.
  assert.equal(rowLine(bare, 1), rowLine(dressed, 1));
});

test("nav keys are spelled out row by row", () => {
  const key = (name) => [name, name, "黄色", "黑色"];
  const rows = [
    ["Backspace", "Home", "PgUp"].map(key),
    ["\\", "End", "PgDn"].map(key),
    ["Enter", "Insert", "Delete"].map(key),
  ];
  assert.match(
    buildPrompt({ bare: false, rows }, 0),
    /右侧导航键共 6 颗：第1排 Home、PgUp；第2排 End、PgDn；第3排 Insert、Delete。每颗都要画，位置照图1/,
  );
  assert.doesNotMatch(buildPrompt(manifest, 0), /导航键共/);
});

test("with a keycap sheet, image 2 is described as a sheet whose arrangement means nothing", () => {
  const kit = buildPrompt(manifest, 0);
  assert.match(kit, /图2是这套键帽的官方键位图/);
  assert.doesNotMatch(kit, /样张/);

  const sheet = buildPrompt(manifest, 0, { sheet: true });
  assert.match(sheet, /\n- 图2是这套键帽的样张：/);
  assert.match(sheet, /样张里键的排列和数量没有意义/);
  assert.doesNotMatch(sheet, /官方键位图/);
  // Art is copied from the sheet when the key is on it, else painted from the words.
  assert.match(kit, /照图2里同一颗键的样子画/);
  assert.match(sheet, /样张里有同一颗键的，照它画.*没有的，按描述画/);
  assert.doesNotMatch(sheet, /照图2里同一颗键/);
  // The key list itself is the same.
  assert.equal(rowLine(sheet, 1), rowLine(kit, 1));
});

test("the closing rule stays last", () => {
  assert.match(buildPrompt(manifest, 2), /不要加清单以外的键、文字或水印。$/);
});
