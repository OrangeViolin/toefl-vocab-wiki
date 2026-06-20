/**
 * i18n — 国际化插件
 *
 * 在 core 上挂载：
 *   core.lang              当前语言代码（'zh' | 'en' | ...）
 *   core.t(key)            返回当前语言的翻译字符串；key 不存在时降级至 DEFAULT_LANG，再降级返回 key 本身
 *   core.setLang(lang)     切换语言，持久化到 localStorage，触发页面重渲染
 *
 * 本地配置（local/config/i18n.config.js）：
 *   export const defaultLang = 'zh';   // 'zh' | 'en'
 *
 * 语言优先级：localStorage（用户上次选择）> i18n.config.js（项目默认）> 'zh'（全局兜底）
 *
 * HTML 中用 data-i18n="key" 标记需翻译的文本节点，
 * 用 data-i18n-placeholder="key" 标记需翻译的 placeholder 属性。
 * applyI18nToDOM 在 onBoot 和 setLang 时自动替换。
 */

import { STRINGS, SUPPORTED_LANGS, DEFAULT_LANG } from './strings.js';

function applyI18nToDOM(core) {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = core.t(el.getAttribute('data-i18n'));
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = core.t(el.getAttribute('data-i18n-placeholder'));
  });
  document.documentElement.lang = core.lang === 'zh' ? 'zh-CN' : core.lang;
}

export default {
  init(core, localConfig) {
    // ── 确定初始语言 ─────────────────────────────────────────────────────────
    const stored   = core.settings.lang;
    const fromConf = localConfig.defaultLang;
    const lang     = SUPPORTED_LANGS.includes(stored)   ? stored
                   : SUPPORTED_LANGS.includes(fromConf) ? fromConf
                   : DEFAULT_LANG;

    core.lang = lang;

    // ── 翻译函数 ──────────────────────────────────────────────────────────────
    core.t = (key) =>
      STRINGS[key]?.[core.lang] ??
      STRINGS[key]?.[DEFAULT_LANG] ??
      key;

    // ── 切换语言 ──────────────────────────────────────────────────────────────
    core.setLang = (newLang) => {
      if (!SUPPORTED_LANGS.includes(newLang) || newLang === core.lang) return;
      core.lang = newLang;
      core.setSetting('lang', newLang);
      applyI18nToDOM(core);
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    };

    // ── onBoot：替换静态 HTML 中的 data-i18n 占位符，注入语言选择器 ──────────
    core.hooks.onBoot.add(() => {
      applyI18nToDOM(core);

      const panel = document.getElementById('settings-panel');
      if (!panel) return;

      const label = document.createElement('label');
      label.className = 'setting-item';
      label.innerHTML =
        `<span data-i18n="lang_label">${core.t('lang_label')}</span>` +
        `<select id="setting-lang">` +
        SUPPORTED_LANGS.map(l =>
          `<option value="${l}"${l === core.lang ? ' selected' : ''}>${core.t('lang_' + l)}</option>`
        ).join('') +
        `</select>`;
      panel.appendChild(label);

      document.getElementById('setting-lang').addEventListener('change', (e) => {
        core.setLang(e.target.value);
      });
    });
  },
};
