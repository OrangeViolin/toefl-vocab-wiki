/**
 * timezone — 本地时区时间显示插件
 *
 * 功能：
 *   1. 在设置页面提供时区选择器（IANA timezone 列表）
 *   2. 导出 formatLocalTime() 供其他插件调用
 *   3. 注册 core.hooks.onFormatTime
 *
 * 用户设置存储在 localStorage key 'wiki-timezone'。
 * 默认值：Intl.DateTimeFormat().resolvedOptions().timeZone（浏览器自动检测）
 * 若存在 local/config.md 的 TIMEZONE 配置，以该值覆盖默认。
 *
 * 用法：
 *   formatLocalTime(timestamp, options?)
 *     timestamp: Unix 秒数（number）或 ISO 字符串（string）
 *     options: { timezone?, format?, relative? }
 *       默认 timezone 从设置读取
 *       默认 format: 'YYYY-MM-DD HH:mm'
 */

const PLUGIN_NAME = 'timezone';

const STORAGE_KEY = 'wiki-timezone';

// IANA 常用时区列表（完整列表由用户键入，下拉提供常用选项）
const COMMON_ZONES = [
  'Asia/Shanghai', 'Asia/Tokyo', 'Asia/Seoul', 'Asia/Singapore',
  'Asia/Hong_Kong', 'Asia/Taipei', 'Asia/Kolkata',
  'Europe/London', 'Europe/Berlin', 'Europe/Paris', 'Europe/Moscow',
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Toronto', 'America/Sao_Paulo',
  'Australia/Sydney', 'Pacific/Auckland',
  'UTC',
];

function getStoredTimezone() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch { return null; }
}

function setStoredTimezone(tz) {
  try { localStorage.setItem(STORAGE_KEY, tz); } catch { /* noop */ }
}

function getEffectiveTimezone() {
  return getStoredTimezone()
    || (typeof CONFIG_TIMEZONE !== 'undefined' ? CONFIG_TIMEZONE : null)
    || Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * 将时间戳格式化为指定时区的本地时间字符串。
 *
 * @param {number|string} timestamp  - Unix 秒数 或 ISO 字符串
 * @param {Object}        options
 * @param {string}        [options.timezone] - IANA timezone（默认从设置读取）
 * @param {string}        [options.format]   - 'full' | 'date' | 'time' | 'relative'（默认 'full'）
 * @param {boolean}       [options.utc]      - 若 true，用 UTC 代替 timezone
 * @returns {string}
 */
function formatLocalTime(timestamp, options = {}) {
  const tz = options.utc ? 'UTC' : (options.timezone || getEffectiveTimezone());

  let date;
  if (typeof timestamp === 'number') {
    date = new Date(timestamp * 1000);
  } else {
    date = new Date(timestamp);
  }
  if (isNaN(date.getTime())) return String(timestamp);

  const fmt = options.format || 'full';

  // 相对时间
  if (fmt === 'relative') {
    const diffSec = (Date.now() - date.getTime()) / 1000;
    if (diffSec < 60) return '刚刚';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} 分钟前`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} 小时前`;
    if (diffSec < 2592000) return `${Math.floor(diffSec / 86400)} 天前`;
    // 回退到完整格式
  }

  try {
    const dtf = new Intl.DateTimeFormat('zh-CN', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: fmt === 'full' ? '2-digit' : undefined,
      hour12: false,
    });
    const parts = dtf.formatToParts(date);
    const map = {};
    for (const p of parts) map[p.type] = p.value;

    if (fmt === 'date') {
      return `${map.year}-${map.month}-${map.day}`;
    }
    if (fmt === 'time') {
      return `${map.hour}:${map.minute}`;
    }
    // full
    let result = `${map.year}-${map.month}-${map.day} ${map.hour}:${map.minute}`;
    if (map.second) result += `:${map.second}`;
    return result;
  } catch {
    // fallback: 浏览器本地时间
    const pad = n => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
}

/**
 * 生成本地化时区名称（如 "北京时间 (UTC+8)"）
 */
function getTimezoneLabel(tz) {
  if (tz === 'UTC') return 'UTC';
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('zh-CN', { timeZone: tz, timeZoneName: 'longOffset' });
    const parts = formatter.formatToParts(now);
    const offset = parts.find(p => p.type === 'timeZoneName')?.value || '';
    // 将 tz 的最后一段转换为友好名称
    const name = tz.split('/').pop().replace(/_/g, ' ');
    return `${name} (${offset})`;
  } catch {
    return tz;
  }
}

export default {
  name: PLUGIN_NAME,
  version: '1.0.0',

  async init(core, { TIMEZONE } = {}) {
    // 使 CONFIG_TIMEZONE 在模块作用域可见
    if (TIMEZONE) {
      window.CONFIG_TIMEZONE = TIMEZONE;
    }

    // 暴露接口供其他插件使用
    core.timezone = {
      format: formatLocalTime,
      get: getEffectiveTimezone,
      set: setStoredTimezone,
      getLabel: getTimezoneLabel,
      getCommonZones: () => COMMON_ZONES,
    };

    // ── Nav 下拉设置面板 ──
    core.hooks.onBoot?.add?.(() => {
      const panel = document.getElementById('settings-panel');
      if (!panel) return;

      const current = getEffectiveTimezone();
      const label = document.createElement('label');
      label.className = 'setting-item';
      label.innerHTML =
        `<span data-i18n="tz_settings_label">${core.t('tz_settings_label')}</span>` +
        `<select id="setting-tz">` +
        COMMON_ZONES.map(z =>
          `<option value="${z}"${z === current ? ' selected' : ''}>${getTimezoneLabel(z)}</option>`
        ).join('') +
        `</select>`;
      panel.appendChild(label);

      panel.querySelector('#setting-tz').addEventListener('change', (e) => {
        setStoredTimezone(e.target.value);
      });
    });

    // ── 设置页面 UI（Special:Settings）──
    core.hooks.onRenderSettings?.add?.((container) => {
      const current = getEffectiveTimezone();
      const section = document.createElement('div');
      section.className = 'settings-section';
      section.innerHTML = `
        <h3>${core.t('tz_settings_title')}</h3>
        <label>
          ${core.t('tz_settings_label')}
          <select id="tz-select">
            ${COMMON_ZONES.map(z =>
              `<option value="${z}" ${z === current ? 'selected' : ''}>${getTimezoneLabel(z)}</option>`
            ).join('')}
          </select>
        </label>
        <p class="muted" style="font-size:.85em;margin-top:4px">
          ${core.t('tz_settings_hint')}
        </p>
      `;
      container.appendChild(section);
      container.querySelector('#tz-select').addEventListener('change', (e) => {
        setStoredTimezone(e.target.value);
      });
    });

    // ── 格式化 hook ──
    core.hooks.onFormatTime?.add?.((timestamp, options) => {
      return formatLocalTime(timestamp, options);
    });
  },
};
