# CSS 目录

memex wiki 样式体系。

## 文件说明

| 文件 | 说明 |
|------|------|
| `main.css` | 入口文件，`@import` 所有子样式表 |
| `base.css` | 基础样式：CSS 变量、排版、表格、引用块等 |
| `home.css` | 首页 Hero 区、精选卡片、知识面板 |
| `nav.css` | 顶部导航栏 |
| `sidebar.css` | 侧边栏与信息框 |
| `pages.css` | 页面通用布局 |
| `types.css` | 页面类型（person/concept/event/organization）差异样式 |
| `diff.css` | 版本差异视图 |
| `history.css` | 修订历史列表 |
| `badges.css` | 标签/徽章样式 |
| `entity.css` | 实体标注样式 |
| `source.css` | 源码查看模式 |
| `math.css` | 数学公式布局 |
| `quality.css` | 页面质量指示器 |
| `allpages.css` | A-Z 列表与分面浏览器 |

## 配色机制

`base.css` 定义默认配色（深海蓝青暗色主题），部分选择器使用硬编码颜色。所有硬编码颜色由主题文件覆盖：

```
:root CSS 变量（--fg, --accent, --border 等） → 被 local.css 中的主题覆盖
article h2 / h3 / code / table / th / td → 被主题中的对应选择器覆盖
.seealso-block / .book-card 等 → 被主题中的对应选择器覆盖
```

## 主题切换

主题文件位于 `wiki/themes/`（共 100 个），每个主题是一个独立的 CSS 文件，覆盖 `base.css` 中所有硬编码颜色。使用方式：

1. 将选定的主题文件内容复制到 `local/local.css`
2. `index.html` 和 `search.html` 在加载 `main.css` 后动态追加 `local/local.css`

## local.css 优先级

`local/local.css` 始终在 `main.css` 之后加载，因此其规则覆盖 base.css 和 home.css 中的默认值。该文件同时包含项目特有的样式（章节引用 PN 标签、语义块、设置面板等），不应被直接删除。
