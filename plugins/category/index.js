/**
 * category — 分类页与全部页面列表插件
 *
 * 在 core 上挂载：
 *   core.renderCategory(core, kind, value)  渲染 #?type= / #?tag= 分类页
 *   core.renderAllPagesList(core)           渲染 Special:AllPages 简单列表（browse 插件降级回退）
 *
 * 拼音首字母映射由 local/config/category.js 的 PINYIN_INITIAL 配置。
 */

import { escapeHtml, TYPE_LABELS, hideSidebar } from '../../js/util.js';

export default {
  init(core, localConfig) {
    const pinyinInitial = localConfig.PINYIN_INITIAL ?? {};

    core.renderCategory = (c, kind, value) =>
      renderCategory(c, kind, value, pinyinInitial);

    core.renderAllPagesList = (c) =>
      renderAllPagesList(c, pinyinInitial);
  },
};

// ── 分类页 ────────────────────────────────────────────────────────────────────

function renderCategory(core, kind, value, pinyinInitial) {
  const t = k => core.t?.(k) ?? k;
  const sortLocale = core.lang === 'zh' ? 'zh' : core.lang === 'ja' ? 'ja' : 'en';
  const pages = core.registry.pages;
  const matches = [];
  for (const [pid, entry] of Object.entries(pages)) {
    if (kind === 'type' && entry.type === value) matches.push({ pid, ...entry });
    else if (kind === 'tag' && (entry.tags || []).includes(value)) matches.push({ pid, ...entry });
  }
  matches.sort((a, b) => {
    const ra = a.total_refs || 0, rb = b.total_refs || 0;
    if (ra !== rb) return rb - ra;
    return a.pid.localeCompare(b.pid, sortLocale);
  });
  const titleKind = kind === 'type' ? t('type_filter') : t('tag_filter');
  const displayValue = kind === 'type' ? (TYPE_LABELS[value] || value) : value;

  const itemsHtml = matches.map((p) => {
    const life = p.lifespan;
    let lifeS = '';
    if (life && life.birth != null && life.death != null) {
      const fmtYr = (yr, c) => yr < 0
        ? (c.lang === 'zh' ? `前 ${-yr}` : `${-yr} BCE`)
        : String(yr);
      const b = fmtYr(life.birth, core);
      const d = fmtYr(life.death, core);
      lifeS = `<span class="cat-life">${b}—${d}</span>`;
    }
    const refLabel = core.lang === 'zh'
      ? `${p.total_refs} 次 / ${p.total_chapters} 篇`
      : `${p.total_refs}× / ${p.total_chapters} ch`;
    const meta = p.total_refs != null ? `<span class="cat-meta">${refLabel}</span>` : '';
    return `<li data-alpha="${getPinyinInitial(p.label, pinyinInitial)}">
      <a href="#${encodeURIComponent(p.pid)}" class="cat-link">${escapeHtml(p.label)}</a>
      ${lifeS}${meta}
    </li>`;
  }).join('');

  const filterBar = matches.length > 100
    ? buildFirstCharBarHtml(matches.map(p => p.label || p.pid), pinyinInitial, t) : '';
  const nPagesLabel = core.lang === 'zh'
    ? `共 ${matches.length} 个页面`
    : core.lang === 'ja' ? `${matches.length} ページ`
    : `${matches.length} page${matches.length !== 1 ? 's' : ''}`;
  const body = matches.length > 0
    ? `<div class="category-filterable">${filterBar}<ol class="category-list">${itemsHtml}</ol></div>`
    : `<p class="category-empty">${t('no_pages_in_cat')}</p>`;

  document.getElementById('article').innerHTML =
    `<nav class="category-crumb"><a href="#">${t('rc_back_home')}</a></nav>
     <h1>${escapeHtml(titleKind)}：${escapeHtml(displayValue)}</h1>
     <p class="category-summary"><strong>${nPagesLabel}</strong></p>
     ${body}`;

  const filterable = document.querySelector('.category-filterable');
  if (filterable) setupFirstCharFilter(filterable);

  document.body.classList.add('is-home');
  hideSidebar();
  document.getElementById('crumb').textContent = `${titleKind}：${displayValue}`;
  document.title = `${titleKind} ${displayValue} · ${core.siteName}`;
  document.getElementById('src-info').textContent = `${kind}=${value}`;
  document.getElementById('broken-info').textContent = '';
  window.scrollTo(0, 0);
}

// ── AllPages 简单列表 ─────────────────────────────────────────────────────────

function renderAllPagesList(core, pinyinInitial) {
  const t2 = k => core.t?.(k) ?? k;
  const sortLocale = core.lang === 'zh' ? 'zh' : core.lang === 'ja' ? 'ja' : 'en';
  const pages = core.registry.pages;
  const entries = Object.entries(pages)
    .filter(([id]) => !id.startsWith('Special:'))
    .map(([id, p]) => ({ id, label: p.label || id, type: p.type || '' }))
    .sort((a, b) => String(a.label).localeCompare(String(b.label), sortLocale));

  const itemsHtml = entries.map(p =>
    `<li data-alpha="${getPinyinInitial(p.label, pinyinInitial)}">
      <a href="#${encodeURIComponent(p.id)}" class="cat-link">${escapeHtml(p.label)}</a>
      ${p.type ? `<span class="cat-meta">${escapeHtml(TYPE_LABELS[p.type] || p.type)}</span>` : ''}
    </li>`
  ).join('');

  const filterBar = entries.length > 100
    ? buildFirstCharBarHtml(entries.map(e => e.label), pinyinInitial, t2) : '';
  const body = `<div class="category-filterable">${filterBar}<ol class="category-list">${itemsHtml}</ol></div>`;

  const nAllLabel = core.lang === 'zh'
    ? `共 ${entries.length} 个页面`
    : core.lang === 'ja' ? `${entries.length} ページ`
    : `${entries.length} page${entries.length !== 1 ? 's' : ''}`;

  document.getElementById('article').innerHTML =
    `<nav class="category-crumb"><a href="#">${t2('rc_back_home')}</a></nav>
     <h1>${t2('all_pages')}</h1>
     <p class="category-summary"><strong>${nAllLabel}</strong></p>
     ${body}`;

  const filterable = document.querySelector('.category-filterable');
  if (filterable) setupFirstCharFilter(filterable);

  document.body.classList.add('is-home');
  hideSidebar();
  document.getElementById('crumb').textContent = t2('all_pages');
  document.title = t2('all_pages') + ' · ' + core.siteName;
  document.getElementById('src-info').textContent = `${entries.length} pages`;
  document.getElementById('broken-info').textContent = '';
  window.scrollTo(0, 0);
}

// ── 拼音首字过滤工具 ──────────────────────────────────────────────────────────

function getPinyinInitial(label, pinyinInitial) {
  const ch = label && label[0];
  if (!ch) return '#';

  // 英文/ASCII：直接取首字母大写
  if (/[A-Za-z]/.test(ch)) return ch.toUpperCase();

  // 数字：归入 '0-9' 桶（显示为 '#'）
  if (/\d/.test(ch)) return '#';

  // 日文假名（平假名 U+3040–U+309F，片假名 U+30A0–U+30FF）：归入 '#'
  // 若未来需要按行段（あ行=A、か行=K 等）排序，可在此扩展
  if (/[぀-ヿ]/.test(ch)) return '#';

  // 中文：查 PINYIN_INITIAL 表
  for (const [letter, chars] of Object.entries(pinyinInitial)) {
    if (chars.includes(ch)) return letter;
  }

  return '#';
}

function buildFirstCharBarHtml(labels, pinyinInitial, t) {
  const counts = {};
  labels.forEach(l => {
    const c = getPinyinInitial(l, pinyinInitial);
    counts[c] = (counts[c] || 0) + 1;
  });
  const hasAlpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').filter(l => counts[l]);
  const hasHash = counts['#'] > 0;
  if (hasAlpha.length <= 2 && !hasHash) return '';
  const allLabel = t?.('firstchar_all') ?? 'All';
  const ariaLabel = t?.('filter_initial') ?? 'Filter by initial';
  const items = [{ char: '*', label: allLabel }];
  hasAlpha.forEach(c => items.push({ char: c, label: c }));
  if (hasHash) items.push({ char: '#', label: '#' });
  const btns = items.map(({ char, label }, i) =>
    `<button class="firstchar-btn${i === 0 ? ' active' : ''}" data-char="${char}">${label}</button>`
  ).join('');
  return `<div class="firstchar-bar" role="group" aria-label="${ariaLabel}">${btns}</div>`;
}

function setupFirstCharFilter(container) {
  const bar = container.querySelector('.firstchar-bar');
  if (!bar) return;
  bar.addEventListener('click', e => {
    const btn = e.target.closest('.firstchar-btn');
    if (!btn) return;
    const ch = btn.dataset.char;
    bar.querySelectorAll('.firstchar-btn').forEach(b => b.classList.toggle('active', b === btn));
    container.querySelectorAll('li[data-alpha]').forEach(li => {
      li.hidden = ch !== '*' && li.dataset.alpha !== ch;
    });
  });
}
