# Plugins 目录

memex wiki 插件系统。所有插件在 `plugins.json` 中声明，由 core 加载器按序初始化。

## 加载机制

- `plugins.json` — 插件注册表，字段：`id` `entry` `name` `version` `core` `localConfig` `dependencies`
- `core: true` — 框架核心插件，始终加载
- `localConfig: required` — 必须提供 `local/config/<plugin>.js`；`optional` — 可选；`no` — 无需配置
- `dependencies` — 声明后由加载器保证依赖先于当前插件初始化

## 构建产出

运行 `wiki/scripts/dist_build.sh` 后：

- **`js/memex.min.js`** — 所有插件合并为单个 bundle，生产环境使用此文件
- **`plugins/` 目录** — 各插件源文件保留在此，用于兼容旧版动态加载路径（CDN 部署时 `plugins/` 目录仍然存在，`memex.min.js` 不可用时才逐个加载）。新项目应直接引用 `memex.min.js`

## 插件总览（34 个）

### 基础框架（2）

| id | 中文名 | 说明 | core | localConfig |
|----|--------|------|:----:|:-----------:|
| [i18n](i18n/) | 国际化 | 多语言支持（zh/en/ja）；挂载 `core.t()` / `core.lang` / `core.setLang()`；topnav 语言选择器 | ✓ | required |
| [variable](variable/) | 模板变量 | 替换 MD 源中的 `{{varName}}` 占位符；变量定义见 `local/config/variables.js` | ✓ | no |

### 页面渲染（10）

| id | 中文名 | 说明 | core | localConfig |
|----|--------|------|:----:|:-----------:|
| [infobox](infobox/) | 信息框 | frontmatter 字段渲染为右侧信息框；字段标签/分组由 `local/config/infobox.js` 配置 | ✓ | no |
| [sidebar](sidebar/) | 侧边栏 | 右侧栏图片区（sidebar-portrait）与坐标地图区（sidebar-map）渲染及可见性控制 | ✓ | no |
| [bold-terms](bold-terms/) | 页名加粗 | 正文中当前页名和别名 DOM 级加粗 | ✓ | no |
| [page-footer](page-footer/) | 页面标签页脚 | `onAfterRender` 钩子在正文末尾注入类型/自由标签 footer | ✓ | no |
| [hero](hero/) | 首页英雄区 | 首页标题、背景、搜索框外壳；文本由 `local/config/hero.js` 配置 | ✓ | optional |
| [home](home/) | 首页渲染 | 精选卡片、书籍章节导航、搜索入口渲染 | ✓ | no |
| [toc](toc/) | 页面目录 | h2/h3 自动生成左侧可折叠目录，含 Scrollspy 高亮 | ✓ | no |
| [chapter](chapter/) | 章节阅读增强 | 对话高亮、诗词检测、前后章导航、阅读进度条 | ✓ | optional |
| [source-view](source-view/) | 源码查看 | `#?source=<page>` 路由，展示 Markdown 源码 | ✓ | no |
| [anchor](anchor/) | 页内锚点 | `[a:id]` 渲染为不可见锚点 span，提供稳定页内链接 | ✓ | no |

### 导航与搜索（6）

| id | 中文名 | 说明 | core | localConfig |
|----|--------|------|:----:|:-----------:|
| [search](search/) | 首页搜索 | 首页词条搜索与全文检索（FTS）；绑定 `#wiki-search` | ✓ | no |
| [browse](browse/) | 分面浏览器 | Special:AllPages 与 type/tag 分类页分面浏览；禁用时回退 A-Z 列表 | ✓ | no |
| [category](category/) | 分类页 | `#?type=` / `#?tag=` 分类页与 Special:AllPages 简单列表；拼音首字过滤（需 `PINYIN_INITIAL`） | ✓ | optional |
| [backlinks](backlinks/) | 反向引用 | 文章末尾注入「被以下页面引用」区块；数据来自 `backlinks.json` | — | no |
| [sealso](sealso/) | 参见链接 | frontmatter `seealso` 字段自动注入页面底部「参见」区块 | — | no |
| [autolink](autolink/) | 自动 Wikilink | 正文已知词条名自动转 wikilink；默认关闭，可通过 topnav 或 `?autolink=1` 开启 | — | no |

### 修订历史（3）

| id | 中文名 | 说明 | core | localConfig |
|----|--------|------|:----:|:-----------:|
| [recent](recent/) | 修订历史 | Special:Recent 列表、单页历史、历史版本查看；支持 v0/v2 双格式 | ✓ | no |
| [diff](diff/) | 版本差异 | `#?diff=<page>&rev=<id>` 行级差异视图；支持 v0/v2 双格式 | ✓ | no |
| [semantic-history](semantic-history/) | 语义历史 | Special:SemanticHistory：按类型/作者/变更类型/日期过滤修订历史 | ✓ | no |

### 语义标注（5）

| id | 中文名 | 说明 | core | localConfig |
|----|--------|------|:----:|:-----------:|
| [semantic-block](semantic-block/) | 语义块 | 处理 `:::image` `:::seealso` `:::infobox` `:::meta` `:::query` 语义块 | — | optional |
| [semantic-query](semantic-query/) | 语义查询 | `:::query` 块渲染；布尔过滤与 computed 表达式字段 | — | optional |
| [pn-citation](pn-citation/) | PN 段落引文 | `（NNN-PPP）` 格式引文渲染为章节段落链接；注入锚点 id | — | no |
| [footnote](footnote/) | 脚注 | `[^id]` 内联引用与 `[^id]:` 定义渲染 | — | no |
| [event-linkify](event-linkify/) | 事件页字段 Wikilink | 事件页指定加粗字段值自动转 wikilink；`LINKIFY_FIELDS` 为空时不执行 | ✓ | required |

### 地图（3）

| id | 中文名 | 说明 | core | deps |
|----|--------|------|:----:|:----:|
| [place-map](place-map/) | 地名地图 | 地名页 sidebar Leaflet 地图（需 frontmatter `coords: [lon, lat]`） | — | — |
| [route-map](route-map/) | 路线地图 | `:::route` 块：地点序列渲染为带箭头 Leaflet 路线地图 | — | semantic-block |
| [geomap](geomap/) | 地理概览地图 | `:::geomap` 块：多地点图钉地图，适合分布概览 | — | semantic-block |

### 数学公式（2）

| id | 中文名 | 说明 | core |
|----|--------|------|:----:|
| [math](math/) | KaTeX 数学公式 | `$...$` 行内与 `$$...$$` 块级公式（需 KaTeX CDN） | — |
| [math-array](math-array/) | 行内公式 array 修复 | 含 `\\` 的 `$...$` 自动提升为 `$$...$$`，修复 array 环境换行 | — |

### 工具（2）

| id | 中文名 | 说明 | core |
|----|--------|------|:----:|
| [page-marker](page-marker/) | 印刷页码 | `[p:N]` 渲染为可导航锚点；支持 `#page-N` / `#PageId#page-N` 链接 | — |
| [want-button](want-button/) | 想要此页面 | 仅 localhost：404 页面注入「想要此页面」按钮，调用 `/api/want` | — |

## 新建插件

1. 在 `plugins/<id>/index.js` 实现插件，导出 `{ id, name, onBoot }` 对象
2. 在 `plugins.json` 添加条目（参考现有字段格式）
3. 如需 localConfig，在 `local/config/<id>.js` 提供默认值并在 JSON 中标记 `localConfig: "required"`
4. 提交 RFC（如影响多个插件或改动框架接口）

## 相关文档

- `ref/spec/meta-rfc.md` — 插件 RFC 规范（含测试用例要求）
- `wiki/scripts/record_revision.py` — 历史录入脚本（v0/v2 格式）
- `wiki/scripts/build_line_index.py` — v2 行 hash 索引全量重建
