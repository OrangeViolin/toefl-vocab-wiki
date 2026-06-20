/**
 * toc — 页面目录插件
 *
 * 监听 wiki:pageRendered 事件，在每次页面渲染后：
 *   - 从 #article 提取 h2/h3，生成左侧可折叠章节目录
 *   - 为标题注入 §前缀 id（供页内锚点定位）
 *   - 在 h1 内注入折叠按钮（☰）
 *   - 绑定 Scrollspy，滚动时高亮当前小节
 *   - TOC 链接点击 → history.pushState 更新 URL 为 #A$s 格式
 */

import { escapeHtml } from '../../js/util.js';

export default {
  async init(core) {
    let currentPageId = null;
    document.addEventListener('wiki:pageRendered', ({ detail }) => {
      currentPageId = detail.pid;
      buildPageToc(core, currentPageId);
    });
  },
};

function buildPageToc(core, currentPageId) {
  const article = document.getElementById('article');
  if (!article) return;
  const toc = document.getElementById('toc-sidebar');
  if (!toc) return;

  const headings = article.querySelectorAll('h2, h3, h4');
  if (headings.length === 0) {
    toc.hidden = true;
    toc.innerHTML = '';
    const oldToggle = article.querySelector('.toc-toggle');
    if (oldToggle) oldToggle.remove();
    return;
  }

  // 为标题生成唯一 ID 并收集条目
  const seen = new Set();
  const entries = [];
  headings.forEach(h => {
    const text = h.textContent.trim();
    let id = text.replace(/\s+/g, '-')
      .replace(/[^\w一-鿿　-鿿-]/g, '')
      .substring(0, 60);
    if (!id) id = 'heading';
    let n = 0;
    let uid = id;
    while (seen.has(uid)) { n++; uid = id + '-' + n; }
    seen.add(uid);
    h.id = '§' + uid;
    const levelMap = { H2: 2, H3: 3, H4: 4 };
    entries.push({ level: levelMap[h.tagName] || 2, id: h.id, text });
  });

  // 多级栈：栈底到栈顶级别递增，新条目找到第一个级别比自己低的作为父节点
  const tree = [];
  const stack = [];
  for (const e of entries) {
    while (stack.length && stack[stack.length - 1].level >= e.level) stack.pop();
    const node = { id: e.id, text: e.text, children: [] };
    if (stack.length) stack[stack.length - 1].node.children.push(node);
    else tree.push(node);
    stack.push({ level: e.level, node });
  }

  function renderTree(nodes, level) {
    return nodes.map(n => {
      const href = `$${encodeURIComponent(n.id)}`;
      const link = `<a href="${href}">${escapeHtml(n.text)}</a>`;
      const cls = `toc-h${level}`;
      if (n.children.length === 0) {
        return `<div class="${cls}">${link}</div>`;
      }
      return `<details class="toc-section" open>
        <summary>${link}</summary>
        <div class="toc-children">
          ${renderTree(n.children, level + 1)}
        </div>
      </details>`;
    }).join('');
  }
  const html = renderTree(tree, 2);

  toc.innerHTML = html;
  toc.hidden = false;

  // 折叠按钮（置于 h1 内）
  const h1 = article.querySelector('h1');
  let toggle = article.querySelector('.toc-toggle');
  if (!toggle && h1) {
    toggle = document.createElement('span');
    toggle.className = 'toc-toggle';
    toggle.title = core?.t?.('toc_title') ?? 'Contents';
    toggle.role = 'button';
    toggle.tabIndex = 0;
    toggle.textContent = '☰';
    h1.insertBefore(toggle, h1.firstChild);
  }
  if (toggle) {
    toggle.onclick = e => { e.preventDefault(); document.body.classList.toggle('toc-collapsed'); };
  }

  // 点击目录链接 → 滚动锚点并更新 URL 为 #A$s 格式（RFC-aima-0033）
  if (toc._tocClick) toc.removeEventListener('click', toc._tocClick);
  toc._tocClick = e => {
    const link = e.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');

    // 提取锚点 ID：支持 $ 前缀（新格式）和 # 前缀（向后兼容）
    let anchorEncoded;
    if (href.startsWith('$')) {
      anchorEncoded = href.slice(1);
    } else if (href.startsWith('#')) {
      anchorEncoded = href.slice(1);
    } else {
      return; // 外部链接，不拦截
    }

    e.preventDefault();

    const anchorId = decodeURIComponent(anchorEncoded);
    const el = document.getElementById(anchorId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // 用 pushState 更新 URL 为 #A$s，产生浏览器历史条目
    if (currentPageId && anchorEncoded) {
      const pageEncoded = encodeURIComponent(currentPageId);
      history.pushState(null, '', '#' + pageEncoded + '$' + anchorEncoded);
    }
  };
  toc.addEventListener('click', toc._tocClick);

  // Scrollspy：滚动时高亮当前小节
  if (toc._scrollSpy) window.removeEventListener('scroll', toc._scrollSpy);
  const spyLinks = [...toc.querySelectorAll('a[href^="$"], a[href^="#"]')];
  if (spyLinks.length > 0) {
    const idToA = new Map(spyLinks.map(a => {
      const h = a.getAttribute('href');
      const raw = h.startsWith('$') ? h.slice(1) : h.slice(1);
      return [decodeURIComponent(raw), a];
    }));
    const ids = [...idToA.keys()];
    let raf = null;
    const spy = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        const threshold = 72;
        let active = ids[0];
        for (const id of ids) {
          const el = document.getElementById(id);
          if (el && el.getBoundingClientRect().top <= threshold) active = id;
        }
        idToA.forEach((a, id) => a.classList.toggle('toc-active', id === active));
        const det = idToA.get(active)?.closest('details.toc-section');
        if (det && !det.open) det.open = true;
      });
    };
    window.addEventListener('scroll', spy, { passive: true });
    toc._scrollSpy = spy;
    spy();
  }
}
