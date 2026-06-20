/* 入口。 加载依赖 / 注册表 / 插件, 启动路由器。 */

import { createHooks } from './hooks.js';
import { loadRegistry, loadFullRegistry, extendRegistry } from './registry.js';
import { setupRouter } from './router.js';
import { createMarkdownIt } from './parser.js';
import { showFatal } from './util.js';
import * as _settings from '@wiki/local/LocalSettings.js';
const wgSiteName       = _settings.wgSiteName       ?? 'Wiki';
// wgEnabledPlugins：仅用于强制加载 plugins.json 之外的实验性插件（通常为空）
const wgEnabledPlugins = _settings.wgEnabledPlugins  ?? [];
// wgDisabledPlugins：显式禁用不需要的插件（opt-out 机制）
const wgDisabledPlugins = _settings.wgDisabledPlugins ?? [];

const DEBUG = new URLSearchParams(location.search).has('debug');
const log = DEBUG ? (...a) => console.log('[wiki]', ...a) : () => {};

const HOOK_NAMES = [
  'onBoot',          // (core)                              启动完成, 插件已加载
  'onRoute',         // (raw, core) → string | null | undef 自定义路由
  'onBeforeRender',  // (body, {pid,meta,front}) → body     MD 源预处理
  'onAfterRender',   // (html, {pid,meta,front}) → html     HTML 后处理
  'onInfobox',       // (rows, front, meta) → rows          Infobox 行定制
  'onRenderSettings',// (container)                         设置页渲染, 插件添加 UI
  'onFormatTime',    // (timestamp, options) → string      时间格式化 hook
];

const SETTINGS_KEY = 'wiki_settings';
const SETTINGS_DEFAULTS = { autoWikilink: false };

function loadSettings() {
  try {
    return Object.assign({}, SETTINGS_DEFAULTS, JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'));
  } catch { return { ...SETTINGS_DEFAULTS }; }
}

function saveSettings(settings) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch {}
}

async function boot() {
  const core = {
    hooks: createHooks(HOOK_NAMES),
    registry: null,
    md: null,
    plugins: [],
    specialPages: [],
    settings: loadSettings(),
    siteName: wgSiteName,
  };
  core.setSetting = (key, val) => {
    core.settings[key] = val;
    saveSettings(core.settings);
  };
  core.registerSpecialPage = (def) => core.specialPages.push(def);
  window.__wiki = core;

  if (!window.markdownit || !window.jsyaml) {
    showFatal('依赖未加载 (markdown-it / js-yaml)');
    return;
  }
  core.md = createMarkdownIt();

  const hasRoute = location.hash.length > 1;

  try {
    // 1. 快速加载轻量注册表（仅 wikilink 解析所需字段）
    core.registry = await loadRegistry('pages.lite.json');
    log(`lite registry loaded: ${core.registry.page_count} pages`);

    // 2. 后台加载全量数据，合并后升级搜索/category 等特性。
    //    catch 将 rejection 转为 resolved(undefined)，是有意为之的降级设计：
    //    renderHome 的 await fullRegistryReady 不会因网络失败而抛错。
    core.fullRegistryReady = loadFullRegistry('pages.json').then(full => {
      extendRegistry(core.registry, full);
      log('full registry merged');
    }).catch(e => {
      console.warn('[wiki] full registry load failed, using lite:', e.message);
    });
  } catch (e) {
    showFatal('无法加载 pages.lite.json：' + e.message);
    return;
  }

  await loadPlugins(core);
  // 无 hash 路由时渲染英雄区（在插件加载后，确保 core.renderHeroShell 已就绪）
  if (!hasRoute && core.renderHeroShell) core.renderHeroShell(core);
  await core.hooks.onBoot.run(core);
  setupRouter(core);
}

async function loadPlugins(core) {
  // bundle 模式：插件已由 memex.min.js 静态打包，直接初始化，跳过网络请求
  const preloaded = window.__wikiPreloadedPlugins;
  if (preloaded) {
    const disabledSet = new Set(wgDisabledPlugins);
    const entries = preloaded.entries.filter(e => !disabledSet.has(e.id));

    // 阶段 1：尝试加载统一配置 plugins.config.js，不存在则回退到逐插件加载
    let unifiedConfigs = null;
    try {
      const mod = await import('@wiki/local/plugins.config.js');
      unifiedConfigs = mod.configs ?? {};
    } catch { /* 旧版兼容：逐插件加载 */ }

    const configMap = {};
    await Promise.all(entries.map(async entry => {
      if (entry.localConfig === 'no') return;
      if (unifiedConfigs && entry.id in unifiedConfigs) {
        configMap[entry.id] = unifiedConfigs[entry.id];
      } else {
        configMap[entry.id] = await import('@wiki/local/config/' + entry.id + '.config.js').catch(() => ({}));
      }
    }));

    // 阶段 2：顺序初始化插件（init 会写 core，不能并发）
    for (const entry of entries) {
      const mod = preloaded.modules[entry.entry];
      if (!mod) continue;
      const p = mod.default;
      if (!p || typeof p.init !== 'function') {
        console.warn(`[plugin] ${entry.id} 缺少 default.init`);
        continue;
      }
      try {
        await p.init(core, configMap[entry.id] ?? {});
        core.plugins.push({
          id:          entry.id,
          name:        entry.name        || entry.id,
          version:     entry.version     || '?',
          description: entry.description || '',
          core:        !!entry.core,
        });
        log(`plugin ${entry.id} v${entry.version || '?'} loaded`);
      } catch (e) {
        console.error(`[plugin] ${entry.id} init 失败:`, e);
      }
    }
    return;
  }

  // 动态加载模式（本地开发）
  let manifest;
  try {
    const bust = '?t=' + Date.now();
    let r = await fetch('plugins.json' + bust);
    if (!r.ok) {
      const cdn = document.querySelector('meta[name=cdn-base]')?.content;
      if (!cdn) return;
      r = await fetch(cdn + '/plugins.json' + bust);
      if (!r.ok) return;
    }
    manifest = await r.json();
  } catch {
    return;
  }

  // wgDisabledPlugins：显式禁用指定插件（opt-out）
  // wgEnabledPlugins：仅用于强制加载 plugins.json 之外的实验性插件（通常为空）
  // plugins.json 中的全部插件默认加载，除非在 wgDisabledPlugins 中声明
  const disabledSet = new Set(wgDisabledPlugins);

  const entries = (manifest.plugins || []).filter(entry => {
    if (disabledSet.has(entry.id)) {
      console.debug(`[plugin] ${entry.id} 已在 wgDisabledPlugins 中，跳过`);
      return false;
    }
    // 防御非法路径（如 ../../evil）
    if (!/^[\w\-/]+\.js$/.test(entry.entry)) {
      console.warn(`[plugin] ${entry.id} entry 路径非法，跳过:`, entry.entry);
      return false;
    }
    return true;
  });

  // 尝试加载统一配置 plugins.config.js，不存在则回退
  let unifiedConfigs = null;
  try {
    const mod = await import('@wiki/local/plugins.config.js');
    unifiedConfigs = mod.configs ?? {};
  } catch { /* 旧版兼容 */ }

  // 按依赖关系分批：同一批内无相互依赖，可并行 fetch；批次之间顺序 init。
  // entry.dependencies?: string[]  — 声明本插件依赖的其他插件 id 列表
  const inited = new Set();
  for (const batch of buildBatches(entries)) {
    // 同批并行 fetch（module + 本地配置）
    const fetched = await Promise.allSettled(
      batch.map(entry => {
        const bust = entry.version ? '?v=' + entry.version : '';
        const configPromise = entry.localConfig !== 'no'
          ? (unifiedConfigs && entry.id in unifiedConfigs
              ? Promise.resolve(unifiedConfigs[entry.id])
              : import('@wiki/local/config/' + entry.id + '.config.js').catch(() => ({})))
          : Promise.resolve({});
        return Promise.all([
          import('@wiki/' + entry.entry + bust),
          configPromise,
        ]);
      })
    );

    // 同批顺序 init（init 会写 core，不能并发）
    for (let i = 0; i < batch.length; i++) {
      const entry  = batch[i];
      const result = fetched[i];
      if (result.status === 'rejected') {
        console.error(`[plugin] ${entry.id} 加载失败:`, result.reason);
        continue;
      }
      const [mod, localConfig] = result.value;
      const p = mod.default;
      if (!p || typeof p.init !== 'function') {
        console.warn(`[plugin] ${entry.id} 缺少 default.init`);
        continue;
      }
      try {
        await p.init(core, localConfig);
        core.plugins.push({
          id:          entry.id,
          name:        entry.name        || entry.id,
          version:     entry.version     || '?',
          description: entry.description || '',
          core:        !!entry.core,
        });
        inited.add(entry.id);
        log(`plugin ${entry.id} v${entry.version || '?'} loaded`);
      } catch (e) {
        console.error(`[plugin] ${entry.id} init 失败:`, e);
      }
    }
  }
}

/**
 * 将插件列表按依赖关系拓扑分批。
 * 同一批内的插件互不依赖，可并行 fetch；批次之间必须顺序 init。
 * 遇到循环依赖或声明了不存在的依赖时，剩余插件退化为单独一批（顺序处理）。
 */
function buildBatches(entries) {
  const ids      = new Set(entries.map(e => e.id));
  const remaining = entries.map(e => {
    const deps = (e.dependencies || []).filter(d => {
      if (!ids.has(d)) { console.warn(`[plugin] ${e.id} 依赖 ${d} 不在插件列表中，忽略`); return false; }
      return true;
    });
    return { entry: e, deps: new Set(deps) };
  });

  const batches  = [];
  const resolved = new Set();

  while (remaining.length) {
    const batch = remaining.filter(({ deps }) => [...deps].every(d => resolved.has(d)));
    if (!batch.length) {
      // 循环依赖兜底：剩余全部顺序加载
      console.warn('[plugin] 检测到循环依赖或无法解析的依赖，剩余插件将顺序加载');
      batches.push(remaining.map(({ entry }) => entry));
      break;
    }
    batches.push(batch.map(({ entry }) => entry));
    for (const { entry } of batch) {
      resolved.add(entry.id);
      remaining.splice(remaining.findIndex(r => r.entry.id === entry.id), 1);
    }
  }

  return batches;
}

boot();
