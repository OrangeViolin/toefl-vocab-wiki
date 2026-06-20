# toc — 页面目录插件

监听 `wiki:pageRendered`，从 `#article` 中提取 h2/h3 标题，生成左侧可折叠目录，并绑定 Scrollspy 高亮当前小节。

## 功能

- 自动从正文 h2/h3 构建目录树
- 为每个标题注入 `§` 前缀的 `id`（供页内锚点使用）
- 在 h1 内注入折叠按钮（☰）
- Scrollspy：滚动时目录高亮当前可见章节

## 脚本依赖

无。

## 数据依赖

无。目录内容来自当前页面 DOM。

## local config 必须项

无。本插件无 `local/config/toc.js`。
