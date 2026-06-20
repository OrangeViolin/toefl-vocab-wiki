/**
 * source-view — 源码查看插件
 *
 * 在 core 上挂载 core.renderSource(core, pid, meta)。
 * router.js 在 #?source=<page> 路由时调用。
 * 高亮策略：
 *   1. Shiki CDN（esm.sh）—— 高质量，支持 YAML frontmatter + Markdown
 *   2. 超时（8s）或失败 → 降级本地 Prism.js
 *   3. Prism 也失败 → 纯文本
 */

import { escapeHtml, hideSidebar, _pageFile } from '../../js/util.js';

const SHIKI_CDN  = 'https://esm.sh/shiki@^1';
const SHIKI_THEME = 'github-dark';
const TIMEOUT_MS  = 8000;

// Prism 降级资源（已在 vendor/prism/ 缓存）
const PRISM_LOCAL = 'vendor/prism';
const PRISM_CDN   = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0';
const PRISM_ASSETS = [
  { type: 'css', cdn: `${PRISM_CDN}/themes/prism-tomorrow.min.css`,      local: `${PRISM_LOCAL}/prism-tomorrow.min.css` },
  { type: 'js',  cdn: `${PRISM_CDN}/prism.min.js`,                       local: `${PRISM_LOCAL}/prism.min.js` },
  { type: 'js',  cdn: `${PRISM_CDN}/components/prism-yaml.min.js`,       local: `${PRISM_LOCAL}/prism-yaml.min.js` },
  { type: 'js',  cdn: `${PRISM_CDN}/components/prism-markdown.min.js`,   local: `${PRISM_LOCAL}/prism-markdown.min.js` },
];

// frontmatter 匹配：文件开头 ---\n...\n---
const FM_RE = /^---\n([\s\S]*?)\n---\n?/;

export default {
  init(core) {
    core.renderSource = renderSource;
  },
};

async function renderSource(core, pid, meta) {
  document.body.classList.remove('is-home');
  const r = await fetch(`pages/${_pageFile(pid, meta)}`);
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const mdText = await r.text();

  const t = k => core.t?.(k) ?? k;
  const label = meta.label || pid;
  document.getElementById('crumb').textContent = t('source_badge') + ' / ' + label;
  document.title = label + ' ' + t('source_badge') + ' · ' + core.siteName;

  // frontmatter 拆分：独立 YAML 块 + Markdown 正文块
  const fmMatch = mdText.match(FM_RE);
  let srcHtml;
  if (fmMatch) {
    const fmBlock = '---\n' + fmMatch[1] + '\n---';
    const body    = mdText.slice(fmMatch[0].length);
    srcHtml =
      `<pre class="src-pre src-fm language-yaml"><code class="language-yaml">${escapeHtml(fmBlock)}</code></pre>\n` +
      `<pre class="src-pre language-markdown"><code class="language-markdown">${escapeHtml(body)}</code></pre>`;
  } else {
    srcHtml = `<pre class="src-pre language-markdown"><code class="language-markdown">${escapeHtml(mdText)}</code></pre>`;
  }

  document.getElementById('article').innerHTML = `
    <h1 class="src-view-title">${escapeHtml(label)} <span class="src-view-badge">${t('source_badge')}</span></h1>
    <p class="muted"><a href="#${encodeURIComponent(pid)}">${t('rc_back_to_page')}</a></p>
    ${srcHtml}
  `;
  hideSidebar();
  document.getElementById('src-info').textContent = '';
  document.getElementById('broken-info').textContent = '';
  window.scrollTo(0, 0);

  // 固定代码块背景色为深色（RFC-liangjing-0020）：Shiki/Prism 暗色 token 色
  // 在亮色/纸色主题下可读，避免各 wiki 自行覆写 token 颜色
  (function() {
    var id = 'src-view-theme-fix';
    if (!document.getElementById(id)) {
      var s = document.createElement('style');
      s.id = id;
      s.textContent = '.src-pre code { background: #0d1117 !important; }';
      document.head.appendChild(s);
    }
  })();

  // 高亮：Shiki → 降级 Prism → 纯文本
  try {
    await Promise.race([
      highlightWithShiki(),
      rejectAfter(TIMEOUT_MS, 'Shiki timeout'),
    ]);
    console.debug('[source-view] Shiki highlight complete');
  } catch (e) {
    console.warn('[source-view] Shiki failed, falling back to Prism:', e.message ?? e);
    try {
      await highlightWithPrism();
      console.debug('[source-view] Prism fallback highlight complete');
    } catch (e2) {
      console.warn('[source-view] Prism also failed, showing plain text');
    }
  }
}

// ── Shiki ─────────────────────────────────────────────────────────────────────

async function highlightWithShiki() {
  const { createHighlighter } = await import(SHIKI_CDN);
  const highlighter = await createHighlighter({
    themes: [SHIKI_THEME],
    langs: ['yaml', 'markdown'],
  });

  for (const preEl of [...document.querySelectorAll('.src-pre')]) {
    const codeEl = preEl.querySelector('code');
    if (!codeEl) continue;

    const lang = [...codeEl.classList]
      .find(c => c.startsWith('language-'))?.replace('language-', '') ?? 'text';
    const code = codeEl.textContent;

    // codeToHtml 返回完整 <pre><code>...</code></pre>（行内 style）
    const html = highlighter.codeToHtml(code, { lang, theme: SHIKI_THEME });
    const tmp  = document.createElement('div');
    tmp.innerHTML = html.trim();
    const newPre = tmp.firstElementChild;
    if (!newPre) continue;

    // 保留我们的 CSS 类（边框、圆角、padding 等）
    newPre.classList.add('src-pre');
    if (preEl.classList.contains('src-fm')) newPre.classList.add('src-fm');

    // ::: 行高亮：Shiki 每行包在 <span class="line"> 里，按 textContent 检测
    newPre.querySelectorAll('.line').forEach(line => {
      if (line.textContent.trimStart().startsWith(':::'))
        line.classList.add('src-container-fence');
    });

    preEl.replaceWith(newPre);
  }
}

// ── Prism 降级 ────────────────────────────────────────────────────────────────

let _prismReady = null;

async function highlightWithPrism() {
  if (!_prismReady) {
    _prismReady = loadPrismAssets();
  }
  await _prismReady;

  document.querySelectorAll('.src-pre code').forEach(el => {
    window.Prism?.highlightElement(el);
  });

  // Prism 不识别 ::: 语法，正文块做行内 regex 后处理
  const mdEl = document.querySelector('.src-pre.language-markdown code');
  if (mdEl) {
    mdEl.innerHTML = mdEl.innerHTML.replace(
      /^(:::(?:[^<\n]*))/gm,
      '<span class="src-container-fence">$1</span>'
    );
  }
}

async function loadPrismAssets() {
  for (const asset of PRISM_ASSETS) {
    // 优先本地，失败才走 CDN
    try { await loadAsset(asset.type, asset.local); }
    catch { await loadAsset(asset.type, asset.cdn); }
  }
}

function loadAsset(type, url) {
  if (type === 'css') {
    if (document.querySelector('link[data-prism-css]')) return Promise.resolve();
    return new Promise(resolve => {
      const link = document.createElement('link');
      link.rel = 'stylesheet'; link.href = url;
      link.dataset.prismCss = '1';
      link.onload = resolve; link.onerror = resolve;
      document.head.appendChild(link);
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url; script.dataset.manual = '1';
    script.onload = resolve;
    script.onerror = () => reject(new Error(`load failed: ${url}`));
    document.head.appendChild(script);
  });
}

function rejectAfter(ms, reason) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error(reason)), ms));
}
