/**
 * export — 页面及区块元数据多格式导出插件
 *
 * 在页面 h1 工具栏添加"⬇ 导出"下拉按钮，与 Source/History 并列。
 * 支持 JSON / RDF/Turtle / Markdown 三种格式。
 * 监听 wiki:pageRendered 获取当前页 frontmatter、PN 区块和 wikilink 数据。
 *
 * RFC-memex-0026: 导出按钮从 topnav 移至页面 h1 工具栏
 */

const NS_RDF = 'https://memium.com/rdf/';

export default {
  init(core) {
    document.addEventListener('wiki:pageRendered', (e) => {
      const { pid, front, articleEl } = e.detail;
      addExportButton(core, pid, front, articleEl);
    });
  },
};

function addExportButton(core, pid, front, articleEl) {
  const t = k => core.t?.(k) ?? k;

  // 避免重复注入
  const existing = document.getElementById('export-btn-wrap');
  if (existing) existing.remove();

  const data = collectData(pid, front, articleEl);
  if (!data) return;

  const h1 = articleEl.querySelector('h1');
  if (!h1) return;

  const wrap = document.createElement('span');
  wrap.id = 'export-btn-wrap';
  wrap.style.cssText = 'position:relative;display:inline-flex;align-items:baseline';

  const btn = document.createElement('button');
  btn.className = 'src-tab';
  btn.textContent = t('export_button');
  btn.title = t('export_title');

  const menu = document.createElement('div');
  menu.className = 'settings-panel';
  menu.hidden = true;
  menu.style.cssText = 'right:0;min-width:140px;white-space:nowrap';

  const formats = [
    { key: 'export_json',  ext: '.json', fn: () => exportJSON(data) },
    { key: 'export_turtle', ext: '.ttl', fn: () => exportTurtle(data) },
    { key: 'export_markdown', ext: '.md', fn: () => exportMarkdown(data) },
  ];

  formats.forEach(({ key, ext, fn }) => {
    const item = document.createElement('div');
    item.className = 'setting-item';
    item.style.cssText = 'cursor:pointer;padding:4px 8px';
    item.textContent = t(key);
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.hidden = true;
      const content = fn();
      download(content, pid + ext);
    });
    menu.appendChild(item);
  });

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.hidden = !menu.hidden;
  });
  document.addEventListener('click', () => { menu.hidden = true; });

  wrap.appendChild(btn);
  wrap.appendChild(menu);
  h1.appendChild(wrap);
}

function collectData(pid, front, articleEl) {
  if (!front) return null;

  // frontmatter
  const { id, type, label, aliases, tags, description } = front;

  // PN 区块：查找 article 内含 pn- 前缀 id 的标题元素
  const pnBlocks = [];
  const headings = articleEl?.querySelectorAll('h2[id^="pn-"], h3[id^="pn-"], h4[id^="pn-"]') || [];
  headings.forEach((h) => {
    const pn = h.id.replace(/^pn-/, '');
    pnBlocks.push({ pn, heading: h.textContent.trim() });
  });

  // wikilink 引用
  const wikilinks = [];
  const links = articleEl?.querySelectorAll('a.wikilink') || [];
  links.forEach((a) => {
    const href = a.getAttribute('href') || '';
    const target = href.replace(/^#/, '');
    wikilinks.push({ target, label: a.textContent.trim() });
  });

  return { front, pnBlocks, wikilinks };
}

function exportJSON(data) {
  const { front, pnBlocks, wikilinks } = data;
  return JSON.stringify({
    id: front.id,
    type: front.type,
    label: front.label,
    aliases: front.aliases || [],
    tags: front.tags || [],
    description: front.description || '',
    pnBlocks,
    wikilinks,
  }, null, 2);
}

function exportTurtle(data) {
  const { front, pnBlocks, wikilinks } = data;
  const pageUri = 'https://memium.com/page/' + encodeURIComponent(front.id || '');
  const lines = [];

  lines.push('@prefix wiki: <' + NS_RDF + '> .');
  lines.push('@prefix schema: <https://schema.org/> .');
  lines.push('');

  lines.push('<' + pageUri + '> a wiki:Page ;');

  if (front.label) {
    const escaped = front.label.replace(/"/g, '\\"');
    lines.push('  schema:name "' + escaped + '" ;');
  }
  if (front.type) {
    lines.push('  wiki:type "' + front.type + '" ;');
  }
  (front.aliases || []).forEach((a) => {
    const escaped = a.replace(/"/g, '\\"');
    lines.push('  wiki:alias "' + escaped + '" ;');
  });
  if (front.description) {
    const escaped = front.description.replace(/"/g, '\\"');
    lines.push('  schema:description "' + escaped + '" ;');
  }

  pnBlocks.forEach((b) => {
    const escaped = b.heading.replace(/"/g, '\\"');
    lines.push('  wiki:hasBlock [ wiki:pn "' + b.pn + '" ; schema:name "' + escaped + '" ] ;');
  });

  wikilinks.forEach((w) => {
    const escaped = w.label.replace(/"/g, '\\"');
    lines.push('  wiki:hasWikilink [ wiki:target "' + w.target + '" ; schema:name "' + escaped + '" ] ;');
  });

  // 去掉最后一个 "; "，用 "."
  lines.push('  .');
  return lines.join('\n');
}

function exportMarkdown(data) {
  const { front, pnBlocks, wikilinks } = data;
  const lines = [];

  lines.push('# ' + (front.label || front.id || ''));
  lines.push('');
  lines.push('**ID**: ' + (front.id || ''));
  lines.push('**Type**: ' + (front.type || ''));
  lines.push('**Aliases**: ' + ((front.aliases || []).join(', ') || '(none)'));
  lines.push('**Tags**: ' + ((front.tags || []).join(', ') || '(none)'));
  lines.push('**Description**: ' + (front.description || ''));
  lines.push('');

  lines.push('## PN Blocks');
  lines.push('');
  if (pnBlocks.length === 0) {
    lines.push('(none)');
  } else {
    lines.push('| PN | Heading |');
    lines.push('|----|---------|');
    pnBlocks.forEach((b) => {
      lines.push('| ' + b.pn + ' | ' + b.heading.replace(/\|/g, '\\|') + ' |');
    });
  }
  lines.push('');

  lines.push('## Wikilinks');
  lines.push('');
  if (wikilinks.length === 0) {
    lines.push('(none)');
  } else {
    wikilinks.forEach((w) => {
      lines.push('- [[' + w.target + '|' + w.label + ']]');
    });
  }
  lines.push('');

  return lines.join('\n');
}

function download(content, filename) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
