# page-footer — 页面底部分类标签插件

通过 `onAfterRender` hook 在正文末尾注入分类标签 footer：

- **类型标签**（突出样式）：链接到 `#?type=<type>`
- **自由标签**（frontmatter `tags[]`）：链接到 `#?tag=<tag>`

## 脚本依赖

无。

## 数据依赖

无。标签数据来自页面 frontmatter（`type`、`tags`）。

## local config 必须项

无。本插件无 `local/config/page-footer.js`。

类型标签的中文名从 `js/util.js` 的 `TYPE_LABELS` 读取（全局公共配置，不属于插件 local config）。
