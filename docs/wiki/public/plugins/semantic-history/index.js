/**
 * semantic-history — 语义历史插件
 *
 * 基于论文：Bao, Ding, McGuinness, "Semantic History: Towards Modeling and
 * Publishing Changes of Online Semantic Data", ISWC 2009.
 *
 * 提供：
 *   Special:SemanticHistory  — 可语义查询的修订历史（按类型/作者/变更类型/日期过滤）
 *   页面历史增强              — 在现有 ?history=<page> 视图中注入语义标签
 *
 * 语义模型三层：
 *   Basic context   : page, pageType, author, timestamp, rev_id
 *   Revision summary: changeType, magnitude, sizeDelta, diff_add, diff_del
 *   Rationale       : summary, tag（从 summary 前缀提取）
 */

import { enrichAll, parseChangeType, CHANGE_TYPE_LABELS } from './enrich.js';

const PAGE_SIZE = 50;

export default {
  async init(core) {
    core.registerSpecialPage({
      id: 'Special:SemanticHistory',
      async render(c, params) {
        await renderSemanticHistory(c, params);
      },
    });

    // 注入页面历史的语义标签（在 recent 插件渲染后）
    document.addEventListener('wiki:historyRendered', () => {
      injectSemanticBadges(core);
    });
  },
};

// ── 数据加载 ─────────────────────────────────────────────────────────────────

let _cache = null;

async function loadEnriched(core) {
  if (_cache) return _cache;
  const bust = `?v=${Math.floor(Date.now() / 60000)}`;
  const r = await fetch('recent.lite.jsonl' + bust);
  if (!r.ok) throw new Error('recent.lite.jsonl load failed');
  const text = await r.text();
  const entries = text.trim().split('\n').filter(Boolean).map(l => JSON.parse(l));
  _cache = enrichAll(entries.reverse(), core.registry.pages); // 最新在前
  return _cache;
}

// ── Special:SemanticHistory ──────────────────────────────────────────────────

async function renderSemanticHistory(core, params) {
  const t = k => core.t?.(k) ?? k;
  setPage(core, t('sp_sem_hist'), t('loading'));

  let all;
  try {
    all = await loadEnriched(core);
  } catch (e) {
    setPage(core, t('sp_sem_hist'), `<p class="error">${t('error')}：${e.message}</p>`);
    return;
  }

  // 读取过滤参数
  const p = params || new URLSearchParams();
  const fType       = p.get('type')       || '';
  const fAuthor     = p.get('author')     || '';
  const fChangeType = p.get('changeType') || '';
  const fSince      = p.get('since')      || '';
  const fUntil      = p.get('until')      || '';
  const fMagnitude  = p.get('magnitude')  || '';
  const page        = parseInt(p.get('page') || '1', 10);

  // 过滤
  let filtered = all;
  if (fType)       filtered = filtered.filter(e => e.pageType === fType);
  if (fAuthor)     filtered = filtered.filter(e => e.author === fAuthor);
  if (fChangeType) filtered = filtered.filter(e => e.changeType === fChangeType);
  if (fMagnitude)  filtered = filtered.filter(e => e.magnitude === fMagnitude);
  if (fSince)      filtered = filtered.filter(e => e.timestamp >= fSince);
  if (fUntil)      filtered = filtered.filter(e => e.timestamp <= fUntil + 'T23:59:59');

  // 分页
  const total   = filtered.length;
  const totalPg = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const slice   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // 选项列表（从全量数据构建）
  const types       = [...new Set(all.map(e => e.pageType).filter(Boolean))].sort();
  const authors     = [...new Set(all.map(e => e.author).filter(Boolean))].sort();
  const changeTypes = Object.keys(CHANGE_TYPE_LABELS);

  const title = t('sp_sem_hist');
  const html = `
    <h1>${title} <small style="font-size:.6em;font-weight:normal">Special:SemanticHistory</small></h1>
    ${buildStatsBar(all, filtered, t)}
    ${buildFilterForm(fType, fAuthor, fChangeType, fSince, fUntil, fMagnitude, types, authors, changeTypes, t)}
    <p style="color:#666;margin:.5em 0">${total} ${t('sh_revisions')}${total !== all.length ? ` ${t('sh_total_note').replace('%s', all.length)}` : ''}</p>
    ${buildTable(slice, t, core.lang)}
    ${buildPager(page, totalPg, p, t)}`;

  setPage(core, title, html);

  // hash 路由下，form method=get 会把 params 写到页面路径而非 hash。
  // 拦截提交，手动构造正确的 hash URL。
  document.querySelector('.sh-filter')?.addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const qs = new URLSearchParams(fd).toString();
    location.hash = encodeURIComponent('Special:SemanticHistory') + (qs ? '?' + qs : '');
  });
}

function buildStatsBar(all, filtered, t) {
  const uniquePages   = new Set(filtered.map(e => e.page)).size;
  const uniqueAuthors = new Set(filtered.map(e => e.author)).size;
  const majorCount    = filtered.filter(e => e.magnitude === 'major').length;
  return `<div class="sh-stats">
    <span>📄 ${filtered.length}</span>
    <span>📑 ${uniquePages}</span>
    <span>✍️ ${uniqueAuthors}</span>
    <span>⬆️ ${majorCount} ${t('sh_major').toLowerCase()}</span>
  </div>`;
}

function buildFilterForm(fType, fAuthor, fChangeType, fSince, fUntil, fMagnitude, types, authors, changeTypes, t) {
  const opt = (val, label, cur) =>
    `<option value="${esc(val)}"${val === cur ? ' selected' : ''}>${esc(label)}</option>`;

  return `<form class="sh-filter">
    <select name="type">
      <option value="">${t('sh_all_types')}</option>
      ${types.map(tp => opt(tp, tp, fType)).join('')}
    </select>
    <select name="author">
      <option value="">${t('sh_all_authors')}</option>
      ${authors.map(a => opt(a, a, fAuthor)).join('')}
    </select>
    <select name="changeType">
      <option value="">${t('sh_all_changes')}</option>
      ${changeTypes.map(ct => opt(ct, core.lang === 'zh' ? CHANGE_TYPE_LABELS[ct].zh : (CHANGE_TYPE_LABELS[ct].en || CHANGE_TYPE_LABELS[ct].zh), fChangeType)).join('')}
    </select>
    <select name="magnitude">
      <option value="">${t('sh_any_scale')}</option>
      ${opt('major', t('sh_major'), fMagnitude)}
      ${opt('minor', t('sh_minor'), fMagnitude)}
    </select>
    <input type="date" name="since" value="${esc(fSince)}" title="${t('sh_date_since')}">
    <input type="date" name="until" value="${esc(fUntil)}" title="${t('sh_date_until')}">
    <button type="submit">${t('sh_filter')}</button>
    <a href="#${encodeURIComponent('Special:SemanticHistory')}" class="sh-reset">${t('sh_reset')}</a>
  </form>`;
}

function buildTable(entries, t, lang) {
  if (!entries.length) return `<p>${t('sh_no_results')}</p>`;
  const rows = entries.map(e => {
    const ctInfo  = CHANGE_TYPE_LABELS[e.changeType] || CHANGE_TYPE_LABELS.other;
    const ctLabel = lang === 'zh' ? ctInfo.zh : (ctInfo.en || ctInfo.zh);
    const ctBadge  = `<span class="sh-badge" style="background:${ctInfo.color}">${ctLabel}</span>`;
    const magBadge = e.magnitude === 'major' ? `<span class="sh-badge sh-badge-major">${t('sh_major')}</span>` : '';
    const delta    = e.sizeDelta >= 0 ? `+${e.sizeDelta}` : `${e.sizeDelta}`;
    const deltaCls = e.sizeDelta >= 0 ? 'sh-delta-pos' : 'sh-delta-neg';
    const ts       = core.timezone?.format?.(e.timestamp, { format: 'full' }) ?? e.timestamp.slice(0, 16).replace('T', ' ');
    const pageHref = `#${encodeURIComponent(e.page)}`;
    const histHref = `#?history=${encodeURIComponent(e.page)}`;
    const typeBadge = e.pageType ? `<span class="sh-type">${esc(e.pageType)}</span>` : '';
    return `<tr>
      <td><a href="${pageHref}">${esc(e.pageLabel)}</a>${typeBadge}</td>
      <td><div class="sh-badges">${ctBadge}${magBadge}</div></td>
      <td>${esc(e.author)}</td>
      <td class="${deltaCls}">${delta}</td>
      <td class="sh-summary">${esc(e.summary)}</td>
      <td><a href="${histHref}">${ts}</a></td>
    </tr>`;
  }).join('');

  return `<table class="wikitable sh-table">
    <thead><tr>
      <th>${t('sh_col_page')}</th><th>${t('sh_col_change')}</th><th>${t('rc_col_author')}</th><th>${t('sh_col_delta')}</th><th>${t('rc_col_summary')}</th><th>${t('rc_col_time')}</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function buildPager(page, total, params, t) {
  if (total <= 1) return '';
  const base = encodeURIComponent('Special:SemanticHistory');
  const qs = new URLSearchParams(params);
  const mk = n => {
    qs.set('page', n);
    return n === page
      ? `<span class="pager-current">${n}</span>`
      : `<a class="pager-link" href="#${base}?${qs}">${n}</a>`;
  };
  const parts = [];
  if (page > 1) { qs.set('page', page - 1); parts.push(`<a class="pager-link" href="#${base}?${qs}">${t('sh_prev_page')}</a>`); }
  const lo = Math.max(1, page - 2), hi = Math.min(total, page + 2);
  for (let i = lo; i <= hi; i++) parts.push(mk(i));
  if (page < total) { qs.set('page', page + 1); parts.push(`<a class="pager-link" href="#${base}?${qs}">${t('sh_next_page')}</a>`); }
  return `<div class="pager">${parts.join(' ')}</div>`;
}

// ── 页面历史语义增强 ──────────────────────────────────────────────────────────

function injectSemanticBadges(core) {
  const table = document.querySelector('.recent-changes');
  if (!table) return;
  table.querySelectorAll('tr[data-rev]').forEach(row => {
    const summary = row.dataset.summary || '';
    const ct = parseChangeType(summary);
    const info = CHANGE_TYPE_LABELS[ct] || CHANGE_TYPE_LABELS.other;
    const badge = document.createElement('span');
    badge.className = 'sh-badge';
    badge.style.background = info.color;
    badge.textContent = core.lang === 'zh' ? info.zh : (info.en || info.zh);
    const summaryCell = row.querySelector('td.summary, td:nth-child(3)');
    if (summaryCell) summaryCell.prepend(badge);
  });
}

// ── DOM 工具 ──────────────────────────────────────────────────────────────────

function setPage(core, title, html) {
  document.body.classList.remove('is-home');
  document.getElementById('article').innerHTML = html;
  const ib = document.getElementById('infobox');
  if (ib) { ib.innerHTML = ''; ib.hidden = true; }
  document.getElementById('crumb').textContent = 'Special / ' + title;
  document.title = title + ' · ' + core.siteName;
  document.getElementById('src-info').innerHTML = '';
  document.getElementById('broken-info').textContent = '';
  window.scrollTo(0, 0);
}

function esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
