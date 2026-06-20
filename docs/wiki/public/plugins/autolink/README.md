# autolink — 自动 wikilink 插件

默认关闭。在 MD 渲染前（`onBeforeRender` hook）对正文做自动 wikilink 替换，将已知词条名替换为 `[[词条名]]` 格式。

## 功能

- 通过 `core.settings.autoWikilink` 或 URL `?autolink=1` 开启
- topnav「自动链接：关/开」按钮调用 `core.setSetting('autoWikilink', bool)` 切换
- 使用 Trie 树加速多词匹配，单字 CJK 词需两侧都不是 CJK 才链接
- 保护代码块、行内代码、标题、已有 wikilink、PN 引注等区域不被替换

## 脚本依赖

无。

## 数据依赖

无。词条列表来自 `core.registry.alias_index`（内存）。

## local config 必须项

文件：`local/config/autolink.js`（可选）

| 导出名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `AUTOLINK_SKIP` | `Set<string>` | `new Set()` | 即使出现也不自动 wikilink 的词条 ID 集合 |

示例：

```js
// local/config/autolink.js（可省略）
export const AUTOLINK_SKIP = new Set(['的', '了', '是']);
```
