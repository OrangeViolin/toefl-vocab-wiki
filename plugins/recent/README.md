# recent — 修订历史插件

提供四个视图：

| 路由 | 视图 |
|------|------|
| `Special:Recent` | 最近修订列表（分页） |
| `#?history=<page>` | 单页修订历史 |
| `#?revision=<page>&rev=<id>` | 查看某一历史版本 |
| `#?diff=<page>&rev=<id>` | 与上版行级 diff |

## 历史格式

支持 **v0**（全文存储）和 **v2**（行级 hash）两种 history JSONL 格式，自动检测，无需配置。

| 格式 | entry 字段 | 说明 |
|------|-----------|------|
| v0 | `rev_id` `timestamp` `author` `summary` `content` `diff` | 全文存储，简单直接 |
| v2 | `v:2` `id` `ts` `au` `su` `t:snap\|delta` `ln`/`dl` `lc` | 行 hash 压缩，空间节省约 80% |

v2 格式由同目录的 `line-resolver.js` 提供解析（`hashBucket` / `resolveLineHash` / `applyDelta` / `reconstructContentV2`），diff 插件亦从此处 import。

### 启用 v2（新 wiki 默认）

```bash
# 初始化 line_index（首次或重建）
python3 $MEMEX_ROOT/wiki/scripts/build_line_index.py --public <wiki>/docs/wiki

# 录入修订（默认 v2）
python3 $MEMEX_ROOT/wiki/scripts/record_revision.py <page> --public <wiki>/docs/wiki
```

## 脚本依赖

### `wiki/scripts/record_revision.py`

记录页面修订，**每次页面更新时调用**。

```bash
python3 wiki/scripts/record_revision.py <页面ID> [--public <wiki/public 目录>]
```

- 默认格式：v2 line-hash；旧 wiki 可传 `--format v0`
- **输出**：`history/<页面ID>.jsonl`（v0 或 v2 格式）
- **聚合**：`recent.lite.jsonl`（始终为 v0 风格字段，供 Special:Recent 和 semantic-history 使用）

## 数据依赖

| 文件 | 说明 | 缺失时影响 |
|------|------|------------|
| `history/<page>.jsonl` | 单页修订历史（v0 或 v2） | 该页无修订历史，其他页正常 |
| `recent.lite.jsonl` | 最近修订摘要 | Special:Recent 无法加载 |
| `line_index/*.json` | v2 行 hash 索引（992 桶） | v2 历史无法解析；v0 不受影响 |

## 事件

`renderHistory()` 完成后 dispatch `wiki:historyRendered` 自定义事件，供 semantic-history 等插件注入语义标签（badge 依赖 `<tr data-rev data-summary>` 属性）。

## local config

文件：`local/config/recent.js`（可选）

| 导出名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `DISPLAY_LIMIT` | `number` | `500` | 最多加载的修订条数 |
| `PAGE_SIZE` | `number` | `50` | Special:Recent 每页显示条数 |

```js
// local/config/recent.js（可省略，使用内置默认值）
export const DISPLAY_LIMIT = 500;
export const PAGE_SIZE = 50;
```
