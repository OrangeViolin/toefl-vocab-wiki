/**
 * recent — 修订历史插件
 *
 * 提供三个视图：
 *   Special:Recent          最近修订列表（分页）
 *   #?history=<page>        单页修订历史
 *   #?revision=<page>&rev=  查看某一历史版本
 *
 * 启用后在 core 上挂载：
 *   core.renderHistory(core, page)
 *   core.renderRevision(core, page, revId)
 *
 * 可配置项（local/config/recent.js）：
 *   DISPLAY_LIMIT   最多加载的修订条数，默认 500
 *   PAGE_SIZE       每页显示条数，默认 50
 */

import { escapeHtml, hideSidebar, historyAll, _historyBucket } from '../../js/util.js';
import { parseMarkdown } from '../../js/parser.js';
import { resolveLineHash, reconstructContentV2 } from './line-resolver.js';

export default {
  async init(core, cfg = {}) {
    const DISPLAY_LIMIT = cfg.DISPLAY_LIMIT ?? 500;
    const PAGE_SIZE     = cfg.PAGE_SIZE     ?? 50;

    core.registerSpecialPage({
      id: 'Special:Recent',
      async render(c, params) {
        const pageNum = parseInt(params?.get('page') || '1', 10);
        await renderRecent(c, pageNum, { DISPLAY_LIMIT, PAGE_SIZE });
      },
    });

    core.renderHistory  = (c, page)          => renderHistory(c, page);
    core.renderRevision = (c, page, revId)   => renderRevision(c, page, revId);
  },
};

// ── 辅助函数 ─────────────────────────────────────────────────────────────────

function fmtTimestamp(val, core) {
  // 优先使用 timezone 插件的格式化（如已加载）
  if (core?.timezone?.format) {
    return core.timezone.format(val, { format: 'full' });
  }
  // fallback: 浏览器本地时间
  try {
    // v2 history entries use Unix seconds (integer); ISO strings are also accepted
    const d = typeof val === 'number' ? new Date(val * 1000) : new Date(val);
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
      `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch { return String(val); }
}

const _fmtAuthor = au => ({
  butler: '🤖 butler',
  baojie: 'baojie',
  baojie_cn: 'baojie',
})[au] || au;

function _fmtChangeDesc(e, t) {
  // v1 format: e.summary is plain text
  if (e.summary) return escapeHtml(e.summary);
  // v2 format: e.su is a line hash, not display text — use type map
  const map = {
    snap:  t('rc_type_snap')  || 'snapshot',
    delta: t('rc_type_delta') || 'delta',
    mv:    t('rc_type_mv')    || 'move',
    rm:    t('rc_type_rm')    || 'delete',
    mk:    t('rc_type_mk')    || 'create',
  };
  return map[e.t] || e.t || '';
}

function sizeCell(added, removed) {
  if (added === null || added === undefined) return `<td class="rc-size rc-size-zero">—</td>`;
  if (added > 0 && removed === 0) return `<td class="rc-size rc-size-plus">+${added}</td>`;
  if (added === 0 && removed > 0) return `<td class="rc-size rc-size-minus">−${removed}</td>`;
  if (added > 0 && removed > 0)   return `<td class="rc-size rc-size-mixed"><span class="rc-plus">+${added}</span> <span class="rc-minus">−${removed}</span></td>`;
  return `<td class="rc-size rc-size-zero">±0</td>`;
}

function buildPager(current, total, t) {
  const mk = (n, label, cls = '') =>
    n === current
      ? `<span class="pager-current">${label}</span>`
      : `<a class="pager-link${cls ? ' ' + cls : ''}" href="#${encodeURIComponent('Special:Recent')}?page=${n}">${label}</a>`;
  const parts = [];
  if (current > 1) parts.push(mk(current - 1, t('rc_prev_page'), 'prev'));
  const lo = Math.max(1, current - 2);
  const hi = Math.min(total, current + 2);
  if (lo > 1) parts.push(mk(1, '1'));
  if (lo > 2) parts.push('<span class="pager-gap">…</span>');
  for (let i = lo; i <= hi; i++) parts.push(mk(i, String(i)));
  if (hi < total - 1) parts.push('<span class="pager-gap">…</span>');
  if (hi < total) parts.push(mk(total, String(total)));
  if (current < total) parts.push(mk(current + 1, t('rc_next_page'), 'next'));
  return `<nav class="pager">${parts.join(' ')}</nav>`;
}

// ── 单页历史 ─────────────────────────────────────────────────────────────────

async function renderHistory(core, page) {
  const t = k => core.t?.(k) ?? k;
  const _bucket = _historyBucket(page, core.registry);
  const _hp = _bucket ? `history/${_bucket}/${page}.jsonl` : `history/${page}.jsonl`;

  let revs;
  try {
    revs = await historyAll(page, core.registry);
  } catch (e) {
    document.getElementById('article').innerHTML = `<p class="muted">${t('no_revisions')}</p>`;
    return;
  }

  // 解析所有摘要（v2 su 为 line hash，需异步 fetch line_index）
  const summaries = await Promise.all(revs.map(e =>
    e.summary ? Promise.resolve(e.summary) : resolveLineHash(e.su)
  ));

  const meta  = core.registry.pages[page];
  const label = meta?.label || page;
  const displayed = revs.toReversed();
  const latestId  = displayed[0] ? (displayed[0].id || displayed[0].rev_id) : null;

  // 建立 revId → summary 映射（revs 与 summaries 同序）
  const sumMap = new Map(revs.map((e, i) => [e.id || e.rev_id, summaries[i]]));

  const rows = displayed.map(e => {
    const revId   = e.id || e.rev_id;
    const isLatest = revId === latestId;
    const badge   = isLatest ? ` <span class="rc-badge-latest">${t('latest_badge')}</span>` : '';

    const ts      = escapeHtml(fmtTimestamp(e.ts ?? e.timestamp, core));
    const author  = escapeHtml(_fmtAuthor(e.au ?? e.author));
    const summary = escapeHtml(sumMap.get(revId) || '');
    const lc      = e.lc != null ? e.lc : '—';

    let changeHtml;
    if (e.t === 'delta') {
      const la = e.la ?? 0, lr = e.lr ?? 0;
      changeHtml = `<span class="rc-plus">+${la}</span> <span class="rc-minus">−${lr}</span>`;
    } else if (e.t === 'snap') {
      changeHtml = `<span class="rc-plus">+${e.lc ?? 0}</span>`;
    } else if (Array.isArray(e.diff)) {
      const add = e.diff.filter(d => d[0] === '+').length;
      const del = e.diff.filter(d => d[0] === '-').length;
      changeHtml = `<span class="rc-plus">+${add}</span> <span class="rc-minus">−${del}</span>`;
    } else {
      changeHtml = '—';
    }

    return `<tr>
      <td class="rc-time">${ts}${badge}</td>
      <td class="rc-author">${author}</td>
      <td class="rc-summary">${summary}</td>
      <td class="rc-lc">${lc}</td>
      <td class="rc-size">${changeHtml}</td>
      <td class="rc-diff"><a href="#?diff=${encodeURIComponent(page)}&rev=${encodeURIComponent(revId)}">diff</a></td>
      <td class="rc-rev"><a href="#?revision=${encodeURIComponent(page)}&rev=${encodeURIComponent(revId)}">${escapeHtml(revId)}</a>${badge}</td>
    </tr>`;
  }).join('');

  document.getElementById('article').innerHTML = `
    <h1>${escapeHtml(label)} <span class="src-view-badge">${t('rc_hist_badge')}</span></h1>
    <p><a href="#${encodeURIComponent(page)}">${t('rc_back_to_page')}</a></p>
    <p class="muted">${revs.length} ${t('sh_revisions')}</p>
    <table class="recent-changes hist"><thead><tr>
      <th>${t('rc_col_time')}</th>
      <th>${t('rc_col_author')}</th>
      <th>${t('rc_col_summary')}</th>
      <th>${t('rc_col_lines')}</th>
      <th>${t('rc_col_changes')}</th>
      <th>diff</th>
      <th>${t('rc_col_revision')}</th>
    </tr></thead><tbody>${rows}</tbody></table>`;
  document.body.classList.add('is-home');
  hideSidebar();
  document.getElementById('crumb').textContent = label;
  document.title = `${label} · ${core.siteName}`;
  document.getElementById('src-info').innerHTML =
    `<a href="${escapeHtml(meta?.path || page + '.md')}" class="src-link" target="_blank">${t('source_file') ?? 'Source'}: ${escapeHtml(meta?.path || page + '.md')}</a>` +
    ` · <a href="${escapeHtml(_hp)}" class="src-link" target="_blank">History: ${escapeHtml(_hp)}</a>`;
}

// ── 按 ID 查看历史版本 ───────────────────────────────────────────────────────

async function renderRevision(core, page, revId) {
  const t = k => core.t?.(k) ?? k;
  const _bucket = _historyBucket(page, core.registry);

  let allEntries;
  try {
    allEntries = await historyAll(page, core.registry);
  } catch (e) {
    throw new Error(`historyAll: ${e.message}`);
  }

  const matchId = x => (x.rev_id || x.id) === revId;
  const rev = allEntries.find(matchId);
  if (!rev) {
    const meta  = core.registry.pages[page];
    const label = meta?.label || page;
    document.getElementById('article').innerHTML = `
      <h1>${escapeHtml(label)} <span class="src-view-badge">${t('rc_hist_badge')}</span></h1>
      <p class="muted"><a href="#${encodeURIComponent(page)}">${t('rc_back_to_page')}</a></p>
      <p class="muted">${t('no_revisions')}</p>`;
    document.getElementById('crumb').textContent = label;
    document.title = `${label} · ${core.siteName}`;
    return;
  }

  let content;
  if (rev.v === 2) {
    content = await reconstructContentV2(allEntries, revId);
  } else {
    if (rev.content == null) throw new Error(`rev missing content: ${revId}`);
    content = rev.content;
  }

  const meta = core.registry.pages[page] || { type: 'meta', label: page, path: '' };
  const { html } = await parseMarkdown(core, content, { pid: page, meta });

  const banner = `<div class="rev-banner">
    <strong>${t('rv_hist_version')}</strong> · ${t('rc_col_revision')} <code>${escapeHtml(revId)}</code> ·
    <a href="#${encodeURIComponent(page)}">${t('rv_current')}</a> ·
    <a href="#?history=${encodeURIComponent(page)}">${t('rv_all_revisions')}</a> ·
    <a href="#?diff=${encodeURIComponent(page)}&rev=${encodeURIComponent(revId)}">${t('rv_diff_prev')}</a>
  </div>`;

  document.getElementById('article').innerHTML = banner + html;
  hideSidebar();
  document.body.classList.add('is-home');
  document.getElementById('crumb').textContent = `${page} @ ${revId}`;
  document.title = `${page} @ ${revId} · ${core.siteName}`;
  document.getElementById('src-info').textContent = _bucket ? `history/${_bucket}/${page}/${revId}.md` : `history/${page}/${revId}.md`;
  document.getElementById('broken-info').textContent = '';
  window.scrollTo(0, 0);
}

// ── Special:Recent ──────────────────────────────────────────────────────────

async function renderRecent(core, pageNum = 1, { DISPLAY_LIMIT, PAGE_SIZE }) {
  const t = k => core.t?.(k) ?? k;
  const bust = `?v=${Math.floor(Date.now() / 60000)}`;
  const r = await fetch('recent.lite.jsonl' + bust);

  if (!r.ok) {
    if (r.status === 404) {
      document.getElementById('article').innerHTML =
        `<nav class="category-crumb"><a href="#">${t('rc_back_home')}</a></nav>
         <h1>${t('recent')}</h1>
         <p class="category-empty">${t('no_revisions')}</p>`;
      document.body.classList.add('is-home');
      hideSidebar();
      document.getElementById('crumb').textContent = t('recent');
      document.title = `${t('recent')} · ${core.siteName}`;
      document.getElementById('src-info').textContent = 'recent.lite.jsonl';
      window.scrollTo(0, 0);
      return;
    }
    throw new Error('HTTP ' + r.status);
  }

  const text = await r.text();
  const allEntries = text.split('\n').filter(l => l.trim()).map(l => JSON.parse(l));
  const recent = allEntries.slice(-DISPLAY_LIMIT).reverse();

  const totalEntries = recent.length;
  const totalPages   = Math.max(1, Math.ceil(totalEntries / PAGE_SIZE));
  pageNum = Math.min(Math.max(1, pageNum), totalPages);

  const slice = recent.slice((pageNum - 1) * PAGE_SIZE, pageNum * PAGE_SIZE);

  const rows = slice.map(e => {
    const pageLink = `<a href="#${encodeURIComponent(e.page)}">${escapeHtml(e.label || e.page)}</a>`;
    const histLink = `<a href="#?history=${encodeURIComponent(e.page)}">${t('history')}</a>`;
    const revLink  = `<a href="#?revision=${encodeURIComponent(e.page)}&rev=${encodeURIComponent(e.rev_id)}">${escapeHtml(e.rev_id)}</a>`;
    const diffLink = `<a href="#?diff=${encodeURIComponent(e.page)}&rev=${encodeURIComponent(e.rev_id)}">diff</a>`;
    return `<tr>
      <td class="rc-time">${escapeHtml(fmtTimestamp(e.timestamp, core))}</td>
      <td class="rc-page">${pageLink}</td>
      <td class="rc-author">${escapeHtml(_fmtAuthor(e.author))}</td>
      ${sizeCell(e.diff_add ?? null, e.diff_del ?? null)}
      <td class="rc-summary">${escapeHtml(e.summary || '')}</td>
      <td class="rc-rev">${revLink} · ${diffLink} · ${histLink}</td>
    </tr>`;
  }).join('');

  const uniquePages = new Set(recent.map(e => e.page)).size;
  const logNote = allEntries.length > DISPLAY_LIMIT
    ? t('rc_total_clamp').replace('%s', allEntries.length).replace('%s', DISPLAY_LIMIT)
    : '';

  const body = slice.length === 0
    ? `<p class="category-empty">${t('no_revisions')}</p>`
    : `<table class="recent-changes">
        <thead><tr>
          <th>${t('rc_col_time')}</th>
          <th>${t('rc_col_page')}</th>
          <th>${t('rc_col_author')}</th>
          <th>${t('rc_col_size')}</th>
          <th>${t('rc_col_summary')}</th>
          <th>${t('rc_col_revision')}</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      ${totalPages > 1 ? buildPager(pageNum, totalPages, t) : ''}`;

  document.getElementById('article').innerHTML =
    `<nav class="category-crumb"><a href="#">${t('rc_back_home')}</a></nav>
     <h1>${t('recent')} <small class="muted">${t('rc_page_num').replace('%s', pageNum).replace('%s', totalPages)}</small></h1>
     <p class="category-summary">${t('rc_revisions_summary').replace('%s', `<strong>${totalEntries}</strong>`).replace('%s', `<strong>${uniquePages}</strong>`)} ${escapeHtml(logNote)}</p>
     ${body}`;

  document.body.classList.add('is-home');
  hideSidebar();
  document.getElementById('crumb').textContent = t('recent');
  document.title = `${t('recent')} · ${core.siteName}`;
  document.getElementById('src-info').textContent = 'recent.lite.jsonl';
  document.getElementById('broken-info').textContent = '';
  window.scrollTo(0, 0);
}
