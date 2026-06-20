/**
 * sidebar — 侧边栏插件
 *
 * 渲染页面右侧栏的两个内容区：
 *   - #sidebar-portrait  人物/实体图片（支持 image 单图 / images 多图）
 *   - #sidebar-map       坐标地图（frontmatter coords: [lon, lat]，嵌入 OSM iframe）
 *
 * 并根据 infobox + portrait + map 的显示状态决定 #sidebar 整体可见性。
 *
 * 启用后在 core 上挂载：
 *   core.renderSidebar(front, ibEl)
 */

import { escapeHtml } from '../../js/util.js';

export default {
  async init(core) {
    core.renderSidebar = (front, ibEl) => renderSidebar(front, ibEl, core);
  },
};

function renderSidebar(front, ibEl, core) {
  renderSidebarPortrait(front, core);
  renderSidebarMap(front, core);

  const sidebarEl   = document.getElementById('sidebar');
  const portraitEl  = document.getElementById('sidebar-portrait');
  const mapEl       = document.getElementById('sidebar-map');
  if (sidebarEl) {
    sidebarEl.hidden = (!ibEl || ibEl.hidden)
      && (!portraitEl || portraitEl.hidden)
      && (!mapEl      || mapEl.hidden);
  }
}

// ── 图片区 ────────────────────────────────────────────────────────────────────

function renderSidebarPortrait(front, core) {
  const el = document.getElementById('sidebar-portrait');
  if (!el) return;

  let items = [];
  if (Array.isArray(front.images) && front.images.length) {
    items = front.images.map(img => ({
      src:     img.file    || img.src || '',
      caption: img.caption || '',
      credit:  img.credit  || '',
    }));
  } else if (front.image) {
    let src = front.image;
    // 客户端兜底：build_registry 未解析的 image: true 降级为 images/<id>.png
    if (src === true || src === 'true') {
      src = 'images/' + (front.id || front.label || '') + '.png';
    }
    items = [{
      src:     src,
      caption: front.image_caption || '',
      credit:  front.image_credit  || '',
    }];
  }

  if (!items.length) { el.hidden = true; el.innerHTML = ''; return; }

  el.hidden = false;
  el.innerHTML = items.map((img, i) => `
    <div class="portrait-item${i > 0 ? ' portrait-item--sep' : ''}">
      <a href="${escapeHtml(img.src)}" target="_blank" rel="noopener" class="portrait-zoom" title="${core?.t?.('map_zoom') ?? 'Click to enlarge'}">
        <img src="${escapeHtml(img.src)}"
             alt="${escapeHtml(img.caption || front.label || '')}"
             loading="lazy"
             onerror="this.closest('.portrait-item').style.display='none'">
      </a>
      ${img.caption ? `<figcaption>${escapeHtml(img.caption)}${img.credit ? `<br><span class="credit">${escapeHtml(img.credit)}</span>` : ''}</figcaption>` : ''}
    </div>`).join('');
}

// ── 地图区 ────────────────────────────────────────────────────────────────────

function renderSidebarMap(front, core) {
  const el = document.getElementById('sidebar-map');
  if (!el) return;

  const coords = front.coords;
  if (!Array.isArray(coords) || coords.length < 2) {
    el.hidden = true; el.innerHTML = ''; return;
  }

  const [lon, lat] = coords;
  const name   = front.coords_name || front.label || '';
  const source = front.coords_source
    ? `<span class="map-source">${escapeHtml(front.coords_source)}</span>` : '';
  const delta  = 0.4;
  const bbox   = `${lon - delta},${lat - delta},${lon + delta},${lat + delta}`;
  const osmEmbed = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;

  el.hidden = false;
  el.innerHTML = `
    <iframe
      src="${osmEmbed}"
      style="width:100%;height:180px;border:none;display:block;"
      loading="lazy"
      title="${escapeHtml(name)} ${core?.t?.('map_iframe_title') ?? 'Map'}"
      referrerpolicy="no-referrer">
    </iframe>
    <div class="map-caption">${escapeHtml(name)}${source}</div>`;
}
