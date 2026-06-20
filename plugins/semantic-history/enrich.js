/**
 * enrich.js — 语义历史数据丰富化
 *
 * 将 recent.lite.jsonl 的原始修订记录补充三层语义信息：
 *   1. Basic context   : pageType, pageLabel（从 registry 关联）
 *   2. Revision summary: changeType, magnitude, sizeDelta（从 summary 解析）
 *   3. Rationale       : tags（从 summary 前缀提取）
 *
 * 参考：Bao, Ding, McGuinness, "Semantic History: Towards Modeling and
 * Publishing Changes of Online Semantic Data", ISWC 2009.
 */

// ── changeType 分类规则 ─────────────────────────────────────────────────────
// 按顺序匹配，首次命中即停止。
const CHANGE_TYPE_RULES = [
  { type: 'new',          re: /^(新增|add)[：:]/i },
  { type: 'fix',          re: /^(fix|FIX\d*|修复|bug)[：:\s]/i },
  { type: 'content',      re: /^(enrich|wikify|wikify-|章节链接|添加|content|feat)[：:\s]/i },
  { type: 'refactor',     re: /^(refactor|重构)[：:\s]/i },
  { type: 'housekeeping', re: /^(HKP\d*|WKP\d*|chore|butler|task)[：:\s]/i },
  { type: 'media',        re: /^(图片|media|image|添加首页配图)[：:\s]/i },
  { type: 'home',         re: /^(首页|home)[：:\s]/i },
  { type: 'docs',         re: /^(docs?|文档)[：:\s]/i },
];

export const CHANGE_TYPE_LABELS = {
  new:          { zh: '新增',   en: 'New',          color: '#276749' },
  fix:          { zh: '修复',   en: 'Fix',          color: '#9b2c2c' },
  content:      { zh: '内容',   en: 'Content',      color: '#2b6cb0' },
  refactor:     { zh: '重构',   en: 'Refactor',     color: '#553c9a' },
  housekeeping: { zh: '维护',   en: 'Housekeeping', color: '#7b5e1a' },
  media:        { zh: '图片',   en: 'Media',        color: '#7b4d1a' },
  home:         { zh: '首页',   en: 'Home',         color: '#1a5276' },
  docs:         { zh: '文档',   en: 'Docs',         color: '#285e4b' },
  other:        { zh: '其他',   en: 'Other',        color: '#4a5568' },
};

export function parseChangeType(summary = '') {
  for (const { type, re } of CHANGE_TYPE_RULES) {
    if (re.test(summary)) return type;
  }
  return 'other';
}

// ── magnitude ───────────────────────────────────────────────────────────────
const MAJOR_THRESHOLD = 500; // 字节差超过此值视为 major

export function parseMagnitude(sizeBefore, sizeAfter) {
  return Math.abs((sizeAfter || 0) - (sizeBefore || 0)) >= MAJOR_THRESHOLD ? 'major' : 'minor';
}

// ── 核心 enrich 函数 ────────────────────────────────────────────────────────
/**
 * @param {object} entry  - recent.lite.jsonl 中的一条记录
 * @param {object} pages  - registry.pages（id → meta）
 * @returns {object}      - 丰富化后的记录
 */
export function enrichEntry(entry, pages) {
  const page   = pages[entry.page] || {};
  const sizeDelta = (entry.size || 0) - (entry.size_before || 0);
  return {
    ...entry,
    // Basic context enrichment
    pageType:  page.type  || '',
    pageLabel: page.label || entry.page,
    // Revision summary enrichment
    changeType: parseChangeType(entry.summary),
    magnitude:  parseMagnitude(entry.size_before, entry.size),
    sizeDelta,
    // Rationale — leading token as tag
    tag: (entry.summary || '').split(/[：:\s]/)[0] || '',
  };
}

export function enrichAll(entries, pages) {
  return entries.map(e => enrichEntry(e, pages));
}
