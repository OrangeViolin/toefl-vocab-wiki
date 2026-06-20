/**
 * infobox — 信息框插件
 *
 * 将页面 frontmatter 渲染为右侧信息框（<aside class="infobox">）。
 * 启用后在 core 上挂载：
 *   core.renderInfobox(core, front, meta, pid) → Promise<string|null>
 *
 * 字段标签、跳过字段、分组顺序均由 local/config/infobox.js 配置。
 */

import { escapeHtml, TYPE_LABELS } from '../../js/util.js';
import { resolvePageId } from '../../js/registry.js';
import { FIELD_LABELS, INFOBOX_SKIP, FIELD_GROUPS } from '@wiki/local/config/infobox.js';

const FIELD_IN_GROUP = new Map();
for (const g of FIELD_GROUPS) for (const k of g.fields) FIELD_IN_GROUP.set(k, g.label);

export default {
  async init(core) {
    core.renderInfobox = renderInfobox;
  },
};

function linkifyValue(val, registry) {
  const s = String(val);
  if (!registry) return escapeHtml(s);
  const resolved = resolvePageId(s, registry);
  if (resolved) return `<a href="#${encodeURIComponent(resolved[0])}">${escapeHtml(s)}</a>`;
  return escapeHtml(s);
}

async function renderInfobox(core, front, meta, pid) {
  let rows = [];
  const handled = new Set();
  const push = (k, v) => {
    if (v != null && v !== '') rows.push(`<tr><th>${escapeHtml(k)}</th><td>${v}</td></tr>`);
  };

  const t = k => core.t?.(k) ?? k;

  // ── 特殊字段（先于分组处理）──
  if (front.canonical_name && front.canonical_name !== (front.label || meta.label)) {
    push(t('ib_canonical_name'), escapeHtml(front.canonical_name));
  }
  handled.add('canonical_name');

  if (front.aliases && front.aliases.length) {
    push(t('aliases'), front.aliases.map(a => {
      const escaped = escapeHtml(a);
      if (a !== pid && core.registry.pages[a]) return `<a href="#${encodeURIComponent(a)}">${escaped}</a>`;
      return escaped;
    }).join(' · '));
  }
  handled.add('aliases');

  push(t('type'), TYPE_LABELS[front.type || meta.type] || front.type || meta.type);
  handled.add('type');

  if (front.tags && front.tags.length) {
    push(t('tags'), front.tags.map(tag => linkifyValue(tag, core.registry)).join(' · '));
  }
  handled.add('tags');

  if (front.birth_ce != null) {
    const yr = Math.abs(front.birth_ce);
    push(t('ib_birth_ce'), front.birth_ce < 0
      ? (core.lang === 'zh' ? `公元前 ${yr} 年` : `${yr} BCE`)
      : (core.lang === 'zh' ? `公元 ${yr} 年`  : String(yr)));
  }
  handled.add('birth_ce');

  if (front.death_ce != null) {
    const yr = Math.abs(front.death_ce);
    push(t('ib_death_ce'), front.death_ce < 0
      ? (core.lang === 'zh' ? `公元前 ${yr} 年` : `${yr} BCE`)
      : (core.lang === 'zh' ? `公元 ${yr} 年`  : String(yr)));
  }
  handled.add('death_ce');

  handled.add('books');

  // ── 分组字段（按 FIELD_GROUPS 顺序）──
  for (const group of FIELD_GROUPS) {
    const hasContent = group.fields.some(k => !handled.has(k) && front[k] != null && front[k] !== '');
    if (!hasContent) continue;

    rows.push(`<tr class="infobox-group"><th colspan="2">${escapeHtml(group.label)}</th></tr>`);

    for (const key of group.fields) {
      handled.add(key);
      const val = front[key];
      if (val == null || val === '') continue;
      const label = FIELD_LABELS[key] || key;
      if (Array.isArray(val)) {
        push(label, val.map(v => linkifyValue(v, core.registry)).join(' · '));
      } else {
        push(label, linkifyValue(val, core.registry));
      }
    }
  }

  // ── 剩余未分组字段（兜底）──
  for (const [key, val] of Object.entries(front)) {
    if (handled.has(key) || INFOBOX_SKIP.has(key)) continue;
    if (val == null || val === '') continue;
    const label = FIELD_LABELS[key] || key;
    if (Array.isArray(val)) {
      if (val.length) push(label, val.map(v => linkifyValue(v, core.registry)).join(' · '));
    } else if (typeof val !== 'object') {
      push(label, linkifyValue(val, core.registry));
    }
  }

  // ── Hook ──
  rows = await core.hooks.onInfobox.run(rows, front, meta);

  if (!rows.length) return null;
  return `<h2>${escapeHtml(front.label || meta.label)}</h2>
    <table>${rows.join('')}</table>`;
}
