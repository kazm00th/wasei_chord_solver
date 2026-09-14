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

const { resolveChain } = require("../core.js");

// a moll：III度調の中でマイナス準VI度調 → as moll（本セッションで検算済みの入れ子例）
{
  const mainKey = { index: 3, quality: "minor" }; // a moll
  const chain = [
    { degree: "III", table: "auto", forceQuality: null },       // → C Dur (root 0, major)
    { degree: "VI", table: "quasi", forceQuality: "minor" }      // → as moll (root -4, minor)
  ];
  const r = resolveChain(mainKey, chain);
  assert.strictEqual(r.rootIndex, -4);
  assert.strictEqual(r.quality, "minor");
  assert.strictEqual(r.steps.length, 3); // 主調 + 2階層
}

// 空のchain → mainKeyがそのまま返る
{
  const r = resolveChain({ index: 0, quality: "major" }, []);
  assert.strictEqual(r.rootIndex, 0);
  assert.strictEqual(r.quality, "major");
}

console.log("Task 3: OK");

const { buildTriad } = require("../core.js");

// C Dur I度 = C, E, G（index 0, 4, 1）
{
  const t = buildTriad(0, "major");
  assert.deepStrictEqual(t, { root: 0, third: 4, fifth: 1 });
}

// a moll I度 = A, C, E（index 3, 0, 4）
{
  const t = buildTriad(3, "minor");
  assert.deepStrictEqual(t, { root: 3, third: 0, fifth: 4 });
}

console.log("Task 4: OK");

const { resolveChordDegree } = require("../core.js");

// C Dur内で通常のIV度 = f, a, c
{
  const r = resolveChordDegree(0, "major", { degree: "IV", special: null });
  assert.strictEqual(r.rootIndex, -1);
  assert.strictEqual(r.quality, "major");
  assert.deepStrictEqual(r.triad, { root: -1, third: 3, fifth: 0 });
}

// C Dur内で準IV度 = f, as, c（chord.special="quasi"）
{
  const r = resolveChordDegree(0, "major", { degree: "IV", special: "quasi" });
  assert.strictEqual(r.rootIndex, -1);
  assert.strictEqual(r.quality, "minor");
  assert.deepStrictEqual(r.triad, { root: -1, third: -4, fifth: 0 });
}

// c moll内でドリアIV度 = f, a, c（プラスIV度と同義、質をmajorに強制）
{
  const r = resolveChordDegree(0, "minor", { degree: "IV", special: "doric" });
  assert.strictEqual(r.rootIndex, -1);
  assert.strictEqual(r.quality, "major");
  assert.deepStrictEqual(r.triad, { root: -1, third: 3, fifth: 0 });
}

// ドリアIV度をIV以外に指定するとエラー
{
  assert.throws(() => {
    resolveChordDegree(0, "minor", { degree: "V", special: "doric" });
  }, ChordError);
}

// c moll内でナポリII度 = des, f, as（root -5, major）
{
  const r = resolveChordDegree(0, "minor", { degree: "II", special: "napoli" });
  assert.strictEqual(r.rootIndex, -5);
  assert.strictEqual(r.quality, "major");
}

// C Dur内で変位VII度 = h, dis, fis（H Durの三和音、root 5, major）
{
  const r = resolveChordDegree(0, "major", { degree: "VII", special: "raisedVII" });
  assert.strictEqual(r.rootIndex, 5);
  assert.strictEqual(r.quality, "major");
}

console.log("Task 5: OK");

const { applyForm } = require("../core.js");

// C Dur V度7 = g h d f（root 1, major）
{
  const triad = { root: 1, third: 5, fifth: 2 };
  const r = applyForm(triad, "major", { seventh: true, ninth: false, add6: false, add4: false });
  assert.deepStrictEqual(r.extra, [-1]); // root+(-2) = 1-2 = -1 → F
}

// C Dur V度9 = g h d f a（長9度、root+2=3）
{
  const triad = { root: 1, third: 5, fifth: 2 };
  const r = applyForm(triad, "major", { seventh: true, ninth: true, add6: false, add4: false });
  assert.deepStrictEqual(r.extra, [-1, 3]);
}

// C Dur IV度付加6 = f a c d（root -1、+3 → 2）
{
  const triad = { root: -1, third: 3, fifth: 0 };
  const r = applyForm(triad, "major", { seventh: false, ninth: false, add6: true, add4: false });
  assert.deepStrictEqual(r.extra, [2]);
}

// C Dur IV度付加4 = f a c d h（付加6の2に加えて根音+6=5）
{
  const triad = { root: -1, third: 3, fifth: 0 };
  const r = applyForm(triad, "major", { seventh: false, ninth: false, add6: false, add4: true });
  assert.deepStrictEqual(r.extra, [2, 5]);
}

console.log("Task 6: OK");
