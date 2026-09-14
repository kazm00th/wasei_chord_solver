const assert = require("assert");
const { deriveChord } = require("../core.js");
const golden = require("./golden.json");

let passed = 0;
for (const testCase of golden) {
  const result = deriveChord(testCase.spec);
  if (testCase.expectedError) {
    assert.ok(
      result.error,
      `${testCase.name}: expected an error, got ${JSON.stringify(result)}`
    );
    passed++;
    continue;
  }
  assert.deepStrictEqual(
    result.notes,
    testCase.expectedNotes,
    `${testCase.name}: expected ${JSON.stringify(testCase.expectedNotes)}, got ${JSON.stringify(result.notes)}`
  );
  assert.deepStrictEqual(
    result.pcs,
    testCase.expectedPcs,
    `${testCase.name}: expected pcs ${JSON.stringify(testCase.expectedPcs)}, got ${JSON.stringify(result.pcs)}`
  );
  passed++;
}
console.log(`Golden tests: ${passed}/${golden.length} OK`);
