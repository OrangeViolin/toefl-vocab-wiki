# variable 插件

在页面 Markdown 源渲染前，将 `{{varName}}` 占位符替换为实际值。

## 语法

```
{{varName}}
```

大小写敏感。未定义的变量名原样保留（不报错）。

## 变量来源

变量按优先级合并，后者覆盖前者：

| 文件 | 用途 |
|------|------|
| `plugins/variable/defaults.js` | 通用系统变量，任何 wiki 项目可复用 |
| `local/config/variables.js` | 项目专属变量（书名、作者等常量） |

## 内置变量（defaults.js）

### 统计

| 变量 | 说明 |
|------|------|
| `{{pageCount}}` | 全部页面数 |
| `{{articleCount}}` | 非 stub 页面数（quality ≠ stub） |
| `{{imageCount}}` | 有图片的页面数 |
| `{{personCount}}` | person 类型页面数 |
| `{{conceptCount}}` | concept 类型页面数 |
| `{{referenceCount}}` | reference 类型页面数 |

### 站点

| 变量 | 说明 |
|------|------|
| `{{siteTitle}}` | 站点名称（`wgSiteName`） |
| `{{lastUpdated}}` | 注册表最后构建日期（`YYYY-MM-DD`） |

### 日期

| 变量 | 示例 |
|------|------|
| `{{currentYear}}` | `2026` |
| `{{currentMonth}}` | `05` |
| `{{currentMonthName}}` | `五月` |
| `{{currentDay}}` | `11` |

### 页面（渲染时动态求值）

| 变量 | 说明 |
|------|------|
| `{{PAGENAME}}` | 当前页 ID（pid） |
| `{{PAGELABEL}}` | 当前页显示名（label） |
| `{{PAGETYPE}}` | 当前页类型（type） |

## 新增变量

在 `local/config/variables.js` 中添加：

```js
export const VARIABLES = {
  myVar: (core, ctx) => '值',
};
```

函数签名 `(core, ctx)`：
- `core` — wiki core 对象，含 `core.registry`、`core.siteName` 等
- `ctx` — 页面上下文 `{ pid, meta, front }`，页面级变量使用

## 示例

```markdown
本 Wiki 共收录词条 **{{pageCount}}** 页，其中人物 {{personCount}} 条。

当前页：{{PAGELABEL}}（类型：{{PAGETYPE}}）

数据截至 {{lastUpdated}}，{{currentYear}} 年 {{currentMonthName}}。
```
