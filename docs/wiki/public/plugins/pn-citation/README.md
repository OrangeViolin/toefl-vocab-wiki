# pn-citation — PN 段落引文插件

将 Markdown 中的 PN 编号（`[NNN-PPP]` 标签与 `（NNN-PPP）` 引注）渲染为可跳转链接，并为段落注入锚点 `id`。

## 功能

- **段落锚点**：`<p>[001-006] 文字</p>` → `<p id="pn-001-006">…</p>`
- **引文链接**：`（001-006）` → 可点击链接，跳转到对应章节页并滚动到目标段落
- Hook: `onAfterRender`

## 脚本依赖

### `wiki/scripts/build_chapter_map.py`（或等效脚本）

构建章节编号到页面 ID 的映射，**构建期运行**。

```bash
python3 wiki/scripts/build_chapter_map.py
```

- **输出**：`site/wiki/data/chapter_map.json`
- **何时重跑**：章节页面新增/重命名后

`chapter_map.json` 结构：

```json
{
  "001": "第001章",
  "002": "第002章",
  ...
}
```

## 数据依赖

| 文件 | 说明 | 缺失时影响 |
|------|------|------------|
| `data/chapter_map.json` | 卷号 → 页面 ID 映射 | 引文链接无法跳转到正确章节，但段落锚点仍生效 |

## local config 必须项

| 文件 | 导出名 | 类型 | 必须 | 说明 |
|------|--------|------|------|------|
| `local/config/pn-citation.js` | `CHAPTER_MAP_URL` | `string` | 是 | `chapter_map.json` 的相对 URL |

示例：

```js
// local/config/pn-citation.js
export const CHAPTER_MAP_URL = 'data/chapter_map.json';
```
