# chapter — 章节阅读增强插件

监听 `wiki:pageRendered` 事件，为所有页面注入阅读进度条，为章节页（`type: chapter`）额外提供：

- 对话行高亮（`> 说话者：内容` 格式）
- 诗词检测（连续引用块视为诗歌块）
- 对话续段缩进
- 前后章导航按钮

## 脚本依赖

无。

## 数据依赖

无。章节顺序信息来自 `core.registry`（内存）。

## local config 必须项

文件：`local/config/chapter.js`

| 导出名 | 类型 | 必须 | 说明 |
|--------|------|------|------|
| `DEFAULT_BOOK_LABEL` | `string` | 是 | 前后章导航中显示的书名（如「返回《人工智能简史》」） |

示例：

```js
// local/config/chapter.js
export const DEFAULT_BOOK_LABEL = '人工智能简史';
```
