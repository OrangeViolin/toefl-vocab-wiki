# diff — 版本差异插件

提供一个视图：

| 路由 | 视图 |
|------|------|
| `#?diff=<page>&rev=<id>` | 当前版本与上版的行级 diff |

## 功能

- 字符级 diff 高亮（对逐行变化做字符粒度标注）
- 快速路径：优先从 `recent.diff.jsonl` 读取预计算 diff chunks
- 降级路径：快速路径失败时从 `history/<page>.jsonl` 重建

## 历史格式支持

支持 v0 和 v2 两种格式，自动检测。

| 格式 | diff 生成方式 |
|------|--------------|
| v0 | 直接读 `rev.content` / `prevRev.content`，LCS 行级 diff |
| v2 | 通过 `reconstructContentV2()` 重建当前版和父版全文，再计算 LCS diff |

v2 解析模块从 `../recent/line-resolver.js` import。

## 数据依赖

| 文件 | 说明 | 缺失时影响 |
|------|------|------------|
| `recent.diff.jsonl` | 预计算 diff（快速路径） | 降级到 history 文件，功能不受影响 |
| `history/<page>.jsonl` | 完整修订历史 | diff 无法显示 |
| `line_index/*.json` | v2 行 hash 索引 | v2 格式下 diff 无法重建；v0 不受影响 |
