/**
 * browse — 分面浏览器插件
 *
 * 启用后：
 *   • Special:AllPages     → 全库分面浏览
 *   • #?type=X / #?tag=X   → 重定向到 Special:AllPages?type=X（预激活对应分面）
 *
 * 禁用（从 plugins.json 移除）后：
 *   • Special:AllPages 回退为 renderAllPagesList（简单 A-Z 列表）
 *   • Type / Tag 路由 回退为 renderCategory（简单列表）
 *
 * 可配置项（local/config/browse.js）：
 *   TITLE       页面标题，默认 '全部页面'
 *   PAGE_SIZE   每页条数，默认 50
 *   FACETS      分面组定义数组（决定哪些分面显示、顺序、默认开关）
 *               每项: { id, title, open, minCount?, maxCount? }
 *               id 可选值: 'type' | 'tag' | 'quality' | 'book'
 *   TYPE_LABELS 类型显示名覆盖（合并全局定义）
 *   QUALITY_LEVELS  质量级别列表（从高到低）
 *   BOOK_ORDER  书册固定排列顺序（[]则不显示书册分面）
 */

import { escapeHtml, TYPE_LABELS as GLOBAL_TYPE_LABELS, QUALITY_BADGE, hideSidebar } from '../../js/util.js';

export default {
  async init(core, cfg = {}) {
    const t = k => core.t?.(k) ?? k;
    const DEFAULT_FACETS = [
      { id: 'type',    title: t('type'),          open: true  },
      { id: 'tag',     title: t('tags'),           open: true, minCount: 3, maxCount: 30 },
      { id: 'quality', title: t('browse_quality'), open: false },
    ];
    const DEFAULT_QUALITY_LEVELS = [
      ['premium',  t('quality_premium')],
      ['featured', t('quality_featured')],
      ['standard', t('quality_standard')],
      ['basic',    t('quality_basic')],
      ['stub',     t('quality_stub')],
    ];
    const TITLE          = cfg.TITLE          ?? t('all_pages');
    const PAGE_SIZE      = cfg.PAGE_SIZE      ?? 50;
    const FACETS         = cfg.FACETS         ?? DEFAULT_FACETS;
    const QUALITY_LEVELS = cfg.QUALITY_LEVELS ?? DEFAULT_QUALITY_LEVELS;
    const BOOK_ORDER     = cfg.BOOK_ORDER     ?? [];
    const TYPE_LABELS    = { ...GLOBAL_TYPE_LABELS, ...(cfg.TYPE_LABELS ?? {}) };

    const opts = { TITLE, PAGE_SIZE, FACETS, QUALITY_LEVELS, BOOK_ORDER, TYPE_LABELS };

    // Special:AllPages → 全库分面浏览器
    core.registerSpecialPage({
      id: 'Special:AllPages',
      render(c) { renderBrowse(c, opts); },
    });

    // #?type=X 和 #?tag=X → 重定向到分面浏览器（预激活对应分面）
    core.browseCategoryRedirect = (kind, value) => {
      const qs = kind === 'type' ? `type=${encodeURIComponent(value)}` : `tag=${encodeURIComponent(value)}`;
      location.hash = encodeURIComponent('Special:AllPages') + '?' + qs;
    };
  },
};

// ── 分面浏览器主渲染 ─────────────────────────────────────────────────────────

function renderBrowse(core, { TITLE, PAGE_SIZE, FACETS, QUALITY_LEVELS, BOOK_ORDER, TYPE_LABELS }) {
  const t = k => core.t?.(k) ?? k;
  const pages = core.registry.pages;

  const allEntries = Object.entries(pages)
    .filter(([id]) => !id.startsWith('Special:'))
    .map(([id, p]) => ({ id, ...p }));

  // 统计各维度
  const typeCounts    = {};
  const tagCounts     = {};
  const bookCounts    = {};
  const qualityCounts = {};

  for (const p of allEntries) {
    const t = p.type || 'unknown';
    typeCounts[t] = (typeCounts[t] || 0) + 1;
    for (const tag of (p.tags  || [])) tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    for (const bk  of (p.books || [])) bookCounts[bk]  = (bookCounts[bk]  || 0) + 1;
    const q = p.quality || 'stub';
    qualityCounts[q] = (qualityCounts[q] || 0) + 1;
  }

  const orderedTypes = Object.keys(typeCounts).sort((a, b) => typeCounts[b] - typeCounts[a]);
  const orderedBooks = BOOK_ORDER.filter(b => bookCounts[b]);

  // ── URL 状态 ──────────────────────────────────────────────────────
  function getState() {
    const hash = decodeURIComponent(location.hash.slice(1));
    const qi   = hash.indexOf('?');
    const p    = new URLSearchParams(qi >= 0 ? hash.slice(qi + 1) : '');
    return {
      types:  p.getAll('type'),
      books:  p.getAll('book'),
      tags:   p.getAll('tag'),
      qlevel: p.get('q') || '',
      search: p.get('s') || '',
      page:   Math.max(1, parseInt(p.get('page') || '1', 10)),
    };
  }

  function buildHash(s) {
    const p = new URLSearchParams();
    s.types.forEach(t => p.append('type', t));
    s.books.forEach(b => p.append('book', b));
    s.tags.forEach(t  => p.append('tag',  t));
    if (s.qlevel) p.set('q', s.qlevel);
    if (s.search) p.set('s', s.search);
    if (s.page > 1) p.set('page', String(s.page));
    const qs = p.toString();
    return '#' + encodeURIComponent('Special:AllPages') + (qs ? '?' + qs : '');
  }

  // ── 过滤 + 排序 ───────────────────────────────────────────────────
  function applyFilters(s) {
    let r = allEntries;
    if (s.types.length) r = r.filter(p => s.types.includes(p.type || 'unknown'));
    if (s.books.length) r = r.filter(p => s.books.some(b => (p.books || []).includes(b)));
    if (s.tags.length)  r = r.filter(p => s.tags.every(t  => (p.tags  || []).includes(t)));
    if (s.qlevel)       r = r.filter(p => (p.quality || 'stub') === s.qlevel);
    if (s.search) {
      const kw = s.search.toLowerCase();
      r = r.filter(p =>
        p.id.toLowerCase().includes(kw) ||
        (p.label || '').toLowerCase().includes(kw) ||
        (p.aliases || []).some(a => a.toLowerCase().includes(kw))
      );
    }
    return r.slice().sort((a, b) =>
      (b.quality_score || 0) - (a.quality_score || 0) ||
      String(a.label || a.id).localeCompare(String(b.label || b.id), 'zh')
    );
  }

  // ── 分面栏（按 FACETS 配置驱动）──────────────────────────────────
  function renderOneFacet(facet, s) {
    const { id, title, open = true } = facet;

    let items = '';

    if (id === 'type') {
      items = orderedTypes.map(t => {
        const active = s.types.includes(t);
        return `<label class="facet-item${active ? ' active' : ''}">
          <input type="checkbox" data-facet="type" data-val="${escapeHtml(t)}"${active ? ' checked' : ''}>
          <span class="facet-label">${escapeHtml(TYPE_LABELS[t] || t)}</span>
          <span class="facet-count">${typeCounts[t]}</span>
        </label>`;
      }).join('');
      if (!items) return '';
    }

    else if (id === 'tag') {
      const minCount = facet.minCount ?? 3;
      const maxCount = facet.maxCount ?? 30;
      const topTags = Object.entries(tagCounts)
        .filter(([, c]) => c >= minCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, maxCount)
        .map(([t]) => t);
      items = topTags.map(tag => {
        const active = s.tags.includes(tag);
        return `<label class="facet-item${active ? ' active' : ''}">
          <input type="checkbox" data-facet="tag" data-val="${escapeHtml(tag)}"${active ? ' checked' : ''}>
          <span class="facet-label">${escapeHtml(tag)}</span>
          <span class="facet-count">${tagCounts[tag]}</span>
        </label>`;
      }).join('');
      if (!items) return '';
    }

    else if (id === 'quality') {
      items = QUALITY_LEVELS.map(([val, lbl]) =>
        `<label class="facet-item${s.qlevel === val ? ' active' : ''}">
          <input type="radio" name="qlevel" data-facet="q" data-val="${val}"${s.qlevel === val ? ' checked' : ''}>
          <span class="facet-label">${lbl}</span>
          <span class="facet-count">${qualityCounts[val] || 0}</span>
        </label>`
      ).join('');
    }

    else if (id === 'book') {
      if (!orderedBooks.length) return '';
      items = orderedBooks.map(b => {
        const active = s.books.includes(b);
        return `<label class="facet-item${active ? ' active' : ''}">
          <input type="checkbox" data-facet="book" data-val="${escapeHtml(b)}"${active ? ' checked' : ''}>
          <span class="facet-label">${escapeHtml(b)}</span>
          <span class="facet-count">${bookCounts[b]}</span>
        </label>`;
      }).join('');
      if (!items) return '';
    }

    const extraClass = id === 'tag' ? ' facet-tags' : '';
    return `
      <details class="facet-group"${open ? ' open' : ''}>
        <summary class="facet-group-title">${escapeHtml(title)}</summary>
        <div class="facet-items${extraClass}">${items}</div>
      </details>`;
  }

  function renderFacets(s) {
    const groups = FACETS.map(f => renderOneFacet(f, s)).join('');
    return `<aside class="facet-panel">
      <div class="facet-reset-row">
        <strong>${t('browse_filter_title')}</strong>
        <button class="facet-reset-btn" id="facet-reset">${t('browse_clear')}</button>
      </div>
      ${groups}
    </aside>`;
  }

  // ── 结果列表 ──────────────────────────────────────────────────────
  function renderResults(results, s) {
    const total      = results.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const page       = Math.min(s.page, totalPages);
    const slice      = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const items = slice.map(p => {
      const badge = QUALITY_BADGE[p.quality]
        ? `<span class="res-quality res-quality-${p.quality}">${t(QUALITY_BADGE[p.quality])}</span>` : '';
      const score = p.quality_score != null
        ? `<span class="res-score">Q=${p.quality_score}</span>` : '';
      const booksHtml = (p.books || []).map(b =>
        `<span class="res-tag">${escapeHtml(b)}</span>`).join('');
      const desc = p.description
        ? `<div class="res-desc">${escapeHtml(p.description)}</div>` : '';
      return `<li class="res-item">
        <a class="res-title" href="#${encodeURIComponent(p.id)}">${escapeHtml(p.label || p.id)}</a>
        ${desc}
        <div class="res-meta">
          <span class="res-type">${escapeHtml(TYPE_LABELS[p.type] || p.type || '')}</span>
          ${badge}${score}${booksHtml}
        </div>
      </li>`;
    }).join('');

    let pagerHtml = '';
    if (totalPages > 1) {
      const mkLink = (pg, label) =>
        `<a class="pager-btn${pg === page ? ' active' : ''}" href="${buildHash({ ...s, page: pg })}">${label}</a>`;
      const prev = page > 1 ? mkLink(page - 1, '←') : '';
      const next = page < totalPages ? mkLink(page + 1, '→') : '';
      const nums = Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter(n => n <= 2 || n >= totalPages - 1 || Math.abs(n - page) <= 2)
        .reduce((acc, n, i, arr) => {
          if (i > 0 && n - arr[i - 1] > 1) acc.push('…');
          acc.push(n); return acc;
        }, [])
        .map(n => typeof n === 'string' ? `<span class="pager-ellipsis">…</span>` : mkLink(n, n))
        .join('');
      pagerHtml = `<div class="pager">${prev}${nums}${next}</div>`;
    }

    const activeFilters = [
      ...s.types.map(t => TYPE_LABELS[t] || t),
      ...s.books,
      ...s.tags,
      ...(s.qlevel ? [s.qlevel] : []),
      ...(s.search ? [`"${s.search}"`] : []),
    ].join(' · ');

    return `<div class="res-header">
        <span class="res-count">${t('browse_n_pages').replace('%s', `<strong>${total}</strong>`)}${activeFilters ? ' · ' + activeFilters : ''}</span>
      </div>
      <ul class="res-list">${items || `<li class="res-empty">${t('no_results')}</li>`}</ul>
      ${pagerHtml}`;
  }

  // ── 移动端过滤栏 ─────────────────────────────────────────────────
  function renderMobileFilters(s) {
    const typeOptions = [`<option value="">${t('browse_all_types')}</option>`]
      .concat(orderedTypes.map(t =>
        `<option value="${escapeHtml(t)}"${s.types[0] === t ? ' selected' : ''}>${escapeHtml(TYPE_LABELS[t] || t)} (${typeCounts[t]})</option>`
      )).join('');
    const bookOptions = orderedBooks.length
      ? [`<option value="">${t('browse_all_volumes')}</option>`]
          .concat(orderedBooks.map(b =>
            `<option value="${escapeHtml(b)}"${s.books[0] === b ? ' selected' : ''}>${escapeHtml(b)} (${bookCounts[b]})</option>`
          )).join('')
      : '';
    return `
      <div class="ap-mobile-filters">
        <input id="ap-search" class="allpages-search" type="search"
          placeholder="${t('search_placeholder')}" value="${escapeHtml(s.search)}">
        <select id="ap-type-select" class="ap-type-select">${typeOptions}</select>
        ${bookOptions ? `<select id="ap-book-select" class="ap-type-select">${bookOptions}</select>` : ''}
      </div>`;
  }

  // ── 主渲染 ────────────────────────────────────────────────────────
  function render() {
    const s       = getState();
    const results = applyFilters(s);
    const article = document.getElementById('article');
    const isMobile = window.innerWidth < 700;

    if (isMobile) {
      article.innerHTML = `
        <nav class="category-crumb"><a href="#">${t('rc_back_home')}</a></nav>
        <h1>${escapeHtml(TITLE)}</h1>
        <div class="allpages-mobile">
          ${renderMobileFilters(s)}
          <div id="ap-results">${renderResults(results, s)}</div>
        </div>`;
    } else {
      article.innerHTML = `
        <nav class="category-crumb"><a href="#">${t('rc_back_home')}</a></nav>
        <h1>${escapeHtml(TITLE)}</h1>
        <div class="allpages-layout">
          ${renderFacets(s)}
          <div class="allpages-main">
            <div class="allpages-search-row">
              <input id="ap-search" class="allpages-search" type="search"
                placeholder="${t('search_placeholder')}" value="${escapeHtml(s.search)}">
            </div>
            <div id="ap-results">${renderResults(results, s)}</div>
          </div>
        </div>`;
    }

    document.body.classList.add('is-home');
    hideSidebar();
    document.getElementById('crumb').textContent = TITLE;
    document.title = `${TITLE} · ${document.title.split('·').pop().trim()}`;
    document.getElementById('src-info').textContent = core.lang === 'zh'
      ? `共 ${allEntries.length} 页`
      : core.lang === 'ja' ? `${allEntries.length} ページ`
      : `${allEntries.length} pages`;
    document.getElementById('broken-info').textContent = '';
    window.scrollTo(0, 0);

    let timer;
    article.querySelector('#ap-search').addEventListener('input', e => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const ns = getState();
        ns.search = e.target.value.trim();
        ns.page = 1;
        history.replaceState(null, '', buildHash(ns));
        document.getElementById('ap-results').innerHTML = renderResults(applyFilters(ns), ns);
      }, 200);
    });

    if (isMobile) {
      article.querySelector('#ap-type-select')?.addEventListener('change', e => {
        const ns = getState();
        ns.types = e.target.value ? [e.target.value] : [];
        ns.page = 1;
        history.replaceState(null, '', buildHash(ns));
        document.getElementById('ap-results').innerHTML = renderResults(applyFilters(ns), ns);
      });
      article.querySelector('#ap-book-select')?.addEventListener('change', e => {
        const ns = getState();
        ns.books = e.target.value ? [e.target.value] : [];
        ns.page = 1;
        history.replaceState(null, '', buildHash(ns));
        document.getElementById('ap-results').innerHTML = renderResults(applyFilters(ns), ns);
      });
    } else {
      article.querySelectorAll('input[data-facet]').forEach(cb => {
        cb.addEventListener('change', () => {
          const ns = getState();
          const { facet, val } = cb.dataset;
          if (facet === 'type') {
            ns.types = cb.checked ? [...new Set([...ns.types, val])] : ns.types.filter(t => t !== val);
          } else if (facet === 'book') {
            ns.books = cb.checked ? [...new Set([...ns.books, val])] : ns.books.filter(b => b !== val);
          } else if (facet === 'tag') {
            ns.tags = cb.checked ? [...new Set([...ns.tags, val])] : ns.tags.filter(t => t !== val);
          } else if (facet === 'q') {
            ns.qlevel = cb.checked ? val : '';
          }
          ns.page = 1;
          history.replaceState(null, '', buildHash(ns));
          document.getElementById('ap-results').innerHTML = renderResults(applyFilters(ns), ns);
          article.querySelectorAll('.facet-item').forEach(lbl => {
            const inp = lbl.querySelector('input');
            lbl.classList.toggle('active', !!(inp && inp.checked));
          });
        });
      });

      article.querySelector('#facet-reset')?.addEventListener('click', () => {
        history.replaceState(null, '', buildHash({ types: [], books: [], tags: [], qlevel: '', search: '', page: 1 }));
        render();
      });
    }
  }

  render();
}
