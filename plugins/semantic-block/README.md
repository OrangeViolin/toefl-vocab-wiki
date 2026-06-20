# semantic-block — 语义块渲染插件

解析页面中所有 `:::` 围栏块，渲染 `infobox`、`meta`、`seealso`、`image` 等类型，并为 `query` 块保留占位符供 semantic-query 插件处理。

## 语法要求

```
::: <type> [参数]   ← 开启行：::: 与类型名之间必须有空格
内容
:::                 ← 关闭行：::: 后无需空格
```

> ⚠️ **`:::query`（无空格）会静默失效**：解析正则 `/^:::[ \t]+(\w+)/` 要求至少一个空格，无空格时整个块渲染为原始文字，不报错。

## 功能

| Hook | 职责 |
|------|------|
| `onBeforeRender` | 解析所有 `:::` 块，替换为占位符 |
| `onAfterRender` | 展开 infobox / meta / seealso / image 占位符为 HTML |
| `onInfobox` | 将第一个 `:::infobox` 的字段注入 sidebar |

通过 `core.semanticBlock` 暴露块缓存，供 `semantic-query` 读取。

## 脚本依赖

无。

## 数据依赖

无。块内容来自页面正文。

## local config 必须项

文件：`local/config/semantic-block.js`（可选，所有项均有内置默认值）

| 导出名 | 类型 | 必须 | 说明 |
|--------|------|------|------|
| `INFOBOX_FIELD_MAP` | `Array<[key, label]>` | 否 | `:::infobox` 块的字段名 → 中文标签映射 |
| `TYPE_VALUE_MAP` | `object` | 否 | `type` 字段值 → 中文显示名（如 `person` → `'人物'`） |

示例：

```js
// local/config/semantic-block.js
export const INFOBOX_FIELD_MAP = [
  ['type',        '类型'],
  ['born',        '生'],
  ['died',        '逝'],
  ['nationality', '国籍'],
  ['affiliation', '机构'],
];

export const TYPE_VALUE_MAP = {
  person: '人物', system: '系统', concept: '概念',
};
```
