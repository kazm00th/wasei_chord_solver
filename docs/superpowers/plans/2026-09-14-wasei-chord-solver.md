# 和声記号→構成音導出ツール（wasei_chord_solver）実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 島岡譲系和声理論の和音記号（`○度調の（○度の○度）`のような入れ子構造、準/同主/プラス/マイナス、ナポリII度、ドリアIV度、変位VII、形体7/9/付加6/付加4、上変/下変、根省/5省、転回を含む）から、構成音・ピッチクラス・導出ステップを算出するツールを作る。

**Architecture:** `core.js`（DOM非依存の純粋関数群、五度圏インデックスによる計算）と`index.html`（動的ドロップダウンUI）を分離する。`core.js`はNode（テスト）とブラウザ（UI）の両方から同じファイルを読み込む。

**Tech Stack:** 素のJavaScript（ES2017程度）。ビルドツール・外部ライブラリなし。テストはNode標準の`assert`モジュールのみ。

**Spec:** [docs/superpowers/specs/2026-09-13-wasei-chord-solver-design.md](../specs/2026-09-13-wasei-chord-solver-design.md)

## Global Constraints

- 単一HTML化は不要（`index.html`から`<script src="core.js">`で読み込む形でよい）——仕様書とのブレを修正済み。
- 外部依存ライブラリ・ビルドツールは使用しない。
- 音名はドイツ語表記（`C, Cis, Ces, ...`, `H`は特別扱い、フラット系は`B, Bes, Beses...`）。E/Aは母音省略規則により最初のフラットのみ`s`（`Es, As`であって`Ees, Aes`ではない）、2個目以降は`es`を追加（`Eses, Ases`）。
- 五度圏インデックス変換規則: `m = n + 1; letter = "FCGDAEH"[((m%7)+7)%7]; accidentals = Math.floor(m/7)`。`letter === "H" && accidentals < 0`のときは`letter = "B"; accidentals = accidentals + 1`に置き換えてから接尾辞を付ける（HANDOFF §5で確定：`n=-2`→`B`、`n=-9`→`Bes`、`n=-16`→`Beses`）。さらにフラット側（`accidentals < 0`）で`letter`が`"A"`または`"E"`のときは、最初の1個は`"s"`、2個目以降は`"es"`を追加する（`letter + "s" + "es".repeat(-accidentals-1)`。Task1実装時に発見・訂正——`Es`(n=-3)`As`等の1フラットで`"Ees"/"Aes"`にならないための母音省略）。それ以外の文字は通常どおり`"es".repeat(-accidentals)`。
- ピッチクラス変換: `pc = (((n*7) % 12) + 12) % 12`。
- 度数オフセット表（長調）: `{ I:0, II:2, III:4, IV:-1, V:1, VI:3, VII:5 }`。
- 度数オフセット表（自然短調）: `{ I:0, II:2, III:-3, IV:-1, V:1, VI:-4, VII:-2 }`。
- 度数の質パターン（長調）: `{ I:"major", II:"minor", III:"minor", IV:"major", V:"major", VI:"minor", VII:"diminished" }`。
- 度数の質パターン（自然短調）: `{ I:"minor", II:"diminished", III:"major", IV:"minor", V:"minor", VI:"major", VII:"major" }`。
- 特殊内部調オフセット: ナポリII調 = `-5`（既定の質 `"major"`）、変位VII調 = `+5`（既定の質 `"major"`）。
- 三和音の3度オフセット: 長三和音 `+4`、短三和音 `-3`。5度オフセットは常に`+1`（完全5度）。
- 形体オフセット（根音からの相対）: 7度 `-2`、9度 = 質が`"major"`なら`+2`、`"minor"`なら`-5`、付加6 `+3`、付加4 = 付加6（`+3`）に加えて根音`+6`のもう1音を追加（[HANDOFF.md:139](../../../../HANDOFF.md)「付加6＋根音の4度上をさらに付加」）。
- 上変/下変: `form.add6`または`form.add4`が真なら「付加6の音」（根音`+3`の音）を`±7`ずらす。それ以外（V度族）なら「5度の音」（根音`+1`の音）を`±7`ずらす（[HANDOFF.md:142](../../../../HANDOFF.md)の実例で確認済み）。

---

## ファイル構成

```
wasei_chord_solver/
├── core.js               # 計算ロジック（DOM非依存、Node/ブラウザ共用）
├── index.html             # UI
├── test/
│   ├── core.test.js        # 単体テスト（Node標準assert）
│   └── golden.json          # HANDOFF.mdから抽出したゴールデンテスト
└── README.md
```

`core.js`は1ファイルに収めるが、内部を「音名変換」「度数テーブル解決（`resolveLevel`/`resolveChain`）」「和音構築（`buildTriad`〜`deriveChord`）」の3ブロックにコメントで区切る。将来分割が必要になった場合の境界を明示しておく。

---

### Task 1: プロジェクト雛形と音名・ピッチクラス変換

**Files:**
- Create: `wasei_chord_solver/core.js`
- Test: `wasei_chord_solver/test/core.test.js`

**Interfaces:**
- Produces: `indexToNoteName(n: number): string`、`indexToPitchClass(n: number): number`（他タスクがすべてこの2関数の上に構築される）

- [ ] **Step 1: 失敗するテストを書く**

`wasei_chord_solver/test/core.test.js`を新規作成:

```js
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
```

- [ ] **Step 2: テストを実行して失敗を確認する**

Run: `node wasei_chord_solver/test/core.test.js`
Expected: `Cannot find module '../core.js'`（`core.js`がまだ存在しないため）

- [ ] **Step 3: 最小実装を書く**

`wasei_chord_solver/core.js`を新規作成:

```js
"use strict";

// ==================== 音名・ピッチクラス変換 ====================

const FIFTHS_LETTERS = "FCGDAEH";

function indexToNoteName(n) {
  const m = n + 1;
  let letter = FIFTHS_LETTERS[((m % 7) + 7) % 7];
  let accidentals = Math.floor(m / 7);
  // ドイツ語表記の特例: Hのフラット系はすべてBを土台にする
  // （n=-2→B, n=-9→Bes, n=-16→Beses。HANDOFF §5で確定）
  if (letter === "H" && accidentals < 0) {
    letter = "B";
    accidentals = accidentals + 1;
  }
  if (accidentals > 0) return letter + "is".repeat(accidentals);
  if (accidentals < 0) {
    const numFlats = -accidentals;
    if (letter === "A" || letter === "E") {
      return letter + "s" + "es".repeat(numFlats - 1);
    }
    return letter + "es".repeat(numFlats);
  }
  return letter;
}

function indexToPitchClass(n) {
  return (((n * 7) % 12) + 12) % 12;
}

module.exports = { indexToNoteName, indexToPitchClass };
```

- [ ] **Step 4: テストを実行して合格を確認する**

Run: `node wasei_chord_solver/test/core.test.js`
Expected: `Task 1: OK`が出力される

- [ ] **Step 5: コミット**

```bash
cd wasei_chord_solver
git add core.js test/core.test.js
git commit -m "feat: add fifths-index note name and pitch class conversion

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

（このリポジトリは既に`git init`済み。追加のリポジトリ初期化は不要。）

---

### Task 2: 度数オフセット表と単一階層の内部調解決（`resolveLevel`）

**Files:**
- Modify: `wasei_chord_solver/core.js`
- Test: `wasei_chord_solver/test/core.test.js`

**Interfaces:**
- Consumes: なし（Task1の関数とは独立したブロック）
- Produces: `resolveLevel(rootIndex: number, currentQuality: "major"|"minor", level: {degree, table, forceQuality}): {rootIndex, quality}`、`ChordError`クラス

`level`の形: `{ degree: "I".."VII" | "napoliII" | "raisedVII", table: "auto"|"quasi"|"relative", forceQuality: null|"major"|"minor" }`

- [ ] **Step 1: 失敗するテストを書く**

`test/core.test.js`に追記:

```js
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
```

- [ ] **Step 2: テストを実行して失敗を確認する**

Run: `node wasei_chord_solver/test/core.test.js`
Expected: `resolveLevel is not a function`

- [ ] **Step 3: 最小実装を書く**

`core.js`の`module.exports`の直前に追記:

```js
// ==================== 度数オフセット・質パターン ====================

const MAJOR_OFFSETS = { I: 0, II: 2, III: 4, IV: -1, V: 1, VI: 3, VII: 5 };
const MINOR_OFFSETS = { I: 0, II: 2, III: -3, IV: -1, V: 1, VI: -4, VII: -2 };
const MAJOR_QUALITY = { I: "major", II: "minor", III: "minor", IV: "major", V: "major", VI: "minor", VII: "diminished" };
const MINOR_QUALITY = { I: "minor", II: "diminished", III: "major", IV: "minor", V: "minor", VI: "major", VII: "major" };

const SPECIAL_DEGREES = {
  napoliII: { offset: -5, quality: "major" },
  raisedVII: { offset: 5, quality: "major" }
};

class ChordError extends Error {}

// level = { degree, table: "auto"|"quasi"|"relative", forceQuality: null|"major"|"minor" }
function resolveLevel(rootIndex, currentQuality, level) {
  if (level.degree === "napoliII" || level.degree === "raisedVII") {
    const special = SPECIAL_DEGREES[level.degree];
    return {
      rootIndex: rootIndex + special.offset,
      quality: level.forceQuality || special.quality
    };
  }

  const useMajorTable =
    level.table === "relative" ? true :
    level.table === "quasi" ? false :
    currentQuality === "major";

  const offsets = useMajorTable ? MAJOR_OFFSETS : MINOR_OFFSETS;
  const qualityTable = useMajorTable ? MAJOR_QUALITY : MINOR_QUALITY;
  const naturalQuality = qualityTable[level.degree];

  if (naturalQuality === "diminished") {
    throw new ChordError(
      `度数${level.degree}は${useMajorTable ? "長調" : "自然短調"}オフセット表では減三和音のため、内部調として成立しません`
    );
  }

  return {
    rootIndex: rootIndex + offsets[level.degree],
    quality: level.forceQuality || naturalQuality
  };
}
```

`module.exports`を次のように更新:

```js
module.exports = {
  indexToNoteName,
  indexToPitchClass,
  resolveLevel,
  ChordError,
  MAJOR_OFFSETS,
  MINOR_OFFSETS,
  MAJOR_QUALITY,
  MINOR_QUALITY,
  SPECIAL_DEGREES
};
```

- [ ] **Step 4: テストを実行して合格を確認する**

Run: `node wasei_chord_solver/test/core.test.js`
Expected: `Task 1: OK` / `Task 2: OK`

- [ ] **Step 5: コミット**

```bash
git add core.js test/core.test.js
git commit -m "feat: add degree offset tables and single-level key resolution

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: 入れ子（`resolveChain`）による複数階層の解決

**Files:**
- Modify: `wasei_chord_solver/core.js`
- Test: `wasei_chord_solver/test/core.test.js`

**Interfaces:**
- Consumes: `resolveLevel`（Task2）
- Produces: `resolveChain(mainKey: {index, quality}, chain: level[]): {rootIndex, quality, steps: string[]}`

- [ ] **Step 1: 失敗するテストを書く**

```js
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
```

- [ ] **Step 2: テストを実行して失敗を確認する**

Run: `node wasei_chord_solver/test/core.test.js`
Expected: `resolveChain is not a function`

- [ ] **Step 3: 最小実装を書く**

`core.js`に`resolveLevel`の直後に追記:

```js
function describeLevel(level) {
  if (level.degree === "napoliII") return "ナポリII調";
  if (level.degree === "raisedVII") return "変位VII調";
  const tablePart = level.table === "quasi" ? "準" : level.table === "relative" ? "同主" : "";
  const forcePart = level.forceQuality === "major" ? "プラス" : level.forceQuality === "minor" ? "マイナス" : "";
  return `${forcePart}${tablePart}${level.degree}度調`;
}

function resolveChain(mainKey, chain) {
  let rootIndex = mainKey.index;
  let quality = mainKey.quality;
  const steps = [`主調（index ${rootIndex}, ${quality}）`];
  for (const level of chain) {
    const result = resolveLevel(rootIndex, quality, level);
    rootIndex = result.rootIndex;
    quality = result.quality;
    steps.push(`${describeLevel(level)}（index ${rootIndex}, ${quality}）`);
  }
  return { rootIndex, quality, steps };
}
```

`module.exports`に`resolveChain`を追加。

- [ ] **Step 4: テストを実行して合格を確認する**

Run: `node wasei_chord_solver/test/core.test.js`
Expected: `Task 3: OK`

- [ ] **Step 5: コミット**

```bash
git add core.js test/core.test.js
git commit -m "feat: add nested internal-key chain resolution

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 4: 三和音構築（`buildTriad`）

**Files:**
- Modify: `wasei_chord_solver/core.js`
- Test: `wasei_chord_solver/test/core.test.js`

**Interfaces:**
- Consumes: なし
- Produces: `buildTriad(rootIndex: number, quality: "major"|"minor"): {root, third, fifth}`（すべてfifths-index）

- [ ] **Step 1: 失敗するテストを書く**

```js
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
```

- [ ] **Step 2: テストを実行して失敗を確認する**

Run: `node wasei_chord_solver/test/core.test.js`
Expected: `buildTriad is not a function`

- [ ] **Step 3: 最小実装を書く**

```js
function buildTriad(rootIndex, quality) {
  const thirdOffset = quality === "major" ? 4 : -3;
  return {
    root: rootIndex,
    third: rootIndex + thirdOffset,
    fifth: rootIndex + 1
  };
}
```

`module.exports`に`buildTriad`を追加。

- [ ] **Step 4: テストを実行して合格を確認する**

Run: `node wasei_chord_solver/test/core.test.js`
Expected: `Task 4: OK`

- [ ] **Step 5: コミット**

```bash
git add core.js test/core.test.js
git commit -m "feat: add triad builder from root index and quality

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 5: 和音自体の特殊形（`chord.special`）を「もう1階層のresolveLevel」として統合

**設計上の要点**: 準/ナポリ/ドリア/変位VIIといった「和音レベルの特殊形」は、内部調を新規に確立しない点を除けば`resolveLevel`と全く同じ計算（オフセット表の選択・質の強制）を1回だけ行うのと同じ。したがって`chord.special`は「もう1段の`level`」に変換してから`resolveLevel`にそのまま渡し、結果を`buildTriad`に渡す、という設計にする（内部調チェーンと和音本体の計算コードを重複させない）。

**Files:**
- Modify: `wasei_chord_solver/core.js`
- Test: `wasei_chord_solver/test/core.test.js`

**Interfaces:**
- Consumes: `resolveLevel`（Task2）、`buildTriad`（Task4）
- Produces: `resolveChordDegree(localRootIndex: number, localQuality: string, chordSpec: {degree, special}): {rootIndex, quality, triad}`

- [ ] **Step 1: 失敗するテストを書く**

```js
const { resolveChordDegree, ChordError } = require("../core.js");

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
```

- [ ] **Step 2: テストを実行して失敗を確認する**

Run: `node wasei_chord_solver/test/core.test.js`
Expected: `resolveChordDegree is not a function`

- [ ] **Step 3: 最小実装を書く**

```js
function chordSpecialToLevel(chordSpec) {
  const degree = chordSpec.degree;
  switch (chordSpec.special) {
    case null:
    case undefined:
      return { degree, table: "auto", forceQuality: null };
    case "quasi":
      return { degree, table: "quasi", forceQuality: null };
    case "doric":
      if (degree !== "IV") throw new ChordError("ドリアIV度はIV度にのみ指定できます");
      return { degree: "IV", table: "auto", forceQuality: "major" };
    case "napoli":
      if (degree !== "II") throw new ChordError("ナポリII度はII度にのみ指定できます");
      return { degree: "napoliII", table: "auto", forceQuality: null };
    case "raisedVII":
      if (degree !== "VII") throw new ChordError("変位VII度はVII度にのみ指定できます");
      return { degree: "raisedVII", table: "auto", forceQuality: null };
    default:
      throw new ChordError(`未知のchord.special: ${chordSpec.special}`);
  }
}

function resolveChordDegree(localRootIndex, localQuality, chordSpec) {
  const level = chordSpecialToLevel(chordSpec);
  const resolved = resolveLevel(localRootIndex, localQuality, level);
  const triad = buildTriad(resolved.rootIndex, resolved.quality);
  return { rootIndex: resolved.rootIndex, quality: resolved.quality, triad };
}
```

`module.exports`に`resolveChordDegree`を追加。

- [ ] **Step 4: テストを実行して合格を確認する**

Run: `node wasei_chord_solver/test/core.test.js`
Expected: `Task 5: OK`

- [ ] **Step 5: コミット**

```bash
git add core.js test/core.test.js
git commit -m "feat: unify chord-level special forms with internal-key resolution

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 6: 形体（7度・9度・付加6・付加4）の追加

**Files:**
- Modify: `wasei_chord_solver/core.js`
- Test: `wasei_chord_solver/test/core.test.js`

**Interfaces:**
- Consumes: なし（`triad`と`quality`と`form`オブジェクトを受け取る純粋関数）
- Produces: `applyForm(triad: {root,third,fifth}, quality: string, form: {seventh,ninth,add6,add4}): {root,third,fifth,extra: number[]}`（`extra`は追加された構成音のfifths-index配列。順序: 7度→9度→6度→4度の順で押し込む）

- [ ] **Step 1: 失敗するテストを書く**

```js
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
```

- [ ] **Step 2: テストを実行して失敗を確認する**

Run: `node wasei_chord_solver/test/core.test.js`
Expected: `applyForm is not a function`

- [ ] **Step 3: 最小実装を書く**

```js
function applyForm(triad, quality, form) {
  const extra = [];
  if (form.seventh) extra.push(triad.root - 2);
  if (form.ninth) extra.push(triad.root + (quality === "major" ? 2 : -5));
  if (form.add4) {
    extra.push(triad.root + 3, triad.root + 6);
  } else if (form.add6) {
    extra.push(triad.root + 3);
  }
  return { ...triad, extra };
}
```

`module.exports`に`applyForm`を追加。

- [ ] **Step 4: テストを実行して合格を確認する**

Run: `node wasei_chord_solver/test/core.test.js`
Expected: `Task 6: OK`

- [ ] **Step 5: コミット**

```bash
git add core.js test/core.test.js
git commit -m "feat: add seventh/ninth/added-6th/added-4th form extension

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 7: 上変・下変（`applyAlteration`）

**Files:**
- Modify: `wasei_chord_solver/core.js`
- Test: `wasei_chord_solver/test/core.test.js`

**Interfaces:**
- Consumes: `applyForm`の戻り値の形（`{root,third,fifth,extra}`）と、その時点の`form`フラグ
- Produces: `applyAlteration(chordTones: {root,third,fifth,extra}, form: {add6,add4}, alteration: {up,down}): {root,third,fifth,extra}`（`fifth`または`extra`の該当要素を書き換えた新オブジェクトを返す）

**判定規則**（Global Constraintsに既述）: `add6`または`add4`が真なら「付加6の音」（`extra`配列の中で`root+3`にあたる要素）を`±7`ずらす。それ以外は`fifth`を`±7`ずらす。

- [ ] **Step 1: 失敗するテストを書く**

```js
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
  const r = applyAlteration(chord, { add6: true, add4: false }, { up: true, down: false });
  assert.deepStrictEqual(r.extra, [9]);
  assert.strictEqual(r.fifth, 0); // 不変
}

// 変化なし（up/down both false）
{
  const chord = { root: 1, third: 5, fifth: 2, extra: [] };
  const r = applyAlteration(chord, { add6: false, add4: false }, { up: false, down: false });
  assert.strictEqual(r.fifth, 2);
}

console.log("Task 7: OK");
```

- [ ] **Step 2: テストを実行して失敗を確認する**

Run: `node wasei_chord_solver/test/core.test.js`
Expected: `applyAlteration is not a function`

- [ ] **Step 3: 最小実装を書く**

```js
function applyAlteration(chord, form, alteration) {
  const shift = alteration.up ? 7 : alteration.down ? -7 : 0;
  if (shift === 0) return { ...chord, extra: [...chord.extra] };

  const result = { ...chord, extra: [...chord.extra] };
  if (form.add6 || form.add4) {
    // 付加6の音（root+3にあたる要素）を探して書き換える
    const idx = result.extra.findIndex((v) => v === chord.root + 3);
    if (idx !== -1) result.extra[idx] = result.extra[idx] + shift;
  } else {
    result.fifth = result.fifth + shift;
  }
  return result;
}
```

`module.exports`に`applyAlteration`を追加。

- [ ] **Step 4: テストを実行して合格を確認する**

Run: `node wasei_chord_solver/test/core.test.js`
Expected: `Task 7: OK`

- [ ] **Step 5: コミット**

```bash
git add core.js test/core.test.js
git commit -m "feat: add upward/downward chromatic alteration

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 8: 根省・5省・転回（`applyOmissionAndInversion`）

**Files:**
- Modify: `wasei_chord_solver/core.js`
- Test: `wasei_chord_solver/test/core.test.js`

**Interfaces:**
- Consumes: `applyAlteration`の戻り値の形
- Produces: `applyOmissionAndInversion(chord: {root,third,fifth,extra}, omission: {root,fifth}, inversion: number): number[]`（**最終的な構成音indexの配列**を、指定された転回に従って**低音から順に**並べたものとして返す。転回番号は「省略していない元の和音」を基準に数える——HANDOFF既定のとおり、根省された和音は明示がなくても慣例上3度が最低音になる）

- [ ] **Step 1: 失敗するテストを書く**

```js
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
```

- [ ] **Step 2: テストを実行して失敗を確認する**

Run: `node wasei_chord_solver/test/core.test.js`
Expected: `applyOmissionAndInversion is not a function`

- [ ] **Step 3: 最小実装を書く**

```js
function applyOmissionAndInversion(chord, omission, inversion) {
  // 元の和音の構成音を低音から高音の「定義順」で並べる: root, third, fifth, ...extra
  let full = [chord.root, chord.third, chord.fifth, ...chord.extra];

  // 転回: 指定された番号だけ先頭の音を末尾へ回す（省略前の全体を基準に回す）
  let rotated = full.slice(inversion).concat(full.slice(0, inversion));

  // 省略の適用
  if (omission.root) rotated = rotated.filter((v) => v !== chord.root);
  if (omission.fifth) rotated = rotated.filter((v) => v !== chord.fifth);

  // 根省で、かつ転回が明示されていない場合、慣例上3度を最低音にする
  if (omission.root && inversion === 0) {
    const thirdIdx = rotated.indexOf(chord.third);
    if (thirdIdx > 0) {
      rotated = rotated.slice(thirdIdx).concat(rotated.slice(0, thirdIdx));
    }
  }

  return rotated;
}
```

`module.exports`に`applyOmissionAndInversion`を追加。

- [ ] **Step 4: テストを実行して合格を確認する**

Run: `node wasei_chord_solver/test/core.test.js`
Expected: `Task 8: OK`

- [ ] **Step 5: コミット**

```bash
git add core.js test/core.test.js
git commit -m "feat: add root/fifth omission and inversion ordering

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 9: 統合関数`deriveChord`とエラー処理

**Files:**
- Modify: `wasei_chord_solver/core.js`
- Test: `wasei_chord_solver/test/core.test.js`

**Interfaces:**
- Consumes: `resolveChain`（Task3）、`resolveChordDegree`（Task5）、`applyForm`（Task6）、`applyAlteration`（Task7）、`applyOmissionAndInversion`（Task8）、`indexToNoteName`／`indexToPitchClass`（Task1）
- Produces: `deriveChord(spec: {mainKey, innerChain, chord}): {notes: string[], pcs: number[], steps: string[]} | {error: string}`（仕様書のデータモデルそのもの。これが`index.html`から呼ばれる唯一の公開APIになる）

- [ ] **Step 1: 失敗するテストを書く**

```js
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

console.log("Task 9: OK");
```

- [ ] **Step 2: テストを実行して失敗を確認する**

Run: `node wasei_chord_solver/test/core.test.js`
Expected: `deriveChord is not a function`

- [ ] **Step 3: 最小実装を書く**

```js
function deriveChord(spec) {
  try {
    const chain = resolveChain(spec.mainKey, spec.innerChain);
    const chordDegree = resolveChordDegree(chain.rootIndex, chain.quality, {
      degree: spec.chord.degree,
      special: spec.chord.special || null
    });

    const form = {
      seventh: !!spec.chord.form.seventh,
      ninth: !!spec.chord.form.ninth,
      add6: !!spec.chord.form.add6,
      add4: !!spec.chord.form.add4
    };
    const withForm = applyForm(chordDegree.triad, chordDegree.quality, form);

    const alteration = {
      up: !!spec.chord.alteration.up,
      down: !!spec.chord.alteration.down
    };
    const withAlteration = applyAlteration(withForm, form, alteration);

    const omission = {
      root: !!spec.chord.omission.root,
      fifth: !!spec.chord.omission.fifth
    };
    const indices = applyOmissionAndInversion(withAlteration, omission, spec.chord.inversion || 0);

    return {
      notes: indices.map(indexToNoteName),
      pcs: indices.map(indexToPitchClass),
      steps: [...chain.steps, `和音: ${spec.chord.degree}度（${chordDegree.quality}）`]
    };
  } catch (err) {
    if (err instanceof ChordError) return { error: err.message };
    throw err;
  }
}
```

`module.exports`に`deriveChord`を追加。

- [ ] **Step 4: テストを実行して合格を確認する**

Run: `node wasei_chord_solver/test/core.test.js`
Expected: `Task 9: OK`

- [ ] **Step 5: コミット**

```bash
git add core.js test/core.test.js
git commit -m "feat: add deriveChord integration entry point

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 10: HANDOFF.mdからのゴールデンテスト抽出

**Files:**
- Create: `wasei_chord_solver/test/golden.json`
- Create: `wasei_chord_solver/test/golden.test.js`

**Interfaces:**
- Consumes: `deriveChord`（Task9）
- Produces: なし（リグレッションテストの追加のみ）

**目的**: 本セッションでユーザーと検算した実例（III度族・VI度族、C Dur/c mollそれぞれ、入れ子2〜3階層含む）を、`deriveChord`の入力形式に変換してリグレッションテスト化する。

- [ ] **Step 1: ゴールデンデータを作成する**

`wasei_chord_solver/test/golden.json`を新規作成:

```json
[
  {
    "name": "C Dur: I度",
    "spec": { "mainKey": { "index": 0, "quality": "major" }, "innerChain": [], "chord": { "degree": "I", "special": null, "form": {}, "alteration": {}, "omission": {}, "inversion": 0 } },
    "expectedNotes": ["C", "E", "G"]
  },
  {
    "name": "C Dur: III度調の(I度)",
    "spec": { "mainKey": { "index": 0, "quality": "major" }, "innerChain": [{ "degree": "III", "table": "auto", "forceQuality": null }], "chord": { "degree": "I", "special": null, "form": {}, "alteration": {}, "omission": {}, "inversion": 0 } },
    "expectedNotes": ["E", "G", "H"]
  },
  {
    "name": "C Dur: プラスIII度調の(I度)",
    "spec": { "mainKey": { "index": 0, "quality": "major" }, "innerChain": [{ "degree": "III", "table": "auto", "forceQuality": "major" }], "chord": { "degree": "I", "special": null, "form": {}, "alteration": {}, "omission": {}, "inversion": 0 } },
    "expectedNotes": ["E", "Gis", "H"]
  },
  {
    "name": "C Dur: 準III度調の(I度)",
    "spec": { "mainKey": { "index": 0, "quality": "major" }, "innerChain": [{ "degree": "III", "table": "quasi", "forceQuality": null }], "chord": { "degree": "I", "special": null, "form": {}, "alteration": {}, "omission": {}, "inversion": 0 } },
    "expectedNotes": ["Es", "G", "B"]
  },
  {
    "name": "C Dur: マイナス準III度調の(I度)",
    "spec": { "mainKey": { "index": 0, "quality": "major" }, "innerChain": [{ "degree": "III", "table": "quasi", "forceQuality": "minor" }], "chord": { "degree": "I", "special": null, "form": {}, "alteration": {}, "omission": {}, "inversion": 0 } },
    "expectedNotes": ["Es", "Ges", "B"]
  },
  {
    "name": "C Dur: III度調の(IV度)",
    "spec": { "mainKey": { "index": 0, "quality": "major" }, "innerChain": [{ "degree": "III", "table": "auto", "forceQuality": null }], "chord": { "degree": "IV", "special": null, "form": {}, "alteration": {}, "omission": {}, "inversion": 0 } },
    "expectedNotes": ["A", "C", "E"]
  },
  {
    "name": "C Dur: プラスIII度調の(IV度)",
    "spec": { "mainKey": { "index": 0, "quality": "major" }, "innerChain": [{ "degree": "III", "table": "auto", "forceQuality": "major" }], "chord": { "degree": "IV", "special": null, "form": {}, "alteration": {}, "omission": {}, "inversion": 0 } },
    "expectedNotes": ["A", "Cis", "E"]
  },
  {
    "name": "C Dur: 準III度調の(IV度)",
    "spec": { "mainKey": { "index": 0, "quality": "major" }, "innerChain": [{ "degree": "III", "table": "quasi", "forceQuality": null }], "chord": { "degree": "IV", "special": null, "form": {}, "alteration": {}, "omission": {}, "inversion": 0 } },
    "expectedNotes": ["As", "C", "Es"]
  },
  {
    "name": "C Dur: マイナス準III度調の(IV度)",
    "spec": { "mainKey": { "index": 0, "quality": "major" }, "innerChain": [{ "degree": "III", "table": "quasi", "forceQuality": "minor" }], "chord": { "degree": "IV", "special": null, "form": {}, "alteration": {}, "omission": {}, "inversion": 0 } },
    "expectedNotes": ["As", "Ces", "Es"]
  },
  {
    "name": "C Dur: VI度調の(I度)",
    "spec": { "mainKey": { "index": 0, "quality": "major" }, "innerChain": [{ "degree": "VI", "table": "auto", "forceQuality": null }], "chord": { "degree": "I", "special": null, "form": {}, "alteration": {}, "omission": {}, "inversion": 0 } },
    "expectedNotes": ["A", "C", "E"]
  },
  {
    "name": "C Dur: プラスVI度調の(I度)",
    "spec": { "mainKey": { "index": 0, "quality": "major" }, "innerChain": [{ "degree": "VI", "table": "auto", "forceQuality": "major" }], "chord": { "degree": "I", "special": null, "form": {}, "alteration": {}, "omission": {}, "inversion": 0 } },
    "expectedNotes": ["A", "Cis", "E"]
  },
  {
    "name": "C Dur: 準VI度調の(I度)",
    "spec": { "mainKey": { "index": 0, "quality": "major" }, "innerChain": [{ "degree": "VI", "table": "quasi", "forceQuality": null }], "chord": { "degree": "I", "special": null, "form": {}, "alteration": {}, "omission": {}, "inversion": 0 } },
    "expectedNotes": ["As", "C", "Es"]
  },
  {
    "name": "C Dur: マイナス準VI度調の(I度)",
    "spec": { "mainKey": { "index": 0, "quality": "major" }, "innerChain": [{ "degree": "VI", "table": "quasi", "forceQuality": "minor" }], "chord": { "degree": "I", "special": null, "form": {}, "alteration": {}, "omission": {}, "inversion": 0 } },
    "expectedNotes": ["As", "Ces", "Es"]
  },
  {
    "name": "c moll: III度調の(I度)",
    "spec": { "mainKey": { "index": 0, "quality": "minor" }, "innerChain": [{ "degree": "III", "table": "auto", "forceQuality": null }], "chord": { "degree": "I", "special": null, "form": {}, "alteration": {}, "omission": {}, "inversion": 0 } },
    "expectedNotes": ["Es", "G", "B"]
  },
  {
    "name": "c moll: マイナスIII度調の(I度)",
    "spec": { "mainKey": { "index": 0, "quality": "minor" }, "innerChain": [{ "degree": "III", "table": "auto", "forceQuality": "minor" }], "chord": { "degree": "I", "special": null, "form": {}, "alteration": {}, "omission": {}, "inversion": 0 } },
    "expectedNotes": ["Es", "Ges", "B"]
  },
  {
    "name": "c moll: 同主III度調の(I度)",
    "spec": { "mainKey": { "index": 0, "quality": "minor" }, "innerChain": [{ "degree": "III", "table": "relative", "forceQuality": null }], "chord": { "degree": "I", "special": null, "form": {}, "alteration": {}, "omission": {}, "inversion": 0 } },
    "expectedNotes": ["E", "G", "H"]
  },
  {
    "name": "c moll: プラス同主III度調の(I度)",
    "spec": { "mainKey": { "index": 0, "quality": "minor" }, "innerChain": [{ "degree": "III", "table": "relative", "forceQuality": "major" }], "chord": { "degree": "I", "special": null, "form": {}, "alteration": {}, "omission": {}, "inversion": 0 } },
    "expectedNotes": ["E", "Gis", "H"]
  },
  {
    "name": "c moll: VI度調の(I度)",
    "spec": { "mainKey": { "index": 0, "quality": "minor" }, "innerChain": [{ "degree": "VI", "table": "auto", "forceQuality": null }], "chord": { "degree": "I", "special": null, "form": {}, "alteration": {}, "omission": {}, "inversion": 0 } },
    "expectedNotes": ["As", "C", "Es"]
  },
  {
    "name": "c moll: マイナスVI度調の(I度)",
    "spec": { "mainKey": { "index": 0, "quality": "minor" }, "innerChain": [{ "degree": "VI", "table": "auto", "forceQuality": "minor" }], "chord": { "degree": "I", "special": null, "form": {}, "alteration": {}, "omission": {}, "inversion": 0 } },
    "expectedNotes": ["As", "Ces", "Es"]
  },
  {
    "name": "c moll: 同主VI度調の(I度)",
    "spec": { "mainKey": { "index": 0, "quality": "minor" }, "innerChain": [{ "degree": "VI", "table": "relative", "forceQuality": null }], "chord": { "degree": "I", "special": null, "form": {}, "alteration": {}, "omission": {}, "inversion": 0 } },
    "expectedNotes": ["A", "C", "E"]
  },
  {
    "name": "c moll: プラス同主VI度調の(I度)",
    "spec": { "mainKey": { "index": 0, "quality": "minor" }, "innerChain": [{ "degree": "VI", "table": "relative", "forceQuality": "major" }], "chord": { "degree": "I", "special": null, "form": {}, "alteration": {}, "omission": {}, "inversion": 0 } },
    "expectedNotes": ["A", "Cis", "E"]
  },
  {
    "name": "a moll: III度調の(マイナス準VI度調の(I度))",
    "spec": { "mainKey": { "index": 3, "quality": "minor" }, "innerChain": [{ "degree": "III", "table": "auto", "forceQuality": null }, { "degree": "VI", "table": "quasi", "forceQuality": "minor" }], "chord": { "degree": "I", "special": null, "form": {}, "alteration": {}, "omission": {}, "inversion": 0 } },
    "expectedNotes": ["As", "Ces", "Es"]
  }
]
```

- [ ] **Step 2: テストランナーを書く（この時点でまだ実行しない）**

`wasei_chord_solver/test/golden.test.js`を新規作成:

```js
const assert = require("assert");
const { deriveChord } = require("../core.js");
const golden = require("./golden.json");

let passed = 0;
for (const testCase of golden) {
  const result = deriveChord(testCase.spec);
  assert.deepStrictEqual(
    result.notes,
    testCase.expectedNotes,
    `${testCase.name}: expected ${JSON.stringify(testCase.expectedNotes)}, got ${JSON.stringify(result.notes)}`
  );
  passed++;
}
console.log(`Golden tests: ${passed}/${golden.length} OK`);
```

- [ ] **Step 3: 実行して合格を確認する**

Run: `node wasei_chord_solver/test/golden.test.js`
Expected: `Golden tests: 22/22 OK`（Task1〜9がすべて正しく実装されていれば、新規実装なしでここは最初から通る——これは実装の正しさを裏付ける確認ステップ）

失敗した項目があれば、該当する`resolveLevel`/`resolveChordDegree`のロジックに戻って修正する（このタスクでは新規実装は行わず、既存実装のバグ出しに使う）。

- [ ] **Step 4: コミット**

```bash
git add test/golden.json test/golden.test.js
git commit -m "test: add golden regression tests extracted from HANDOFF.md

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 11: UI（`index.html`）

**Files:**
- Create: `wasei_chord_solver/index.html`

**Interfaces:**
- Consumes: `deriveChord`（`core.js`をブラウザから`<script src="core.js">`で読み込み、グローバルに公開された関数を呼ぶ）

**設計方針**: `core.js`は現在Node向けに`module.exports`のみを使っている。ブラウザで`<script src="core.js">`として読み込んだ場合、`module`が未定義でエラーになる。UMD形式に直す必要がある。

- [ ] **Step 1: `core.js`をUMD形式に変更する**

`core.js`の先頭に追加し、末尾の`module.exports = {...}`をこのラッパーの中に移す:

```js
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.WaseiCore = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // ... 既存の全関数定義をここに移動 ...

  return {
    indexToNoteName,
    indexToPitchClass,
    resolveLevel,
    resolveChain,
    buildTriad,
    resolveChordDegree,
    applyForm,
    applyAlteration,
    applyOmissionAndInversion,
    deriveChord,
    ChordError,
    MAJOR_OFFSETS,
    MINOR_OFFSETS,
    MAJOR_QUALITY,
    MINOR_QUALITY,
    SPECIAL_DEGREES
  };
});
```

- [ ] **Step 2: 既存テストが引き続き通ることを確認する**

Run: `node wasei_chord_solver/test/core.test.js && node wasei_chord_solver/test/golden.test.js`
Expected: 両方とも全件OK（UMD化はNode側の`require`結果を変えないはずだが、念のため確認する）

- [ ] **Step 3: `index.html`を作成する**

```html
<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<title>和声記号 構成音導出ツール</title>
<style>
  body { font-family: sans-serif; max-width: 800px; margin: 2em auto; }
  fieldset { margin-bottom: 1em; }
  .inner-level { border: 1px solid #ccc; padding: 0.5em; margin-bottom: 0.5em; }
  #result { white-space: pre-wrap; background: #f5f5f5; padding: 1em; }
  .error { color: #c00; }
</style>
</head>
<body>
<h1>和声記号 構成音導出ツール</h1>

<fieldset>
  <legend>主調</legend>
  五度圏インデックス: <input type="number" id="mainKeyIndex" value="0">
  質:
  <select id="mainKeyQuality">
    <option value="major">長調</option>
    <option value="minor">短調</option>
  </select>
</fieldset>

<fieldset>
  <legend>内部調の入れ子（外側→内側の順）</legend>
  <div id="innerChainContainer"></div>
  <button type="button" id="addInnerLevel">＋ 内部調を追加</button>
</fieldset>

<fieldset>
  <legend>和音</legend>
  度数: <select id="chordDegree">
    <option>I</option><option>II</option><option>III</option><option>IV</option>
    <option>V</option><option>VI</option><option>VII</option>
  </select>
  特殊形: <select id="chordSpecial">
    <option value="">なし</option>
    <option value="quasi">準</option>
    <option value="napoli">ナポリ</option>
    <option value="doric">ドリア</option>
    <option value="raisedVII">変位VII</option>
  </select>
  <br>
  <label><input type="checkbox" id="formSeventh"> 7度</label>
  <label><input type="checkbox" id="formNinth"> 9度</label>
  <label><input type="checkbox" id="formAdd6"> 付加6</label>
  <label><input type="checkbox" id="formAdd4"> 付加4</label>
  <br>
  <label><input type="checkbox" id="alterationUp"> 上変</label>
  <label><input type="checkbox" id="alterationDown"> 下変</label>
  <br>
  <label><input type="checkbox" id="omissionRoot"> 根省</label>
  <label><input type="checkbox" id="omissionFifth"> 5省</label>
  <br>
  転回: <input type="number" id="inversion" value="0" min="0">
</fieldset>

<button type="button" id="calculate">構成音を導出</button>

<div id="result"></div>

<script src="core.js"></script>
<script>
"use strict";

function addInnerLevel() {
  const container = document.getElementById("innerChainContainer");
  const div = document.createElement("div");
  div.className = "inner-level";
  div.innerHTML = `
    度数: <select class="level-degree">
      <option>I</option><option>II</option><option>III</option><option>IV</option>
      <option>V</option><option>VI</option><option>VII</option>
      <option value="napoliII">ナポリII</option>
      <option value="raisedVII">変位VII</option>
    </select>
    表: <select class="level-table">
      <option value="auto">通常</option>
      <option value="quasi">準</option>
      <option value="relative">同主</option>
    </select>
    強制質: <select class="level-force">
      <option value="">なし</option>
      <option value="major">プラス（長）</option>
      <option value="minor">マイナス（短）</option>
    </select>
    <button type="button" class="remove-level">×削除</button>
  `;
  div.querySelector(".remove-level").addEventListener("click", () => div.remove());
  container.appendChild(div);
}

function readInnerChain() {
  const levels = document.querySelectorAll(".inner-level");
  return Array.from(levels).map((div) => ({
    degree: div.querySelector(".level-degree").value,
    table: div.querySelector(".level-table").value,
    forceQuality: div.querySelector(".level-force").value || null
  }));
}

function calculate() {
  const spec = {
    mainKey: {
      index: parseInt(document.getElementById("mainKeyIndex").value, 10),
      quality: document.getElementById("mainKeyQuality").value
    },
    innerChain: readInnerChain(),
    chord: {
      degree: document.getElementById("chordDegree").value,
      special: document.getElementById("chordSpecial").value || null,
      form: {
        seventh: document.getElementById("formSeventh").checked,
        ninth: document.getElementById("formNinth").checked,
        add6: document.getElementById("formAdd6").checked,
        add4: document.getElementById("formAdd4").checked
      },
      alteration: {
        up: document.getElementById("alterationUp").checked,
        down: document.getElementById("alterationDown").checked
      },
      omission: {
        root: document.getElementById("omissionRoot").checked,
        fifth: document.getElementById("omissionFifth").checked
      },
      inversion: parseInt(document.getElementById("inversion").value, 10)
    }
  };

  const result = WaseiCore.deriveChord(spec);
  const resultDiv = document.getElementById("result");
  if (result.error) {
    resultDiv.innerHTML = `<span class="error">エラー: ${result.error}</span>`;
    return;
  }
  resultDiv.textContent =
    "構成音: " + result.notes.join(", ") + "\n" +
    "ピッチクラス: " + result.pcs.join(", ") + "\n\n" +
    "導出ステップ:\n" + result.steps.join("\n");
}

document.getElementById("addInnerLevel").addEventListener("click", addInnerLevel);
document.getElementById("calculate").addEventListener("click", calculate);
</script>
</body>
</html>
```

- [ ] **Step 4: ブラウザで手動確認する**

`wasei_chord_solver/index.html`をブラウザで開き、以下を確認する（自動テストではなく手動チェックリスト）:
1. 主調をデフォルト（C Dur）のまま「構成音を導出」→ `C, E, G`が出る
2. 「内部調を追加」を押し、度数III・表=通常・強制質=なしを設定して導出 → `E, G, H`が出る（`golden.json`の"C Dur: III度調の(I度)"と一致）
3. 内部調をもう1つ追加し、度数VI・表=準・強制質=マイナスを設定して導出 → 入れ子2階層が正しく計算されることを確認
4. 存在しない組み合わせ（例: ドリアをV度に指定）→ エラーメッセージが赤字で表示されることを確認

- [ ] **Step 5: コミット**

```bash
git add core.js index.html
git commit -m "feat: add browser UI for chord tone derivation

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 12: README

**Files:**
- Create: `wasei_chord_solver/README.md`

**Interfaces:** なし（ドキュメントのみ）

- [ ] **Step 1: README.mdを書く**

```markdown
# wasei_chord_solver

島岡譲系和声理論の和音記号（`○度調の（○度の○度）`のような内部調の入れ子、準/同主/プラス/マイナス、ナポリII度、ドリアIV度、変位VII、7/9/付加6/付加4、上変/下変、根省/5省、転回を含む）から、構成音・ピッチクラス・導出ステップを算出するツールです。

計算方式の理論的根拠は `../HANDOFF.md` §5「五度圏インデックスによる構成音導出アルゴリズム」、設計の詳細は `docs/superpowers/specs/2026-09-13-wasei-chord-solver-design.md` を参照してください。

## 使い方

`index.html` をブラウザで開くだけです（ビルド不要）。

## テスト

```bash
node test/core.test.js
node test/golden.test.js
```

外部依存ライブラリなし。Node標準の`assert`のみを使用しています。

## ファイル構成

- `core.js` — 計算ロジック本体（DOM非依存、Node/ブラウザ共用のUMD形式）
- `index.html` — UI
- `test/core.test.js` — 単体テスト
- `test/golden.json` / `test/golden.test.js` — HANDOFF.mdの検算例から抽出したリグレッションテスト
```

- [ ] **Step 2: コミット**

```bash
git add README.md
git commit -m "docs: add README for wasei_chord_solver

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## セルフレビュー結果（本計画作成時に実施済み）

- **仕様カバレッジ**: 仕様書の「データモデル」「コアアルゴリズム」「テスト計画」「ファイル構成」はTask1〜12ですべて実装対象になっている。「エラーハンドリング」はTask2・5・9でカバー。
- **プレースホルダ**: なし（すべてのステップに実際のコード・実際のRunコマンド・実際の期待値を記載）。
- **型・シグネチャの一貫性**: `resolveLevel`→`resolveChain`→`resolveChordDegree`→`deriveChord`の間で`{rootIndex, quality}`の形を統一。`applyForm`→`applyAlteration`→`applyOmissionAndInversion`の間で`{root,third,fifth,extra}`の形を統一。確認済み。
