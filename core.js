(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.WaseiCore = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
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
      let num_flats = -accidentals;
      // German notation: vowel-ending letters (E, A) use "s" for one flat, then "es" for additional
      if ("AE".includes(letter)) {
        return letter + "s" + "es".repeat(num_flats - 1);
      } else {
        return letter + "es".repeat(num_flats);
      }
    }
    return letter;
  }

  function indexToPitchClass(n) {
    return (((n * 7) % 12) + 12) % 12;
  }

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
  const VALID_DEGREES = ["I", "II", "III", "IV", "V", "VI", "VII"];

  function resolveLevel(rootIndex, currentQuality, level, allowDiminished = false) {
    if (level.degree === "napoliII" || level.degree === "raisedVII") {
      const special = SPECIAL_DEGREES[level.degree];
      return {
        rootIndex: rootIndex + special.offset,
        quality: level.forceQuality || special.quality
      };
    }

    if (!VALID_DEGREES.includes(level.degree)) {
      throw new ChordError(`不明な度数: ${level.degree}`);
    }

    const useMajorTable =
      level.table === "relative" ? true :
      level.table === "quasi" ? false :
      currentQuality === "major";

    const offsets = useMajorTable ? MAJOR_OFFSETS : MINOR_OFFSETS;
    const qualityTable = useMajorTable ? MAJOR_QUALITY : MINOR_QUALITY;
    const naturalQuality = qualityTable[level.degree];

    if (naturalQuality === "diminished") {
      if (allowDiminished && !level.forceQuality) {
        return {
          rootIndex: rootIndex + offsets[level.degree],
          quality: "diminished"
        };
      }
      throw new ChordError(
        `度数${level.degree}は${useMajorTable ? "長調" : "自然短調"}オフセット表では減三和音のため、内部調として成立しません`
      );
    }

    return {
      rootIndex: rootIndex + offsets[level.degree],
      quality: level.forceQuality || naturalQuality
    };
  }

  // ==================== 三和音構築 ====================

  function buildTriad(rootIndex, quality) {
    const thirdOffset = quality === "major" ? 4 : -3;
    const fifthOffset = quality === "diminished" ? -6 : 1;
    return {
      root: rootIndex,
      third: rootIndex + thirdOffset,
      fifth: rootIndex + fifthOffset
    };
  }

  // ==================== 和音自体の特殊形（度数→レベル変換） ====================

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
    const resolved = resolveLevel(localRootIndex, localQuality, level, true);

    // V度の和音は常に導音を上げた長三和音が標準形（HANDOFF確定: 「V度和音」は
    // C Dur/c Moll問わずg h dで、自然短調どおりの短三和音は実際にはほぼ使われない）。
    // これは「V度和音」（今まさに構築している最終和音）にのみ適用され、「V度調」
    // （resolveLevel/resolveChainが内部調を確立する側の解決）には適用しない——
    // 両者は別物（HANDOFF §7.3注3）なので、ここ（chord構築の最終段）だけで上書きする。
    const chordQuality =
      level.degree === "V" && resolved.quality === "minor" ? "major" : resolved.quality;
    const triad = buildTriad(resolved.rootIndex, chordQuality);

    // 7度・9度・付加6・付加4はquality（三和音の音程パターン）だけでは決まらず、
    // 「三和音そのものを解決したのと同じオフセット表（長調表／自然短調表）」に
    // 依存する（例: C Durの I度・IV度は長7度、c Mollの III度・VI度も長7度になるが、
    // triad.qualityは両者とも"major"で区別できない）。
    //
    // ここではlevel.table（"quasi"/"relative"）を三和音と**同じ**ように使う
    // （useMajorTableをresolveLevel内部の判定式と揃える）。これはHANDOFF §2の
    // 「最重要の規則: 準X（C Dur）の構成音はX（c Moll）と完全に一致する」を
    // 拡張形（7度・9度・付加音を含む）でも成立させるための選択——借用元の表を
    // そのまま使えば、準X度の拡張音は自動的にX度(c Moll)の拡張音と一致する。
    // （一時的に「今いる調自身の表を使う」方式を試したが、準II度9・準VI度9・
    // 準I度7でこの規則が崩れることが判明したため、この方式に戻した。
    // 準IV度付加4=f as c d hは、この表でも下記の導音上げ補正と組み合わさって
    // 同じ結果になるため矛盾しない）。
    //
    // ナポリII度・変位VII度はSPECIAL_DEGREESによる固定音程の擬似度数で
    // VALID_DEGREESに属さないため、ダイアトニックな7度・9度という概念自体が
    // 定義されない（diatonicContext=null）。
    let diatonicContext = null;
    if (VALID_DEGREES.includes(level.degree)) {
      const useMajorTable =
        level.table === "relative" ? true :
        level.table === "quasi" ? false :
        localQuality === "major";
      diatonicContext = {
        tonicIndex: localRootIndex,
        offsets: useMajorTable ? MAJOR_OFFSETS : MINOR_OFFSETS,
        degreeIndex: VALID_DEGREES.indexOf(level.degree)
      };
    }

    return { rootIndex: resolved.rootIndex, quality: chordQuality, triad, diatonicContext };
  }

  // ==================== 形体（7度・9度・付加6・付加4）====================

  // diatonicContextのオフセット表から、和音根音の度数を基準に`steps`度上（3度累積の
  // 度数差）の自然音を引く。7度=+6、9度=+1、付加6=+5、付加4の追加音=+3（HANDOFF §5参照）。
  function diatonicNote(diatonicContext, steps) {
    const { tonicIndex, offsets, degreeIndex } = diatonicContext;
    return tonicIndex + offsets[VALID_DEGREES[(degreeIndex + steps) % 7]];
  }

  function applyForm(triad, quality, form, diatonicContext) {
    const extra = [];
    const needsDiatonic = form.seventh || form.ninth || form.add6 || form.add4;
    if (needsDiatonic && !diatonicContext) {
      throw new ChordError("この和音には7度・9度・付加6・付加4を付加できません（ダイアトニックな度数を持たないため）");
    }
    // 9度は必ず7度を内包する（HANDOFF §5「7の和音の原型の上に9度の音を付加すると
    // 9の和音になる」）。付加4が常に付加6の音を内包するのと同じ理屈で、
    // form.seventhが未指定でもform.ninthだけで7度の音を自動的に含める。
    if (form.seventh || form.ninth) extra.push(diatonicNote(diatonicContext, 6));
    if (form.ninth) extra.push(diatonicNote(diatonicContext, 1));
    if (form.add4) {
      let add4Note = diatonicNote(diatonicContext, 3);
      // 付加4の音（限定進行音、第4音→I）が自然短調のVII度（導音）に着地する場合は
      // 常に半音上げる（HANDOFF確定例: 準IV度付加4はC Dur自身の音のためVII度は
      // 既にH＝上げ不要だが、c moll自身のIV度付加4ではVII度がB→Hに上がる）。
      // V度と異なり三和音のqualityを丸ごと差し替える方式は使えない（付加4の音だけを
      // 個別に上げる必要があるため）ので、着地した度数を見て判定する。
      if (diatonicContext.offsets === MINOR_OFFSETS &&
          VALID_DEGREES[(diatonicContext.degreeIndex + 3) % 7] === "VII") {
        add4Note += 7;
      }
      extra.push(diatonicNote(diatonicContext, 5), add4Note);
    } else if (form.add6) {
      extra.push(diatonicNote(diatonicContext, 5));
    }
    return { ...triad, extra };
  }

  // ==================== 上変・下変 ====================

  function applyAlteration(chord, form, alteration, diatonicContext) {
    const shift = alteration.up ? 7 : alteration.down ? -7 : 0;
    if (shift === 0) return { ...chord, extra: [...chord.extra] };

    const result = { ...chord, extra: [...chord.extra] };
    if (form.add6 || form.add4) {
      // 「IV度付加の第6音」（付加6の音、diatonicNoteのsteps=5のスロット）を
      // 書き換える。度数によって値が変わる（固定オフセットroot+3は度数によっては
      // 一致しない。例: III度・VI度・VII度）ため、diatonicContextから同じ式で
      // 再計算して一致する要素を探す。
      const add6Value = diatonicNote(diatonicContext, 5);
      const idx = result.extra.findIndex((v) => v === add6Value);
      if (idx !== -1) result.extra[idx] = result.extra[idx] + shift;
    } else {
      result.fifth = result.fifth + shift;
    }
    return result;
  }

  // ==================== 入れ子（複数階層） ====================

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

  // ==================== 根省・5省・転回 ====================

  function applyOmissionAndInversion(chord, omission, inversion) {
    // 元の和音の構成音を低音から高音の「定義順」で並べる: root, third, fifth, ...extra
    // 根省時に3度が自動的に最低音になるのは、rootが常にthirdの直前（index 0→1）にあり、
    // rootを除去すると自然にthirdが先頭に来るため（明示的な並べ替えは不要）
    let full = [chord.root, chord.third, chord.fifth, ...chord.extra];

    // 転回: 指定された番号だけ先頭の音を末尾へ回す（省略前の全体を基準に回す）
    let rotated = full.slice(inversion).concat(full.slice(0, inversion));

    // 省略の適用
    if (omission.root) rotated = rotated.filter((v) => v !== chord.root);
    if (omission.fifth) rotated = rotated.filter((v) => v !== chord.fifth);

    return rotated;
  }

  // ==================== 統合関数 ====================

  function deriveChord(spec) {
    try {
      const chain = resolveChain(spec.mainKey, spec.innerChain);
      const chordDegree = resolveChordDegree(chain.rootIndex, chain.quality, {
        degree: spec.chord.degree,
        special: spec.chord.special || null
      });

      const formSpec = spec.chord.form || {};
      const alterationSpec = spec.chord.alteration || {};
      const omissionSpec = spec.chord.omission || {};

      const form = {
        seventh: !!formSpec.seventh,
        ninth: !!formSpec.ninth,
        add6: !!formSpec.add6,
        add4: !!formSpec.add4
      };
      const withForm = applyForm(chordDegree.triad, chordDegree.quality, form, chordDegree.diatonicContext);

      const alteration = {
        up: !!alterationSpec.up,
        down: !!alterationSpec.down
      };
      const withAlteration = applyAlteration(withForm, form, alteration, chordDegree.diatonicContext);

      const omission = {
        root: !!omissionSpec.root,
        fifth: !!omissionSpec.fifth
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

  return {
    indexToNoteName,
    indexToPitchClass,
    resolveLevel,
    resolveChain,
    describeLevel,
    buildTriad,
    resolveChordDegree,
    chordSpecialToLevel,
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
