# semantic-history 插件

基于论文《Semantic History: Towards Modeling and Publishing Changes of Online Semantic Data》（Bao, Ding, McGuinness, ISWC 2009）实现的语义历史查询插件。

## 功能

### Special:SemanticHistory

可过滤的修订历史视图，支持以下维度查询：

| 过滤维度 | 说明 |
|---------|------|
| 页面类型 | person / concept / event / system … |
| 作者 | butler / baojie … |
| 变更类型 | 新增 / 内容 / 修复 / 重构 / 维护 … |
| 规模 | 重大（±500字节以上）/ 轻微 |
| 日期范围 | 起始日期 ~ 截止日期 |

### 页面历史增强

在 `?history=<page>` 视图的每条修订行上注入变更类型彩色徽章。

依赖 recent 插件：
- `wiki:historyRendered` 事件触发注入
- 读取每行 `<tr data-summary="...">` 属性获取摘要文本（v0 和 v2 格式均由 recent 插件归一化为明文）

## 语义模型（对应论文）

| 论文层次 | 字段 | 来源 |
|---------|------|------|
| Basic context | page, pageType, pageLabel, author, timestamp, rev_id | registry + jsonl |
| Revision summary | changeType, magnitude, sizeDelta, diff_add, diff_del | 推断 + jsonl |
| Rationale | summary, tag | jsonl summary 字段 |

## 变更类型规则（enrich.js）

| changeType | 触发模式 |
|-----------|---------|
| new | 新增: / add: |
| fix | fix: / FIX* / 修复: |
| content | enrich / wikify / 章节链接 / 添加 / feat: |
| refactor | refactor: / 重构: |
| housekeeping | HKP* / WKP* / chore: / butler |
| media | 图片 / 添加首页配图 |
| home | 首页: |
| docs | docs: / 文档: |
| other | 未匹配 |

## 数据源

- `recent.lite.jsonl` — Special:SemanticHistory 数据源；始终为 v0 风格字段（`rev_id` / `timestamp` / `author` / `summary` 明文），与 history 文件格式版本无关
- `history/<pid>.jsonl` — 不直接读取；通过监听 recent 插件的 `wiki:historyRendered` 事件间接获取渲染后的 DOM

## 扩展 changeType

在 `enrich.js` 的 `CHANGE_TYPE_RULES` 数组头部插入新规则：

```js
{ type: 'translation', re: /^(翻译|translate)[：:\s]/i },
```
