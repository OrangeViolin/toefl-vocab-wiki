# sealso — 参见链接插件

读取 frontmatter `seealso` 字段，在文章末尾通过 `onAfterRender` hook 注入「参见」区块。

## 功能

- 支持条目格式：`页面ID` 或 `页面ID|显示文字`
- 通过 `core.registry` 解析页面是否存在，不存在则显示断链样式

## 脚本依赖

无。

## 数据依赖

无。数据来自页面 frontmatter `seealso` 字段，解析依赖 `core.registry`（内存）。

## local config 必须项

无。本插件无 `local/config/sealso.js`。
