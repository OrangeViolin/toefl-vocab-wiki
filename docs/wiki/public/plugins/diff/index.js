/**
 * diff — 版本差异插件
 *
 * 提供一个视图：
 *   #?diff=<page>&rev=<id>    与上版行级 diff
 *
 * 启用后在 core 上挂载：
 *   core.renderDiff(core, page, revId)
 *
 * 数据依赖：
 *   recent.diff.jsonl          快速路径（page + rev_id + diff chunks）
 *   history/<bucket>/<page>.jsonl   完整路径（元数据 + content，用于降级计算）
 *
 * CSS 定义在 css/main.css（.diff-* 系列选择器）。
 */

import { escapeHtml, hideSidebar, historyAll, _historyBucket } from '../../js/util.js';
import { reconstructContentV2, resolveLineHash } from '../recent/line-resolver.js';

export default {
  async init(core) {
    core.renderDiff = (c, page, revId) => renderDiff(c, page, revId);
  },
};

// ── renderDiff ────────────────────────────────────────────────────────────────

async function renderDiff(core, page, revId) {
  const t = k => core.t?.(k) ?? k;
  let chunks  = null;
  let curMeta = null;
  let source  = `recent.diff.jsonl`;

  try {
    const rr = await fetch('recent.diff.jsonl');
    if (rr.ok) {
      const lines = (await rr.text()).split('\n').filter(l => l.trim());
      for (let i = lines.length - 1; i >= 0; i--) {
        const e = JSON.parse(lines[i]);
        if (e.page === page && e.rev_id === revId) {
          if (e.diff) {
            // v2 compact format: lines are base62 hashes; legacy format: raw text
            const HASH_PAT = /^[0-9a-zA-Z]{6,16}$/;
            const firstLine = e.diff[0]?.[1] ?? '';
            if (e.diff.length > 0 && HASH_PAT.test(firstLine) && !firstLine.includes(' ')) {
              // hash format — resolve asynchronously; skip lines whose hash can't be resolved
              const resolved = await Promise.all(
                e.diff.map(async ([op, h]) => {
                  const line = await resolveLineHash(h);
                  return { type: op === '+' ? 'add' : 'del', line: line || ' ' };
                })
              );
              chunks = resolved.filter(Boolean);
            } else {
              chunks = e.diff.map(([op, line]) => ({
                type: op === '+' ? 'add' : op === '-' ? 'del' : 'same', line,
              }));
            }
            // recent.diff.jsonl strips 'same' entries — without them
            // renderDiffChunks pairs unrelated del/add for char-level diff.
            // Fall through to full LCS reconstruction from history.
            if (chunks && chunks.every(c => c.type !== 'same')) chunks = null;
          }
          curMeta = e;
          break;
        }
      }
    }
  } catch (_) {}

  // recent.diff.jsonl 可能只含 diff 字段而缺少 timestamp/author/parent_rev；
  // 此时仍需从 history 文件补全元数据，同时保留已有的 diff chunks。
  const needMeta = !curMeta || !curMeta.timestamp || !curMeta.author;

  if (!chunks || needMeta) {
    const _bkt = _historyBucket(page, core.registry);
    source = _bkt ? `history/${_bkt}/${page}.jsonl` : `history/${page}.jsonl`;
    const allRevs = await historyAll(page, core.registry);  // ascending (oldest first)
    const matchId = x => (x.rev_id || x.id) === revId;
    const cur = allRevs.find(matchId);
    if (!cur) throw new Error(`rev not found: ${revId}`);
    curMeta = cur;
    if (!chunks || chunks.length === 0) {
      if (cur.v === 2) {
        const parentId = cur.parent;
        const curContent    = await reconstructContentV2(allRevs, revId);
        const prevContent   = parentId ? await reconstructContentV2(allRevs, parentId) : '';
        chunks = computeLineDiff(prevContent, curContent);
      } else {
        let prevContent = '';
        const parentId = cur.parent_rev;
        if (parentId) {
          const prevRev = allRevs.find(x => (x.rev_id || x.id) === parentId);
          if (prevRev) prevContent = prevRev.content || '';
        }
        chunks = computeLineDiff(prevContent, cur.content || '');
      }
    }
  }

  // Normalize v2 field names for display
  if (curMeta.v === 2) {
    curMeta = {
      ...curMeta,
      rev_id:     curMeta.id,
      timestamp:  new Date(curMeta.ts * 1000).toISOString(),
      author:     curMeta.au,
      summary:    curMeta.summary || '',  // resolved or empty; full resolve not done here
      parent_rev: curMeta.parent,
    };
  }

  const diffHtml = renderDiffChunks(chunks);

  const header = `<nav class="category-crumb">
    <a href="#${encodeURIComponent(page)}">← ${escapeHtml(page)}</a>
    <span class="sep">·</span>
    <a href="#?history=${encodeURIComponent(page)}">${t('diff_all_revisions')}</a>
    <span class="sep">·</span>
    <a href="#?revision=${encodeURIComponent(page)}&rev=${encodeURIComponent(revId)}">${t('diff_view_rev')}</a>
  </nav>`;

  const parentInfo = curMeta.parent_rev
    ? `<div><strong>${t('diff_prev_rev')}:</strong> <code>${escapeHtml(curMeta.parent_rev)}</code></div>`
    : `<div><em>${t('diff_first_version')}</em></div>`;

  const meta = `<div class="diff-meta">
    <div><strong>${t('diff_cur_rev')}:</strong> <code>${escapeHtml(revId)}</code> · ${escapeHtml(fmtTimestamp(curMeta.timestamp, core))} · ${escapeHtml(curMeta.author)}</div>
    ${parentInfo}
    <div class="diff-summary">
      <span class="diff-added">+${chunks.filter(c => c.type === 'add').length}</span>
      ·
      <span class="diff-removed">-${chunks.filter(c => c.type === 'del').length}</span>
      · ${t('rc_col_summary')}: <em>${escapeHtml(curMeta.summary || t('diff_no_summary'))}</em>
    </div>
  </div>`;

  document.getElementById('article').innerHTML = header +
    `<h1>${t('diff_title')} <small class="muted">${escapeHtml(page)}</small></h1>` +
    meta + `<div class="diff-body">${diffHtml}</div>`;

  hideSidebar();
  document.body.classList.add('is-home');
  document.getElementById('crumb').textContent = `${page} diff ${revId}`;
  document.title = `${page} diff · ${core.siteName}`;
  document.getElementById('src-info').textContent = `${source} (diff ${revId} vs ${curMeta.parent_rev || 'null'})`;
  document.getElementById('broken-info').textContent = '';
  window.scrollTo(0, 0);
}

// ── 辅助：时间格式化 ──────────────────────────────────────────────────────────

function fmtTimestamp(iso, core) {
  // 优先使用 timezone 插件的格式化
  if (core?.timezone?.format) {
    return core.timezone.format(iso, { format: 'full' });
  }
  try {
    const d = new Date(iso);
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
           `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch (_) { return iso || ''; }
}

// ── 行级 LCS diff ─────────────────────────────────────────────────────────────

function computeLineDiff(oldText, newText) {
  const o = oldText.split('\n');
  const n = newText.split('\n');
  const m = o.length, nn = n.length;
  const dp = Array(m + 1).fill(null).map(() => new Int32Array(nn + 1));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= nn; j++) {
      dp[i][j] = o[i - 1] === n[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  const res = [];
  let i = m, j = nn;
  while (i > 0 && j > 0) {
    if (o[i - 1] === n[j - 1]) { res.push({ type: 'same', line: o[i - 1] }); i--; j--; }
    else if (dp[i - 1][j] >= dp[i][j - 1]) { res.push({ type: 'del', line: o[i - 1] }); i--; }
    else { res.push({ type: 'add', line: n[j - 1] }); j--; }
  }
  while (i > 0) { res.push({ type: 'del', line: o[i - 1] }); i--; }
  while (j > 0) { res.push({ type: 'add', line: n[j - 1] }); j--; }
  return res.reverse();
}

function renderDiffChunks(chunks) {
  // Pair up adjacent del/add runs for inline char-level highlighting.
  // LCS backtracking may produce del/add in any order within a change block,
  // so collect the entire contiguous non-same run first, then separate.
  const items = [];
  let i = 0;
  while (i < chunks.length) {
    if (chunks[i].type === 'same') {
      items.push(chunks[i]);
      i++;
      continue;
    }
    const dels = [], adds = [];
    while (i < chunks.length && chunks[i].type !== 'same') {
      if (chunks[i].type === 'del') dels.push(chunks[i].line);
      else                          adds.push(chunks[i].line);
      i++;
    }
    const pairs = Math.min(dels.length, adds.length);
    for (let k = 0; k < pairs; k++) {
      const cd = computeCharDiff(dels[k], adds[k]);
      items.push({ type: 'del', line: dels[k], parts: cd?.del ?? null });
      items.push({ type: 'add', line: adds[k], parts: cd?.add ?? null });
    }
    for (let k = pairs; k < dels.length; k++) items.push({ type: 'del', line: dels[k], parts: null });
    for (let k = pairs; k < adds.length; k++) items.push({ type: 'add', line: adds[k], parts: null });
  }

  const sign = { same: ' ', add: '+', del: '-' };
  return items.map(c => {
    const cls = 'diff-line diff-' + c.type;
    const textHtml = c.parts?.length ? renderInlineParts(c.parts) : escapeHtml(c.line);
    return `<div class="${cls}"><span class="diff-sign">${sign[c.type]}</span><span class="diff-text">${textHtml}</span></div>`;
  }).join('');
}

// ── 词/字符级 tokenizer ───────────────────────────────────────────────────────
// CJK 字符逐字拆分，非 CJK 按单词（含标点）拆分，保留空白为独立 token。

const CJK_RE = /[\u4e00-\u9fff\u3400-\u4dbf\u3000-\u303f\uf900-\ufaff\uff00-\uffef]/;

function tokenizeLine(str) {
  const tokens = [];
  let i = 0;
  while (i < str.length) {
    if (CJK_RE.test(str[i])) {
      tokens.push(str[i]);
      i++;
    } else {
      let j = i;
      while (j < str.length && !CJK_RE.test(str[j])) j++;
      const parts = str.slice(i, j).match(/\S+|\s+/g) || [];
      tokens.push(...parts);
      i = j;
    }
  }
  return tokens;
}

// ── 词/字符级 LCS diff ────────────────────────────────────────────────────────

function computeCharDiff(oldLine, newLine) {
  const o = tokenizeLine(oldLine), n = tokenizeLine(newLine);
  const m = o.length, nn = n.length;
  if (m * nn > 4000000) return null; // skip for extremely long lines (>~2000 chars each)
  const dp = Array(m + 1).fill(null).map(() => new Int32Array(nn + 1));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= nn; j++)
      dp[i][j] = o[i-1] === n[j-1] ? dp[i-1][j-1] + 1 : Math.max(dp[i-1][j], dp[i][j-1]);
  const del = [], add = [];
  let i = m, j = nn;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && o[i-1] === n[j-1]) {
      del.unshift({ ch: o[i-1], changed: false });
      add.unshift({ ch: n[j-1], changed: false });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j-1] >= dp[i-1][j])) {
      add.unshift({ ch: n[j-1], changed: true }); j--;
    } else {
      del.unshift({ ch: o[i-1], changed: true }); i--;
    }
  }
  return { del, add };
}

function renderInlineParts(parts) {
  let html = '', k = 0;
  while (k < parts.length) {
    const changed = parts[k].changed;
    let text = '';
    while (k < parts.length && parts[k].changed === changed) text += parts[k++].ch;
    html += changed
      ? `<span class="diff-char">${escapeHtml(text)}</span>`
      : escapeHtml(text);
  }
  return html;
}
