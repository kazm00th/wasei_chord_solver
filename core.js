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
    // 変位VII調（無印）の既定質はminor（h moll = プラス指定なしの標準形）。
    // 「長7度上の長調」ではなく「長7度上の短調」がプラス/マイナス指定なしの
    // 基本形で、プラス変位VII調（forceQuality="major"）でH Durになる。
    // ユーザー確認済み（マイナス/プラスが「同主短調/同主長調」を表すという
    // §5の一般規則どおり、変位VII調も他の度数調と同じ長調/短調の二重性を持つ）。
    raisedVII: { offset: 5, quality: "minor" }
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

  function chordSpecialToLevel(chordSpec, localQuality) {
    const degree = chordSpec.degree;
    switch (chordSpec.special) {
      case null:
      case undefined:
        return { degree, table: "auto", forceQuality: null };
      case "quasi":
        // 準X度は「同主短調(c Moll)での形を長調で用いたもの」（HANDOFF §2、長調専用）。
        // 短調で指定しても意味がない（自分自身の同主短調を借りることになる）ため、
        // ナポリII度と同様に文脈のqualityを検証する。
        if (localQuality !== "major") {
          throw new ChordError("準X度は長調でのみ使用できます（自分自身の同主短調を借用することになるため）");
        }
        return { degree, table: "quasi", forceQuality: null };
      case "doric":
        if (degree !== "IV") throw new ChordError("ドリアIV度はIV度にのみ指定できます");
        // HANDOFF §2「ドリアIV度｜短調で第6音を上げたIV（短調専用）」。
        // 準・ナポリ・準ナポリと同じ基準でlocalQualityを検証する。
        if (localQuality !== "minor") {
          throw new ChordError("ドリアIV度は短調でのみ使用できます");
        }
        return { degree: "IV", table: "auto", forceQuality: "major" };
      case "napoli":
        if (degree !== "II") throw new ChordError("ナポリII度はII度にのみ指定できます");
        // ナポリII度は同主短調の借用元そのもの＝短調にのみ存在する。長調で
        // 使う場合は「準」を伴った借用形（準ナポリII度）でなければならない
        // （「準」は同主短調の形を長調で用いたもの、という§2の一般原則の一例）。
        if (localQuality !== "minor") {
          throw new ChordError("ナポリII度は短調でのみ使用できます（長調では準ナポリII度を使用してください）");
        }
        return { degree: "napoliII", table: "auto", forceQuality: null };
      case "quasiNapoli":
        if (degree !== "II") throw new ChordError("準ナポリII度はII度にのみ指定できます");
        if (localQuality !== "major") {
          throw new ChordError("準ナポリII度は長調でのみ使用できます（短調ではナポリII度を使用してください）");
        }
        return { degree: "napoliII", table: "auto", forceQuality: null };
      case "raisedVII":
        if (degree !== "VII") throw new ChordError("変位VII度はVII度にのみ指定できます");
        return { degree: "raisedVII", table: "auto", forceQuality: null };
      default:
        throw new ChordError(`未知のchord.special: ${chordSpec.special}`);
    }
  }

  function resolveChordDegree(localRootIndex, localQuality, chordSpec) {
    const level = chordSpecialToLevel(chordSpec, localQuality);
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

  function applyAlteration(chord, form, alteration, diatonicContext, quality, isVofV) {
    const shift = alteration.up ? 7 : alteration.down ? -7 : 0;
    if (shift === 0) return { ...chord, extra: [...chord.extra] };

    // 付加6・付加4への下変は、より具体的な理由（S機能側に下変の節が無い）を
    // 後段で個別に案内するため、ここでは対象外にする。
    if (alteration.down && !isVofV && !(form.add6 || form.add4)) {
      // 『総合和声』実技篇 第5章 p.128「2 V̇諸和音の下方変位（V̇↓）」——下方変位は
      // 節そのものがV̇諸和音（V度のV度族）に対して立てられており、定義も
      // 「短調のV̇諸和音の第5音を下方変位（↓5）した形」。他の音度に対する
      // 下方変位の規定は原典に存在しない。
      // 構造的な理由もp.129に明記されている:「短調のV̇諸和音の第5音は、もともと
      // 上方変位VI（↑VI）音である（p.125）。従って、下方変位（↓5）した場合、
      // 反って固有のVI音に戻ることになる」——第5音が↑VI音であるのはV̇諸和音だけで、
      // プレーンV度やIII度の第5音を半音下げる操作にはこの根拠が無い。
      throw new ChordError("下変は「V度のV度」（V̇諸和音）の第5音にのみ適用できます");
    }

    if (!(form.add6 || form.add4) && alteration.up && quality !== "major") {
      // HANDOFF §7.7.1注1「V諸和音との形体上の類似性ゆえに、他音度の長3和音・
      // 長7の和音を基礎とする付加和音にも上方変位の適用を広げることができる」
      // ——上変（5度そのものを直接動かす場合）はmajor quality（長三和音・長7の
      // 和音）の和音にのみ拡張可能で、短三和音・減三和音には理論的根拠が無い。
      // 付加6・付加4の上変（対象は5度ではなく付加音）はこの制約の対象外
      // （準IV度付加6上変=f as c disのように、三和音自体がminorでも成立する）。
      throw new ChordError("上変は長三和音・長7の和音にのみ適用できます（この和音はmajor質ではありません）");
    }

    if (form.add6 || form.add4) {
      // HANDOFF §2「上変｜『V度』の第5音、または『IV度付加』の第6音を半音上げる」
      // 「下変｜『V度のV度』の第5音を半音下げる」——下変はIV度付加系には定義されて
      // いない（島岡理論の英訳39-5 p.61-64でも、上変にはD/S両側の鏡像的な節がある
      // 一方、下変はD側のみで、S側（IV度付加）に対応する節は存在しない。下変は
      // 「別の調の固有和音として再解釈される」現象であり、上変のように単純に対称化
      // できるものではない）。IV度付加6/付加4下変は理論上不成立のため拒否する。
      if (alteration.down) {
        throw new ChordError("IV度付加6・付加4には下変を適用できません（下変は『V度のV度』専用）");
      }

      const result = { ...chord, extra: [...chord.extra] };
      // 「IV度付加の第6音」（付加6の音、diatonicNoteのsteps=5のスロット）を
      // 書き換える。度数によって値が変わる（固定オフセットroot+3は度数によっては
      // 一致しない。例: III度・VI度・VII度）ため、diatonicContextから同じ式で
      // 再計算して一致する要素を探す。
      const add6Value = diatonicNote(diatonicContext, 5);
      const idx = result.extra.findIndex((v) => v === add6Value);
      if (idx !== -1) result.extra[idx] = result.extra[idx] + shift;
      return result;
    }

    const result = { ...chord, extra: [...chord.extra] };
    result.fifth = result.fifth + shift;
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
      if (alteration.up && alteration.down) {
        throw new ChordError("上変と下変を同時に指定することはできません");
      }
      // 下変の適用可否は「V度のV度」という入れ子構造そのもので決まる（原典p.128）。
      // 内部調連鎖の最終レベルがV度調で、かつ和音自体の度数もV度であること——
      // ナポリII度・変位VII度・ドリアIV度のように special が度数を置き換える形は
      // V̇ではないので対象外（"quasi"は度数を変えないので対象に含む）。
      const lastLevel = spec.innerChain && spec.innerChain.length
        ? spec.innerChain[spec.innerChain.length - 1]
        : null;
      const isVofV =
        !!lastLevel &&
        lastLevel.degree === "V" &&
        spec.chord.degree === "V" &&
        (!spec.chord.special || spec.chord.special === "quasi");

      const withAlteration = applyAlteration(withForm, form, alteration, chordDegree.diatonicContext, chordDegree.quality, isVofV);

      const omission = {
        root: !!omissionSpec.root,
        fifth: !!omissionSpec.fifth
      };
      // 根省か5省かは機能で自動的に決まる（HANDOFF §2.1・§7.10確定）:
      // D・D2機能（V度族・V度のV度族・II度族・付加6/付加4を伴わないIV度族等）は
      // 根省、S機能（IV度付加6・付加4）は5省。機能と逆の省略は理論上不成立。
      if ((form.add6 || form.add4) && omission.root) {
        throw new ChordError("付加6・付加4（S機能）の和音には根省ではなく5省を使用してください");
      }
      if (!(form.add6 || form.add4) && omission.fifth) {
        throw new ChordError("この和音（D・D2機能）には5省ではなく根省を使用してください");
      }

      const inversion = spec.chord.inversion || 0;
      const totalNotes = 3 + withAlteration.extra.length;
      if (inversion < 0 || inversion >= totalNotes) {
        throw new ChordError(`転回数は0〜${totalNotes - 1}の範囲で指定してください（この和音の構成音数は${totalNotes}）`);
      }

      const indices = applyOmissionAndInversion(withAlteration, omission, inversion);

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
