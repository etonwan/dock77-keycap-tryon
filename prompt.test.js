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

test("the closing rule stays last", () => {
  assert.match(buildPrompt(2), /不要加文字、水印或多余的键。$/);
});
