# source-view — 源码查看插件

渲染 `#?source=<page>` 路由，展示页面 Markdown 源码，并使用 highlight.js 做语法高亮。

## 功能

在 `core` 上挂载 `core.renderSource(core, pid, meta)`，由 `router.js` 在 `#?source=` 路由时调用。

- 从 `pages/<pid>.md` fetch Markdown 原文
- 使用 highlight.js 渲染 `language-markdown` 高亮
- CDN 优先，超时（4 秒）或失败时自动降级到本地缓存

## 脚本依赖

### 下载 highlight.js 本地缓存

首次部署时需手动下载，放入 `vendor/hljs/`：

```bash
mkdir -p site/wiki/vendor/hljs
curl -o site/wiki/vendor/hljs/highlight.min.js \
  https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js
curl -o site/wiki/vendor/hljs/github-dark.min.css \
  https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css
```

- **CDN URL**：`https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/`
- **本地路径**：`site/wiki/vendor/hljs/highlight.min.js`、`site/wiki/vendor/hljs/github-dark.min.css`

## 数据依赖

| 文件 | 说明 | 缺失时影响 |
|------|------|------------|
| `vendor/hljs/highlight.min.js` | highlight.js 本地缓存 | CDN 失败时降级为纯文本（无高亮） |
| `vendor/hljs/github-dark.min.css` | 高亮样式本地缓存 | 同上 |

## local config 必须项

无。本插件无 `local/config/source-view.js`。
