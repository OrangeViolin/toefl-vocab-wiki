/**
 * semantic-query — ::: query 块渲染插件
 *
 * 职责：
 *   onAfterRender  从 core.semanticBlock 取缓存，展开 query 占位符为 HTML 表格/列表
 *
 * 依赖 semantic-block 插件（需先注册，以确保 _cache 在 onBeforeRender 时填充）。
 *
 * query 块支持的参数：
 *   过滤：type / tags / featured / total_refs_min 等（精确相等 + _min/_max 范围）
 *   布尔：tags_any:[a,b]  tags_not:[a,b]  type_any:[a,b]
 *   计算：computed:{key: expr}  （表达式变量为 registry 字段名）
 *   显示：sort / order / limit / display / fields / field_labels / title
 */

const PLUGIN_NAME = 'semantic-query';

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ---------- SQL 关系查询引擎 ----------

import { parseSQL, ParseError } from './sql-parser.js';
import { evaluate } from './sql-evaluator.js';

/**
 * 执行 SQL 查询并返回渲染 HTML。
 * 仅在 meta.query 存在时使用，替代 YAML 过滤。
 */
function renderSQLQuery(meta, kbData, core) {
  const t = k => core.t?.(k) ?? k;
  if (!kbData?.pages) return `<p class="query-error">${t('sq_no_data')}</p>`;

  let ast;
  try {
    ast = parseSQL(meta.query);
  } catch (e) {
    return `<p class="query-error">${t('sq_parse_error') + ':'} ${esc(e.message)}</p>`;
  }

  const normalizerFn = meta.normalizer ? (NORMALIZERS[meta.normalizer] || null) : null;
  let result;
  try {
    result = evaluate(ast, kbData.pages, normalizerFn);
  } catch (e) {
    return `<p class="query-error">${t('sq_exec_error') + ':'} ${esc(e.message)}</p>`;
  }

  const { columns, rows } = result;
  const titleHtml = meta.title ? `<div class="query-title">${esc(meta.title)}</div>` : '';
  const n = rows.length;
  const countHtml = `<div class="query-count">${t('sq_n_results').replace('%s', n)}</div>`;
  const display = meta.display || 'table';

  if (display === 'count') {
    return `${titleHtml}${countHtml}`;
  }

  if (rows.length === 0) {
    return `${titleHtml}<p class="query-empty">${t('no_results')}</p>`;
  }

  if (display === 'list') {
    const labelField = columns[0];
    const items = rows.map(row => {
      const label = row[labelField];
      return `<li><span class="qp">▸</span> ${esc(label == null ? '' : String(label))}</li>`;
    }).join('');
    return `${titleHtml}${countHtml}<ul class="query-results">${items}</ul>`;
  }

  // table (default for SQL mode)
  const thead = '<tr>' + columns.map(c => `<th>${esc(meta.field_labels?.[c] || c)}</th>`).join('') + '</tr>';
  const tbody = rows.map(row => {
    const cells = columns.map(c => `<td>${esc(fmtQueryValue(c, row[c], core))}</td>`).join('');
    return `<tr>${cells}</tr>`;
  }).join('');
  return `${titleHtml}${countHtml}
<table class="query-table">
<thead>${thead}</thead>
<tbody>${tbody}</tbody>
</table>`;
}

// ---------- 表达式求值器 ----------

function tokenizeExpr(expr) {
  const tokens = [];
  let i = 0;
  while (i < expr.length) {
    if (/\s/.test(expr[i])) { i++; continue; }
    if ('+-*/()'.includes(expr[i])) { tokens.push(expr[i++]); continue; }
    let j = i;
    while (j < expr.length && /[\w.]/.test(expr[j])) j++;
    if (j > i) { tokens.push(expr.slice(i, j)); i = j; continue; }
    i++;
  }
  return tokens;
}

export function evalExpr(expr, vars) {
  const tokens = tokenizeExpr(String(expr));
  let pos = 0;
  const peek = () => tokens[pos];
  const consume = () => tokens[pos++];

  function parsePrimary() {
    const t = consume();
    if (t === '(') { const v = parseAddSub(); consume(); return v; }
    const n = Number(t);
    if (!isNaN(n) && t !== undefined) return n;
    const v = vars[t];
    return (v == null) ? null : typeof v === 'number' ? v : Number(v);
  }
  function parseUnary() {
    if (peek() === '-') { consume(); const v = parsePrimary(); return v == null ? null : -v; }
    return parsePrimary();
  }
  function parseMulDiv() {
    let l = parseUnary();
    while (peek() === '*' || peek() === '/') {
      const op = consume(); const r = parseUnary();
      if (l == null || r == null) { l = null; continue; }
      l = op === '*' ? l * r : r !== 0 ? l / r : null;
    }
    return l;
  }
  function parseAddSub() {
    let l = parseMulDiv();
    while (peek() === '+' || peek() === '-') {
      const op = consume(); const r = parseMulDiv();
      if (l == null || r == null) { l = null; continue; }
      l = op === '+' ? l + r : l - r;
    }
    return l;
  }
  try { return parseAddSub(); } catch (_) { return null; }
}

// ---------- 查询引擎 ----------

const QUERY_SYSTEM_KEYS = new Set([
  'sort', 'order', 'limit', 'display', 'fields', 'title', 'field_labels', 'computed',
  'union', 'unique', 'group', 'count_of', 'normalizer', 'query',
]);

const QUERY_BOOL_KEYS = new Set([
  'tags_any', 'tags_not', 'type_any',
]);

// 分组归一化器注册表：query 通过 normalizer 参数引用
// 默认仅保留 default（原样输出），业务 normalizer 由 local config 注入
// 导出以便测试注入（init() 时自动从 localConfig 合并）
export const NORMALIZERS = {
  default: (raw) => raw == null ? [] : [String(raw).trim()].filter(Boolean),
};

// 这些字段的值是页面名称，渲染时自动转为 wikilink
// 语义关系字段（丫鬟、小厮、僕等）在 init 时从 kb.json schema 动态加入
const LINKIFY_FIELDS = new Set([
  'father', 'mother', 'spouse', 'children', 'siblings',
  'uncles', 'aunts', 'nephews', 'nieces',
  'grandparents', 'grandchildren', 'cousins', 'in_laws',
  'master', 'servants',
  'location', 'participants', 'author', 'owner', 'region', 'members',
]);

let QUERY_FIELD_LABELS = {
  label:          { zh: '名称',      en: 'Name' },
  type:           { zh: '类型',      en: 'Type' },
  tags:           { zh: '标签',      en: 'Tags' },
  total_refs:     { zh: '引用',      en: 'Refs' },
  total_chapters: { zh: '章节数',    en: 'Chapters' },
  quality_score:  { zh: '质量',      en: 'Quality' },
  featured:       { zh: '精品',      en: 'Featured' },
  birthday:       { zh: '生日',      en: 'Birthday' },
  gender:         { zh: '性别',      en: 'Gender' },
  father:         { zh: '父亲',      en: 'Father' },
  mother:         { zh: '母亲',      en: 'Mother' },
  spouse:         { zh: '配偶',      en: 'Spouse' },
  children:       { zh: '子女',      en: 'Children' },
  siblings:       { zh: '兄弟姐妹',  en: 'Siblings' },
  uncles:         { zh: '叔伯舅',    en: 'Uncles' },
  aunts:          { zh: '姑姨婶',    en: 'Aunts' },
  nephews:        { zh: '侄甥',      en: 'Nephews' },
  nieces:         { zh: '侄女甥女',  en: 'Nieces' },
  grandparents:   { zh: '祖父母',    en: 'Grandparents' },
  grandchildren:  { zh: '孙辈',      en: 'Grandchildren' },
  cousins:        { zh: '堂表亲',    en: 'Cousins' },
  in_laws:        { zh: '姻亲',      en: 'In-laws' },
  master:         { zh: '主人',      en: 'Master' },
  servants:       { zh: '仆从',      en: 'Servants' },
  fate:           { zh: '结局',      en: 'Fate' },
  date:           { zh: '时间',      en: 'Date' },
  location:       { zh: '地点',      en: 'Location' },
  participants:   { zh: '参与人物',  en: 'Participants' },
  result:         { zh: '结果',      en: 'Result' },
  region:         { zh: '所属',      en: 'Region' },
  modern_name:    { zh: '今地名',    en: 'Modern Name' },
  lifespan:       { zh: '活跃期',    en: 'Active Period' },
  birth_ce:       { zh: '生',        en: 'Birth' },
  death_ce:       { zh: '卒',        en: 'Death' },
};

let QUERY_TYPE_LABELS = {
  person:       { zh: '人物',   en: 'Person' },
  place:        { zh: '地点',   en: 'Place' },
  state:        { zh: '邦国',   en: 'State' },
  official:     { zh: '官职',   en: 'Official Post' },
  identity:     { zh: '身份',   en: 'Identity' },
  dynasty:      { zh: '朝代',   en: 'Dynasty' },
  event:        { zh: '事件',   en: 'Event' },
  chapter:      { zh: '章节',   en: 'Chapter' },
  topic:        { zh: '主题',   en: 'Topic' },
  list:         { zh: '列表',   en: 'List' },
  sanwen:       { zh: '散文',   en: 'Prose' },
  story:        { zh: '故事',   en: 'Story' },
  object:       { zh: '器物',   en: 'Object' },
  poem:         { zh: '诗词',   en: 'Poem' },
  quote:        { zh: '名句',   en: 'Quote' },
  concept:      { zh: '概念',   en: 'Concept' },
  food:         { zh: '饮食',   en: 'Food' },
  clothing:     { zh: '服饰',   en: 'Clothing' },
  medicine:     { zh: '医药',   en: 'Medicine' },
  game:         { zh: '游戏',   en: 'Game' },
  book:         { zh: '卷册',   en: 'Volume' },
  family:       { zh: '家族',   en: 'Family' },
  organization: { zh: '组织',   en: 'Organization' },
  symbol:       { zh: '象征',   en: 'Symbol' },
  ritual:       { zh: '礼仪',   en: 'Ritual' },
  painting:     { zh: '书画',   en: 'Painting' },
  overview:     { zh: '综述',   en: 'Overview' },
  mythology:    { zh: '神话',   en: 'Mythology' },
  music:        { zh: '音乐',   en: 'Music' },
  skill:        { zh: '技能',   en: 'Skill' },
};

function getQueryLabel(map, key, lang) {
  const e = map[key];
  if (!e) return key;
  return e[lang] || e.en || e.zh || key;
}

function matchesCondition(key, val, page) {
  if (key.endsWith('_min')) {
    const field = key.slice(0, -4);
    const n = page[field];
    return !(typeof n !== 'number' || n < val);
  }
  if (key.endsWith('_max')) {
    const field = key.slice(0, -4);
    const n = page[field];
    return !(typeof n !== 'number' || n > val);
  }
  const pv = page[key];
  if (val === 'NOT NULL') {
    return !(pv == null || pv === '' || (Array.isArray(pv) && pv.length === 0));
  }
  if (Array.isArray(pv) && typeof val === 'string') {
    return pv.includes(val);
  }
  return pv === val;
}

/** 通过 alias_index 解析等价名称集合 */
function expandAlias(val, kbData) {
  const aliasIndex = kbData?.alias_index;
  const pages = kbData?.pages;
  if (!aliasIndex || !pages || typeof val !== 'string') return null;
  const pid = aliasIndex[val];
  if (!pid) return null;
  const page = pages[pid];
  if (!page) return null;
  const set = new Set([pid, page.label]);
  if (Array.isArray(page.aliases)) page.aliases.forEach(a => set.add(a));
  return set;
}

export function executeQuery(meta, kbData, opts = {}) {
  // kbData = kb.json 全量（pages.json 超集 + alias_index）
  const kbPages = kbData?.pages;
  if (!kbPages) return [];

  const allPages = Object.entries(kbPages);

  const isUnion = meta.union === true;
  const conditions = [];
  for (const [key, val] of Object.entries(meta)) {
    if (QUERY_SYSTEM_KEYS.has(key) || QUERY_BOOL_KEYS.has(key)) continue;
    conditions.push({ key, val });
  }

  const preCheck = (page) => {
    if (meta.tags_any) {
      const any = Array.isArray(meta.tags_any) ? meta.tags_any : [meta.tags_any];
      if (!any.some(t => (page.tags || []).includes(t))) return false;
    }
    if (meta.tags_not) {
      const not = Array.isArray(meta.tags_not) ? meta.tags_not : [meta.tags_not];
      if (not.some(t => (page.tags || []).includes(t))) return false;
    }
    if (meta.type_any) {
      const anyT = Array.isArray(meta.type_any) ? meta.type_any : [meta.type_any];
      if (!anyT.includes(page.type)) return false;
    }
    return true;
  };

  const filtered = allPages.filter(([pid, page]) => {
    if (!preCheck(page)) return false;
    if (conditions.length === 0) return true;

    const matchCondition = ({ key, val }) => {
      // 对字符串值做别名展开和 CSV 防御
      if (typeof val === 'string' && !key.endsWith('_min') && !key.endsWith('_max')) {
        const pv = page[key];
        // CSV 字符串防御：自动拆成数组再匹配
        if (typeof pv === 'string' && pv.includes(',')) {
          const parts = pv.split(',').map(s => s.trim());
          if (parts.includes(val)) return true;
        }
        // 别名展开：affiliation: MIT → 同时匹配 MIT/麻省理工学院/...
        const expanded = expandAlias(val, kbData);
        if (expanded) {
          if (Array.isArray(pv)) return pv.some(v => expanded.has(v));
          if (expanded.has(pv)) return true;
        }
      }
      return matchesCondition(key, val, page);
    };

    if (isUnion) {
      return conditions.some(matchCondition);
    }
    return conditions.every(matchCondition);
  });

  const sortField = meta.sort || 'label';
  const order = meta.order === 'desc' ? -1 : 1;
  filtered.sort(([, a], [, b]) => {
    const av = a[sortField] ?? '';
    const bv = b[sortField] ?? '';
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * order;
    return String(av).localeCompare(String(bv), 'zh') * order;
  });

  const limit = opts.noLimit ? Infinity : (typeof meta.limit === 'number' ? meta.limit : 200);
  return filtered.slice(0, limit).map(([pid, page]) => ({ pid, ...page }));
}

const CN_MONTH = ['', '正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
const CN_DAY = ['', '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'];

function fmtQueryValue(key, v, core) {
  const t = k => core?.t?.(k) ?? k;
  if (v == null || v === '') return '';
  if (key === 'type') return getQueryLabel(QUERY_TYPE_LABELS, String(v), core?.lang || 'en');
  if (key === 'birthday' && typeof v === 'string' && /^\d{2}-\d{2}$/.test(v)) {
    const [m, d] = v.split('-').map(Number);
    return core?.lang === 'zh' ? `${CN_MONTH[m] || m}月${CN_DAY[d] || d}` : `${m}/${d}`;
  }
  if (key === 'birth_ce' || key === 'death_ce') {
    if (typeof v !== 'number') return String(v);
    return v < 0 ? (core?.lang === 'zh' ? `前${-v}` : `${-v} BCE`) : String(v);
  }
  if (Array.isArray(v)) return v.join(' · ');
  if (typeof v === 'boolean') return v ? t('bool_yes') : '';
  if (typeof v === 'number') return String(v);
  return String(v);
}

/** 将页面引用字段的值渲染为 wikilink HTML。dataSource 需包含 alias_index */
function fmtLinkField(key, v, dataSource) {
  const linkOne = (name) => {
    const s = String(name);
    const aliasIndex = dataSource && dataSource.alias_index;
    if (aliasIndex && aliasIndex[s]) {
      return `<a class="wikilink resolved" href="#${encodeURIComponent(aliasIndex[s])}">${esc(s)}</a>`;
    }
    // 找不到对应页面的值作为红链（可能的待建页面）
    return `<a class="wikilink" href="#${encodeURIComponent(s)}">${esc(s)}</a>`;
  };
  if (v == null || v === '') return '';
  if (Array.isArray(v)) return v.map(linkOne).join(' · ');
  return linkOne(v);
}

export function renderQueryBlock(meta, kbData, core) {
  const t = k => core?.t?.(k) ?? k;
  if (!kbData?.pages) return `<p class="query-error">${t('sq_no_data')}</p>`;

  // SQL 关系查询优先（与 YAML 过滤互斥）
  if (meta.query) {
    return renderSQLQuery(meta, kbData, core);
  }

  const results = executeQuery(meta, kbData);
  const display = meta.display || 'list';
  const titleHtml = meta.title ? `<div class="query-title">${esc(meta.title)}</div>` : '';
  const n = results.length;
  const countHtml = `<div class="query-count">${t('sq_n_results').replace('%s', n)}</div>`;

  if (display === 'count') {
    return `${titleHtml}${countHtml}`;
  }

  // ── group-by：按 group 字段分组，统计 count_of 字段各值的出现次数 ──
  if (display === 'group_by') {
    const groupField = meta.group || 'nationality';
    const countField = meta.count_of || 'type';
    const allResults = executeQuery(meta, kbData, { noLimit: true });

    // 分组计数
    const groups = {};
    for (const item of allResults) {
      const gv = item[groupField];
      if (gv == null || gv === '') continue;
      const cv = item[countField] || (core?.t?.('not_found') ?? 'Unknown');
      const normalizer = NORMALIZERS[meta.normalizer || 'default'];
      const keys = normalizer(gv);
      for (const gk of keys) {
        if (!groups[gk]) groups[gk] = {};
        groups[gk][cv] = (groups[gk][cv] || 0) + 1;
      }
    }

    // 排序分组：默认按总计数降序（order: desc），order: asc 则升序
    const sortedGroups = Object.keys(groups).sort((a, b) => {
      const sumA = Object.values(groups[a]).reduce((s, v) => s + v, 0);
      const sumB = Object.values(groups[b]).reduce((s, v) => s + v, 0);
      if (sumB !== sumA) return meta.order === 'asc' ? sumA - sumB : sumB - sumA;
      return a.localeCompare(b, 'zh');
    });

    // 限制分组数
    const groupLimit = typeof meta.limit === 'number' ? meta.limit : 200;
    const limitedGroups = sortedGroups.slice(0, groupLimit);

    // 收集所有 count_of 值作为列
    const allValues = new Set();
    for (const gk of limitedGroups) {
      for (const v of Object.keys(groups[gk])) allValues.add(v);
    }
    const sortedValues = [...allValues].sort();

    // 构建表格
    let table = '<table class="query-table"><thead><tr>';
    table += `<th>${esc(getQueryLabel(QUERY_FIELD_LABELS, groupField, core?.lang || 'en'))}</th>`;
    for (const v of sortedValues) {
      table += `<th class="num">${esc(getQueryLabel(QUERY_TYPE_LABELS, v, core?.lang || 'en'))}</th>`;
    }
    table += '</tr></thead><tbody>';
    for (const gk of limitedGroups) {
      table += `<tr><td>${esc(gk)}</td>`;
      for (const v of sortedValues) {
        table += `<td class="num">${groups[gk][v] || 0}</td>`;
      }
      table += '</tr>';
    }
    table += '</tbody></table>';

    return `${titleHtml}${table}`;
  }

  if (results.length === 0) {
    return `${titleHtml}<p class="query-empty">${t('no_results')}</p>`;
  }

  if (display === 'table') {
    const rawFields = meta.fields;
    const fields = Array.isArray(rawFields) ? rawFields
      : typeof rawFields === 'string' ? [rawFields]
      : ['label', 'type', 'tags', 'total_refs'];
    const customLabels = (meta.field_labels && typeof meta.field_labels === 'object')
      ? meta.field_labels : {};
    const computed = (meta.computed && typeof meta.computed === 'object')
      ? meta.computed : {};

    const thead = '<tr>' + fields.map(f =>
      `<th>${esc(customLabels[f] || getQueryLabel(QUERY_FIELD_LABELS, f, core?.lang || 'en'))}</th>`
    ).join('') + '</tr>';

    const tbody = results.map(item => {
      const cells = fields.map(f => {
        if (f === 'label') {
          return `<td><a class="wikilink resolved query-label-link" href="#${encodeURIComponent(item.pid)}">${esc(item.label || item.pid)}</a></td>`;
        }
        const val = (f in computed) ? evalExpr(computed[f], item) : item[f];
        if (LINKIFY_FIELDS.has(f)) {
          return `<td>${fmtLinkField(f, val, kbData)}</td>`;
        }
        return `<td>${esc(fmtQueryValue(f, val, core))}</td>`;
      }).join('');
      return `<tr>${cells}</tr>`;
    }).join('');

    return `${titleHtml}${countHtml}
<table class="query-table">
<thead>${thead}</thead>
<tbody>${tbody}</tbody>
</table>`;
  }

  // list mode
  const items = results.map(item =>
    `<li><a class="wikilink resolved query-label-link" href="#${encodeURIComponent(item.pid)}"><span class="qp">▸</span> ${esc(item.label || item.pid)}</a></li>`
  ).join('');
  return `${titleHtml}${countHtml}<ul class="query-results">${items}</ul>`;
}

// ---------- 样式 ----------

const STYLES = `
.query-title {
  font-weight: 600;
  font-size: 1em;
  margin: .8em 0 .3em;
  color: var(--accent, #7a1f1f);
}
.query-count {
  font-size: .85em;
  color: var(--fg-muted, #888);
  margin-bottom: .4em;
}
.query-empty { color: var(--fg-muted, #888); font-style: italic; }
.query-results {
  list-style: disc;
  padding-left: 1.5em;
  margin: .4em 0 .8em;
  columns: 2;
  column-gap: 2em;
}
.query-results li { break-inside: avoid; padding: .1em 0; }
.query-label-link .qp {
  opacity: .45;
  font-size: .85em;
}
table.query-table {
  width: 100%;
  border-collapse: collapse;
  font-size: .93em;
  margin: .4em 0 .8em;
}
table.query-table th {
  background: var(--bg-box, #f0ece0);
  border: 1px solid var(--border, #d8d2bf);
  padding: .3em .5em;
  text-align: left;
  font-weight: 600;
}
table.query-table td {
  border: 1px solid var(--border, #d8d2bf);
  padding: .25em .5em;
  vertical-align: top;
}
table.query-table tr:nth-child(even) td { background: var(--bg-stripe, #f8f5ed); }
table.query-table th.num, table.query-table td.num { text-align: right; }
`;

function injectStyles() {
  if (document.getElementById('semantic-query-style')) return;
  const el = document.createElement('style');
  el.id = 'semantic-query-style';
  el.textContent = STYLES;
  document.head.appendChild(el);
}

// ---------- 数据加载 ----------

async function loadKB(localConfig) {
  const primary = localConfig.KB_URL ?? 'kb.json';
  try {
    const resp = await fetch(primary);
    if (resp.ok) {
      const data = await resp.json();
      if (data?.pages) return data;
    }
  } catch (_) { /* fall through */ }

  // 所有 wiki 必有 pages.json；作为通用降级数据源
  try {
    const resp = await fetch('pages.json');
    if (resp.ok) return resp.json();
  } catch (_) { /* fall through */ }

  return null;
}

// ---------- 插件入口 ----------

export default {
  name: PLUGIN_NAME,
  version: '1.2.0',
  description: '::: query 块渲染：语义查询、布尔过滤、计算字段、自定义列标签',

  async init(core, localConfig = {}) {
    if (localConfig.QUERY_FIELD_LABELS) QUERY_FIELD_LABELS = localConfig.QUERY_FIELD_LABELS;
    if (localConfig.QUERY_TYPE_LABELS)  QUERY_TYPE_LABELS  = localConfig.QUERY_TYPE_LABELS;
    if (localConfig.NORMALIZERS)        Object.assign(NORMALIZERS, localConfig.NORMALIZERS);
    injectStyles();

    // ── 加载数据源：先尝试 kb.json（pages.json 超集 + 推理字段），失败后降级到 pages.json ──
    // kb.json 仅存在于知识图谱类 wiki；pages.json 在所有 wiki 必有
    const kbData = await loadKB(localConfig);
    if (kbData?.schema) {
      for (const relName of Object.keys(kbData.schema)) {
        LINKIFY_FIELDS.add(relName);
      }
    }

    // onAfterRender：展开 query 占位符（semantic-block 已跳过这些占位符）
    core.hooks.onAfterRender.add(async (html, ctx) => {
      const sb = core.semanticBlock;
      if (!sb) return html;

      const pid = ctx?.pid ?? '__last__';
      const blocks = sb.getBlocks(pid);
      const cacheDebug = sb.getCacheDebug ? sb.getCacheDebug() : {};
      const cacheKeys = Object.keys(cacheDebug);
      console.log('[sq] %s: blocks=%d, cacheKeys=[%s]', pid, blocks.length, cacheKeys.join(','));
      if (cacheKeys.length) {
        for (const k of cacheKeys) console.log('[sq] cache[%s]:', k, cacheDebug[k]);
      }

      if (!blocks.some(b => b.blockType === 'query')) {
        console.log('[sq] %s: no query blocks', pid);
        return html;
      }
      console.log('[sq] %s: query blocks=%d', pid, blocks.filter(b => b.blockType === 'query').length);

      const { PH_OPEN, PH_CLOSE } = sb;
      // 匹配包含占位符的整个段落：占位符前/后可能有其他内容（如 <strong>标题：</strong>）
      const PH_PARA_RE = new RegExp(
        `<p>[\\s\\S]*?${PH_OPEN}([\\s\\S])${PH_CLOSE}[\\s\\S]*?<\\/p>`, 'g'
      );

      return html.replace(PH_PARA_RE, (match, idxStr) => {
        const idx = idxStr.charCodeAt(0) - 0xE100;
        if (idx < 0 || idx >= blocks.length) return match;
        const block = blocks[idx];
        if (!block || block.blockType !== 'query') return match;
        const rendered = renderQueryBlock(block.meta, kbData, core);
        console.log(`[sq] ${pid} block#${idx} meta=`, block.meta, `result length=${rendered.length}`);
        // 仅替换占位符本身，保留段落内其他内容（标题文本等）
        const ph = PH_OPEN + idxStr + PH_CLOSE;
        return match.replace(ph, rendered);
      });
    });

    // 控制台调试：window.wikiDebugQuery
    window.wikiDebugQuery = (meta) => {
      console.log('[sq] debug query meta=', meta);
      const result = executeQuery(meta, kbData);
      console.log(`[sq] result count: ${result.length}`, result.slice(0, 3));
      return result;
    };
  },
};
