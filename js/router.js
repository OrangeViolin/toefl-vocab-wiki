/* 哈希路由。 */

import { resolvePageId } from './registry.js';
import {
  renderPage, renderHome, renderNotFound, injectH1Tabs,
} from './renderer.js';
import { renderSpecialSettings, renderSpecialPlugins, renderSpecialAll, renderSpecialStatistics } from './special.js';
import { setStatus, showFatal, escapeHtml, _pageFile, _historyBucket } from './util.js';

// 取消上一次飞行中的导航，防止竞态覆盖
let currentController = null;

export function setupRouter(core) {
  window.addEventListener('hashchange', () => {
    currentController?.abort();
    currentController = new AbortController();
    route(core, currentController.signal);
  });
  currentController = new AbortController();
  route(core, currentController.signal);
}

async function route(core, signal) {
  try {
    await _route(core, signal);
  } catch (e) {
    if (e.name === 'AbortError') return;
    showFatal((core.t?.('route_error') ?? 'Routing error') + '：' + e.message);
  } finally {
    if (!signal.aborted) setStatus('');
  }
}

async function _route(core, signal) {
  const rawHash = location.hash.slice(1) || '';

  // 提取 ?pn= 段落导航参数（如 #第074回?pn=074-007）
  let pendingPN = null;
  let cleanHash = rawHash;
  const pnIdx = rawHash.indexOf('?pn=');
  if (pnIdx > 0) {
    const pnVal = rawHash.slice(pnIdx + 4);
    if (/^[A-Za-z0-9]{3}-\d{3,4}(?:-\d{3,4})?$/.test(pnVal)) {
      pendingPN = 'pn-' + pnVal;
      cleanHash = rawHash.slice(0, pnIdx);
    }
  }

  // 处理 #pageId$anchorId（新格式）和 #pageId#anchorId（向后兼容）
  let pendingPageAnchor = null;
  if (cleanHash && !cleanHash.startsWith('?')) {
    // 优先尝试 $ 格式（用 $ 区分页链接与页内锚点）
    const dollarSep = cleanHash.indexOf('$');
    if (dollarSep > 0) {
      // #PageId$anchorId — 跨页锚点
      pendingPageAnchor = cleanHash.slice(dollarSep + 1);
      cleanHash = cleanHash.slice(0, dollarSep);
    } else if (dollarSep === 0) {
      // #$anchorId — 同页锚点，去掉 $ 前缀进入页内锚点处理
      cleanHash = cleanHash.slice(1);
    } else {
      // 向后兼容：#pageId#anchorId（旧格式）
      const hashSep = cleanHash.indexOf('#');
      if (hashSep > 0) {
        pendingPageAnchor = cleanHash.slice(hashSep + 1);
        cleanHash = cleanHash.slice(0, hashSep);
      }
    }
  }

  // 页内锚点（目标元素已在 DOM 中）：直接滚动，不做页面路由
  if (cleanHash && !cleanHash.startsWith('?') && !pendingPageAnchor) {
    // PN 段落已在 DOM 中（同页直链），滚动并返回
    if (pendingPN) {
      const pnEl = document.getElementById(pendingPN);
      if (pnEl) {
        highlightAndScroll(pnEl);
        return;
      }
    }
    const anchorId = decodeURIComponent(cleanHash);
    // 若 hash 对应已知页面，优先页面路由（而非页内滚动）
    if (anchorId && !anchorId.startsWith('§') && resolvePageId(anchorId, core.registry)) {
      // 落入下方页面渲染流程
    } else {
      const el = document.getElementById(anchorId);
      if (el) {
        scrollAnchor(anchorId, el);
        return;
      }
    }
  }

  setStatus(core.t?.('loading') ?? 'Loading…');

  // 特殊页: #?type= · #?tag= · #?recent · #?history= · #?diff= · #?revision= · #?source=
  if (rawHash.startsWith('?')) {
    const params = new URLSearchParams(rawHash.slice(1));
    await handleQueryRoute(core, params);
    return;
  }

  let raw = decodeURIComponent(cleanHash);

  // Plugin hook: 自定义路由
  //   返回 null  → 已自行处理，跳过默认路由
  //   返回 string → 改写 raw
  //   返回 undefined → 保持原值
  const mutated = await core.hooks.onRoute.run(raw, core);
  if (mutated === null) return;
  if (typeof mutated === 'string') raw = mutated;

  if (!raw) {
    renderHome(core);
    return;
  }

  // Special 页路由
  if (raw.startsWith('Special:')) {
    const handled = await handleSpecialRoute(core, raw);
    if (handled) return;
  }

  // 普通页面
  let resolved = resolvePageId(raw, core.registry);
  if (!resolved) {
    // 注册表可能是旧的（新建页面后 SPA 未刷新），强制重新拉取一次
    try {
      const bust = `?v=${Date.now()}`;
      const r = await fetch('pages.lite.json' + bust);
      if (r.ok) {
        const fresh = await r.json();
        Object.assign(core.registry.pages, fresh.pages || {});
        Object.assign(core.registry.alias_index, fresh.alias_index || {});
        resolved = resolvePageId(raw, core.registry);
      }
    } catch (_) { /* 拉取失败时静默降级 */ }
  }
  if (!resolved) {
    renderNotFound(core, raw);
    return;
  }

  const [pid, meta] = resolved;
  const article = document.getElementById('article');
  article.innerHTML = `<p class="loading">${core.t?.('loading') ?? 'Loading…'}</p>`;
  article.dataset.type = '';
  document.body.classList.remove('is-home');

  const r = await fetch(`pages/${_pageFile(pid, meta)}`, { signal });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  if (signal.aborted) return;
  const mdText = await r.text();

  // Frontmatter redirect: type: redirect with redirect: target_slug
  const fmMatch = mdText.match(/^---\n([\s\S]*?)\n---/);
  if (fmMatch) {
    const fm = fmMatch[1];
    if (/^type:\s*redirect\s*$/m.test(fm)) {
      const rd = fm.match(/^redirect:\s*(.+)$/m);
      if (rd) {
        renderFmRedirect(core, pid, meta, rd[1].trim());
        return;
      }
    }
  }

  // Redirect syntax: "#REDIRECT [[目标]]" or "REDIRECT [[目标]]" in body (skip frontmatter)
  const bodyText = mdText.replace(/^---\n[\s\S]*?\n---\n?/, '');
  const firstBodyLine = bodyText.split('\n').find(l => l.trim());
  const redirectMatch = firstBodyLine?.match(/^#?REDIRECT\s+\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/);
  if (redirectMatch) {
    await renderBodyRedirect(core, pid, meta, mdText, redirectMatch[1].trim());
    return;
  }

  await renderPage(core, pid, meta, mdText);
  // pendingPN 优先于 pendingPageAnchor，两者不同时生效
  if (pendingPN) {
    waitForElement(pendingPN, el => highlightAndScroll(el, 300));
  } else if (pendingPageAnchor) {
    const anchorId = decodeURIComponent(pendingPageAnchor);
    const resolvedId = /^(?:P0[1-9]|\d{3})-\d{3,4}$/.test(anchorId) ? 'pn-' + anchorId : anchorId;
    waitForElement(resolvedId, el => highlightAndScroll(el, 300));
  }
}

async function handleQueryRoute(core, params) {
  const type = params.get('type');
  const tag = params.get('tag');
  if (type) {
    if (core.browseCategoryRedirect) core.browseCategoryRedirect('type', type);
    else core.renderCategory?.(core, 'type', type);
    return;
  }
  if (tag) {
    if (core.browseCategoryRedirect) core.browseCategoryRedirect('tag', tag);
    else core.renderCategory?.(core, 'tag', tag);
    return;
  }
  if (params.has('all')) {
    location.hash = encodeURIComponent('Special:AllPages');
    return;
  }
  if (params.has('recent')) {
    // 旧 URL 兼容：重定向到 Special:Recent
    const page = params.get('page') || '1';
    location.hash = encodeURIComponent('Special:Recent') + '?page=' + page;
    return;
  }
  if (params.has('history')) {
    const page = params.get('history');
    if (core.renderHistory) {
      const _bkt = _historyBucket(page, core.registry);
      const _hp = _bkt ? `history/${_bkt}/${page}.jsonl` : `history/${page}.jsonl`;
      try { await core.renderHistory(core, page); }
      catch (e) { showFatal(`${_hp} 加载失败：${e.message}`); }
    }
    return;
  }
  if (params.has('diff')) {
    const page = params.get('diff');
    const rev = params.get('rev');
    if (core.renderDiff) {
      try { await core.renderDiff(core, page, rev); }
      catch (e) { showFatal(`diff ${page} @ ${rev} 失败：${e.message}`); }
    }
    return;
  }
  if (params.has('revision')) {
    const page = params.get('revision');
    const rev = params.get('rev');
    if (core.renderRevision) {
      const _bkt = _historyBucket(page, core.registry);
      const _hp = _bkt ? `history/${_bkt}/${page}.jsonl` : `history/${page}.jsonl`;
      try { await core.renderRevision(core, page, rev); }
      catch (e) { showFatal(`${_hp}#${rev} 加载失败：${e.message}`); }
    }
    return;
  }
  if (params.has('source')) {
    const page = params.get('source');
    const resolved = resolvePageId(page, core.registry);
    if (!resolved) { renderNotFound(core, page); return; }
    const [pid, meta] = resolved;
    try { await core.renderSource?.(core, pid, meta); }
    catch (e) { showFatal(`源码加载失败：${e.message}`); }
    return;
  }
}

// 返回 true 表示已处理，false 表示未匹配（交由普通页面路由）
async function handleSpecialRoute(core, raw) {
  if (raw === 'Special:Random') {
    const pids = Object.keys(core.registry.pages).filter(
      p => !p.startsWith('Special:') && core.registry.pages[p].type !== 'chapter'
    );
    const randomPid = pids[Math.floor(Math.random() * pids.length)];
    location.hash = encodeURIComponent(randomPid);
    return true;
  }
  if (raw === 'Special:Settings') { renderSpecialSettings(core); return true; }
  if (raw === 'Special:Plugins') { renderSpecialPlugins(core); return true; }
  if (raw === 'Special:All') { renderSpecialAll(core); return true; }
  if (raw === 'Special:Statistics' || raw === 'Special:知识量') { renderSpecialStatistics(core); return true; }

  // 动态 Special 页：由插件通过 core.registerSpecialPage() 注册
  const dynPage = core.specialPages.find(p => raw === p.id || raw.startsWith(p.id + '?'));
  if (dynPage?.render) {
    const qm = raw.indexOf('?');
    const params = qm >= 0 ? new URLSearchParams(raw.slice(qm + 1)) : new URLSearchParams();
    try { await dynPage.render(core, params); }
    catch (e) { showFatal(`${dynPage.id} 渲染失败：${e.message}`); }
    return true;
  }

  // Special:AllPages 无插件时的兜底
  if (raw === 'Special:AllPages' || raw.startsWith('Special:AllPages?')) {
    core.renderAllPagesList?.(core);
    return true;
  }

  return false;
}

function renderFmRedirect(core, pid, meta, target) {
  const targetResolved = resolvePageId(target, core.registry);
  const label = meta.label || pid;
  const noticeBody = targetResolved
    ? `<a href="#${encodeURIComponent(targetResolved[0])}">${escapeHtml(targetResolved[1]?.label || target)}</a>`
    : `<span class="broken-link">${escapeHtml(target)}</span>`;
  const article = document.getElementById('article');
  article.innerHTML =
    `<h1>${escapeHtml(label)}</h1>` +
    `<div class="redirect-notice"><span class="redirect-arrow">⇒</span> ${core.t?.('redirect_to') ?? 'Redirect to'} ${noticeBody}</div>`;
  const h1 = article.querySelector('h1');
  if (h1) injectH1Tabs(core, h1, pid);
  document.getElementById('crumb').textContent = label;
  document.title = label + ' · ' + core.siteName;
  document.getElementById('src-info').innerHTML =
    `<a href="pages/${escapeHtml(meta.path)}" class="src-link" target="_blank">${core.t?.('source_file') ?? 'Source'}: ${escapeHtml(meta.path)}</a>`;
  document.getElementById('broken-info').textContent = '';
}

async function renderBodyRedirect(core, pid, meta, mdText, target) {
  const targetResolved = resolvePageId(target, core.registry);
  const label = meta.label || pid;
  const strippedMd = mdText.replace(/^#?REDIRECT\s+\[\[[^\]]+\]\]\s*/m, `# ${label}\n`);
  await renderPage(core, pid, meta, strippedMd);
  const targetLink = targetResolved
    ? `<a href="#${encodeURIComponent(targetResolved[0])}">${escapeHtml(target)}</a>`
    : `<span class="broken-link">${escapeHtml(target)}</span>`;
  const notice = document.createElement('div');
  notice.className = 'redirect-notice';
  notice.innerHTML = `<span class="redirect-arrow">⇒</span> ${core.t?.('redirect_to') ?? 'Redirect to'} ${targetLink}`;
  const article = document.getElementById('article');
  const h1 = article.querySelector('h1');
  if (h1) h1.after(notice); else article.prepend(notice);
}

// MutationObserver 等待 DOM 中出现指定 id 元素，替代轮询 setTimeout
function waitForElement(id, cb, timeout = 2000) {
  const el = document.getElementById(id);
  if (el) { cb(el); return; }
  const article = document.getElementById('article');
  if (!article) return;
  const obs = new MutationObserver(() => {
    const found = document.getElementById(id);
    if (found) { obs.disconnect(); cb(found); }
  });
  obs.observe(article, { childList: true, subtree: true });
  setTimeout(() => obs.disconnect(), timeout);
}

function scrollToElWithNavOffset(el) {
  const navH = document.querySelector('.topnav')?.offsetHeight ?? 56;
  const top = el.getBoundingClientRect().top + window.scrollY - navH - 8;
  window.scrollTo({ top, behavior: 'smooth' });
}

// 高亮并滚动到元素，delay > 0 时延迟滚动（等页面布局稳定后再定位）
function highlightAndScroll(el, delay = 0) {
  el.classList.add('pn-highlight');
  setTimeout(() => el.classList.remove('pn-highlight'), 2000);
  if (delay) setTimeout(() => scrollToElWithNavOffset(el), delay);
  else scrollToElWithNavOffset(el);
}

// 页内锚点滚动，脚注回跳（fnref*）特殊处理：找块级祖先顶部对齐
function scrollAnchor(id, el) {
  const navH = document.querySelector('.topnav')?.offsetHeight ?? 0;
  if (id.startsWith('fnref')) {
    const BLOCK = new Set(['P','LI','TD','TH','H1','H2','H3','H4','H5','H6','BLOCKQUOTE','DIV','SECTION']);
    let block = el.parentElement;
    while (block && !BLOCK.has(block.tagName)) block = block.parentElement;
    const target = block || el;
    const top = target.getBoundingClientRect().top + window.scrollY - navH - 8;
    window.scrollTo({ top, behavior: 'smooth' });
  } else {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}
