/* 纯工具函数。类型显示名由 local/config/types.js 统一定义。 */

export { TYPE_LABELS } from '@wiki/local/config/types.js';

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
}

export function escapeAttr(s) { return escapeHtml(s); }

export function setStatus(msg) {
  const el = document.getElementById('status');
  if (el) el.textContent = msg;
}

export function showFatal(msg) {
  const article = document.getElementById('article');
  if (article) {
    article.innerHTML = `<h1>Error</h1><p class="error">${escapeHtml(msg)}</p>`;
  }
  setStatus('');
}

export const QUALITY_BADGE = { premium: 'quality_premium', featured: 'quality_featured', standard: 'quality_standard', basic: 'quality_basic', stub: 'quality_stub' };

/**
 * 从 registry.pages[page].path 提取分桶目录名。
 * 未分桶（path 为 "page.md"）或无 path 字段时返回 null。
 * 测试：wiki/tests/test_crud_frontend.mjs
 */
export function _historyBucket(page, registry) {
  const p = registry?.pages?.[page]?.path;
  if (!p) return null;
  const idx = p.indexOf('/');
  return idx > 0 ? p.slice(0, idx) : null;
}

/**
 * 返回 pages/ 下的相对文件路径。
 * 优先使用 registry 中的 meta.path；缺省时 fallback 到 pid + '.md'。
 * 测试：wiki/tests/test_crud_frontend.mjs
 */
export function _pageFile(pid, meta) {
  return (meta && meta.path) || pid + '.md';
}

/**
 * 加载某页的全部修订（主文件 + 所有归档文件），按时间升序返回。
 * 支持分桶：若 registry 中有 path 字段且含桶前缀，则读取 history/{bucket}/{page}.jsonl。
 * 归档文件命名：history/[{bucket}/]{page}.1.jsonl, .2.jsonl, ...（数字越大越新）
 */
export async function historyAll(page, registry) {
  const bucket = _historyBucket(page, registry);
  const base = bucket
    ? `history/${bucket}/${encodeURIComponent(page)}`
    : `history/${encodeURIComponent(page)}`;
  const all = [];
  for (let n = 1; n <= 9999; n++) {
    const ar = await fetch(`${base}.${n}.jsonl`);
    if (!ar.ok) break;
    const t = await ar.text();
    t.split('\n').filter(l => l.trim()).forEach(l => all.push(JSON.parse(l)));
  }
  const r = await fetch(`${base}.jsonl`);
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const t = await r.text();
  t.split('\n').filter(l => l.trim()).forEach(l => all.push(JSON.parse(l)));
  return all;
}

export function hideSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.hidden = true;
  const ib = document.getElementById('infobox');
  if (ib) { ib.hidden = true; ib.innerHTML = ''; }
  const portrait = document.getElementById('sidebar-portrait');
  if (portrait) { portrait.hidden = true; portrait.innerHTML = ''; }
  const mapEl = document.getElementById('sidebar-map');
  if (mapEl) { mapEl.hidden = true; mapEl.innerHTML = ''; }
  const toc = document.getElementById('toc-sidebar');
  if (toc) {
    toc.hidden = true; toc.innerHTML = '';
    if (toc._scrollSpy) { window.removeEventListener('scroll', toc._scrollSpy); toc._scrollSpy = null; }
  }
}
