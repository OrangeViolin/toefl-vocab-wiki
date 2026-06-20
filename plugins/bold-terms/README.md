# bold-terms — 页名/别名加粗插件

监听 `wiki:pageRendered`，在正文中找到当前页名和 frontmatter `aliases` 中的别名，在文本节点级别将其加粗（包裹为 `<strong>`）。

## 功能

- 跳过标题（h1–h6）、链接（a）、代码块（pre/code）、已加粗（strong）、PN 标签
- 多个别名按长度降序匹配，避免短串误匹配长串

## 脚本依赖

无。

## 数据依赖

无。加粗词语来自当前页面的 `pid`、`front.label`、`front.aliases`。

## local config 必须项

无。本插件无 `local/config/bold-terms.js`。
