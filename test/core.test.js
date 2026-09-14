const assert = require("assert");
const { indexToNoteName, indexToPitchClass, MAJOR_OFFSETS } = require("../core.js");

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

// c moll内で準IV度を指定するとエラー（準X度は長調専用のため、自分自身の
// 同主短調を借用することになり意味をなさない）
{
  assert.throws(() => {
    resolveChordDegree(0, "minor", { degree: "IV", special: "quasi" });
  }, ChordError);
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

// C Dur内で準ナポリII度 = des, f, as（ナポリII度と同じ構成音、長調専用）
{
  const r = resolveChordDegree(0, "major", { degree: "II", special: "quasiNapoli" });
  assert.strictEqual(r.rootIndex, -5);
  assert.strictEqual(r.quality, "major");
}

// 長調でナポリII度（準なし）を指定するとエラー（短調専用のため）
{
  assert.throws(() => {
    resolveChordDegree(0, "major", { degree: "II", special: "napoli" });
  }, ChordError);
}

// 短調で準ナポリII度を指定するとエラー（長調専用のため）
{
  assert.throws(() => {
    resolveChordDegree(0, "minor", { degree: "II", special: "quasiNapoli" });
  }, ChordError);
}

// C Dur内で変位VII度 = h, dis, fis（H Durの三和音、root 5, major）
{
  const r = resolveChordDegree(0, "major", { degree: "VII", special: "raisedVII" });
  assert.strictEqual(r.rootIndex, 5);
  assert.strictEqual(r.quality, "major");
}

// C Dur内でVII度（減三和音）は和音としては成立する = h, d, f（root 5, diminished）
{
  const r = resolveChordDegree(0, "major", { degree: "VII", special: null });
  assert.strictEqual(r.rootIndex, 5);
  assert.strictEqual(r.quality, "diminished");
  assert.deepStrictEqual(r.triad, { root: 5, third: 2, fifth: -1 }); // H, D, F
}

// c moll内でII度（減三和音）も和音としては成立する = d, f, as（root 2, diminished）
{
  const r = resolveChordDegree(0, "minor", { degree: "II", special: null });
  assert.strictEqual(r.rootIndex, 2);
  assert.strictEqual(r.quality, "diminished");
  assert.deepStrictEqual(r.triad, { root: 2, third: -1, fifth: -4 });
}

// resolveChainは内部調としてのVII度（減三和音）を引き続き拒否する
{
  assert.throws(() => {
    resolveChain({ index: 0, quality: "major" }, [{ degree: "VII", table: "auto", forceQuality: null }]);
  }, ChordError);
}

console.log("Task 5: OK");

const { applyForm } = require("../core.js");

// V度のdiatonicContext（C Dur、長調オフセット表、degreeIndex=4）
const vDegreeContext = { tonicIndex: 0, offsets: MAJOR_OFFSETS, degreeIndex: 4 };

// C Dur V度7 = g h d f（7度はIV度の音＝root-1、ダイアトニックに決まる）
{
  const triad = { root: 1, third: 5, fifth: 2 };
  const r = applyForm(triad, "major", { seventh: true, ninth: false, add6: false, add4: false }, vDegreeContext);
  assert.deepStrictEqual(r.extra, [-1]); // IV度の音 = 0 + (-1) = -1 → F
}

// C Dur V度9 = g h d f a（9度はVI度の音＝root+3、ダイアトニックに決まる）
{
  const triad = { root: 1, third: 5, fifth: 2 };
  const r = applyForm(triad, "major", { seventh: true, ninth: true, add6: false, add4: false }, vDegreeContext);
  assert.deepStrictEqual(r.extra, [-1, 3]); // VI度の音 = 0 + 3 = 3 → A
}

// 9度は7度を自動的に内包する（seventh: falseでもninth: trueだけで7度の音も含まれる、
// 付加4が付加6の音を自動的に内包するのと同じ設計）
{
  const triad = { root: 1, third: 5, fifth: 2 };
  const r = applyForm(triad, "major", { seventh: false, ninth: true, add6: false, add4: false }, vDegreeContext);
  assert.deepStrictEqual(r.extra, [-1, 3]); // seventh:trueを指定した場合と同じ結果になる
}

// 7度・9度にdiatonicContextが無い場合（ナポリ・変位VII等）はエラー
{
  const triad = { root: 1, third: 5, fifth: 2 };
  assert.throws(() => {
    applyForm(triad, "major", { seventh: true, ninth: false, add6: false, add4: false }, null);
  }, ChordError);
}

// IV度のdiatonicContext（C Dur、長調オフセット表、degreeIndex=3）
const ivDegreeContext = { tonicIndex: 0, offsets: MAJOR_OFFSETS, degreeIndex: 3 };

// C Dur IV度付加6 = f a c d（付加6の音はII度の音、ダイアトニックに決まる）
{
  const triad = { root: -1, third: 3, fifth: 0 };
  const r = applyForm(triad, "major", { seventh: false, ninth: false, add6: true, add4: false }, ivDegreeContext);
  assert.deepStrictEqual(r.extra, [2]); // II度の音 = 0 + 2 = 2 → D
}

// C Dur IV度付加4 = f a c d h（付加6の音D＋VII度の音H）
{
  const triad = { root: -1, third: 3, fifth: 0 };
  const r = applyForm(triad, "major", { seventh: false, ninth: false, add6: false, add4: true }, ivDegreeContext);
  assert.deepStrictEqual(r.extra, [2, 5]); // D, VII度の音 = 0 + 5 = 5 → H
}

console.log("Task 6: OK");

const { applyAlteration } = require("../core.js");

// C Dur V度上変 = g h dis（5度を+7）
{
  const chord = { root: 1, third: 5, fifth: 2, extra: [] };
  const r = applyAlteration(chord, { add6: false, add4: false }, { up: true, down: false });
  assert.strictEqual(r.fifth, 9);
  assert.strictEqual(r.root, 1);
  assert.strictEqual(r.third, 5);
}

// C Dur IV度付加6上変 = f a c dis（付加6音を+7、5度は不変）
{
  const chord = { root: -1, third: 3, fifth: 0, extra: [2] };
  const r = applyAlteration(chord, { add6: true, add4: false }, { up: true, down: false }, ivDegreeContext);
  assert.deepStrictEqual(r.extra, [9]);
  assert.strictEqual(r.fifth, 0); // 不変
}

// C Dur III度付加6上変 = e g h cis（付加6音の実値がroot+3(=7)と一致しない度数での回帰テスト。
// 付加6音は度数(2+5)%7=I度の音=0で、これを+7した7が正しい結果）
{
  const iiiDegreeContext = { tonicIndex: 0, offsets: MAJOR_OFFSETS, degreeIndex: 2 };
  const chord = { root: 4, third: 1, fifth: 5, extra: [0] };
  const r = applyAlteration(chord, { add6: true, add4: false }, { up: true, down: false }, iiiDegreeContext);
  assert.deepStrictEqual(r.extra, [7]); // 0 + 7 = 7 → Cis（root+3=7ではなく実際の付加6音0を正しく発見・変更できること）
}

// 変化なし（up/down both false）
{
  const chord = { root: 1, third: 5, fifth: 2, extra: [] };
  const r = applyAlteration(chord, { add6: false, add4: false }, { up: false, down: false });
  assert.strictEqual(r.fifth, 2);
}

console.log("Task 7: OK");

const { applyOmissionAndInversion } = require("../core.js");

// C Dur I度（基本形、転回なし）= [C, E, G]
{
  const chord = { root: 0, third: 4, fifth: 1, extra: [] };
  const notes = applyOmissionAndInversion(chord, { root: false, fifth: false }, 0);
  assert.deepStrictEqual(notes, [0, 4, 1]);
}

// C Dur I度1転（3度が最低音）= [E, G, C]
{
  const chord = { root: 0, third: 4, fifth: 1, extra: [] };
  const notes = applyOmissionAndInversion(chord, { root: false, fifth: false }, 1);
  assert.deepStrictEqual(notes, [4, 1, 0]);
}

// C Dur V度9根省（根省すると慣例上3度が最低音になる）= [H, D, F, A]
{
  const chord = { root: 1, third: 5, fifth: 2, extra: [-1, 3] }; // V度9 = g h d f a
  const notes = applyOmissionAndInversion(chord, { root: true, fifth: false }, 0);
  assert.deepStrictEqual(notes, [5, 2, -1, 3]); // h(根省) d f a、rootのgを除外し3度が先頭
}

console.log("Task 8: OK");

const { deriveChord } = require("../core.js");

// C Dur：III度調の（I度） = e, g, h（e moll、本セッション検算済み）
{
  const spec = {
    mainKey: { index: 0, quality: "major" },
    innerChain: [{ degree: "III", table: "auto", forceQuality: null }],
    chord: { degree: "I", special: null, form: {}, alteration: {}, omission: {}, inversion: 0 }
  };
  const r = deriveChord(spec);
  assert.deepStrictEqual(r.notes, ["E", "G", "H"]);
  assert.deepStrictEqual(r.pcs, [4, 7, 11]);
}

// a moll：III度調の（マイナス準VI度調の（I度）） = As, Ces, Es（本セッションで検算済みの3階層入れ子）
{
  const spec = {
    mainKey: { index: 3, quality: "minor" },
    innerChain: [
      { degree: "III", table: "auto", forceQuality: null },
      { degree: "VI", table: "quasi", forceQuality: "minor" }
    ],
    chord: { degree: "I", special: null, form: {}, alteration: {}, omission: {}, inversion: 0 }
  };
  const r = deriveChord(spec);
  assert.deepStrictEqual(r.notes, ["As", "Ces", "Es"]);
}

// エラー処理: 長調でVII度調を要求 → { error: ... }
{
  const spec = {
    mainKey: { index: 0, quality: "major" },
    innerChain: [{ degree: "VII", table: "auto", forceQuality: null }],
    chord: { degree: "I", special: null, form: {}, alteration: {}, omission: {}, inversion: 0 }
  };
  const r = deriveChord(spec);
  assert.ok(r.error);
}

// 不明な度数 "VIII" → { error: ... }（NaNだらけの結果ではなくエラーになる）
{
  const spec = {
    mainKey: { index: 0, quality: "major" },
    innerChain: [],
    chord: { degree: "VIII", special: null, form: {}, alteration: {}, omission: {}, inversion: 0 }
  };
  const r = deriveChord(spec);
  assert.ok(r.error);
}

// chord.form/alteration/omissionを丸ごと省略しても正常に動作する（{}指定と同じ結果）
{
  const spec = {
    mainKey: { index: 0, quality: "major" },
    innerChain: [],
    chord: { degree: "I", special: null, inversion: 0 }
  };
  const r = deriveChord(spec);
  assert.deepStrictEqual(r.notes, ["C", "E", "G"]);
}

console.log("Task 9: OK");
