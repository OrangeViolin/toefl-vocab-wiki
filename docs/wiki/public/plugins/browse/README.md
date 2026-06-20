# browse — 分面浏览器插件

提供 `Special:AllPages` 的分面浏览界面，支持按类型、标签、质量、书册筛选。

## 功能

- 注册 `Special:AllPages` 特殊页（覆盖 category 插件的简单列表）
- 接管 `#?type=X` / `#?tag=X` 路由，重定向到带预激活分面的 `Special:AllPages`
- 禁用此插件后，以上路由回退至 category 插件的简单列表

## 脚本依赖

无。

## 数据依赖

无。数据来自 `core.registry`（内存）。

## local config 必须项

文件：`local/config/browse.js`（可选，所有项均有默认值）

| 导出名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `TITLE` | `string` | `'全部页面'` | 页面标题 |
| `PAGE_SIZE` | `number` | `50` | 每页条数 |
| `FACETS` | `Array` | 见下 | 分面组定义 |
| `QUALITY_LEVELS` | `Array` | 见下 | 质量级别列表（从高到低） |
| `BOOK_ORDER` | `string[]` | `[]` | 书册分面固定排序；空数组则不显示书册分面 |

`FACETS` 每项结构：

```js
{ id: 'type' | 'tag' | 'quality' | 'book', title: string, open: boolean, minCount?: number, maxCount?: number }
```

示例：

```js
// local/config/browse.js
export const TITLE = '全部页面';
export const PAGE_SIZE = 50;
export const FACETS = [
  { id: 'type',    title: '类型',    open: true },
  { id: 'tag',     title: '标签',    open: true, minCount: 3, maxCount: 30 },
  { id: 'quality', title: '内容质量', open: false },
];
export const QUALITY_LEVELS = [
  ['premium', '旗舰'], ['featured', '精品'],
  ['standard', '标准'], ['basic', '基础'], ['stub', '存根'],
];
export const BOOK_ORDER = [];
```
