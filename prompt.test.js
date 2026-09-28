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

test("the closing rule stays last", () => {
  assert.match(buildPrompt(2), /不要加文字、水印或多余的键。$/);
});
