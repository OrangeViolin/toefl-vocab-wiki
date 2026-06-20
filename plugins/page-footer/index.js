/**
 * page-footer — 页面分类标签插件
 *
 * 监听 wiki:pageRendered 事件，在 #article 末尾注入分类标签：
 *   - type 标签（突出样式，链接到 #?type=<type>）
 *   - tags[] 自由标签（链接到 #?tag=<tag>）
 *
 * 注入到文章区而非 <footer>，使标签继承正文字号和左对齐样式。
 */

import { escapeHtml, TYPE_LABELS } from '../../js/util.js';

export default {
  init(core) {
    const t = k => core.t?.(k) ?? k;

    document.addEventListener('wiki:pageRendered', ({ detail }) => {
      const { meta, front } = detail;
      const article = document.getElementById('article');
      if (!article) return;

      // 清除上一页的标签
      const old = article.querySelector('.entity-tags');
      if (old) old.remove();

      const html = buildTagsFooter(front, meta, t);
      if (!html) return;

      article.insertAdjacentHTML('beforeend', html);
    });
  },
};

function buildTagsFooter(front, meta, t) {
  const type = front.type || meta?.type || '';
  const typeLabel = TYPE_LABELS[type] || type;
  const tags = front.tags || [];
  const hasType = !!typeLabel;
  const hasTags = tags.length > 0;
  if (!hasType && !hasTags) return '';

  let html = '<div class="entity-tags">';
  if (hasType) {
    html += `<span class="tag-label">${t('type')}</span> ` +
      `<a class="tag tag-type" rel="tag" data-kind="type"` +
      ` href="#?type=${encodeURIComponent(type)}">${escapeHtml(typeLabel)}</a>`;
  }
  if (hasTags) {
    if (hasType) html += '<br>';
    html += `<span class="tag-label">${t('tags')}</span> ` +
      tags.map(tag =>
        `<a class="tag" rel="tag" data-kind="tag"` +
        ` href="#?tag=${encodeURIComponent(tag)}">${escapeHtml(tag)}</a>`
      ).join(', ');
  }
  html += '</div>';
  return html;
}
