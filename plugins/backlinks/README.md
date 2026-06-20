# backlinks — 反向引用插件

在文章末尾注入「被以下页面引用」区块，数据来自预构建的 `backlinks.json`。

## 功能

- 启动时（`onBoot`）fetch `backlinks.json` 并挂到 `core.backlinks`
- `onAfterRender` 在文章末尾注入按类型分组的反向引用列表

## 脚本依赖

### `wiki/scripts/build_backlinks.py`

构建反向引用索引，**构建期运行**。

```bash
python3 wiki/scripts/build_backlinks.py
```

- **输入**：`site/wiki/pages/*.md`（扫描所有 `[[wikilink]]`）
- **输出**：`site/wiki/backlinks.json`
- **何时重跑**：新增/删除页面，或页面内 wikilink 有变动后

输出结构：

```json
{
  "页面ID": [
    { "id": "引用页ID", "label": "显示名", "type": "person" },
    ...
  ]
}
```

## 数据依赖

| 文件 | 说明 | 缺失时影响 |
|------|------|------------|
| `backlinks.json` | 反向引用索引 | 所有页面不显示反向引用区块，页面本身正常 |

## local config 必须项

本插件无 `local/config/backlinks.js`。

可选：若 `local/config/backlinks.js` 存在，可覆盖类型标签：

```js
// local/config/backlinks.js（可选）
export const TYPE_LABELS = {
  person: '人物', organization: '机构', /* ... */
};
```

未配置时使用插件内置的中文类型名。
