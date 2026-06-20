# hero — 首页英雄区插件（通用框架）

渲染首页英雄区，包括标题、搜索框外壳、以及可插拔的背景动画。

## 功能

在 `core` 上挂载：

| 方法 | 说明 |
|------|------|
| `core.startMatrixRain()` | 启动英雄区动画 |
| `core.stopMatrixRain()` | 停止动画 |
| `core.buildHeroHtml(entityCount)` | 返回英雄区完整 HTML 字符串 |
| `core.heroDocTitle` | 首页文档标题 |
| `core.renderHeroShell(core)` | 渲染英雄区外壳（仅首次） |

## 脚本依赖

无。

## 数据依赖

无。英雄区文字内容全部来自 local config。

## local config 必须项

文件：`local/config/hero.js`

| 导出名 | 类型 | 必须 | 说明 |
|--------|------|------|------|
| `EYEBROW` | `string` | 是 | 标题上方小标（如"第三版"） |
| `TITLE` | `string` | 是 | 主标题文字 |
| `TAGLINE` | `string` | 是 | 副标题/口号 |
| `DOC_TITLE` | `string` | 是 | 首页 `<title>` 文字 |
| `SEARCH_PLACEHOLDER` | `string` | 是 | 词条搜索框占位文字 |
| `SEARCH_PLACEHOLDER_FTS` | `string` | 是 | FTS 模式占位文字（search 插件读取） |
| `BOOK_META` | `Array` | 是 | 首页书册卡片配置（renderer.js 读取） |
| `buildHeroBackground()` | `function` | 否 | 返回背景区 HTML（canvas/img/svg/''）；缺省为空字符串 |
| `startHeroAnimation(setStop)` | `function` | 否 | 启动背景动画，调用 `setStop(fn)` 注册清理回调；缺省为无操作 |

示例（矩阵字符雨）：

```js
// local/config/hero.js
export const TITLE = '人工智能简史';
export const TAGLINE = '从图灵到 ChatGPT';
export const DOC_TITLE = '人工智能简史 Wiki';
export const EYEBROW = '第三版';
export const SEARCH_PLACEHOLDER = '搜索人物、系统、概念…';
export const SEARCH_PLACEHOLDER_FTS = '搜索原文段落…';

export const BOOK_META = [{ key: 'v1', label: '第一卷', subtitle: '...', min: 1, max: 8 }];

export function buildHeroBackground() {
  return `<canvas id="matrix-rain" class="hero-cosmos" aria-hidden="true"></canvas>`;
}

export function startHeroAnimation(setStop) {
  // canvas 动画代码…
  const id = requestAnimationFrame(tick);
  setStop(() => cancelAnimationFrame(id));
}
```
