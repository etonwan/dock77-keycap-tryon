// Stage 2 of the try-on: the text sent to the image model together with the
// images (图1 = keyboard photo, 图2 = base kit, 图3 onwards = add-on kits).
//
// The manifest comes from describe.js: { bare, rows }, where each row is a list
// of keys [name, legend, base, legendColor], or [name, "保留"] for an artisan
// keycap that stays. The prompt states what to change and what to keep, then
// lists every key so the image model only has to paint, not count or match.

function isKept(key) {
  return key[1] === "保留";
}

function sameStyle(a, b) {
  return !isKept(a) && !isKept(b) && a[2] === b[2] && a[3] === b[3];
}

// A key prints its own name unless the kit prints something else there, which
// is quoted: `Tab→"Tag"`. A blank legend (the space bar) is said outright.
// Art the kit draws beside the legend (doodles on a novelty kit) follows in
// ［配图：…］; without it the painter printed plain letters.
function renderKey([name, legend, , , art]) {
  const text = legend.replace(/\s+/g, " ").trim();
  const extra = art ? `［配图：${art.replace(/\s+/g, " ").trim()}］` : "";
  if (text === name) return name + extra;
  if (text === "") return `${name}（不印字）${extra}`;
  return `${name}→"${text}"${extra}`;
}

// Consecutive keys with the same colors become one group, e.g.
// `Q、W、E、R（米白色底，金棕色字）`. The 、 keeps a multi-word name or a
// quoted legend from being read as part of its neighbor: with plain spaces,
// `Backspace 地球键→"Insert"` got painted as one wide key printing Insert.
function renderRow(row) {
  const groups = [];
  for (const key of row) {
    const last = groups[groups.length - 1];
    if (last && sameStyle(last[0], key)) last.push(key);
    else groups.push([key]);
  }
  return groups
    .map((group) => {
      const [first] = group;
      if (isKept(first)) return `${first[0]}（原样保留）`;
      return `${group.map(renderKey).join("、")}（${first[2]}底，${first[3]}字）`;
    })
    .join("；");
}

// The painter tends to redraw the nav block the way the kit render lays it
// out and drops keys, typically Insert/Delete beside Enter. Naming the nav
// keys row by row pins them to the keyboard photo.
const NAV_KEYS = new Set(["Home", "End", "PgUp", "PgDn", "Insert", "Delete"]);

function navLine(rows) {
  const perRow = rows.map((row) => row.map((key) => key[0]).filter((name) => NAV_KEYS.has(name)));
  const count = perRow.flat().length;
  if (count === 0) return "";
  const parts = perRow.flatMap((names, i) => (names.length > 0 ? [`第${i + 1}排 ${names.join("、")}`] : []));
  return `\n- 右侧导航键共 ${count} 颗：${parts.join("；")}。每颗都要画，位置照图1，不按图2的排法。`;
}

// Image 2 is either the kit render or, normally, a sheet of keycaps cut out of
// it (keysheet.js).
const KIT_ROLE =
  "图2是这套键帽的官方键位图，只用来看键帽的底色、字符、字符颜色和材质，不用来看键的位置。它按全尺寸排版，排法可能和图1不同：图2比图1多出来的键（小键盘等）不要画；图1上有的键一颗也不能少，位置照图1。";
const SHEET_ROLE =
  "图2是这套键帽的样张：从官方图上把一部分键帽单独剪下来、打乱顺序摆在一起，只用来看底色、字符样式、字符颜色和材质。样张里键的排列和数量没有意义，不要照它排；键的位置和数量只照图1和下面的清单。样张里没有的键，颜色照清单，字符样式照同类的键。";

export function buildPrompt(manifest, addonCount, { sheet = false } = {}) {
  const { bare, rows } = manifest;
  const total = rows.reduce((n, row) => n + row.length, 0);
  const rowLines = rows.map((row, i) => `第${i + 1}排（${row.length}颗）：${renderRow(row)}`).join("\n");
  const nav = navLine(rows);
  const addonImages = Array.from({ length: addonCount }, (_, i) => `图${i + 3}`).join("、");
  // Add-on renders are whole kit images with their own grid, whether or not
  // image 2 is a sheet, so they get their own role instead of "same as 图2".
  const addonRole =
    addonCount === 0
      ? ""
      : `\n- ${addonImages}是同一套键帽的增补套件的官方图，只用来看清单里用到的那几颗键的底色、字符、字符颜色和材质，不用来看键的位置和数量。里面的键只有清单点到的才画，其余不要画，也不要照它的排法。`;

  // A sheet holds only some keys, so art on a key it lacks comes from the words.
  const artSource = sheet
    ? `样张${addonCount === 0 ? "" : "或增补套件图"}里有同一颗键的，照它画，风格、颜色和位置都照它；没有的，按描述画`
    : "照图2里同一颗键的样子画，风格、颜色和位置都照图2";

  const subject = bare
    ? "图1是没装键帽的键盘套件（只有轴体或定位板）。按轴位和定位板开孔给每个轴位装上一颗键帽，键帽的高度和轮廓参考图2。"
    : "图1是要编辑的照片。除了键帽，一切保持原样。";
  const profile = bare ? "" : "\n- 键帽的高度和轮廓，看起来是真实拍摄的实物。";

  return `任务：把图1这把键盘的键帽换成图2这套键帽，生成一张"图1这把键盘装上这套键帽"的真实照片。

图片角色：
- ${subject}
- ${sheet ? SHEET_ROLE : KIT_ROLE}${addonRole}

只改：每颗键帽的底色、字符、字符颜色和材质，按下面的清单逐颗换。

保持不变：
- 拍摄角度、构图、裁切、光线、背景、阴影和景深。
- 机身、铭牌、logo、指示灯、旋钮和线材。
- 每一排的键数、每颗键的位置和宽度、键之间的空位。不增加、不删除、不移动任何键。${nav}${profile}
- 清单里标"原样保留"的键。

键位清单（图1共 ${rows.length} 排 ${total} 颗键；从上到下，每排从左到右，顿号隔开的是不同的键。引号里的字照印，一字不改，写着"××图标"的画对应的图标；没有引号的键印它自己的字符；［配图：…］是字符之外还要画在这颗键帽上的图案，${artSource}；以"侧刻："开头的印在键帽朝前的侧壁上，不印在顶面，侧壁在图1角度下看不到就不画）：
${rowLines}

键帽的材质、表面质感和光泽与图2一致，只带上图1光线造成的自然明暗和反光。字符颜色照清单，浅色或低对比度的字也照样印，不要改成深色。
不要加清单以外的键、文字或水印。`;
}
