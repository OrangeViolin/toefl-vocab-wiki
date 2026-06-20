/* 页面 / 首页 / 404 的 DOM 挂载。
 *
 * 解析逻辑 (frontmatter + MD + wikilink + hook) 全在 parser.js。
 * 本模块只把解析结果填到 DOM，管元数据/导航/状态栏。
 *
 * renderHome 已拆入 plugins/home/index.js，在此 re-export。
 */

import { escapeHtml, TYPE_LABELS, QUALITY_BADGE, hideSidebar } from './util.js';
import { parseMarkdown } from './parser.js';
// home-plugin 已拆至 plugins/home/index.js，保持 re-export 以兼容 router.js 导入路径
export { renderHome } from '../plugins/home/index.js';

// ── renderPage ────────────────────────────────────────────────────────────────

export async function renderPage(core, pid, meta, mdText) {
  document.body.classList.remove('is-home');
  core.stopHeroAnimation?.();

  const { front, html, broken } = await parseMarkdown(core, mdText, { pid, meta });

  const articleEl = document.getElementById('article');
  articleEl.innerHTML = html;
  articleEl.dataset.type = front.type || '';

  await mountInfobox(core, front, meta, pid);
  mountPageMeta(core, articleEl, front, meta, pid);
  mountStatusBar(core, meta, broken);

  window.scrollTo(0, 0);
  document.dispatchEvent(new CustomEvent('wiki:pageRendered', { detail: { pid, meta, front, articleEl } }));
}

async function mountInfobox(core, front, meta, pid) {
  const ibEl = document.getElementById('infobox');
  let content = core.renderInfobox ? await core.renderInfobox(core, front, meta, pid) : null;
  if (content) {
    ibEl.innerHTML = core.pnCitation ? core.pnCitation.expand(content) : content;
    ibEl.hidden = false;
  } else {
    ibEl.innerHTML = '';
    ibEl.hidden = true;
  }
  core.renderSidebar?.(front, ibEl);
}

function mountPageMeta(core, articleEl, front, meta, pid) {
  const label      = front.label || meta.label;
  const siteTitle  = core.siteName;

  // 面包屑
  const quality = front.quality || meta.quality;
  const qScore  = front.quality_score ?? meta.quality_score;
  const QUALITY_KEY = { premium: 'quality_premium', featured: 'quality_featured', standard: 'quality_standard' };
  const qLabel = QUALITY_KEY[quality] ? (core.t?.(QUALITY_KEY[quality]) ?? QUALITY_BADGE[quality]) : null;
  const qBadge = qLabel ? `<span class="page-quality page-quality-${quality}">${qLabel}</span>` : '';
  const qScoreHtml = qScore != null
    ? `<span class="page-quality-score">Q=${qScore}</span>` : '';
  document.getElementById('crumb').innerHTML =
    (TYPE_LABELS[meta.type] || meta.type) + ' / ' + escapeHtml(label) + ' ' + qBadge + qScoreHtml;
  document.title = label + ' · ' + siteTitle;

  // 若正文无 h1，从 label 补一个
  if (!articleEl.querySelector('h1')) {
    const h1 = document.createElement('h1');
    h1.textContent = label;
    articleEl.prepend(h1);
  }

  const h1 = articleEl.querySelector('h1');
  if (h1) injectH1Tabs(core, h1, pid);

  document.getElementById('src-panel')?.remove();
}

export function injectH1Tabs(core, h1, pid) {
  h1.querySelector('.src-tab')?.remove();
  h1.querySelector('.orig-tab')?.remove();
  const mkTab = (href, cls, text) => Object.assign(document.createElement('a'), { href, className: cls, textContent: text });
  h1.appendChild(mkTab(`#?source=${encodeURIComponent(pid)}`,  'src-tab',          core.t?.('source')  ?? 'Source'));
  h1.appendChild(mkTab(`#?history=${encodeURIComponent(pid)}`, 'src-tab hist-tab', core.t?.('history') ?? 'History'));
}

function mountStatusBar(core, meta, broken) {
  const sfLabel = core.t?.('source_file') ?? 'Source';
  document.getElementById('src-info').innerHTML =
    `<a href="pages/${escapeHtml(meta.path)}" class="src-link" target="_blank">${sfLabel}: ${escapeHtml(meta.path)}</a>`;
  const brokenEl = document.getElementById('broken-info');
  if (!broken.length) { brokenEl.textContent = ''; return; }
  const uniq = [...new Set(broken)].sort();
  const blLabel = core.t?.('broken_links') ?? 'Broken';
  brokenEl.innerHTML = ` · ${blLabel} ${uniq.length}：` + uniq.map(b => `<code>${escapeHtml(b)}</code>`).join(' ');
}

// ── renderNotFound ────────────────────────────────────────────────────────────

export function renderNotFound(core, target) {
  const t = core.t?.bind(core) ?? (k => k);
  document.getElementById('article').innerHTML =
    `<h1>${t('page_not_found')}</h1>
     <p>${t('page_not_found_msg').replace('%s', `<code>${escapeHtml(target)}</code>`)}</p>
     <p><a href="#">${t('back_to_home')}</a></p>`;
  hideSidebar();
  document.body.classList.add('is-home');
  document.getElementById('crumb').textContent = t('not_found');
  document.title = t('not_found') + ' · ' + core.siteName;
  document.getElementById('src-info').textContent = '';
  document.getElementById('broken-info').textContent = '';
  core.injectWantButton?.(target);
}
