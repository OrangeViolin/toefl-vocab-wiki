# footnote — 脚注插件

渲染 `[^id]` 行内引用与 `[^id]: 定义` 脚注定义，支持标准 Markdown 脚注语法。

## 功能

- 依赖 `markdown-it-footnote` 扩展（本地 UMD 文件，无 CDN 依赖）
- 渲染脚注序号上标、底部脚注列表，以及回跳链接

## 脚本依赖

无。

## 数据依赖

| 文件 | 说明 | 缺失时影响 |
|------|------|------------|
| `plugins/footnote/markdown-it-footnote.js` | markdown-it 脚注插件（本地 UMD） | 插件加载失败，脚注不渲染 |

此文件随插件代码一同提交到仓库，不需要单独下载。

## local config 必须项

无。本插件无 `local/config/footnote.js`。
