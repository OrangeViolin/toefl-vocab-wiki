/**
 * anchor — 页面内精确锚点定义插件
 *
 * 语法：在 Markdown 中写 [a:id]
 * 渲染：<span id="a-{id}" class="wiki-anchor" aria-hidden="true"></span>
 *
 * 与 page-marker 插件的 [p:N] 风格一致，提供独立于 heading 文字的稳定锚点。
 * 链接格式：[[PageId$a-id|display]]（跨页）或同页内 [display](#a-id)
 * 向后兼容：[[PageId#a-id|display]] 旧格式仍受 router 支持
 */

const RE_ANCHOR = /\[a:([a-zA-Z0-9_-]+)\]/g;

export default {
  init(core) {
    core.hooks.onBeforeRender.add((body) => {
      return body.replace(RE_ANCHOR, (_, id) =>
        '<span id="a-' + id + '" class="wiki-anchor" aria-hidden="true"></span>'
      );
    });
  },
};
