/* Markdown 解析主流水线。
 *
 * parseMarkdown(core, mdText, ctx) 做完整链路:
 *   1. splitFrontmatter  → {front, body}
 *   2. hook onBeforeRender(body)
 *   3. protectWikilinks  (避开 MD 表格 '|' 冲突)
 *   4. markdown-it 渲染
 *   5. expandWikilinks   (占位符 → <a>)
 *   6. hook onAfterRender(html)
 *
 * 返回: {front, html, broken[]}
 */

import { splitFrontmatter } from './frontmatter.js';
import { protectWikilinks, expandWikilinks } from './wikilink.js';
import { resolvePageId } from './registry.js';
import { escapeHtml } from './util.js';

export function createMarkdownIt() {
  if (!window.markdownit) {
    throw new Error('markdown-it 未加载');
  }
  const md = window.markdownit({
    html: true,
    linkify: true,
    typographer: false,
    breaks: false,
  });

  // 图片点击在新 tab 打开
  const defaultImageRender = md.renderer.rules.image || function(tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
  };
  md.renderer.rules.image = function(tokens, idx, options, env, self) {
    const token = tokens[idx];
    const src = token.attrGet('src') || '';
    const alt = token.content || '';
    return `<a href="${src}" target="_blank" rel="noopener">${defaultImageRender(tokens, idx, options, env, self)}</a>`;
  };

  return md;
}

export async function parseMarkdown(core, mdText, ctx = {}) {
  const { pid, meta } = ctx;
  const { front, body: rawBody } = splitFrontmatter(mdText);

  // Hook: MD 源预处理 (e.g. semantic 插件展开 :::query)
  let body = await core.hooks.onBeforeRender.run(rawBody, { pid, meta, front });

  // H1 标题行去除 wikilink（章回标题等不做链接化）
  body = body.replace(/^# (.*)$/gm, (_, title) =>
    '# ' + title.replace(/\[\[([^\[\]|]+?)(?:\|[^\[\]]+?)?\]\]/g, '$1'));

  // autoWikilink 已移至 plugins/autolink/index.js（默认关闭）

  // LaTeX 数学内容由 math 插件的 onBeforeRender 提取为占位符（RFC-aima-0029）
  // 不在此处处理，防止 markdown-it 转义 & 等特殊字符

  // 占位符保护 wikilink
  let { protectedText, tokens } = protectWikilinks(body);

  // 制表符 → &emsp;（TOC 缩进、源格式保留等场景）
  protectedText = protectedText.replace(/\t/g, '&emsp;');

  // MD → HTML
  let html = core.md.render(protectedText);

  // 展开 wikilink 占位符为 <a>
  const broken = [];
  html = expandWikilinks(html, tokens, {
    selfId: pid,
    resolve: (target) => resolvePageId(target, core.registry),
    onBroken: (t) => broken.push(t),
    escape: escapeHtml,
    t: k => core.t?.(k) ?? k,
  });

  // Hook: HTML 后处理
  html = await core.hooks.onAfterRender.run(html, { pid, meta, front });

  return { front, html, broken };
}
