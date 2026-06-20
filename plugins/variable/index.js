/**
 * variable — 模板变量替换插件
 *
 * 在 onBeforeRender hook 中把 MD 源里的 {{varName}} 替换为实际值。
 * 变量来源（后者覆盖前者）：
 *   1. plugins/variable/defaults.js — 通用系统变量（任何 wiki 可复用）
 *   2. local/config/variables.js   — 项目专属变量（本书常量等）
 *
 * 变量函数签名：(core, ctx) => value
 *   ctx = { pid, meta, front } — 页面级变量可用
 *
 * 同时注册 Special:Variables 展示所有变量及当前值。
 */

import { DEFAULT_VARIABLES } from './defaults.js';
import { VARIABLES } from '@wiki/local/config/variables.js';

const ALL_VARIABLES = { ...DEFAULT_VARIABLES, ...VARIABLES };

export default {
  async init(core) {
    // ── onBeforeRender：替换 {{varName}} ──────────────────────────────────────
    core.hooks.onBeforeRender.add((body, ctx) => {
      return body.replace(/\{\{([A-Za-z]\w*)\}\}/g, (_, name) => {
        const fn = ALL_VARIABLES[name];
        if (!fn) return `{{${name}}}`;
        try { return String(fn(core, ctx)); } catch { return `{{${name}}}`; }
      });
    });

    // ── Special:Variables ─────────────────────────────────────────────────────
    core.registerSpecialPage({
      id: 'Special:Variables',
      render(c) { renderSpecialVariables(c); },
    });
  },
};

function renderSpecialVariables(core) {
  const t = k => core.t?.(k) ?? k;
  const PAGE_VARS = new Set(['PAGENAME', 'PAGELABEL', 'PAGETYPE']);

  function rows(source, sourceLabel) {
    return Object.entries(source).map(([name, fn]) => {
      let value;
      if (PAGE_VARS.has(name)) {
        value = `<em>${t('var_page_level')}</em>`;
      } else {
        try { value = escapeHtml(String(fn(core, null))); } catch { value = `<em>${t('var_eval_failed')}</em>`; }
      }
      return `<tr><td><code>{{${escapeHtml(name)}}}</code></td><td>${value}</td><td>${escapeHtml(sourceLabel)}</td></tr>`;
    }).join('');
  }

  const title = t('sp_variables');
  const html = `
    <h1>${title} <small style="font-size:.6em;font-weight:normal">Special:Variables</small></h1>
    <table class="wikitable" style="width:100%">
      <thead><tr><th>${t('var_col_name')}</th><th>${t('var_col_value')}</th><th>${t('var_col_source')}</th></tr></thead>
      <tbody>
        ${rows(DEFAULT_VARIABLES, 'defaults.js')}
        ${rows(VARIABLES, 'local/config/variables.js')}
      </tbody>
    </table>`;

  document.body.classList.remove('is-home');
  document.getElementById('article').innerHTML = html;
  const ib = document.getElementById('infobox');
  if (ib) { ib.innerHTML = ''; ib.hidden = true; }
  document.getElementById('crumb').textContent = `Special / ${title}`;
  document.title = title + ' · ' + core.siteName;
  document.getElementById('src-info').innerHTML = '';
  document.getElementById('broken-info').textContent = '';
  window.scrollTo(0, 0);
}

function escapeHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
