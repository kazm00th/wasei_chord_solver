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
