/**
 * bold-terms — 页名/别名加粗插件
 *
 * 监听 wiki:pageRendered，在正文中找到当前页名和别名所在的文本节点并加粗。
 * 跳过标题（h1-h6）、链接（a）、代码块（pre/code）、已加粗（strong）、PN 标签。
 */

export default {
  init(core) {
    document.addEventListener('wiki:pageRendered', ({ detail }) => {
      const { pid, meta, front, articleEl } = detail;
      const pageTerms = [pid, front.label || meta?.label, ...(front.aliases || [])]
        .filter(Boolean).map(String);
      boldPageTermsInDOM(articleEl, pageTerms);
    });
  },
};

function boldPageTermsInDOM(root, pageTerms) {
  const terms = [...new Set(pageTerms)].filter(Boolean);
  if (terms.length === 0) return;
  const sorted = terms.sort((a, b) => b.length - a.length);
  const re = new RegExp(
    sorted.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
    'g'
  );

  const skipTags = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'PRE', 'CODE', 'STRONG']);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      for (let el = node.parentElement; el && el !== root; el = el.parentElement) {
        if (skipTags.has(el.tagName)) return NodeFilter.FILTER_REJECT;
        if (el.classList && (el.classList.contains('pn-label') || el.classList.contains('pn-citation')))
          return NodeFilter.FILTER_REJECT;
      }
      return re.test(node.textContent) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });

  const toReplace = [];
  let n;
  while ((n = walker.nextNode())) {
    re.lastIndex = 0;
    const text = n.textContent;
    const frag = document.createDocumentFragment();
    let lastIdx = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      if (m.index > lastIdx) frag.appendChild(document.createTextNode(text.slice(lastIdx, m.index)));
      const strong = document.createElement('strong');
      strong.textContent = m[0];
      frag.appendChild(strong);
      lastIdx = m.index + m[0].length;
    }
    if (lastIdx < text.length) frag.appendChild(document.createTextNode(text.slice(lastIdx)));
    toReplace.push([n, frag]);
  }

  for (const [node, frag] of toReplace) node.parentNode.replaceChild(frag, node);
}
