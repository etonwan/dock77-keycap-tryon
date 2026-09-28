import assert from "node:assert/strict";
import { test } from "node:test";
import { buildPrompt } from "./prompt.js";

test("without add-ons the prompt only talks about images 1 and 2", () => {
  const prompt = buildPrompt(0);
  assert.match(prompt, /图2/);
  assert.doesNotMatch(prompt, /图3|增补/);
});

test("add-on images are numbered from 3, one per upload", () => {
  const one = buildPrompt(1);
  assert.match(one, /\n图3是同一套键帽的增补套件/);
  assert.doesNotMatch(one, /图4/);

  const three = buildPrompt(3);
  assert.match(three, /\n图3、图4、图5是同一套键帽的增补套件/);
  assert.doesNotMatch(three, /图6/);
});

test("reference colors and materials stay unchanged, with or without add-ons", () => {
  for (const count of [0, 2]) {
    const prompt = buildPrompt(count);
    assert.match(prompt, /图2只用来参考配色、材质、字体和字符位置/);
    assert.match(prompt, /不要改色、重新配色或统一不同键的颜色/);
    assert.match(prompt, /不要改变参考键帽的材质、表面纹理、光泽或透光性/);
    assert.match(prompt, /只允许图1光线造成的自然明暗和反光/);
    if (count > 0) assert.match(prompt, /和图2一样只参考配色、材质、字体、字符和图案/);
  }
});

test("legend colors come from the reference, even when low-contrast", () => {
  for (const count of [0, 2]) {
    const prompt = buildPrompt(count);
    assert.match(prompt, /同一颗键的字符、字体、位置和字符颜色/);
    assert.match(prompt, /不要按底色或整套键帽的主色去猜，也不要沿用图1原来的字符颜色/);
    assert.match(prompt, /不要为了清晰改成深色/);
  }
});

test("the layout follows image 1 key by key, not the kit's full-size layout", () => {
  for (const count of [0, 2]) {
    const prompt = buildPrompt(count);
    assert.match(prompt, /先数清图1每一排有几颗键/);
    assert.match(prompt, /空位（[^）]*）保持空着，不要补上键帽/);
    assert.match(prompt, /不要用它们替换或挤走图1原有的键/);
    assert.match(prompt, /字母、数字、符号、F 区、导航键和方向键，按字符找图2里同一颗键/);
  }
});

test("themed legends and accent Esc/Enter keys still come from the kit", () => {
  for (const count of [0, 2]) {
    const prompt = buildPrompt(count);
    assert.match(prompt, /^[^\n]*除了艺术帽，图1上的每一颗键帽都要换掉，包括颜色和周围不同的 Esc、回车等强调色键。/);
    assert.match(prompt, /最后自查：Esc 和回车的底色、字符和字符颜色要和图2同位置的那颗键一致/);
    assert.match(prompt, /修饰键（Esc、Tab、Caps Lock、Shift、Ctrl、Win、Alt、Fn、退格、回车）按所在的排和左右位置找，不要按字符找/);
    assert.match(prompt, /Esc 是 F1 那一排最左边的键/);
    assert.match(prompt, /Tab 是字母 Q 那一排最左边的键/);
    assert.match(prompt, /Caps Lock 和回车是字母 A 那一排最左边和最右边的键/);
    assert.match(prompt, /不要把上一排或下一排的键挪过来/);
    assert.match(prompt, /强调色键（常见于 Esc 和回车）只是普通键帽，不是艺术帽/);
    assert.match(prompt, /不要保留图1原来的颜色和字符/);
    assert.match(prompt, /结果里每颗键帽的底色都必须是参考键帽图里出现过的颜色/);
    assert.match(prompt, /图2那颗键印的是主题词或图标（不是 Esc、Enter），就照印图2的字/);
    assert.match(prompt, /图2里找不到同位置、同宽度的键时，才用图2里同类键的配色和字体/);
  }
});

test("image 1 may be a kit without keycaps", () => {
  assert.match(buildPrompt(0), /图1也可能是没装键帽的键盘套件/);
});

test("the closing rule stays last", () => {
  assert.match(buildPrompt(2), /不要加文字、水印或多余的键。$/);
});
