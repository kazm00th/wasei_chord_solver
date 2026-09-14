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

const { resolveLevel, ChordError } = require("../core.js");

// 準III度調 = Es Dur（root -3, major）
{
  const r = resolveLevel(0, "major", { degree: "III", table: "quasi", forceQuality: null });
  assert.strictEqual(r.rootIndex, -3);
  assert.strictEqual(r.quality, "major");
}

// プラスIII度調 = E Dur（root 4、根音不変、質だけ強制的にmajor）
{
  const r = resolveLevel(0, "major", { degree: "III", table: "auto", forceQuality: "major" });
  assert.strictEqual(r.rootIndex, 4);
  assert.strictEqual(r.quality, "major");
}

// マイナス準III度調 = es moll（root -3, minor強制）
{
  const r = resolveLevel(0, "major", { degree: "III", table: "quasi", forceQuality: "minor" });
  assert.strictEqual(r.rootIndex, -3);
  assert.strictEqual(r.quality, "minor");
}

// C Dur：VI度調 = a moll（root 3, minor自然）
{
  const r = resolveLevel(0, "major", { degree: "VI", table: "auto", forceQuality: null });
  assert.strictEqual(r.rootIndex, 3);
  assert.strictEqual(r.quality, "minor");
}

// c moll：同主III度調 = e moll（root 4、長調オフセット表で根音を求め、質は長調パターンでminor）
{
  const r = resolveLevel(0, "minor", { degree: "III", table: "relative", forceQuality: null });
  assert.strictEqual(r.rootIndex, 4);
  assert.strictEqual(r.quality, "minor");
}

// VII調は長調で減三和音のため不成立 → ChordErrorを投げる
{
  assert.throws(() => {
    resolveLevel(0, "major", { degree: "VII", table: "auto", forceQuality: null });
  }, ChordError);
}

console.log("Task 2: OK");
