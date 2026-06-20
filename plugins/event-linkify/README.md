# event-linkify — 事件页字段自动 wikilink 插件

监听 `wiki:pageRendered`，将事件页正文中指定加粗字段的值自动转为 wikilink。

## 功能

识别正文中的 `**字段名**：name1、name2` 格式，若目标词条存在于注册表，则自动转为 `[[wikilink]]` 链接。

仅处理 `local/config/event-linkify.js` 中列出的字段名。

## 脚本依赖

无。

## 数据依赖

无。数据来自 `core.registry`（内存）。

## local config 必须项

文件：`local/config/event-linkify.js`

| 导出名 | 类型 | 必须 | 说明 |
|--------|------|------|------|
| `LINKIFY_FIELDS` | `string[]` | 是 | 需要自动 wikilink 化的字段名列表；为空数组则插件不生效 |

示例：

```js
// local/config/event-linkify.js
export const LINKIFY_FIELDS = ['主要人物', '地点', '机构'];
```
