/**
 * pn-citation — 红楼梦 PN 段落引文插件
 *
 * PN 格式：NNN-PPP
 *   NNN = 卷号 (001–294)
 *   PPP = 段落号 (001–9999，支持超大章节)
 *
 * 功能：
 *   1. 段落锚点：将 <p>[001-006] 文字</p> → <p id="pn-001-006">文字</p>
 *   2. 引文链接：将 （001-006） → 可点击链接，跳转章节页并滚动到段落
 *
 * Hook: onAfterRender
 *
 * VVV 卷号格式（v2026-05）：支持 [BH-1977-001] /
 * （BH-1977-001）等 VOL-prefix PN，首字符可为字母（GEN）
 * 或数字（2CO）。
 */

const PLUGIN_NAME = 'pn-citation';

// 第一段标识：字母和/或数字（GEN、gen、BH、2CO、1SA、001、P01）
// 第一段标识：3 位字母/数字（GEN、gen、2CO、001、P01）
const _FIRST = '[A-Za-z0-9]{3}';

// 完整章节标识：卷号前缀+章节号（GEN-001、gen-001）、或独立章节号（001、P01）
const _CH_ID = '(?:[A-Za-z0-9]{3}-[A-Za-z0-9]{3,4}|[A-Za-z0-9]{3})';

// 匹配段落开头的 PN 标签，如 [001-006]、[P03-002] 或 [BH-002-001]
const RE_PN_TAG = new RegExp(`<p>\\[(${_CH_ID}-[A-Za-z0-9]{3,4})\\]([ \\t\\r\\n\\f]*)`, 'g');

// 匹配引文写法 （001-006）、（P03-002）、（BH-002-001）等（全角或半角括号）
const RE_CITATION_PLAIN = new RegExp(`([（(])(${_CH_ID})-([A-Za-z0-9]{3,4})([）)])`, 'g');

// 匹配 wikilink 已展开形式
const RE_CITATION_WIKILINK = new RegExp(`([（(])<a\\s[^>]*class="wikilink[^"]*"[^>]*>(${_CH_ID})-([A-Za-z0-9]{3,4})<\\/a>([）)])`, 'g');

function expandAnchors(html) {
  return html.replace(RE_PN_TAG, '<p id="pn-$1"><span class="pn-label">[$1]</span>$2');
}

const BRACKET_PAIRS = { '（': '）', '(': ')' };

function expandCitations(html, chapterMap, core) {
  // 1. wikilink 展开形式（groups: open, nnn, ppp, close）
  html = html.replace(RE_CITATION_WIKILINK, (_match, open, nnn, ppp, close) => {
    if (BRACKET_PAIRS[open] !== close) return _match;
    return buildCitationLink(nnn, ppp, chapterMap, core, open) ?? _match;
  });

  // 2. 纯文本形式（保护已有 <a> 标签内的内容）
  const anchors = [];
  const protected_ = html.replace(/<a[\s\S]*?<\/a>/g, m => {
    anchors.push(m);
    return `\x00a${anchors.length - 1}\x00`;
  });

  // groups: open, nnn, ppp, close
  const expanded = protected_.replace(RE_CITATION_PLAIN, (_match, open, nnn, ppp, close) => {
    if (BRACKET_PAIRS[open] !== close) return _match;
    return buildCitationLink(nnn, ppp, chapterMap, core, open) ?? _match;
  });

  return expanded.replace(/\x00a(\d+)\x00/g, (_, i) => anchors[+i]);
}

function buildCitationLink(nnn, ppp, chapterMap, core, openBracket = '（') {
  // nnn 可能是标准章节号 "003"、P 前缀 "P03" 或 VOL 前缀 "BH"
  // 对于 VOL 格式，chapter map 的 key 应为 "BH-1977" 形式
  const pageId = chapterMap[nnn] ?? chapterMap[`${nnn}-${ppp}`];
  if (!pageId) return null;

  const closeBracket = BRACKET_PAIRS[openBracket] ?? '）';
  const pn = `${nnn}-${ppp}`;
  const href = `#${encodeURIComponent(pageId)}?pn=${pn}`;

  // 生成卷标 — VOL 前缀、P 前缀、或纯数字
  let volLabel;
  if (/^P/.test(nnn)) {
    volLabel = pageId;
  } else if (/^[A-Z]/.test(nnn)) {
    volLabel = nnn; // VOL 前缀，直接用原字符串
  } else {
    const n = parseInt(nnn, 10);
    volLabel = core?.lang === 'zh' ? `第${n}卷` : core?.lang === 'ja' ? `第${n}巻` : `Vol.${n}`;
  }
  const title = `${volLabel} ¶${parseInt(ppp, 10)}`;

  return `${openBracket}<a class="pn-citation" href="${href}" data-pn="pn-${pn}" title="${title}" target="_blank" rel="noopener">${pn}</a>${closeBracket}`;
}

export default {
  name: PLUGIN_NAME,
  version: '1.0.0',

  async init(core, { CHAPTER_MAP_URL = 'data/chapter_map.json' } = {}) {
    const t = k => core.t?.(k) ?? k;
    let chapterMap = null;

    // 注入默认 CSS（使插件开箱即用，各 wiki local/style.css 只保留个性化覆盖）
    const style = document.createElement('style');
    style.textContent = `
      p[id^="pn-"] { scroll-margin-top: 56px; }

      .pn-label {
        color: var(--fg-muted);
        font-size: .75em;
        font-family: var(--mono, monospace);
        user-select: none;
        margin-right: .3em;
        white-space: nowrap;
      }

      a.pn-citation {
        color: var(--fg-muted);
        font-size: .82em;
        text-decoration: none;
        font-family: var(--mono, monospace);
        border-bottom: 1px dotted var(--fg-muted);
        scroll-margin-top: 60px;
      }
      a.pn-citation:hover { color: var(--accent); border-bottom-color: var(--accent); }

      @keyframes pn-flash {
        0%   { background: color-mix(in srgb, var(--accent) 30%, transparent); }
        100% { background: transparent; }
      }
      .pn-highlight { animation: pn-flash 2s ease-out forwards; border-radius: 3px; }

      @media (min-width: 1200px) {
        article[data-type="chapter"] { padding-left: 6.5em; }
        article[data-type="chapter"] .pn-label {
          float: left;
          margin-left: -8.5em;
          width: 7.3em;
          text-align: right;
          clear: both;
          font-size: 0.72em;
        }
        article[data-type="chapter"] blockquote .pn-label {
          margin-left: calc(-8.5em - (1em / 0.72) - 3px);
        }
        /* ── chapter 页面：重置浏览器默认 figure 边距 ── */
        article[data-type="chapter"] .wiki-figure {
          margin-left: 0;
          margin-right: 0;
        }
        /* ── chapter 页面：重置表格浏览器默认边距 ── */
        article[data-type="chapter"] .wiki-table {
          margin-left: 0;
          margin-right: 0;
        }
        /* ── chapter 页面：blockquote 改用 padding+border 维持视觉区分 ── */
        article[data-type="chapter"] blockquote {
          margin-left: 0;
          margin-right: 0;
          padding-left: 1em;
          border-left: 3px solid var(--border, #ccc);
        }
        /* ── chapter 页面：图片/表格 PN 与段落 PN 一致左对齐 ── */
        article[data-type="chapter"] .wiki-figure .pn-label,
        article[data-type="chapter"] .wiki-table  .pn-label {
          float: left;
          margin-left: -8.5em;
          width: 7.3em;
          text-align: right;
          clear: both;
        }
      }

      .wiki-figure .pn-label,
      .wiki-table  .pn-label { margin-bottom: .3em; }
    `;
    document.head.appendChild(style);

    core.hooks.onBoot.add(async () => {
      try {
        const r = await fetch(CHAPTER_MAP_URL);
        chapterMap = await r.json();
        console.log(`[${PLUGIN_NAME}] Loaded ${Object.keys(chapterMap).length} chapter mappings`);
      } catch (e) {
        console.warn(`[${PLUGIN_NAME}] Failed to load ${CHAPTER_MAP_URL}:`, e);
      }
    });

    core.hooks.onAfterRender.add((html, { meta }) => {
      // 只在 chapter 页面做定义锚点展开（[NNN-PPP] → pn-label）
      // 其他页面（concept/event/person 等）只做引文链接
      const isChapter = meta?.type === 'chapter';
      if (isChapter) html = expandAnchors(html);
      if (chapterMap) html = expandCitations(html, chapterMap, core);
      return html;
    });

    // PN 标签点击复制
    document.addEventListener('click', (e) => {
      const label = e.target.closest('.pn-label');
      if (label) {
        const text = label.textContent.replace(/[[\]]/g, '');
        navigator.clipboard.writeText(text).catch(() => {});
        const orig = label.textContent;
        label.textContent = t('copy_ok');
        setTimeout(() => { label.textContent = orig; }, 600);
        return;
      }
    });

    // 同页点击引文：直接滚动，不触发导航
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a.pn-citation');
      if (!a || !a.dataset.pn) return;
      const currentHash = location.hash.split('?')[0]; // 去掉可能携带的 ?pn=
      const targetHash = (a.getAttribute('href') || '').split('?')[0];
      if (currentHash === targetHash) {
        e.preventDefault();
        const el = document.getElementById(a.dataset.pn);
        if (el) {
          const navH = document.querySelector('.topnav')?.offsetHeight ?? 56;
          const top = el.getBoundingClientRect().top + window.scrollY - navH - 8;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      }
      // 跨页：URL 已携带 ?pn=，路由器会处理滚动
    });

    core.pnCitation = {
      expand: (html) => {
        html = expandAnchors(html);
        return chapterMap ? expandCitations(html, chapterMap, core) : html;
      },
    };
  },
};
