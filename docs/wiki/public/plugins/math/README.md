# math — KaTeX 数学公式插件

渲染 `$...$` 行内公式和 `$$...$$` 块级公式。

## 功能

- `onAfterRender` hook：对 HTML 字符串中的 `<span class="math-inline">` 和 `<div class="math-block">` 调用 `katex.renderToString`
- 无 DOM 时序问题（在 HTML 字符串层面处理，不依赖 DOM）
- KaTeX 通过 CDN 按需加载（首次渲染含公式的页面时）

注：`parser.js` 在 MD 解析时已将 `\(...\)` 和 `\[...\]` 包裹为上述 HTML 标签；本插件只负责渲染。

## 脚本依赖

无。

## 数据依赖

无。

**外部 CDN 依赖（运行时）：**

| 库 | URL |
|----|-----|
| KaTeX CSS | `https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css` |
| KaTeX JS | `https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js` |

网络不可用时公式渲染失败，原始 LaTeX 源码可见。

## local config 必须项

无。本插件无 `local/config/math.js`。
