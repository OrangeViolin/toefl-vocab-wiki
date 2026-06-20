/* home-plugin — 首页渲染
 *
 * 从 renderer.js 拆出的独立插件。
 * 在 plugins.json 中声明为 core: true，随核心一起加载。
 */

import { escapeHtml, TYPE_LABELS, hideSidebar } from '../../js/util.js';
import { BOOK_META, BOOK_DISPLAY } from '@wiki/local/config/hero.js';
import { CORE_FEATURED, PREFACE_IDS, APPENDIX_IDS, HOME_SECTIONS, SKIP_TYPES } from '@wiki/local/config/home.js';

const QUALITY_RANK = { premium: 1000, featured: 500, standard: 100, basic: 10, stub: 0 };

function init(core) {
  core.renderHome = renderHome;
  core.buildHeroHtml ??= () => '';
  core.startHeroAnimation ??= () => {};
  core.stopHeroAnimation ??= () => {};
  core.bindHomeSearch ??= () => {};
  console.log('[home] loaded');
}

export default { init };

// ── renderHome ────────────────────────────────────────────────────────────────

export async function renderHome(core) {
  // 首页精选卡片需要 featured/quality 全量字段，等待完整注册表加载
  if (core.fullRegistryReady) await core.fullRegistryReady;

  const { bookCardsHtml, sections, entityCount, totalPages } = buildHomeSections(core.registry.pages);

  const article      = document.getElementById('article');
  const existingBody = article.querySelector('.wiki-home > .home-body');
  const hasHero      = article.querySelector('.home-hero');

  const t = k => core.t?.(k) ?? k;

  if (existingBody && hasHero) {
    const countEl = article.querySelector('.hero-count');
    if (countEl) countEl.textContent = `${totalPages} ${t('all_pages').toLowerCase()} · ${entityCount} ${t('hero_entries')}`;
    existingBody.innerHTML = buildHomeBodyHtml(bookCardsHtml, sections, totalPages, t);
  } else {
    const heroHtml = core.buildHeroHtml?.(entityCount, totalPages) ?? '';
    article.innerHTML = `<div class="wiki-home">
      ${heroHtml}
      <div class="home-body">${buildHomeBodyHtml(bookCardsHtml, sections, totalPages, t)}</div>
    </div>`;
    document.body.classList.add('is-home');
    hideSidebar();
    document.getElementById('crumb').textContent = t('home');
    document.title = core.siteName || document.title;
    core.startHeroAnimation?.();
  }

  // src-info 由 renderer.js/mountStatusBar 管理
  document.getElementById('broken-info').textContent = '';
  core.bindHomeSearch?.(core);

  // 首页底部插入知识量面板（异步，不阻塞首屏）
  injectKPanel(core);
}

// ── 首页数据构建 ───────────────────────────────────────────────────────────────

function buildHomeSections(pages) {
  const ids      = Object.keys(pages);
  const allPages = ids.map(id => ({ id, ...pages[id] }));
  const scoreOf  = p => (QUALITY_RANK[p.quality] || 0) + (p.quality_score || 0) + (p.featured ? 500 : 0);

  const candidates = allPages
    .filter(p => !SKIP_TYPES.has(p.type || ''))
    .filter(p => p.featured || (p.quality || 'stub') !== 'stub')
    .sort((a, b) => scoreOf(b) - scoreOf(a));

  // CORE_FEATURED 精选列表（来自 local config），供 featuredOnly 区使用
  const coreFeaturedIds = new Set(CORE_FEATURED);
  const coreFeatured    = candidates.filter(p => coreFeaturedIds.has(p.id));
  const normal          = candidates.filter(p => !coreFeaturedIds.has(p.id));

  const sections = HOME_SECTIONS.flatMap(sec => {
    let pool = sec.featuredOnly ? coreFeatured : normal;
    // 兼容 types（数组）和 type（字符串）两种 home.js 配置写法
    const typeFilter = sec.types || (sec.type ? [sec.type] : null);
    if (typeFilter) pool = pool.filter(p => typeFilter.includes(p.type || ''));
    if (sec.requireImage) pool = pool.filter(p => p.image || p.img);
    // ids: 显式按 id 数组筛选并保持给定顺序（RFC-liangjing-0025）
    if (Array.isArray(sec.ids) && sec.ids.length) {
      const byId = new Map(pool.map(p => [p.id, p]));
      pool = sec.ids.map(id => byId.get(id)).filter(Boolean);
    }
    if (!pool.length) return [];
    const items = pool.slice(0, sec.limit ?? 10);
    // typeLink: 供首页分类标题链接到分面浏览器
    const typeLink = sec.type || (Array.isArray(sec.types) ? sec.types[0] : null);
    // 兼容 title 和 label 两种字段名
    return [{ title: sec.title ?? sec.label, subtitle: sec.subtitle, cardsHtml: items.map(renderFeaturedCard).join(''), typeLink }];
  });

  return {
    bookCardsHtml: BOOK_DISPLAY !== 'card'
      ? renderBookStrip(pages)
      : BOOK_META.map(m => renderBookCard(m, pages)).join(''),
    sections,
    entityCount: allPages.filter(p => !SKIP_TYPES.has(p.type || '')).length,
    totalPages: ids.length,
  };
}

// ── 首页 HTML 模板 ────────────────────────────────────────────────────────────

function buildHomeBodyHtml(bookCardsHtml, sections, totalPages, t = k => k) {
  const sectionHtml = sections.map(({ title, subtitle, cardsHtml, typeLink }) => {
    if (!cardsHtml) return '';
    const subHtml = subtitle ? `<span class="home-section-sub">${escapeHtml(subtitle)}</span>` : '';
    const titleHtml = typeLink
      ? `<a class="home-section-link" href="#${encodeURIComponent('Special:AllPages')}?type=${encodeURIComponent(typeLink)}"><h2 class="home-section-title">${escapeHtml(title)}</h2></a>`
      : `<h2 class="home-section-title">${escapeHtml(title)}</h2>`;
    return `<div class="home-section-header">
        ${titleHtml}
        ${subHtml}
      </div>
      <div class="featured-grid">${cardsHtml}</div>`;
  }).join('');

  return `<div class="home-books">${bookCardsHtml}</div>
    ${sectionHtml}
    <nav class="home-links">
      <a href="#${encodeURIComponent('Special:AllPages')}" class="home-link">${t('all_pages')} (${totalPages}) →</a>
      <a href="#${encodeURIComponent('Special:Recent')}"   class="home-link">${t('home_more_recent')}</a>
      <a href="#${encodeURIComponent('Special:Random')}"   class="home-link">${t('home_random')}</a>
    </nav>
    `;
}

function renderBookStrip(pages) {
  const prefaceHtml = PREFACE_IDS.filter(id => pages[id]).map(id =>
    `<a class="bc-chap bc-chap--pre" href="#${encodeURIComponent(id)}" title="${escapeHtml(pages[id].label || id)}">${escapeHtml(chipLabel(pages[id].label || id))}</a>`
  ).join('');

  const chapListHtml = Object.entries(pages)
    .filter(([id, m]) => m.type === 'chapter' && (m.chapter != null || /^\w+-\d{3,8}$/.test(id)))
    .sort(([ida], [idb]) => {
      const na = +(ida.split('-')[1] || 0);
      const nb = +(idb.split('-')[1] || 0);
      return na - nb;
    })
    .map(([id, m]) => {
      const n   = +(m.chapter ?? id.split('-')[1] ?? 0);
      const tip = (m.description || '').replace(/^第\d+章[：:]?\s*/, '');
      const lbl = m.year ? String(m.year) : (/^第\d+章/.test(id) ? `第${n}章` : `Ch.${n}`);
      return `<a class="bc-chap" href="#${encodeURIComponent(id)}" title="${escapeHtml(tip)}">${lbl}</a>`;
    }).join('');

  const appendixHtml = APPENDIX_IDS.filter(id => pages[id]).map(id =>
    `<a class="bc-chap bc-chap--app" href="#${encodeURIComponent(id)}" title="${escapeHtml(pages[id].label || id)}">${escapeHtml(chipLabel(pages[id].label || id))}</a>`
  ).join('');

  return `<div class="book-card"><div class="bc-body"><div class="bc-chapters">${prefaceHtml}${chapListHtml}${appendixHtml}</div></div></div>`;
}

function chipLabel(label, max = 10) {
  return label.length > max ? label.slice(0, max) + '…' : label;
}

function renderBookCard({ label, subtitle, min, max, volume }, pages) {
  const chapters = Object.entries(pages)
    .filter(([id, m]) => {
      if (m.type !== 'chapter') return false;
      if (volume) {
        const re = new RegExp(`^${volume}-\\d{3,8}$`);
        return re.test(id) && m.chapter != null && +m.chapter >= min && +m.chapter <= max;
      }
      return m.chapter != null && +m.chapter >= min && +m.chapter <= max;
    })
    .sort(([, a], [, b]) => +a.chapter - +b.chapter);

  const CHAPTER_LIMIT = 20;
  const hasMore       = chapters.length > CHAPTER_LIMIT;
  if (hasMore) chapters.length = CHAPTER_LIMIT;

  const firstId = chapters[0]?.[0] ?? null;
  const href    = firstId ? `#${encodeURIComponent(firstId)}` : '#';

  const prefaceHtml = PREFACE_IDS.filter(id => pages[id]).map(id =>
    `<a class="bc-chap bc-chap--pre" href="#${encodeURIComponent(id)}" title="${escapeHtml(pages[id].label || id)}">${escapeHtml(chipLabel(pages[id].label || id))}</a>`
  ).join('');

  const chapListHtml = chapters.map(([id, m]) => {
    const n   = +m.chapter;
    const lbl = /^第\d+章/.test(id) ? `第${n}章` : `Ch.${n}`;
    const tip = (m.description || '').replace(/^第\d+章[：:]?\s*/, '');
    return `<a class="bc-chap" href="#${encodeURIComponent(id)}" title="${escapeHtml(tip)}">${lbl}</a>`;
  }).join('') + (hasMore ? `<a class="bc-chap bc-chap--more" href="${href}" title="完整目录">…</a>` : '');

  const appendixHtml = APPENDIX_IDS.filter(id => pages[id]).map(id =>
    `<a class="bc-chap bc-chap--app" href="#${encodeURIComponent(id)}" title="${escapeHtml(pages[id].label || id)}">${escapeHtml(chipLabel(pages[id].label || id))}</a>`
  ).join('');

  return `<div class="book-card">
    <a class="bc-icon" href="${href}" aria-label="${escapeHtml(label)}">AI</a>
    <div class="bc-body">
      <div class="bc-head">
        <a class="bc-title" href="${href}">${escapeHtml(label)}</a>
        <span class="bc-sub">${escapeHtml(subtitle)}</span>
      </div>
      <div class="bc-chapters">${prefaceHtml}${chapListHtml}${appendixHtml}</div>
    </div>
  </div>`;
}

// ── 知识量面板（k-panel）────────────────────────────────────────────────────────

async function injectKPanel(core) {
  try {
    const [latestResp, timelineResp] = await Promise.all([
      fetch('data/knowledge_latest.json'),
      fetch('data/knowledge_timeline.jsonl'),
    ]);
    if (!latestResp.ok) return;
    const latest = await latestResp.json();

    // timeline → sparkline (last 30)
    let timeline = [];
    if (timelineResp.ok) {
      const text = await timelineResp.text();
      timeline = text.trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
    }
    const entries = timeline.slice(-30);
    const kValues = entries.map(e => e.K);
    const maxK = Math.max(...kValues);
    const minK = Math.min(...kValues);
    const range = maxK - minK || 1;
    const W = 120, H = 28, pad = 2;
    const points = kValues.map((k, i) => {
      const x = pad + (i / (kValues.length - 1 || 1)) * (W - 2 * pad);
      const y = H - pad - ((k - minK) / range) * (H - 2 * pad);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    const sparkline = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"><polyline fill="none" stroke="var(--accent)" stroke-width="1.5" points="${points}"/></svg>`;

    // top-5 by quality_score
    const pages = core.registry.pages;
    const top5 = Object.entries(pages)
      .filter(([, p]) => p.type !== 'chapter' && (p.quality_score || 0) > 0)
      .sort(([, a], [, b]) => (b.quality_score || 0) - (a.quality_score || 0))
      .slice(0, 5)
      .map(([id, p]) => `<a href="#${encodeURIComponent(id)}">${escapeHtml(p.label || id)}</a>`)
      .join(' ');

    const kb = latest.total_bytes ? (latest.total_bytes / 1024).toFixed(1) : '?';
    const pct = latest.link_hit_rate != null ? (latest.link_hit_rate * 100).toFixed(1) : '?';
    const premium = latest.quality_counts?.premium ?? '?';

    const t = k => core.t?.(k) ?? k;
    const title = t('sp_statistics') === 'sp_statistics' ? '知识量' : t('sp_statistics');

    const panel = document.createElement('div');
    panel.id = 'k-panel';
    panel.className = 'k-panel';
    panel.innerHTML = `
      <h3>
        <a href="#Special:Statistics" class="k-title-link">${escapeHtml(title)}</a>
        ${sparkline}
      </h3>
      <div class="k-row">
        <span>${latest.page_count ?? '?'} ${t('kpanel_pages')}</span>
        <span>${premium} ${t('kpanel_premium')}</span>
        <span>${t('kpanel_link_hit')} ${pct}%</span>
        <span>${kb} KB</span>
      </div>
      <div class="k-row k-top">${t('kpanel_top')}: ${top5}</div>
      <div class="k-row muted">${t('kpanel_snapshot')}: ${latest.generated ?? ''}</div>
    `;

    const homeBody = document.querySelector('.home-body');
    if (homeBody) homeBody.appendChild(panel);
  } catch (_e) {
    // k-panel 非关键组件，静默失败
  }
}

function renderFeaturedCard(p) {
  const typeLabel    = TYPE_LABELS[p.type] || p.type || '';
  const qualityClass = p.quality ? ` card-q-${p.quality}` : '';
  const typeClass    = p.type    ? ` card-t-${p.type}`    : '';
  const eyebrow      = typeLabel     ? `<div class="card-eyebrow">${escapeHtml(typeLabel)}</div>`                                                    : '';
  const imgHtml      = p.image       ? `<div class="card-thumb"><img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.label)}" loading="lazy"></div>` : '';
  const descHtml     = p.description ? `<div class="card-desc">${escapeHtml(p.description)}</div>`                                                   : '';
  return `<a class="featured-card entity-card${qualityClass}${typeClass}" href="#${encodeURIComponent(p.id)}">
    ${imgHtml}<div class="card-header"><h3>${escapeHtml(p.label)}</h3>${eyebrow}</div>${descHtml}
  </a>`;
}
