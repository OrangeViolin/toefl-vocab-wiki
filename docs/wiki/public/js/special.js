/* special.js — Special: 系统页动态渲染 */

import { escapeHtml } from './util.js';

// 通用多语言字段选取：优先 desc_<lang>，降级 desc_en，再降级 desc
function pickDesc(entry, lang) {
  return entry['desc_' + lang] || entry.desc_en || entry.desc || '';
}

// 所有硬编码的 Special 页。新增 Special 页时只需在此添加一行。
// renderSpecialAll 自动用这个列表生成 Special:All 索引。
const SPECIAL_PAGES = [
  { id: 'Special:Recent',          key: 'sp_recent',      desc: '最近修订记录（滚动窗口，最新 500 条）',           desc_en: 'Recent changes log (rolling window, latest 500)',                     desc_ja: '最近の更新ログ（直近 500 件）' },
  { id: 'Special:AllPages',        key: 'sp_all_pages',   desc: '所有 wiki 页面的完整列表，支持分组切换',          desc_en: 'Complete list of all wiki pages, with grouping support',             desc_ja: '全 wiki ページの一覧、グループ切替対応' },
  { id: 'Special:Statistics',      key: 'sp_statistics',  desc: '知识库统计：K 值增长曲线、质量分布、页面计数',    desc_en: 'Knowledge base stats: K-score growth, quality distribution, page count', desc_ja: 'ナレッジベース統計：K スコア推移・品質分布・ページ数' },
  { id: 'Special:Settings',        key: 'sp_settings',    desc: '用户设置',                                        desc_en: 'User settings',                                                      desc_ja: 'ユーザー設定' },
  { id: 'Special:Plugins',         key: 'sp_plugins',     desc: '已安装插件列表',                                  desc_en: 'List of installed plugins',                                          desc_ja: 'インストール済みプラグイン一覧' },
  { id: 'Special:All',             key: 'sp_all',         desc: '所有特殊系统页面索引',                            desc_en: 'Index of all special system pages',                                  desc_ja: '全特別システムページの索引' },
  { id: 'Special:Random',          key: 'sp_random',      desc: '随机跳转到一个非章节页面',                        desc_en: 'Jump to a random non-chapter page',                                  desc_ja: 'ランダムな非章節ページへジャンプ' },
  { id: 'Special:Variables',       key: 'sp_variables',   desc: '所有可在页面中使用的 {{变量名}} 及其当前值',      desc_en: 'All {{variable}} template variables and their current values',       desc_ja: 'ページで使用可能な全 {{変数名}} と現在値' },
  { id: 'Special:SemanticHistory', key: 'sp_sem_hist',    desc: '按页面类型、作者、变更类型、日期查询修订历史',    desc_en: 'Query revision history by type, author, change type, and date',      desc_ja: '種類・編集者・変更種別・日付で編集履歴を検索' },
];

function setPage(core, title, html) {
  document.body.classList.remove('is-home');
  document.getElementById('article').innerHTML = html;
  const ib = document.getElementById('infobox');
  if (ib) ib.outerHTML = '<aside class="infobox" id="infobox" hidden></aside>';
  document.getElementById('crumb').textContent = 'Special / ' + title;
  document.title = title + ' · ' + core.siteName;
  document.getElementById('src-info').innerHTML = '';
  document.getElementById('broken-info').textContent = '';
  window.scrollTo(0, 0);
}

// 从 plugins.json 加载插件定义（供 Settings 和 Plugins 页使用）
// 注意：此缓存在同一页面会话中保持，切换路由不会重新 fetch。
// 若需强制刷新，使用 getPluginDefs(true)。
let _pluginDefs = null;
async function getPluginDefs(force = false) {
  if (_pluginDefs && !force) return _pluginDefs;
  try {
    const r = await fetch('plugins.json?t=' + Date.now());
    if (!r.ok) return [];
    const m = await r.json();
    _pluginDefs = (m.plugins || []).map(p =>
      typeof p === 'string'
        ? { key: p, names: { zh: p, en: p, ja: p }, descs: {}, id: p, corePlugin: false }
        : {
            key:   p.settings_key || p.id,
            names: { zh: p.name || p.id, en: p.name_en || p.name || p.id, ja: p.name_ja || p.name_en || p.name || p.id },
            descs: { zh: p.description_zh || '', en: p.description_en || p.description_zh || '', ja: p.description_ja || p.description_en || p.description_zh || '' },
            id:    p.id,
            corePlugin: !!p.core,
          }
    );
    return _pluginDefs;
  } catch { return []; }
}

export async function renderSpecialSettings(core) {
  const t = k => core.t?.(k) ?? k;
  setPage(core, t('special_settings'), `
    <h1>Special:Settings</h1>
    <p class="muted">${t('settings_note')}</p>
    <h2>${t('settings_special')}</h2>
    <p>→ <a href="#${encodeURIComponent('Special:Plugins')}">Special:Plugins</a> &nbsp;
       → <a href="#${encodeURIComponent('Special:All')}">Special:All</a></p>
    <div id="plugin-settings"></div>
  `);
  const container = document.getElementById('plugin-settings');
  if (container && core.hooks?.onRenderSettings) {
    await core.hooks.onRenderSettings.run(container);
  }
}

/* ── Special:Plugins ── */
export async function renderSpecialPlugins(core) {
  const t = k => core.t?.(k) ?? k;
  const PLUGIN_DEFS = await getPluginDefs(true);

  const lang = core.lang;
  const makeRow = p => `<tr>
    <td><strong>${escapeHtml(p.names[lang] || p.names.en || '')}</strong></td>
    <td><small class="muted">${escapeHtml(p.id || p.key || '')}</small></td>
    <td>${p.corePlugin ? t('plugin_core_badge') : t('plugin_enabled_badge')}</td>
    <td><small class="muted">${escapeHtml(p.descs[lang] || p.descs.en || '')}</small></td>
  </tr>`;

  const cols = `<th>${t('plugin_col_plugin')}</th><th>${t('plugin_col_id')}</th><th>${t('plugin_col_status')}</th><th>${t('plugin_col_desc')}</th>`;
  const coreRows     = PLUGIN_DEFS.filter(p =>  p.corePlugin).map(makeRow).join('');
  const optionalRows = PLUGIN_DEFS.filter(p => !p.corePlugin).map(makeRow).join('');

  const optionalSection = optionalRows ? `
    <h2>${t('plugin_optional_title')}</h2>
    <table>
      <thead><tr>${cols}</tr></thead>
      <tbody>${optionalRows}</tbody>
    </table>` : '';

  setPage(core, t('special_plugins'), `
    <h1>Special:Plugins</h1>

    <h2>${t('plugin_core_title')} <small class="muted">（${t('stat_always_on')}）</small></h2>
    <table>
      <thead><tr>${cols}</tr></thead>
      <tbody>${coreRows}</tbody>
    </table>
    ${optionalSection}
  `);
}

/* ── Special:All ── */
export function renderSpecialAll(core) {
  const t = k => core.t?.(k) ?? k;

  // 用 Map 去重：优先级 SPECIAL_PAGES > core.specialPages > registry
  // 避免插件 registerSpecialPage 与硬编码列表重复导致 label=undefined 出现两次
  const byPid = new Map();
  const put = (pid, entry) => {
    if (!byPid.has(pid)) byPid.set(pid, entry);
  };

  SPECIAL_PAGES.forEach(p => put(p.id, { pid: p.id, key: p.key }));
  (core.specialPages || []).forEach(p => put(p.id, { pid: p.id, label: p.label }));
  Object.entries(core.registry.pages)
    .filter(([pid]) => pid.startsWith('Special:'))
    .forEach(([pid, e]) => put(pid, { pid, label: e.label || pid }));

  const all = [...byPid.values()].sort((a, b) => a.pid.localeCompare(b.pid));

  const rows = all.map(({ pid, key, label }) => {
    const def = SPECIAL_PAGES.find(p => p.id === pid);
    const displayLabel = key ? t(key) : escapeHtml(label || pid);
    return `<tr>
      <td><a href="#${encodeURIComponent(pid)}">${escapeHtml(pid)}</a></td>
      <td>${displayLabel}</td>
      <td class="muted">${def ? escapeHtml(pickDesc(def, core.lang)) : ''}</td>
    </tr>`;
  }).join('');

  setPage(core, t('special_all'), `
    <h1>Special:All — ${t('sp_all')}</h1>
    <table>
      <thead><tr><th>${t('sp_col_id')}</th><th>${t('sp_col_title')}</th><th>${t('sp_col_desc')}</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `);
}

/* ── Special:Statistics — 统计页（K 值增长 + 质量分布）── */
export async function renderSpecialStatistics(core) {
  const t = k => core.t?.(k) ?? k;

  // 加载时间线数据
  let timeline = [];
  try {
    const r = await fetch('data/knowledge_timeline.jsonl');
    if (r.ok) {
      const text = await r.text();
      timeline = text.trim().split('\n').filter(Boolean).map(l => JSON.parse(l));
    }
  } catch (e) { /* 无数据则不画图 */ }

  // 加载最新快照
  let latest = null;
  try {
    const r = await fetch('data/knowledge_latest.json');
    if (r.ok) latest = await r.json();
  } catch (e) { /* ignore */ }

  const K = latest ? latest.K.toLocaleString() : '—';
  const pages = latest ? latest.page_count : '—';
  const hitRate = latest ? (latest.link_hit_rate * 100).toFixed(1) + '%' : '—';
  const qc = latest && latest.quality_counts ? latest.quality_counts : {};
  const premium = qc.premium ?? (latest ? latest.featured_count : '—');

  // SVG 折线图
  const chartHtml = buildKChart(timeline, t);
  const premiumChartHtml = buildPremiumChart(timeline, t);
  const qualityStackHtml = buildQualityStackChart(timeline, t);

  // 质量分布表格
  const QUALITY_TIERS = [
    ['premium',  t('quality_premium'), '#9f7aea'],
    ['featured', t('quality_featured'), '#4f9cf9'],
    ['standard', t('quality_standard'), '#68d391'],
    ['basic',    t('quality_basic'),    '#fbd38d'],
    ['stub',     t('quality_stub'),     '#fc8181'],
  ];
  const total = Object.values(qc).reduce((a, b) => a + b, 0) || 1;
  const qualityRows = QUALITY_TIERS.map(([key, label, color]) => {
    const n = qc[key] || 0;
    const pct = (n / total * 100).toFixed(1);
    const barW = Math.round(n / total * 200);
    return `<tr>
      <td><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${color};margin-right:6px"></span>${label} (${key})</td>
      <td style="text-align:right;font-variant-numeric:tabular-nums">${n.toLocaleString()}</td>
      <td style="text-align:right;color:var(--fg-muted)">${pct}%</td>
      <td><div style="display:inline-block;height:8px;width:${barW}px;background:${color};border-radius:2px;vertical-align:middle"></div></td>
    </tr>`;
  }).join('');

  // K 公式
  const formula = `
    <blockquote>
      <code>K = Σ_page  log₂(1+B) × (1 + min(D,5)) × W × clamp(q/30, 1, 3)</code>
    </blockquote>
    <table>
      <thead><tr><th>${t('stat_col_var')}</th><th>${t('stat_col_meaning')}</th><th>${t('plugin_col_desc')}</th></tr></thead>
      <tbody>
        <tr><td><b>B</b></td><td>${t('stat_var_b_meaning')}</td><td>${t('stat_var_b_note')}</td></tr>
        <tr><td><b>D</b></td><td>${t('stat_var_d_meaning')}</td><td>${t('stat_var_d_note')}</td></tr>
        <tr><td><b>W</b></td><td>${t('stat_var_w_meaning')}</td><td>${t('stat_var_w_note')}</td></tr>
        <tr><td><b>q</b></td><td>${t('stat_var_q_meaning')}</td><td>${t('stat_var_q_note')}</td></tr>
      </tbody>
    </table>`;

  const top10 = latest && latest.top10_pages ? latest.top10_pages.map((p, i) =>
    `<tr><td>${i + 1}</td><td><a href="#${encodeURIComponent(p.pid)}">${escapeHtml(p.pid)}</a></td><td>${p.k}</td></tr>`
  ).join('') : '';

  setPage(core, t('special_statistics'), `
    <h1>Special:Statistics — ${t('special_statistics')}</h1>

    <div class="k-stat-bar">
      <div class="k-stat"><span class="k-stat-val">${K}</span><span class="k-stat-label">${t('stat_current_k')}</span></div>
      <div class="k-stat"><span class="k-stat-val">${pages}</span><span class="k-stat-label">${t('stat_total_pages')}</span></div>
      <div class="k-stat"><span class="k-stat-val">${premium}</span><span class="k-stat-label">${t('stat_premium_pages')}</span></div>
      <div class="k-stat"><span class="k-stat-val">${hitRate}</span><span class="k-stat-label">${t('stat_link_hit_rate')}</span></div>
    </div>

    <h2>${t('stat_k_chart')}</h2>
    ${chartHtml}

    <h2>${t('stat_premium_chart')}</h2>
    ${premiumChartHtml}

    <h2>${t('stat_quality_time')}</h2>
    ${qualityStackHtml}

    <h2>${t('stat_quality_current')}</h2>
    <p class="chart-desc">${t('stat_quality_table_desc')}</p>
    <table>
      <thead><tr><th>${t('stat_col_level')}</th><th>${t('stat_col_count')}</th><th>${t('stat_col_ratio')}</th><th>${t('stat_col_dist')}</th></tr></thead>
      <tbody>${qualityRows}</tbody>
    </table>

    <h2>${t('stat_formula_title')}</h2>
    ${formula}

    <h2>${t('stat_top10')}</h2>
    <table>
      <thead><tr><th>#</th><th>${t('rc_col_page')}</th><th>K</th></tr></thead>
      <tbody>${top10}</tbody>
    </table>

    <h2>${t('stat_design_goals')}</h2>
    <ul>
      <li>${t('stat_goal_depth')}</li>
      <li>${t('stat_goal_nodump')}</li>
      <li>${t('stat_goal_quality')}</li>
      <li>${t('stat_goal_chapter')}</li>
    </ul>

    <p class="muted">${t('stat_note_excl')}
    →&nbsp;<a href="#${encodeURIComponent('Special:Settings')}">Special:Settings</a>
    &nbsp;·&nbsp;<a href="#${encodeURIComponent('Special:All')}">Special:All</a></p>
  `);
}

function _buildSvgBase(timeline, vals, color, yLabel, maxTickCount = 8) {
  const W = 900, H = 320, PAD = { top: 28, right: 24, bottom: 48, left: 68 };
  const cw = W - PAD.left - PAD.right;
  const ch = H - PAD.top - PAD.bottom;

  const minV = Math.min(...vals) * 0.97;
  const maxV = Math.max(...vals) * 1.01;
  const xScale = (i) => PAD.left + (i / (timeline.length - 1 || 1)) * cw;
  const yScale = (v) => PAD.top + ch - ((v - minV) / (maxV - minV || 1)) * ch;

  const points = timeline.map((d, i) => `${xScale(i).toFixed(1)},${yScale(vals[i]).toFixed(1)}`).join(' ');

  // area fill under line
  const areaClose = `${xScale(timeline.length - 1).toFixed(1)},${PAD.top + ch} ${xScale(0).toFixed(1)},${PAD.top + ch}`;

  const yTicks = 6;
  const yTickHtml = Array.from({ length: yTicks + 1 }, (_, i) => {
    const v = minV + (maxV - minV) * (i / yTicks);
    const y = yScale(v).toFixed(1);
    const label = v >= 1000 ? Math.round(v).toLocaleString() : Math.round(v);
    return `<line x1="${PAD.left}" y1="${y}" x2="${PAD.left + cw}" y2="${y}" stroke="var(--border)" stroke-dasharray="4,4"/>
      <text x="${PAD.left - 8}" y="${y}" text-anchor="end" dominant-baseline="middle" font-size="12" fill="var(--fg-muted)">${label}</text>`;
  }).join('');

  const step = Math.ceil(timeline.length / maxTickCount);
  const xTickHtml = timeline.map((d, i) => {
    if (i % step !== 0 && i !== timeline.length - 1) return '';
    const x = xScale(i).toFixed(1);
    const label = d.generated ? d.generated.slice(0, 10) : '';
    return `<text x="${x}" y="${H - PAD.bottom + 16}" text-anchor="middle" font-size="11" fill="var(--fg-muted)">${label}</text>`;
  }).join('');

  return { W, H, PAD, cw, ch, xScale, yScale, points, areaClose, yTickHtml, xTickHtml, color };
}

function buildKChart(timeline, t) {
  if (!timeline.length) return `<p class="muted">${t('stat_no_data')}</p>`;

  const vals = timeline.map(d => d.K);
  const { W, H, PAD, cw, ch, xScale, yScale, points, areaClose, yTickHtml, xTickHtml } = _buildSvgBase(timeline, vals, 'var(--accent)');

  return `
  <p class="chart-desc">${t('stat_k_chart_desc')}</p>
  <div class="k-chart-wrap">
  <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block">
    ${yTickHtml}
    <polygon points="${points} ${areaClose}" fill="rgba(var(--accent-rgb,220,38,38),0.08)" stroke="none"/>
    <polyline points="${points}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round"/>
    ${timeline.map((d, i) => `<circle cx="${xScale(i).toFixed(1)}" cy="${yScale(vals[i]).toFixed(1)}" r="3.5" fill="var(--accent)"/>`).join('')}
    ${xTickHtml}
    <text x="${PAD.left - 8}" y="${PAD.top - 10}" font-size="12" fill="var(--accent)" text-anchor="end">${t('stat_k_axis')}</text>
    <text x="${PAD.left + cw / 2}" y="${H - 6}" font-size="12" fill="var(--fg-muted)" text-anchor="middle">${t('stat_date_axis')}</text>
  </svg>
  </div>`;
}

function buildPremiumChart(timeline, t) {
  if (!timeline.length) return '';

  // 兼容旧快照（featured_count）和新快照（quality_counts.premium）
  const vals = timeline.map(d =>
    d.quality_counts ? (d.quality_counts.premium || 0) : (d.featured_count || 0)
  );
  if (Math.max(...vals) === 0) return `<p class="muted">${t('stat_no_premium_data')}</p>`;

  const color = 'rgba(159,122,234,1)';
  const { W, H, PAD, cw, ch, xScale, yScale, points, areaClose, yTickHtml, xTickHtml } = _buildSvgBase(timeline, vals, color);

  const dotHtml = timeline.map((d, i) => {
    const cx = xScale(i).toFixed(1), cy = yScale(vals[i]).toFixed(1);
    return `<circle cx="${cx}" cy="${cy}" r="3.5" fill="${color}"/>`;
  }).join('');

  return `
  <p class="chart-desc">${t('stat_premium_chart_desc')}</p>
  <div class="k-chart-wrap">
  <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block">
    ${yTickHtml}
    <polygon points="${points} ${areaClose}" fill="rgba(159,122,234,0.18)" stroke="none"/>
    <polyline points="${points}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round"/>
    ${dotHtml}
    ${xTickHtml}
    <text x="${PAD.left - 8}" y="${PAD.top - 10}" font-size="12" fill="${color}" text-anchor="end">${t('stat_premium_axis')}</text>
    <text x="${PAD.left + cw / 2}" y="${H - 6}" font-size="12" fill="var(--fg-muted)" text-anchor="middle">${t('stat_date_axis')}</text>
  </svg>
  </div>
  <p class="chart-desc" style="color:var(--fg-muted)">⚠️ ${t('stat_premium_chart_warn')}</p>`;
}

/* 质量分布堆叠面积图 */
function buildQualityStackChart(timeline, t) {
  // 只用有 quality_counts 的快照
  const data = timeline.filter(d => d.quality_counts);
  if (data.length < 2) {
    return `<p class="muted">${t('stat_no_data')} (${data.length}/2)</p>`;
  }

  const TIERS = [
    { key: 'stub',     color: 'rgba(252,129,129,0.85)',  label: t('quality_stub') },
    { key: 'basic',    color: 'rgba(251,211,141,0.85)',  label: t('quality_basic') },
    { key: 'standard', color: 'rgba(104,211,145,0.85)', label: t('quality_standard') },
    { key: 'featured', color: 'rgba(79,156,249,0.85)',  label: t('quality_featured') },
    { key: 'premium',  color: 'rgba(159,122,234,1)',     label: t('quality_premium') },
  ];

  const W = 900, H = 320, PAD = { top: 28, right: 120, bottom: 48, left: 68 };
  const cw = W - PAD.left - PAD.right;
  const ch = H - PAD.top - PAD.bottom;
  const n = data.length;

  const xScale = i => PAD.left + (i / (n - 1)) * cw;

  // 每个时间点各层累积高度
  const stacks = data.map(d => {
    const qc = d.quality_counts;
    let acc = 0;
    return TIERS.map(t => {
      const v = qc[t.key] || 0;
      const bot = acc;
      acc += v;
      return { v, bot, top: acc };
    });
  });

  const maxTotal = Math.max(...stacks.map(s => s[TIERS.length - 1].top));
  const yScale = v => PAD.top + ch - (v / (maxTotal || 1)) * ch;

  // 绘制每层堆叠多边形
  const layersSvg = TIERS.map((tier, ti) => {
    // 上边缘从左到右，下边缘从右到左
    const topPts = data.map((_, i) => `${xScale(i).toFixed(1)},${yScale(stacks[i][ti].top).toFixed(1)}`).join(' ');
    const botPts = data.map((_, i) => `${xScale(i).toFixed(1)},${yScale(stacks[i][ti].bot).toFixed(1)}`).reverse().join(' ');
    return `<polygon points="${topPts} ${botPts}" fill="${tier.color}" stroke="none"/>`;
  }).join('');

  // Y 轴刻度
  const yTicks = 5;
  const yTickHtml = Array.from({ length: yTicks + 1 }, (_, i) => {
    const v = maxTotal * i / yTicks;
    const y = yScale(v).toFixed(1);
    const label = Math.round(v).toLocaleString();
    return `<line x1="${PAD.left}" y1="${y}" x2="${PAD.left + cw}" y2="${y}" stroke="var(--border)" stroke-dasharray="3,3"/>
      <text x="${PAD.left - 8}" y="${y}" text-anchor="end" dominant-baseline="middle" font-size="11" fill="var(--fg-muted)">${label}</text>`;
  }).join('');

  // X 轴日期
  const step = Math.ceil(n / 8);
  const xTickHtml = data.map((d, i) => {
    if (i % step !== 0 && i !== n - 1) return '';
    return `<text x="${xScale(i).toFixed(1)}" y="${H - PAD.bottom + 16}" text-anchor="middle" font-size="11" fill="var(--fg-muted)">${(d.generated || '').slice(0, 10)}</text>`;
  }).join('');

  // 图例（右侧）
  const legendHtml = TIERS.slice().reverse().map((t, i) => {
    const y = PAD.top + i * 22;
    return `<rect x="${W - PAD.right + 8}" y="${y}" width="12" height="12" fill="${t.color}" rx="2"/>
      <text x="${W - PAD.right + 26}" y="${y + 10}" font-size="12" fill="var(--fg)">${t.label}</text>`;
  }).join('');

  return `
  <p class="chart-desc">${t('stat_quality_chart_desc')}</p>
  <div class="k-chart-wrap">
  <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block">
    ${yTickHtml}
    ${layersSvg}
    <line x1="${PAD.left}" y1="${PAD.top}" x2="${PAD.left}" y2="${PAD.top + ch}" stroke="var(--border)"/>
    ${xTickHtml}
    ${legendHtml}
  </svg>
  </div>`;
}
