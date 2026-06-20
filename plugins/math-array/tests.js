/**
 * math-array 测试用例
 *
 * 测试用例来自 aima wiki Chapter-9 实际公式：
 *   用例 1: 多行 array（009-006）
 *   用例 2: 含编号的多行公式（009-020）
 *   用例 3: 双列 array 对比（009-022）
 *   用例 4: 多列 array 对齐（009-045, UNIFY 例子）
 *
 * 运行：node tests.js
 */

const RE_INLINE_MATH = /(?<![\\$])\$(?!\$)([\s\S]*?)(?<!\\)\$/g;

function promoteInlineMath(body) {
  return body.replace(RE_INLINE_MATH, (match, tex) => {
    if (/\\\\/.test(tex)) {
      return "$$" + tex + "$$";
    }
    return match;
  });
}

let passed = 0;
let failed = 0;

function test(name, input, expected) {
  const result = promoteInlineMath(input);
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

// ======== 用例 1: 多行 array（009-006） ========
const formula1 = '$\\begin{array}{l} \\left. King(John) \\land Greedy(John)\\Rightarrow Evil(John) \\right. \\\\ \\left. King(Richard) \\land Greedy(Richard)\\Rightarrow Evil(Richard) \\right. \\\\ \\left. King(Fathe\\text{r(}John\\text{)}) \\land Greedy(Fathe\\text{r(}John\\text{)})\\Rightarrow Evil(Fathe\\text{r(}John\\text{)}). \\right. \\end{array}$';

test('用例1: array 含 \\\\ 提升为 $$',
  `前置文字 ${formula1} 后续文字`,
  "前置文字 $$" + formula1.slice(1, -1) + "$$ 后续文字"
);

// 不包含 \\ 时不变
test('用例1b: 无 \\\\ 不变',
  'text $E=mc^2$ more',
  'text $E=mc^2$ more'
);

// ======== 用例 2: 含编号的多行公式（009-020） ========
const formula2 = '$\\begin{array}{l} \\left. \\forall x\\, King(x) \\land Greedy(x)\\Rightarrow Evil(x) \\right. \\\\ {King\\,\\text{(}John\\text{)}} \\\\ {Greedy\\,(John)} \\\\ {Brother\\,(Richard;John)\\ :} \\end{array}$';

test('用例2: 多行 array 提升为 $$',
  `前文 ${formula2} 后文`,
  "前文 $$" + formula2.slice(1, -1) + "$$ 后文"
);

// ======== 用例 3: 双列 array 对比（009-022） ========
const formula3 = '$\\begin{array}{l} \\left. King(John)\\,\\,\\, \\land \\,\\,\\, Greedy(John)\\Rightarrow Evil\\text{(}John\\text{)} \\right. \\\\ \\left. King(Richard)\\,\\,\\, \\land \\,\\,\\, Greedy(Richard)\\Rightarrow Evil\\text{(}Richard\\text{)}\\\text{.} \\right. \\end{array}$';

test('用例3: 双列 array 提升为 $$',
  `前文 ${formula3} 后文`,
  "前文 $$" + formula3.slice(1, -1) + "$$ 后文"
);

// ======== 用例 4: 多列 array 对齐（009-045） ========
const formula4 = '$\\begin{array}{l} {\\text{UNIFY}\\,\\text{(}Knows\\text{(}John\\text{,}\\, x\\text{),~}Knows\\text{(}John,Jane\\text{))~=~\\{}x\\text{/Jane\\}}} \\\\ {\\text{UNIFY}\\,\\text{(}Knows\\text{(}John\\text{,}\\, x\\text{),~}Knows\\text{(}y,Bill\\text{))~=~\\{}x\\text{/}Bill,y/John\\text{\\\}}} \\\\ {\\text{UNIFY(}Knows\\text{(}John\\text{,}x\\text{),~}Knows\\text{(}y\\text{,}Mother\\text{(}y\\text{)))~=~\\{}y\\text{/}John\\text{,}x\\text{/}Mother\\text{(}John\\text{)\\\}}} \\\\ {\\text{UNIFY(}Knows\\text{(}John\\text{,}\\, x\\text{),~}Knows\\text{(}x\\text{,~}Elizabeth\\text{))~=~}failure\\ \\text{.} \\end{array}$';

test('用例4: 多列 array 提升为 $$',
  `前文 ${formula4} 后文`,
  "前文 $$" + formula4.slice(1, -1) + "$$ 后文"
);

// ======== 边界情况 ========
test('$$ 块级不变',
  'text $$a\\\\b$$ more',
  'text $$a\\\\b$$ more'
);

test('不含 $ 的文本不变',
  'plain text without dollar',
  'plain text without dollar'
);

test('空公式不变',
  '$$',
  '$$'
);

test('已提升的不重复提升',
  'text $$a\\\\b$$ end',
  'text $$a\\\\b$$ end'
);

console.log(`\nResults: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
