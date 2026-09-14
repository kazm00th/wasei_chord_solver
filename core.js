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

// ==================== 三和音構築 ====================

function buildTriad(rootIndex, quality) {
  const thirdOffset = quality === "major" ? 4 : -3;
  return {
    root: rootIndex,
    third: rootIndex + thirdOffset,
    fifth: rootIndex + 1
  };
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

module.exports = {
  indexToNoteName,
  indexToPitchClass,
  resolveLevel,
  resolveChain,
  buildTriad,
  ChordError,
  MAJOR_OFFSETS,
  MINOR_OFFSETS,
  MAJOR_QUALITY,
  MINOR_QUALITY,
  SPECIAL_DEGREES
};
