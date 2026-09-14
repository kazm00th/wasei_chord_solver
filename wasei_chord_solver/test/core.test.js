const assert = require("assert");
const { indexToNoteName, indexToPitchClass } = require("../core.js");

// 基本
assert.strictEqual(indexToNoteName(0), "C");
assert.strictEqual(indexToNoteName(4), "E");
assert.strictEqual(indexToNoteName(-3), "Es");
assert.strictEqual(indexToNoteName(1), "G");
assert.strictEqual(indexToNoteName(5), "H");

// シャープ側
assert.strictEqual(indexToNoteName(11), "Eis");
assert.strictEqual(indexToNoteName(12), "His");

// H/B特例（フラット側はBを土台にする）
assert.strictEqual(indexToNoteName(-2), "B");
assert.strictEqual(indexToNoteName(-9), "Bes");
assert.strictEqual(indexToNoteName(-16), "Beses");

// ピッチクラス
assert.strictEqual(indexToPitchClass(0), 0);
assert.strictEqual(indexToPitchClass(4), 4);
assert.strictEqual(indexToPitchClass(-3), 3);
assert.strictEqual(indexToPitchClass(-10), 2);

console.log("Task 1: OK");
