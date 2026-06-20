# math-array: KaTeX 行内公式 array/matrix 修复

## 问题

KaTeX **行内模式**（`$...$`，`displayMode=false`）不支持 `\\` 换行。当 LaTeX 公式包含 `array`、`matrix`、`split` 等环境时，必须使用 **块级模式**（`$$...$$`，`displayMode=true`）才能正确渲染换行。

在 wiki 内容中，这些公式通常以 `$...$` 编写（与原文 epub 来源一致），需要自动提升为 `$$...$$`。

## 工作原理

在 `onBeforeRender` hook 中，检测 `$...$` 内是否包含 `\\` 换行符：

- 包含 `\\` → 提升为 `$$...$$`（KaTeX 块级模式）
- 不包含 `\\` → 保持不变

## 与 math 插件的关系

本插件与 `math` 插件 **v2.1.0+** 配合构成完整的修复链路：

1. **math v2.1.0+**（先执行）→ 将 `\\` 翻倍为 `\\\\`，防止 markdown-it 当作内联 HTML 转义符处理
2. **math-array**（后执行）→ 将含 `\\` 的 `$...$` 提升为 `$$...$$`，使 KaTeX 使用 displayMode

### 执行顺序

在 `LocalSettings.js` 中，`math` 必须排在 `math-array` 之前：

```javascript
wgEnabledPlugins: [
  'math',        // 先执行：\\ 翻倍保护
  'math-array',  // 后执行：$...$ → $$...$$
]
```

## 局限性

- 仅在公式包含 `\\` 时触发
- 仅提升 `$...$` 行内公式，不提升 `$$...$$` 块级公式
- 提升后公式始终以 `displayMode=true` 渲染，可能导致行内公式上下留白变大
