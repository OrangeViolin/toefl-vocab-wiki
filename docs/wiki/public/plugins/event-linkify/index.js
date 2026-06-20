/**
 * event-linkify — 事件页字段自动 wikilink 插件
 *
 * 监听 wiki:pageRendered，将正文中
 *   **字段名**：name1、name2
 * 格式的纯文本转为 wikilink。
 *
 * 哪些字段参与 linkify 由 local/config/event-linkify.js 的 LINKIFY_FIELDS 配置。
 */

import { resolvePageId } from '../../js/registry.js';

export default {
  init(core, localConfig) {
    const fields = new Set(localConfig.LINKIFY_FIELDS ?? []);
    if (!fields.size) return;

    document.addEventListener('wiki:pageRendered', ({ detail }) => {
      linkifyEventFields(detail.articleEl, core.registry, fields, core);
    });
  },
};

function linkifyEventFields(articleEl, registry, fields, core) {
  articleEl.querySelectorAll('strong').forEach(strong => {
    const label = strong.textContent.trim();
    if (!fields.has(label)) return;

    const textNode = strong.nextSibling;
    if (!textNode || textNode.nodeType !== Node.TEXT_NODE) return;
    const text = textNode.textContent;
    const sep = text[0];
    if (sep !== '：' && sep !== ':') return;
    const rest = text.slice(1).trim();
    if (!rest) return;

    const parts = rest.split(/([、，])/);
    const fragment = document.createDocumentFragment();
    fragment.appendChild(document.createTextNode(sep));
    for (const part of parts) {
      if (part === '、' || part === '，') {
        fragment.appendChild(document.createTextNode(part));
        continue;
      }
      const name = part.trim();
      if (!name) continue;
      const resolved = resolvePageId(name, registry);
      const a = document.createElement('a');
      a.href = `#${encodeURIComponent(resolved ? resolved[0] : name)}`;
      a.className = resolved ? 'wikilink resolved' : 'wikilink broken';
      if (!resolved) a.title = `${core?.t?.('not_found') ?? 'Unresolved'}: ${name}`;
      a.textContent = name;
      fragment.appendChild(a);
    }
    textNode.replaceWith(fragment);
  });
}
