/**
 * hero — 首页英雄区插件（通用框架）
 *
 * 在 core 上挂载：
 *   core.startHeroAnimation()       启动英雄区动画
 *   core.stopHeroAnimation()        停止动画
 *   core.buildHeroHtml(entityCount) 返回英雄区 HTML 字符串
 *   core.heroDocTitle               文档标题字符串
 *   core.renderHeroShell(core)      渲染首页英雄区外壳
 *
 * 具体实现由 local/config/hero.js 提供：
 *   buildHeroBackground()           → 背景区 HTML（canvas / img / svg / ''）
 *   startHeroAnimation(setStop)     → 启动动画，调用 setStop(fn) 注册清理函数
 */

import { hideSidebar } from '../../js/util.js';
import {
  EYEBROW, TITLE, TAGLINE, DOC_TITLE, SEARCH_PLACEHOLDER,
} from '@wiki/local/config/hero.js';

export default {
  async init(core, localConfig) {
    let _stop = null;

    const buildBg   = localConfig.buildHeroBackground ?? (() => '');
    const startAnim = localConfig.startHeroAnimation  ?? (() => {});

    core.startHeroAnimation = () => startAnim(_ref => { _stop = _ref; });
    core.stopHeroAnimation  = () => { if (_stop) { _stop(); _stop = null; } };
    core.buildHeroHtml      = (entityCount, totalPages) => buildHeroHtml(entityCount, totalPages, buildBg, core);
    core.heroDocTitle       = DOC_TITLE;

    core.renderHeroShell = () => {
      const article = document.getElementById('article');
      article.dataset.type = '';
      article.innerHTML = `<div class="wiki-home">
        <div class="home-hero">
          ${buildBg()}
          <div class="hero-overlay">
            <div class="hero-eyebrow">${EYEBROW}</div>
            <h1 class="hero-title">${TITLE}</h1>
            <div class="hero-tagline">${TAGLINE} · <span class="hero-count"></span></div>
            ${buildSearchBoxHtml(core)}
          </div>
        </div>
        <div class="home-body"></div>
      </div>`;
      document.body.classList.add('is-home');
      hideSidebar();
      document.getElementById('crumb').textContent = core.t?.('home') ?? 'Home';
      document.title = DOC_TITLE;
      core.startHeroAnimation();
    };
  },
};

// ── HTML 构建 ─────────────────────────────────────────────────────────────────

function buildSearchBoxHtml(core) {
  const ftsLabel = core?.t?.('fts_toggle') ?? 'Full-text search';
  return `<div class="hero-search">
    <input id="wiki-search" type="search"
      placeholder="${SEARCH_PLACEHOLDER}"
      autocomplete="off" autofocus>
    <div class="search-mode-toggle">
      <label class="mode-opt">
        <input type="checkbox" id="fts-toggle"> ${ftsLabel}
      </label>
    </div>
    <ul id="search-results" hidden></ul>
  </div>`;
}

function buildHeroHtml(entityCount, totalPages, buildBg, core) {
  const countText = core?.lang === 'zh'
    ? `共收录 ${totalPages} 页 · ${entityCount} 个词条`
    : core?.lang === 'ja'
    ? `${totalPages} ページ · ${entityCount} 項目`
    : `${totalPages} pages · ${entityCount} entries`;
  return `<div class="home-hero">
    ${buildBg()}
    <div class="hero-overlay">
      <div class="hero-eyebrow">${EYEBROW}</div>
      <h1 class="hero-title">${TITLE}</h1>
      <div class="hero-tagline">${TAGLINE} · <span class="hero-count">${countText}</span></div>
      ${buildSearchBoxHtml(core)}
    </div>
  </div>`;
}
