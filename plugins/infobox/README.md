# infobox — 信息框插件

将页面 frontmatter 字段渲染为右侧信息框（`<aside class="infobox">`）。

## 功能

在 `core` 上挂载 `core.renderInfobox(core, front, meta, pid)`，由 `renderer.js` 在页面渲染时调用。

- 自动 wikilink 化字段值（若目标页面存在）
- 按 `FIELD_GROUPS` 分组展示字段

## 脚本依赖

无。

## 数据依赖

无。信息框数据全部来自页面 frontmatter。

## local config 必须项

文件：`local/config/infobox.js`

| 导出名 | 类型 | 必须 | 说明 |
|--------|------|------|------|
| `FIELD_LABELS` | `object` | 是 | frontmatter 字段名 → 中文标签 |
| `INFOBOX_SKIP` | `Set<string>` | 是 | 不在信息框中显示的字段名集合 |
| `FIELD_GROUPS` | `Array` | 是 | 字段分组定义，决定分组标题与顺序 |

`FIELD_GROUPS` 结构：

```js
export const FIELD_GROUPS = [
  { label: '人物',   fields: ['born', 'died', 'nationality', 'affiliation'] },
  { label: '研究',   fields: ['era', 'field', 'teacher', 'students'] },
];
```

示例：

```js
// local/config/infobox.js
export const FIELD_LABELS = {
  born: '生年', died: '逝年', nationality: '国籍',
  era: '年代', field: '领域', affiliation: '机构',
};

export const INFOBOX_SKIP = new Set([
  'id', 'label', 'type', 'featured', 'quality', 'path',
  'image', 'images', 'chapter_num',
]);

export const FIELD_GROUPS = [
  { label: '基本',   fields: ['born', 'died', 'nationality'] },
  { label: '学术',   fields: ['era', 'field', 'affiliation'] },
];
```
