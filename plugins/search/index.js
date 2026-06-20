/**
 * search — 首页搜索插件
 *
 * 提供：
 *   core.bindHomeSearch(core)   绑定首页 #wiki-search 输入框的搜索逻辑
 *
 * 支持两种模式（由 #fts-toggle 切换）：
 *   - 词条搜索：在注册表中匹配页面名/别名（数据来自内存中的 core.registry）
 *   - 全文检索：从 data/fts-index.json 中检索段落原文
 *
 * 全文检索索引构建（构建期，非运行时）：
 *   python3 wiki/scripts/build_fts_index.py
 *   输入：wiki/public/pages/ 下的章节 Markdown（分桶结构：pages/<bucket>/<page>.md）
 *   输出：site/wiki/data/fts-index.json
 *   何时重跑：章节正文有变动后
 */

import { escapeHtml } from '../../js/util.js';
import { SEARCH_PLACEHOLDER_FTS } from '@wiki/local/config/hero.js';

export default {
  async init(core) {
    core.bindHomeSearch = bindHomeSearch;
  },
};

// ── 词条搜索 ──────────────────────────────────────────────────────────────────

function searchPages(q, registry) {
  const lower = q.toLowerCase();
  const TYPE_PRIO = {
    person: 40, character: 40, civilization: 35, law: 35,
    concept: 30, technology: 25, weapon: 25,
    organization: 20, event: 20, time: 20, place: 15,
    animal: 15, plant: 15,
    book: 10, chapter: 8, quote: 7, overview: 5, list: 5,
    redirect: -20,
  };

  function matchScore(surface) {
    const s = surface.toLowerCase();
    if (s === lower)          return 100;
    if (s.startsWith(lower)) return 70;
    if (s.includes(lower))   return 30;
    return 0;
  }

  const best = new Map();
  function tryMatch(pid, surface) {
    const sc = matchScore(surface);
    if (!sc) return;
    const prev = best.get(pid);
    if (!prev || sc > prev.score) best.set(pid, { surface, score: sc });
  }

  for (const [pid, entry] of Object.entries(registry.pages)) {
    tryMatch(pid, pid);
    if (entry.label) tryMatch(pid, entry.label);
  }
  for (const [alias, pid] of Object.entries(registry.alias_index || {})) {
    tryMatch(pid, alias);
  }

  return [...best.entries()]
    .map(([pid, { surface, score }]) => {
      const entry = registry.pages[pid];
      const typePrio = TYPE_PRIO[entry?.type] ?? 10;
      const refs = entry?.total_refs ?? 0;
      return { pid, entry, matched: surface, _sort: score * 100 + typePrio * 10 + Math.min(refs, 9) };
    })
    .sort((a, b) => b._sort - a._sort)
    .slice(0, 15)
    .map(({ pid, entry, matched }) => ({ pid, entry, matched }));
}

// ── 全文检索 ──────────────────────────────────────────────────────────────────

let ftsIndexPromise = null;
function loadFTSIndex() {
  if (!ftsIndexPromise) ftsIndexPromise = fetch('data/fts-index.json').then(r => r.json());
  return ftsIndexPromise;
}

function searchFTS(q, index) {
  const lower = q.toLowerCase();
  const terms = lower.split(/\s+/).filter(Boolean);
  if (!terms.length) return [];

  const results = [];
  for (const entry of index.entries) {
    const text = entry.x.toLowerCase();
    let allMatch = true, firstPos = -1;
    for (const t of terms) {
      const pos = text.indexOf(t);
      if (pos === -1) { allMatch = false; break; }
      if (firstPos === -1 || pos < firstPos) firstPos = pos;
    }
    if (!allMatch) continue;
    const chap = index.chapters[entry.c];
    results.push({ chapterN: chap.n, chapterId: chap.f, chapterTitle: chap.t, paraId: entry.p, text: entry.x, score: firstPos });
  }
  results.sort((a, b) => a.score - b.score);
  return results.slice(0, 30);
}

function makeFTSSnippet(text, query, radius = 32) {
  const lower = text.toLowerCase();
  const qLower = query.toLowerCase();
  const pos = lower.indexOf(qLower);
  if (pos === -1) return escapeHtml(text.slice(0, 100)) + (text.length > 100 ? '…' : '');
  const start = Math.max(0, pos - radius);
  const end   = Math.min(text.length, pos + qLower.length + radius);
  let s = start > 0 ? '…' : '';
  s += escapeHtml(text.slice(start, pos));
  s += '<mark class="fts-hl">' + escapeHtml(text.slice(pos, pos + qLower.length)) + '</mark>';
  s += escapeHtml(text.slice(pos + qLower.length, end));
  if (end < text.length) s += '…';
  return s;
}

// ── 绑定 ──────────────────────────────────────────────────────────────────────

function bindHomeSearch(core) {
  const t = k => core.t?.(k) ?? k;
  const input     = document.getElementById('wiki-search');
  if (!input) return;
  const resultsEl = document.getElementById('search-results');
  if (!resultsEl) return;
  const ftsToggle = document.getElementById('fts-toggle');

  if (ftsToggle) {
    ftsToggle.addEventListener('change', () => {
      input.placeholder = ftsToggle.checked ? SEARCH_PLACEHOLDER_FTS : input.dataset.defaultPlaceholder || '';
      if (input.value.trim()) input.dispatchEvent(new Event('input'));
    });
    input.dataset.defaultPlaceholder = input.placeholder;
  }

  input.addEventListener('input', () => {
    const q = input.value.trim();
    if (!q) { resultsEl.hidden = true; resultsEl.innerHTML = ''; return; }

    if (ftsToggle && ftsToggle.checked) {
      loadFTSIndex().then(index => {
        const hits = searchFTS(q, index);
        resultsEl.hidden = false;
        if (!hits.length) {
          resultsEl.innerHTML = `<li class="search-empty">${t('search_no_fts_match')}: "${escapeHtml(q)}"</li>`;
          return;
        }
        resultsEl.innerHTML = hits.slice(0, 30).map(h => {
          const chapLabel = h.chapterN <= 0
            ? t('chap_preface')
            : (core.lang === 'zh' || core.lang === 'ja' ? `第${h.chapterN}章` : `Ch.${h.chapterN}`);
          return `<li class="search-result-item fts-item">
            <a href="#${encodeURIComponent(h.chapterId)}?pn=${h.paraId}">
              <span class="fts-chap">${chapLabel}</span>
              <span class="fts-pn">${h.paraId}</span>
              <span class="fts-snip">${makeFTSSnippet(h.text, q)}</span>
              <span class="fts-title">${escapeHtml(h.chapterTitle.replace(/[　 ]+/g, ' '))}</span>
            </a>
          </li>`;
        }).join('') + (hits.length > 30
          ? `<li class="search-result-item fts-all"><a href="search.html?q=${encodeURIComponent(q)}">${t('search_view_all')} (${hits.length})</a></li>`
          : '');
      });
      return;
    }

    const matches = searchPages(q, core.registry);
    resultsEl.hidden = false;
    if (!matches.length) {
      resultsEl.innerHTML = `<li class="search-empty">${t('search_no_match')}: "${escapeHtml(q)}"</li>`;
      return;
    }
    resultsEl.innerHTML = matches.map(m => {
      const altHtml  = m.matched !== m.entry.label ? `<span class="match-alt">[${escapeHtml(m.matched)}]</span>` : '';
      const metaHtml = m.entry.total_refs != null
        ? `<span class="match-meta">${core.lang === 'zh'
            ? `${m.entry.total_refs} 次 / ${m.entry.total_chapters ?? '-'} 篇`
            : `${m.entry.total_refs}× / ${m.entry.total_chapters ?? '-'} ch`
          }</span>` : '';
      return `<li class="search-result-item">
        <a href="#${encodeURIComponent(m.pid)}">
          <span class="match-label">${escapeHtml(m.entry.label)}</span>${altHtml}${metaHtml}
        </a>
      </li>`;
    }).join('');
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      if (ftsToggle && ftsToggle.checked) {
        const q = input.value.trim();
        if (q) window.location.href = 'search.html?q=' + encodeURIComponent(q);
        return;
      }
      const first = resultsEl.querySelector('a');
      if (first) location.hash = first.getAttribute('href').slice(1);
    } else if (e.key === 'Escape') {
      input.value = ''; resultsEl.hidden = true; resultsEl.innerHTML = '';
    }
  });
}
