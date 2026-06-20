# want-button — 「想要此页面」开发工具插件

仅在 localhost 下生效。在 404 页面注入「想要此页面」按钮，点击后向本地开发服务器提交页面需求。

## 功能

- 在 `core` 上挂载 `core.injectWantButton(pid)`
- `renderer.js` 的 `renderNotFound` 在 404 时调用它
- 非 localhost 环境下此插件完全不生效（`init` 直接返回）

## 脚本依赖

### 本地开发服务器 API `/api/want`

需运行 `wiki/wiki.sh`（或等效的开发服务器），提供：

```
GET /api/want?page=<页面ID>
```

响应：

```json
{ "added": true }   // 新加入队列
{ "added": false }  // 已在队列中
```

**生产环境无此 API，但插件在非 localhost 下不会发起请求。**

## 数据依赖

无静态文件依赖。

## local config 必须项

无。本插件无 `local/config/want-button.js`。
