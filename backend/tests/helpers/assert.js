let passed = 0;
let failed = 0;

export const assert = (condition, msg) => {
  if (condition) { passed++; console.log(`  ✓ ${msg}`); }
  else           { failed++; console.error(`  ✗ ${msg}`); }
};

export const assertEqual = (a, b, msg) => assert(a === b, `${msg} (expected ${b}, got ${a})`);

export const assertStatus = (res, code, msg) => assertEqual(res.statusCode, code, msg);

export const summary = () => {
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
};
