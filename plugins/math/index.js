/**
 * math.js — KaTeX 数学公式渲染插件 v3.1.0
 *
 * 占位符方案：onBeforeRender 把所有 LaTeX 内容提取为 \x02MATH_N\x03 占位符，
 * markdown-it 完全不接触数学内容；onAfterRender 还原并交给 KaTeX。
 *
 * 支持格式：
 *   - 块级: $$...$$ 和 \[...\]
 *   - 行内: $...$ 和 \(...\)
 *
 * RFC: RFC-aima-0029
 */

const PLUGIN_NAME = 'math';
const KATEX_CSS = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
const KATEX_JS  = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';

async function loadKaTeX() {
  if (window.katex) return;
  if (!document.querySelector(`link[href="${KATEX_CSS}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = KATEX_CSS;
    document.head.appendChild(link);
  }
  await new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = KATEX_JS; s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
}

function renderTeX(tex, display) {
  try {
    return window.katex.renderToString(tex, { displayMode: display, throwOnError: false });
  } catch (e) {
    return `<code>${tex}</code>`;
  }
}

// 每次渲染用 pid 键隔离 store，避免并发污染
const _mathStores = new Map();

export default {
  name: PLUGIN_NAME,
  version: '3.0.0',
  description: 'KaTeX 数学公式渲染（占位符保护方案，支持含 & 的 LaTeX 环境）',

  async init(core) {
    await loadKaTeX();

    core.hooks.onBeforeRender.add((body, ctx) => {
      const codeStore = [];
      const store = [];
      const pid = ctx?.pid ?? '__default__';

      // 1. 保护 fenced code block（先处理，防止 inline 正则分片吃掉）
      body = body.replace(/`{3,}[\s\S]*?`{3,}/g, (m) => {
        codeStore.push(m.replace(/\\([\\`*_\[\]()#+\-.!|{}])/g, '$1'));
        return `\x02CODE${codeStore.length - 1}\x03`;
      });

      // 2. 保护 inline code span（支持多重反引号）
      body = body.replace(/`+[^`]*`+/g, (m) => {
        codeStore.push(m.replace(/\\([\\`*_\[\]()#+\-.!|{}])/g, '$1'));
        return `\x02CODE${codeStore.length - 1}\x03`;
      });

      // 2.5 保护 wikilink [[...]]，防止内部 $ 被误认为公式（RFC-0032 $ 格式引入）
      const wikiStore = [];
      body = body.replace(/\[\[[^\]]*\]\]/g, (m) => {
        wikiStore.push(m);
        return `\x02WIKI${wikiStore.length - 1}\x03`;
      });

      // 3. 数学提取（现在不会碰到代码和 wikilink 内容）
      const placeholder = (tex, display) => {
        // 同时移除 math 内部的 PN 标记 [NNN-PPP]（有时因段落分割被误插入）
        store.push({ tex: tex.trim().replace(/\[\w+-\d+\]/g, ''), display });
        return `\x02MATH${store.length - 1}\x03`;
      };

      // 块级 $$...$$ （先处理，避免与行内 $ 冲突）
      body = body.replace(/\$\$([\s\S]*?)\$\$/g, (_, tex) => placeholder(tex, true));

      // 行内 $...$ （排除 $$ 已处理的）
      body = body.replace(/(?<!\$|\\)\$(?!\$)([\s\S]*?)(?<!\$|\\)\$(?!\$)/g, (_, tex) => placeholder(tex, false));

      // 块级 \[...\]
      body = body.replace(/\\\[([\s\S]*?)\\\]/g, (_, tex) => placeholder(tex, true));

      // 行内 \(...\)
      body = body.replace(/\\\(([\s\S]*?)\\\)/g, (_, tex) => placeholder(tex, false));

      // 4. 先还原 wikilink 占位符（避免 CODE 还原时误处理）
      body = body.replace(/\x02WIKI(\d+)\x03/g, (_, i) => wikiStore[+i]);

      // 5. 还原代码占位符（数学占位符保留，供 onAfterRender 处理）
      body = body.replace(/\x02CODE(\d+)\x03/g, (_, i) => codeStore[+i]);

      _mathStores.set(pid, store);
      return body;
    });

    core.hooks.onAfterRender.add((html, ctx) => {
      if (!window.katex) return html;
      const pid = ctx?.pid ?? '__default__';
      const store = _mathStores.get(pid);
      if (!store || store.length === 0) return html;

      html = html.replace(/\x02MATH(\d+)\x03/g, (_, i) => {
        const { tex, display } = store[+i];
        return display
          ? `<div class="math-block">${renderTeX(tex, true)}</div>`
          : `<span class="math-inline">${renderTeX(tex, false)}</span>`;
      });

      _mathStores.delete(pid);
      return html;
    });
  },
};
