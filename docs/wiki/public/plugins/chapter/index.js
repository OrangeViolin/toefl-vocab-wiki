/**
 * chapter — 章节阅读增强插件
 *
 * 监听 wiki:pageRendered 事件：
 *   - 所有页面：注入阅读进度条
 *   - 章节页（type === 'chapter'）：
 *       对话高亮、诗词检测、对话续段缩进、前后章导航
 */

import { escapeHtml } from '../../js/util.js';

export default {
  init(core, localConfig) {
    const defaultBookLabel = localConfig.DEFAULT_BOOK_LABEL ?? '';
    const tocPageId = localConfig.TOC_PAGE_ID ?? '_TOC_';

    document.addEventListener('wiki:pageRendered', ({ detail }) => {
      const { pid, meta, articleEl } = detail;

      setupReadingProgress();

      if (meta?.type === 'chapter') {
        highlightDialog(articleEl);
        detectPoemsInChapter(articleEl);
        indentDialogueContinuation(articleEl);
        injectChapterNav(core, pid, meta, defaultBookLabel, tocPageId);
      }
    });
  },
};

// ── 阅读进度条 ────────────────────────────────────────────────────────────────

let _progressBar = null;
function setupReadingProgress() {
  if (!_progressBar) {
    _progressBar = document.createElement('div');
    _progressBar.className = 'reading-progress';
    _progressBar.id = 'reading-progress';
    document.body.prepend(_progressBar);
  }

  const update = () => {
    if (document.body.classList.contains('is-home')) {
      _progressBar.style.width = '0%';
      return;
    }
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? Math.min(scrollTop / docHeight * 100, 100) : 0;
    _progressBar.style.width = progress + '%';
  };

  if (!_progressBar._bound) {
    window.addEventListener('scroll', update, { passive: true });
    _progressBar._bound = true;
  }
  update();
}

// ── 前后章导航 ────────────────────────────────────────────────────────────────

function injectChapterNav(core, pid, meta, defaultBookLabel, tocPageId = '目录') {
  const t = k => core.t?.(k) ?? k;
  const pages = core.registry.pages;
  const book = meta.book;
  const siblings = Object.entries(pages)
    .filter(([, m]) => m.type === 'chapter' && m.book === book)
    .sort(([, a], [, b]) => (a.book_seq ?? a.chapter ?? 0) - (b.book_seq ?? b.chapter ?? 0));

  const idx = siblings.findIndex(([id]) => id === pid);
  const prev = idx > 0 ? siblings[idx - 1] : null;
  const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;

  const bookLabel = book || defaultBookLabel;

  const prevHtml = prev
    ? `<a class="chapnav-prev" href="#${encodeURIComponent(prev[0])}">← ${escapeHtml(prev[1].label)}</a>`
    : `<span class="chapnav-prev chapnav-disabled">← ${t('chap_first')}</span>`;
  const nextHtml = next
    ? `<a class="chapnav-next" href="#${encodeURIComponent(next[0])}">${escapeHtml(next[1].label)} →</a>`
    : `<span class="chapnav-next chapnav-disabled">${t('chap_last')} →</span>`;
  const tocHtml = `<a class="chapnav-toc" href="#${encodeURIComponent(tocPageId)}">↑ ${escapeHtml(bookLabel)} ${t('chap_back_toc')}</a>`;

  const nav = document.createElement('nav');
  nav.className = 'chapnav';
  nav.innerHTML = prevHtml + tocHtml + nextHtml;

  const article = document.getElementById('article');
  const h1 = article.querySelector('h1');
  if (h1) h1.after(nav.cloneNode(true));
  article.appendChild(nav);
}

// ── 对话高亮 ──────────────────────────────────────────────────────────────────

function highlightDialog(articleEl) {
  const paragraphs = articleEl.querySelectorAll('p');
  for (const p of paragraphs) {
    if (!p.innerHTML.includes('「')) continue;

    let html = p.innerHTML;
    let result = '';
    let depth = 0;
    let last = 0;

    for (let i = 0; i < html.length; i++) {
      if (html[i] === '「') {
        if (depth === 0) { result += html.slice(last, i); last = i; }
        depth++;
      } else if (html[i] === '」') {
        if (depth > 0) depth--;
        if (depth === 0) {
          result += '「<span class="dialog-text">' + html.slice(last + 1, i) + '</span>」';
          last = i + 1;
        }
      }
    }
    if (last < html.length) result += html.slice(last);
    if (result !== html) p.innerHTML = result;
  }
}

// ── 诗词检测 ──────────────────────────────────────────────────────────────────

function detectPoemsInChapter(articleEl) {
  const paragraphs = articleEl.querySelectorAll('p[id^="pn-"]');
  if (paragraphs.length < 3) return;

  const bodyText = (p) => {
    const label = p.querySelector('.pn-label');
    return label ? p.textContent.replace(label.textContent, '').trim() : p.textContent.trim();
  };

  // 模式 1：3+ 连续短行
  const SHORT = 50;
  const runs = [];
  let start = -1;
  for (let i = 0; i < paragraphs.length; i++) {
    const len = bodyText(paragraphs[i]).length;
    if (len >= 3 && len <= SHORT) {
      if (start === -1) start = i;
    } else {
      if (start >= 0 && i - start >= 3) runs.push([start, i]);
      start = -1;
    }
  }
  if (start >= 0 && paragraphs.length - start >= 3) runs.push([start, paragraphs.length]);

  for (const [s, e] of runs) {
    for (let j = s; j < e; j++) {
      const text = bodyText(paragraphs[j]);
      if (text.endsWith('：')) continue;
      paragraphs[j].classList.add('chapter-poem');
      if (text.length <= 25) paragraphs[j].classList.add('chapter-poem-short');
    }
  }

  // 模式 2：含 \n 的韵文段落
  for (const p of paragraphs) {
    if (p.classList.contains('chapter-poem')) continue;
    const text = bodyText(p);
    if (!text.includes('\n')) continue;
    p.classList.add('chapter-poem');
    if (text.split('\n').every(l => l.length <= 25)) p.classList.add('chapter-poem-short');
    p.innerHTML = p.innerHTML.replace(/\n/g, '<br>');
  }
}

// ── 对话续段缩进 ──────────────────────────────────────────────────────────────

function indentDialogueContinuation(articleEl) {
  const paras = articleEl.querySelectorAll('p');
  let depth = 0;
  for (const p of paras) {
    const text = p.textContent || '';
    const hasPN = /^\s*\[[0-9A-Z]{3}-\d{3}\]/.test(text);
    if (hasPN) depth = 0;
    const hasQuote = text.includes('「');
    if (depth > 0 && !hasQuote && !hasPN) p.classList.add('dialogue-cont');
    for (const ch of text) {
      if (ch === '「') depth++;
      if (ch === '」') depth = Math.max(0, depth - 1);
    }
  }
}
