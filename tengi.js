(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.WaseiTengi = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // ==================== 転義表（移調不変形） ====================
  //
  // 和音記号ではなく**ピッチクラス集合**でグループ化する。同じ集合を持つ
  // 〈記号 × 旋法〉は互いに転義可能、というのがこの表の意味。
  // 理論と検算は harmony リポジトリの HANDOFF.md §5「段階B」。

  const FIFTHS_LETTERS = "FCGDAEH";

  function lexCompare(a, b) {
    if (a.length !== b.length) return a.length - b.length;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i];
    return 0;
  }

  // 12通りの移調のうち、昇順で辞書順最小になる回転を正規形とする。
  // 同着（対称集合）は移調量 t が最小のものを採る。
  function normalize(pcs) {
    const set = [...new Set(pcs.map((p) => ((p % 12) + 12) % 12))];
    let best = null;
    for (let t = 0; t < 12; t++) {
      const pattern = set.map((p) => (p - t + 12) % 12).sort((x, y) => x - y);
      if (best === null || lexCompare(pattern, best.pattern) < 0) best = { pattern, t };
    }
    return best;
  }

  // 集合が自分自身に重なる最小の移調量。減7なら3、増三和音なら4、通常は12。
  // 周期 p のとき、1つのメンバーは 12/p 個の調で同じ和音として読める。
  function symmetryPeriod(pattern) {
    const s = new Set(pattern);
    for (let p = 1; p < 12; p++) {
      if ([...s].every((x) => s.has((x + p) % 12))) return p;
    }
    return 12;
  }

  // spec の同一性を判定するための指紋。
  // **主調のインデックスと転回は無視する**——表はピッチクラス集合で引くものなので、
  // 「同じ和音を別の調で／別の転回で入力した」ケースを同一視したい。
  // 逆に旋法・度数・特殊形・形体・変位・省略・内部調の入れ子は区別する。
  function specFingerprint(spec) {
    const f = spec.chord.form || {};
    const a = spec.chord.alteration || {};
    const o = spec.chord.omission || {};
    const on = (obj, k) => (obj[k] ? 1 : 0);
    // **9度は7度を含む**（core.js: `form.seventh` が無くても `form.ninth` だけで
    // 7度の音が入る）。UI で「9度」だけを選んだ場合と、カタログのように
    // 7度＋9度を立てた場合は同じ和音なので、指紋でも同一視する。
    const seventhBit = f.seventh || f.ninth ? 1 : 0;
    return [
      spec.mainKey.quality,
      (spec.innerChain || []).map((l) =>
        `${l.degree}:${l.table || "auto"}:${l.forceQuality || "-"}`).join(">"),
      spec.chord.degree,
      spec.chord.special || "-",
      `${seventhBit}${on(f, "ninth")}${on(f, "add6")}${on(f, "add4")}`,
      `${on(a, "up")}${on(a, "down")}`,
      `${on(o, "root")}${on(o, "fifth")}`
    ].join("|");
  }

  // カタログ（記号→spec）を deriveChord に通し、正規形でグループ化する。
  function buildTable(catalog, deriveChord) {
    const byKey = new Map();
    for (const e of catalog) {
      const r = deriveChord(e.spec);
      if (r.error) throw new Error(`${e.symbol}/${e.mode}: ${r.error}`);
      const { pattern, t } = normalize(r.pcs);
      const key = pattern.join(",");
      if (!byKey.has(key)) byKey.set(key, { pcsPattern: pattern, members: [] });
      // tonicOffset: 正規形の 0 から見た主音の位置（カタログの spec は主調 C なので 0 - t）。
      byKey.get(key).members.push({
        tonicOffset: (12 - t) % 12, mode: e.mode, symbol: e.symbol, fingerprint: specFingerprint(e.spec)
      });
    }
    const groups = [...byKey.values()].sort((a, b) => lexCompare(a.pcsPattern, b.pcsPattern));
    for (const g of groups) {
      g.members.sort((a, b) =>
        a.tonicOffset - b.tonicOffset ||
        (a.mode === b.mode ? 0 : a.mode === "major" ? -1 : 1) ||
        a.symbol.localeCompare(b.symbol, "ja"));
      g.isolated = g.members.length === 1;
    }
    return { groups };
  }

  // ピッチクラス → 調名。五度圏で原点に近い綴りを選ぶ。
  // 三全音（pc6）だけは Fis(+6) と Ges(-6) が等距離なので、**正の側＝Fis** を採る
  // （kazmus ブログ ID585 の綴りに合わせる。harmony 側の照合で使う）。
  function pcToKeyName(pc) {
    const target = ((pc % 12) + 12) % 12;
    let best = null;
    for (let n = -7; n <= 7; n++) {
      if ((((n * 7) % 12) + 12) % 12 !== target) continue;
      if (best === null || Math.abs(n) < Math.abs(best) ||
          (Math.abs(n) === Math.abs(best) && n > best)) best = n;
    }
    const m = best + 1;
    let letter = FIFTHS_LETTERS[((m % 7) + 7) % 7];
    let accidentals = Math.floor(m / 7);
    if (letter === "H" && accidentals < 0) {
      letter = "B";
      accidentals = accidentals + 1;
    }
    if (accidentals > 0) return letter + "is".repeat(accidentals);
    if (accidentals < 0) {
      const flats = -accidentals;
      return "AE".includes(letter)
        ? letter + "s" + "es".repeat(flats - 1)
        : letter + "es".repeat(flats);
    }
    return letter;
  }

  // 導出済みのピッチクラス集合から、転義候補を並べる。
  //
  // 戻り値: { found, isolated, period, pcsPattern, rows }
  //   rows[i] = { keyPc, key, mode, symbol, isInput }
  //   key は長調が大文字、短調が小文字。isInput は入力そのものの行に付く。
  //
  // 表は記号ではなく構成音で引くので、カタログ106件に無い和音（内部調の入れ子など）
  // でも、構成音が一致すればその読み替え先を出せる。その場合 isInput は付かない。
  //
  // isInput は「入力した和音そのもの」の行にだけ付く（調が一致し、かつ spec の指紋が
  // 一致する）。同じ調に別の読みがある場合（減7で`準IV度付加4-5省`と`準V度9根省`が
  // ともに C Dur で成り立つなど）は sameKey を立てて区別する——どちらも正しい読みだが、
  // ユーザーが打ったのは片方だけなので「入力」と呼んでよいのは片方だけ。
  function lookup(pcs, table, inputKeyPc, inputMode, inputSpec) {
    const { pattern, t } = normalize(pcs);
    const group = table.groups.find((g) => g.pcsPattern.join() === pattern.join());
    if (!group) return { found: false, isolated: false, period: 12, pcsPattern: pattern, rows: [] };

    const period = symmetryPeriod(pattern);
    const wantPc = inputKeyPc === undefined ? null : (((inputKeyPc % 12) + 12) % 12);
    const wantPrint = inputSpec ? specFingerprint(inputSpec) : null;
    const rows = [];
    for (const m of group.members) {
      for (let k = 0; k < 12 / period; k++) {
        const keyPc = (t + m.tonicOffset + k * period) % 12;
        const name = pcToKeyName(keyPc);
        const inKey = wantPc !== null && keyPc === wantPc && m.mode === inputMode;
        rows.push({
          keyPc,
          key: m.mode === "major" ? name : name.toLowerCase(),
          mode: m.mode,
          symbol: m.symbol,
          isInput: inKey && wantPrint !== null && m.fingerprint === wantPrint,
          sameKey: inKey && !(wantPrint !== null && m.fingerprint === wantPrint)
        });
      }
    }
    rows.sort((a, b) =>
      a.keyPc - b.keyPc ||
      (a.mode === b.mode ? 0 : a.mode === "major" ? -1 : 1) ||
      a.symbol.localeCompare(b.symbol, "ja"));
    return { found: true, isolated: group.isolated, period, pcsPattern: pattern, rows };
  }

  return { normalize, symmetryPeriod, buildTable, pcToKeyName, lookup, specFingerprint };
});
