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

module.exports = { indexToNoteName, indexToPitchClass };
