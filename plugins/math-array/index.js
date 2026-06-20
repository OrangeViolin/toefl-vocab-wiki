/**
 * math-array — 将含 \\ 换行的 $...$ 行内公式自动提升为 $$...$$ 块级公式
 *
 * 问题：KaTeX displayMode=false 不支持 \\ 换行。当行内公式包含 array/matrix
 * 等环境时，\\ 不渲染。本插件在 onBeforeRender hook 中检测并提升定界符。
 *
 * 依赖：math 插件 v2.1.0+（提供 \\ 转义保护，需在 math-array 之前执行）
 *
 * Hook: onBeforeRender
 *   Phase 1 — $...$ 含 \\ 则提升为 $$...$$
 *   Phase 2 — 裸 \begin{env}...\end{env}（不在 $...$ 内）自动包裹为 $$...$$
 */

const PLUGIN_NAME = 'math-array';

const RE_INLINE_MATH = /(?<![\\$])\$(?!\$)([\s\S]*?)(?<!\\)\$/g;

// LaTeX environments that require display mode for proper rendering
const RE_BARE_ENV = /\\begin\{(matrix|pmatrix|bmatrix|vmatrix|Vmatrix|array|align\*?|alignat\*?|gather\*?|cases|equation\*?)\}([\s\S]*?)\\end\{\1\}/g;

// Match all $...$ and $$...$$ ranges (to detect already-wrapped envs)
const RE_DOLLAR_BLOCK = /(?<![\\$])\$\$(?!\$)([\s\S]*?)(?<!\\)\$\$|(?<![\\$])\$(?!\$)([\s\S]*?)(?<!\\)\$/g;


function collectDollarRanges(body) {
  /* Collect [start, end) ranges of all $...$ and $$...$$ blocks. */
  const ranges = [];
  let m;
  RE_DOLLAR_BLOCK.lastIndex = 0;
  while ((m = RE_DOLLAR_BLOCK.exec(body)) !== null) {
    ranges.push({ start: m.index, end: m.index + m[0].length });
  }
  return ranges;
}


function isInsideRanges(pos, ranges) {
  return ranges.some(r => pos >= r.start && pos < r.end);
}


function wrapBareEnvs(body) {
  const protectedRanges = collectDollarRanges(body);
  let count = 0;

  const result = body.replace(RE_BARE_ENV, (match, envName, _inner, offset) => {
    if (isInsideRanges(offset, protectedRanges)) {
      return match; // already inside math — leave as-is
    }
    count++;
    console.log('[math-array] Phase 2: wrapped bare \\begin{' + envName + '} block');
    return "$$\n" + match + "\n$$";
  });

  return result;
}


export default {
  name: PLUGIN_NAME,
  version: '1.1.0',
  description: 'Promote $...$ to $$...$$ for \\\\ / env blocks; auto-wrap bare \\begin{env}...\\end{env} in $$...$$',

  init(core) {
    core.hooks.onBeforeRender.add((body, ctx) => {
      // Phase 1: promote $...$ with \\\\ to $$...$$
      let phase1count = 0;
      body = body.replace(RE_INLINE_MATH, (match, tex) => {
        if (/\\\\/.test(tex)) {
          phase1count++;
          return "$$" + tex + "$$";
        }
        return match;
      });

      // Phase 2: wrap bare LaTeX env blocks not already inside $...$ or $$...$$
      body = wrapBareEnvs(body);

      if (phase1count > 0) {
        console.log('[math-array] Phase 1: promoted ' + phase1count + ' blocks (page=' + (ctx?.pid) + ')');
      }
      return body;
    });
  },
};
