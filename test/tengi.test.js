const assert = require("assert");
const { deriveChord, indexToPitchClass } = require("../core.js");
const { CATALOG } = require("../catalog.js");
const { normalize, symmetryPeriod, buildTable, pcToKeyName, lookup } = require("../tengi.js");

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
}

// ==================== normalize ====================

test("normalize は辞書順最小の回転を選ぶ", () => {
  // C dur 三和音 {0,4,7}: [0,4,7](t=0) [0,3,8](t=4) [0,5,9](t=7) → [0,3,8]
  assert.deepStrictEqual(normalize([0, 4, 7]), { pattern: [0, 3, 8], t: 4 });
  assert.deepStrictEqual(normalize([7, 0, 4]), { pattern: [0, 3, 8], t: 4 });
});

test("normalize は移調不変", () => {
  const a = normalize([0, 4, 7]);
  const b = normalize([2, 6, 9]);
  assert.deepStrictEqual(a.pattern, b.pattern);
  assert.strictEqual((b.t - a.t + 12) % 12, 2);
});

test("normalize は対称集合では t 最小を選ぶ", () => {
  assert.deepStrictEqual(normalize([0, 3, 6, 9]), { pattern: [0, 3, 6, 9], t: 0 });
  assert.deepStrictEqual(normalize([1, 4, 7, 10]), { pattern: [0, 3, 6, 9], t: 1 });
});

// ==================== symmetryPeriod ====================

test("symmetryPeriod: 減7は3、増三和音は4、非対称は12", () => {
  assert.strictEqual(symmetryPeriod([0, 3, 6, 9]), 3);
  assert.strictEqual(symmetryPeriod([0, 4, 8]), 4);
  assert.strictEqual(symmetryPeriod([0, 2, 6, 8]), 6);
  assert.strictEqual(symmetryPeriod([0, 3, 8]), 12);
});

// ==================== pcToKeyName ====================

test("pcToKeyName は五度圏で近い綴りを選ぶ", () => {
  assert.strictEqual(pcToKeyName(0), "C");
  assert.strictEqual(pcToKeyName(3), "Es");
  assert.strictEqual(pcToKeyName(8), "As");
  assert.strictEqual(pcToKeyName(10), "B");
  assert.strictEqual(pcToKeyName(11), "H");
});

test("pcToKeyName は三全音では Fis を選ぶ（Ges ではない）", () => {
  // pc6 は n=+6(Fis) と n=-6(Ges) が五度圏上で等距離。ブログ(ID585)の綴りに合わせる。
  assert.strictEqual(pcToKeyName(6), "Fis");
});

// ==================== buildTable ====================

const table = buildTable(CATALOG, deriveChord);

test("buildTable: カタログは106件で、24グループ・孤立8になる", () => {
  assert.strictEqual(CATALOG.length, 106);
  assert.strictEqual(table.groups.length, 24);
  assert.strictEqual(table.groups.filter((g) => g.isolated).length, 8);
  const total = table.groups.reduce((n, g) => n + g.members.length, 0);
  assert.strictEqual(total, 106);
});

// ==================== lookup ====================

function rowsOf(spec) {
  const r = deriveChord(spec);
  assert.ok(!r.error, r.error);
  return lookup(r.pcs, table, indexToPitchClass(spec.mainKey.index), spec.mainKey.quality, spec);
}

const SPEC = (over, quality, degree, special, form, alteration, omission) => ({
  mainKey: { index: over, quality },
  innerChain: [],
  chord: { degree, special, form, alteration, omission, inversion: 0 }
});

test("lookup: C Dur V度7 は11件、入力自身を含む", () => {
  const out = rowsOf(SPEC(0, "major", "V", null, { seventh: true }, {}, {}));
  assert.strictEqual(out.found, true);
  assert.strictEqual(out.isolated, false);
  assert.strictEqual(out.rows.length, 11);
  const labels = out.rows.map((r) => r.key + " " + r.symbol);
  for (const want of ["C V度7", "c V度7", "D IV度付加6上変", "d ドリアIV度7",
    "F V度のV度7", "f V度のV度7", "G IV度のV度7", "g IV度のV度7",
    "a VII度7", "H V度の準V度9下変根省", "h V度のV度9下変根省"]) {
    assert.ok(labels.includes(want), `missing: ${want} / got ${labels.join(" | ")}`);
  }
});

test("lookup: D Dur V度9上変 は孤立（入力行のみ）", () => {
  const out = rowsOf(SPEC(2, "major", "V", null, { seventh: true, ninth: true }, { up: true }, {}));
  assert.strictEqual(out.found, true);
  assert.strictEqual(out.isolated, true);
  assert.strictEqual(out.rows.length, 1);
  assert.strictEqual(out.rows[0].key, "D");
  assert.strictEqual(out.rows[0].symbol, "V度9上変");
});

test("lookup: 減7（C Dur 準IV度付加4-5省）は周期3で24件、Fis を含む", () => {
  const out = rowsOf(SPEC(0, "major", "IV", "quasi", { add4: true }, {}, { fifth: true }));
  assert.strictEqual(out.rows.length, 24);
  assert.strictEqual(out.period, 3);
  const labels = out.rows.map((r) => r.key + " " + r.symbol);
  assert.ok(labels.includes("Fis 準IV度付加4-5省"), labels.join(" | "));
  assert.ok(labels.includes("fis IV度付加4-5省"), labels.join(" | "));
  assert.ok(!labels.some((l) => l.startsWith("Ges") || l.startsWith("ges")), "Ges 綴りが混じった");
});

test("lookup: 増三和音（C Dur V度上変）は周期4で6件", () => {
  const out = rowsOf(SPEC(0, "major", "V", null, {}, { up: true }, {}));
  assert.strictEqual(out.period, 4);
  assert.strictEqual(out.rows.length, 6);
  const labels = out.rows.map((r) => r.key + " " + r.symbol).sort();
  assert.deepStrictEqual(labels.sort(), [
    "As V度上変", "C V度上変", "E V度上変", "as III度上変", "c III度上変", "e III度上変"
  ].sort());
});

test("lookup: C Dur V度9上変根省 は周期6で8件", () => {
  const out = rowsOf(SPEC(0, "major", "V", null, { seventh: true, ninth: true }, { up: true }, { root: true }));
  assert.strictEqual(out.period, 6);
  assert.strictEqual(out.rows.length, 8);
  const labels = out.rows.map((r) => r.key + " " + r.symbol);
  assert.ok(labels.includes("Es V度の準V度7下変"), labels.join(" | "));
  assert.ok(labels.includes("Fis V度9上変根省"), labels.join(" | "));
});

test("lookup: 入力行は isInput 印が付き、ちょうど1件", () => {
  const out = rowsOf(SPEC(0, "major", "V", null, { seventh: true }, {}, {}));
  const marked = out.rows.filter((r) => r.isInput);
  assert.strictEqual(marked.length, 1);
  assert.strictEqual(marked[0].key, "C");
  assert.strictEqual(marked[0].symbol, "V度7");
});

test("lookup: 表に無い構成音は found=false", () => {
  // 全音音階の断片 {0,2,4}: カタログのどのグループにも無い
  const out = lookup([0, 2, 4], table);
  assert.strictEqual(out.found, false);
  assert.deepStrictEqual(out.rows, []);
});

test("lookup: 106件外の入力でも構成音が一致すれば引ける（内部調の入れ子）", () => {
  // G Dur の V度調(D Dur)の I度 = d fis a。単独の記号としてはカタログに無いが
  // 構成音は長三和音なのでグループに当たる。
  const spec = {
    mainKey: { index: 1, quality: "major" },
    innerChain: [{ degree: "V", table: "auto", forceQuality: null }],
    chord: { degree: "I", special: null, form: {}, alteration: {}, omission: {}, inversion: 0 }
  };
  const r = deriveChord(spec);
  assert.ok(!r.error, r.error);
  const out = lookup(r.pcs, table, indexToPitchClass(spec.mainKey.index), spec.mainKey.quality, spec);
  assert.strictEqual(out.found, true);
  const labels = out.rows.map((x) => x.key + " " + x.symbol);
  assert.ok(labels.includes("D I度"), labels.join(" | "));
  assert.ok(labels.includes("A IV度"), labels.join(" | "));
  // 入力した記号（V度調の I度）はカタログに無いので isInput は付かない。
  // ただし主調 G Dur に同じ構成音の平の記号 V度 があるので、そちらに sameKey が付く
  // ——入れ子の記法を主調から見た言い換えとして読める。
  assert.strictEqual(out.rows.filter((x) => x.isInput).length, 0);
  const same = out.rows.filter((x) => x.sameKey);
  assert.strictEqual(same.length, 1);
  assert.strictEqual(same[0].key, "G");
  assert.strictEqual(same[0].symbol, "V度");
});

test("lookup: 同じ調に別の読みがあっても、入力印が付くのは打った記号だけ", () => {
  // C Dur の減7は `準IV度付加4-5省` とも `準V度9根省` とも読めるが、
  // ユーザーが打ったのは前者だけ。後者には sameKey が付く。
  const out = rowsOf(SPEC(0, "major", "IV", "quasi", { add4: true }, {}, { fifth: true }));
  const marked = out.rows.filter((r) => r.isInput);
  assert.strictEqual(marked.length, 1);
  assert.strictEqual(marked[0].symbol, "準IV度付加4-5省");
  const same = out.rows.filter((r) => r.sameKey);
  assert.strictEqual(same.length, 1);
  assert.strictEqual(same[0].key, "C");
  assert.strictEqual(same[0].symbol, "準V度9根省");
});

test("lookup: 転回違いでも入力印は付く（表は構成音で引くので転回は無視する）", () => {
  const spec = {
    mainKey: { index: 0, quality: "major" },
    innerChain: [],
    chord: { degree: "V", special: null, form: { seventh: true }, alteration: {}, omission: {}, inversion: 2 }
  };
  const out = rowsOf(spec);
  const marked = out.rows.filter((r) => r.isInput);
  assert.strictEqual(marked.length, 1);
  assert.strictEqual(marked[0].symbol, "V度7");
});

test("lookup: 転回しても同じグループに当たる（構成音で引くため）", () => {
  const base = rowsOf(SPEC(0, "major", "V", null, { seventh: true }, {}, {}));
  const inv = deriveChord({
    mainKey: { index: 0, quality: "major" },
    innerChain: [],
    chord: { degree: "V", special: null, form: { seventh: true }, alteration: {}, omission: {}, inversion: 2 }
  });
  assert.ok(!inv.error, inv.error);
  const out = lookup(inv.pcs, table);
  assert.strictEqual(out.rows.length, base.rows.length);
});

console.log(`Tengi tests: ${passed}/${passed} OK`);
