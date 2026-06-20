# search — 首页搜索插件

提供首页词条搜索与全文检索（FTS）功能，绑定 `#wiki-search` 输入框。

## 功能

| 模式 | 触发 | 数据来源 |
|------|------|----------|
| 词条搜索 | 默认 | `core.registry`（pages.json，内存） |
| 全文检索 | `#fts-toggle` 开启 | `data/fts-index.json`（静态文件） |

## 脚本依赖

### `wiki/scripts/build_fts_index.py`

构建全文检索索引，**构建期运行，不是运行时依赖**。

```bash
python3 wiki/scripts/build_fts_index.py
```

- **输入**：`site/wiki/pages/` 下的章节 Markdown 文件（`type: chapter`）
- **输出**：`site/wiki/data/fts-index.json`
- **何时重跑**：章节正文内容有变动后

索引结构：

```json
{
  "chapters": [{ "n": 1, "f": "第001章", "t": "章节标题" }, ...],
  "entries":  [{ "c": 0, "p": "001-006", "x": "段落原文" }, ...]
}
```

其中 `p` 为 PN 编号（`NNN-PPP`），用于定位到具体段落。

## 数据依赖

| 文件 | 说明 | 缺失时影响 |
|------|------|------------|
| `data/fts-index.json` | 全文检索索引 | FTS 模式报错，词条搜索不受影响 |

词条搜索数据来自 `core.registry`（由 `pages.json` 在启动时加载到内存），无独立文件依赖。

## local config 必须项

本插件从 `local/config/hero.js` 读取一个配置项：

| 导出名 | 类型 | 说明 |
|--------|------|------|
| `SEARCH_PLACEHOLDER_FTS` | `string` | FTS 模式下输入框占位文字 |

示例：

```js
// local/config/hero.js
export const SEARCH_PLACEHOLDER_FTS = '搜索原文段落…';
```

本插件无独立的 `local/config/search.js`。
