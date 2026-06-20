# semantic-query — 语义查询插件

渲染 `::: query` 块，支持布尔过滤、字段范围筛选、computed 表达式字段、分组聚合，输出计数、表格或列表。

## 架构

- `semantic-block` 插件在 `onBeforeRender` 时将 `::: query` 块替换为占位符
- `semantic-query` 插件在 `onAfterRender` 时将占位符展开为渲染结果
- **必须同时启用 `semantic-block` 插件**，且排在 `semantic-query` 之前

## 查询语法

### 基本结构

````markdown
::: query
参数名: 值
参数名: [值1, 值2]
:::
````

**`::: query` 前必须空行**，否则 markdown-it 会将其与前文渲染到同一个 `<p>` 中，导致占位符无法匹配。

### 过滤参数

| 参数 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `type` | 字符串 | 精确匹配页面 type 字段 | `type: person` |
| `tags` | 字符串/数组 | tags 数组包含该值（精确匹配某一标签） | `tags: AI` |
| `featured` | 布尔 | featured 字段值 | `featured: true` |
| `nationality` | 字符串 | 精确匹配 nationality 字段 | `nationality: 美国` |
| `field: NOT NULL` | 字符串 | 字段非空（null / undefined / 空数组 / 空字符串 均视为空） | `仆: NOT NULL` |

任意页面字段名均可作为过滤键使用。值支持精确相等匹配。

### 范围过滤

字段名以 `_min` / `_max` 后缀表示范围：

| 参数 | 说明 | 示例 |
|------|------|------|
| `{field}_min` | 字段 >= 值 | `total_refs_min: 100` |
| `{field}_max` | 字段 <= 值 | `total_refs_max: 30` |

### 布尔数组过滤

| 参数 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `tags_any` | 数组 | tags 数组包含任一给定值 | `tags_any: [深度学习, 认知科学]` |
| `tags_not` | 数组 | tags 数组不包含任何给定值 | `tags_not: [数学]` |
| `type_any` | 数组 | type 为任一给定值 | `type_any: [person, organization]` |

### 逻辑模式

| 参数 | 值 | 说明 |
|------|-----|------|
| `union` | `true` | 多个条件之间为 OR 关系（默认 AND） |

### 显示参数

| 参数 | 值 | 说明 | 示例 |
|------|-----|------|------|
| `display` | `count` / `list` / `table` / `group_by` | 输出格式 | `display: table` |
| `sort` | 字段名 | 排序字段（默认 `label`） | `sort: total_refs` |
| `order` | `asc` / `desc` | 排序方向（默认 `asc`） | `order: desc` |
| `limit` | 数字 | 最大返回条目数（默认 200） | `limit: 50` |
| `fields` | 数组 | table 模式要显示的列 | `fields: [label, type, tags]` |
| `field_labels` | 映射 | 列显示名的自定义映射 | `field_labels: label: 姓名 type: 类别` |
| `title` | 字符串 | 显示在结果上方的标题 | `title: 精选人物` |

### display: count

仅显示匹配条目数：

```
::: query
type: person
featured: true
display: count
title: 精选人物数量
:::
```

输出：`<div class="query-title">精选人物数量</div><div class="query-count">12 条结果</div>`

### display: list

显示为无序列表：

```
::: query
type: person
limit: 10
display: list
title: 人物列表
sort: label
:::
```

### display: table

显示为表格，用 `fields` 指定列，`field_labels` 自定义列名：

```
::: query
type: person
display: table
fields: [label, type, tags, total_refs]
field_labels:
  label: 姓名
  type: 类别
  tags: 标签
  total_refs: 引用数
sort: total_refs
order: desc
limit: 20
:::
```

#### 链接字段

`father`、`mother`、`spouse`、`children`、`affiliation` 等关联字段的值会被自动渲染为 wikilink。schema 中定义的关系字段也会在 `init()` 时动态加入。

#### computed 字段

用 `computed` 定义计算列，表达式支持四则运算，变量名为页面字段名：

```
::: query
type: person
display: table
fields: [label, quality_score, score_doubled]
computed:
  score_doubled: quality_score * 2
field_labels:
  score_doubled: 双倍分数
:::
```

### display: group_by

按某字段分组，交叉统计另一字段各值的出现次数。支持 `normalizer` 对分组键做归一化处理。

```
::: query
display: group_by
group: nationality
count_of: type
type_any: [person, organization]
normalizer: nationality
order: desc
title: 各国学者与机构数量
:::
```

#### group_by 参数

| 参数 | 说明 | 示例 |
|------|------|------|
| `group` | 分组字段（默认 `nationality`） | `group: nationality` |
| `count_of` | 统计字段（默认 `type`） | `count_of: type` |
| `normalizer` | 对 group 字段值做归一化的函数名 | `normalizer: nationality` |
| `order` | 按分组总计数排序：`asc` / `desc`（默认 `desc`） | `order: asc` |
| `limit` | 限制显示的分组数 | `limit: 10` |

#### normalizer

`normalizer` 引用 `NORMALIZERS` 注册表中的函数。内置两个：

| 名称 | 行为 |
|------|------|
| `default` | 原样输出，不做拆分或归一 |
| `nationality` | 拆分多国籍（`/`、`、`、`, `）、去括号注释、归一化后缀（`X裔Y`→`Y`、`X人`→`X` 等） |

业务 normalizer 在 `local/config/semantic-query.js` 中定义，通过 `NORMALIZERS` 导出注入。

## Markdown 格式要求

`::: query` **前必须空行**。Markdown 中段落由空行分隔，若无空行：

```markdown
**标题：**
::: query
type: person
display: count
:::
```

markdown-it 会把 `**标题：**` 和 `::: query` 渲染到同一个 `<p>` 里：

```html
<p><strong>标题：</strong>
占位符</p>
```

而占位符替换正则要求以 `<p>` 开头，导致匹配失败、查询块不渲染。正确写法：

```markdown
**标题：**

::: query
type: person
display: count
:::
```

## local config

位于 `site/wiki/local/config/semantic-query.js`。可配置项：

| 导出 | 说明 |
|------|------|
| `QUERY_FIELD_LABELS` | 字段显示名映射 |
| `QUERY_TYPE_LABELS` | type 值的显示名映射 |
| `NORMALIZERS` | 自定义 normalizer 函数注册表 |
| `KB_URL` | 数据源 URL（默认 `pages.json`） |

## 测试

```
npx vitest run site/wiki/plugins/semantic-query/semantic-query.test.js
```

测试覆盖：cleanNationality（37 个用例）、executeQuery（20 个用例）、renderQueryBlock（27 个用例）。
