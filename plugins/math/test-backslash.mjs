/**
 * Test: math plugin onBeforeRender backslash doubling
 *
 * Test cases from aima4 corpus (aima/corpus/raw/en/aima4.md):
 *   - line 6797: $\begin{array}{l}...\\...\end{array}$  (信内，行首)
 *   - line 9595: $\begin{matrix}...\\...\end{matrix}$  (行内，行首)
 *
 * The fix doubles \\ inside $...$ NOT at line start, so markdown-it
 * escaping doesn't strip the backslash.
 */

const RE_PAGE_MARKER = /\[p:(\d+)\]/g;
const RE_DOLLAR = /(?<![\\$])\$(?!\$)([\s\S]*?)(?<!\\)\$/g;

function doubleBackslash(body) {
  return body.replace(RE_DOLLAR, (match, tex, offset) => {
    if (!/\\\\/.test(tex)) return match;
    if (offset === 0 || body[offset - 1] === '\n') return match;
    return '$' + tex.replace(/\\\\/g, '\\\\\\\\') + '$';
  });
}

let passed = 0;
let failed = 0;

function test(name, input, expected) {
  const result = doubleBackslash(input);
  if (result === expected) {
    console.log(`  ✅ ${name}`);
    passed++;
  } else {
    console.log(`  ❌ ${name}`);
    console.log(`      input:    ${JSON.stringify(input)}`);
    console.log(`      expected: ${JSON.stringify(expected)}`);
    console.log(`      got:      ${JSON.stringify(result)}`);
    failed++;
  }
}

// ---- 1. Inline $...$ with \\ (not at line start) ----
test('inline array with \\\\',
  'text $\\begin{array}{l}a\\\\b\\end{array}$ more',
  'text $\\begin{array}{l}a\\\\\\\\b\\end{array}$ more'
);

// ---- 2. Line-start $...$ with \\ -> unchanged (already raw HTML block) ----
test('line-start array with \\\\ (unchanged)',
  '$\\begin{array}{l}a\\\\b\\end{array}$',
  '$\\begin{array}{l}a\\\\b\\end{array}$'
);

// ---- 3. $...$ without \\\\ -> unchanged ----
test('inline without backslash (unchanged)',
  'text $E=mc^2$ more',
  'text $E=mc^2$ more'
);

// ---- 4. $$...$$ block with \\\\ -> unchanged (not matched by \$ pattern) ----
test('block $$ with \\\\ (unchanged)',
  '$$\\begin{array}{l}a\\\\b\\end{array}$$',
  '$$\\begin{array}{l}a\\\\b\\end{array}$$'
);

// ---- 5. Multi-line formula from aima corpus (line 6797-6800) ----
const corpusArray = [
  '$\\begin{array}{l}',
  '{N\\text{(IDS)~=~50+400+3,000+20,000+100,000~=~123,450}} \\\\',
  '{N\\text{(BFS)~=~10+100+1,000+10,000+100,000~=~111,110,}}',
  '\\end{array}$'
].join('\n');

// Line-start -> unchanged
test('corpus array at line start (unchanged)',
  corpusArray,
  corpusArray
);

// Same formula but inline (not at line start) -> backslashes doubled
const inlineCorpusArray = 'text ' + corpusArray;
const expectedInline = 'text ' + [
  '$\\begin{array}{l}',
  '{N\\text{(IDS)~=~50+400+3,000+20,000+100,000~=~123,450}} \\\\\\\\',
  '{N\\text{(BFS)~=~10+100+1,000+10,000+100,000~=~111,110,}}',
  '\\end{array}$'
].join('\n');

test('corpus array inline -> backslash doubled',
  inlineCorpusArray,
  expectedInline
);

// ---- 6. Empty formula ----
test('empty formula (unchanged)',
  '$$',
  '$$'
);

// ---- 7. Multiple inline formulas, one with \\\\ ----
test('multiple formulas, only one with \\\\',
  'a $x$ b $\\begin{array}{l}a\\\\b\\end{array}$ c $y$',
  'a $x$ b $\\begin{array}{l}a\\\\\\\\b\\end{array}$ c $y$'
);

console.log(`\n结果: ${passed} 通过, ${failed} 失败`);
process.exit(failed > 0 ? 1 : 0);
