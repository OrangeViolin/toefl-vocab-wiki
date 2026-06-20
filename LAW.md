# TOEFL词汇词根+联想记忆法 — 本地法律

> 宪法（`$MEMEX_ROOT/CONSTITUTION.md`）优先。本文件是宪法之下的项目特定补充规范（法源体系 L3）。
> 如有冲突，宪法优先。

---

## 一、项目基本参数

| 参数 | 值 |
|------|-----|
| Wiki 名称 | TOEFL词汇词根+联想记忆法 |
| WIKI_LANG | zh |
| 本地端口 | 2012 |
| 发布方案 | GitHub Pages |

本地预览：`bash wiki/wiki.sh`，访问 `http://localhost:2012`。

---

## 二、语料声明

- `corpus/raw/toefl-vocabulary.epub`：俞敏洪《TOEFL词汇词根＋联想记忆法（乱序版）》，西安交通大学出版社，2012年，**只读，不可修改**。
- corpus 文件受版权保护，不提交到 git（见 .gitignore）。
- 引用语料时只记录位置（Word List + 词条序号），不复制大段原文到页面。

| 文件/目录 | 内容 | 文件数 | 备注 |
|-----------|------|--------|------|
| corpus/raw/toefl-vocabulary.epub | 俞敏洪 TOEFL词汇 乱序版 | 1 | EPUB 格式，版权保护 |

---

## 三、PN（段落编号）映射规则

> PN 格式规范来源：`ref/spec/data-pn.md`。

### 格式定义

**三段 PN（wordlist 方案）**：
```
PN = WLNN-WWW
WL   = 固定前缀 "WL"
NN   = Word List 编号 (01–48)
WWW  = 词条序号 (001–999)，按词条在原文中出现的顺序计数
pn_prefix = WLNN         每个 Word List 页 frontmatter 存此值
```

### 括号格式

**`WIKI_LANG=zh`**：

| 场景 | 格式 | 示例 |
|------|------|------|
| Word List 页段首标注 | `[WL01-001]` | `[WL01-007]正文` |
| 词条页行内引注 | 全角 `（WL01-007）` | `上下文（WL01-007）` |

### WLNN 分配表

| WLNN | page_id | 类型 | 说明 |
|------|---------|------|------|
| WL01 | Word List 1 | wordlist | 词根词缀预习表 + 核心词汇 |
| WL02 | Word List 2 | wordlist | 词根词缀预习表 + 核心词汇 |
| ... | ... | ... | ... |
| WL48 | Word List 48 | wordlist | 词根词缀预习表 + 核心词汇 |

完整映射见 `ref/chapter-order.md`。

### 规则

1. PN 格式为 **三段 `WLNN-WWW`**。
2. 各 Word List 独立计数，WWW 从 `001` 起，PN 一经分配不得变更。
3. 词根词缀预习表以 `WLNN-T00` 至 `WLNN-TNN` 编号。

---

## 四、页面类型

本 wiki 使用以下页面类型：

| 类型 | 说明 | 示例 |
|------|------|------|
| `wordlist` | Word List 章节页（从语料切分）| Word List 1 |
| `word` | 单词词条 | abandon, essence |
| `root` | 词根 | scrib（写）, dict（说） |
| `affix` | 词缀（前缀/后缀）| pre-, -tion |
| `overview` | 综述/导引页（wiki 编辑者手工创建）| TOEFL词汇学习指南 |
| `list` | 列表页 | A-Z索引、词根索引 |

> ⚠️ 所有从语料切分的页面均使用 `type: wordlist`；禁止使用 `document` 等不兼容类型。
> `type: overview` 仅用于 wiki 编辑者手工创建的综述/导引页。

---

## 五、页面 slug 命名规范

页面 slug（文件名、`id` 字段）的格式依 `WIKI_LANG` 而定，**不得混用**。

**`WIKI_LANG=zh`**：slug **必须使用汉字**。

| 规则 | 说明 |
|------|------|
| ✅ 汉字 slug | `本质`、`文艺复兴`、`前言` |
| ❌ 拼音 slug | `benzhi` — 禁止 |
| ❌ 英文 slug | `essence` — 禁止 |
| ❌ 拼音首字母 | `bz` — 禁止 |

**例外**：
- `wordlist` 类型页面使用 `Word-List-N` 格式（memex 框架约定）
- `overview` 类型的系统页面（`About`、`目录` 等）由 memex 框架定义，不受此约束

---

## 六、Corpus 只读声明

任何 skill、脚本、Claude 操作，均**禁止修改** `corpus/` 目录下的任何文件。
如需标注，写入 `data/` 目录，不得回写 corpus。

**例外**：BIRTH.md Phase 3（语料准备与校对）期间允许向 `corpus/` 写入。
Phase 3 最后一次提交后恢复只读，后续阶段（Phase 4 起）不再写入。

---

## 七、提交门控

- 直接 `git commit` 被 deny 拦截
- 授权提交须走：`bash wiki/scripts/wiki_commit.sh`
- Skill 提交须走：`bash wiki/scripts/skill_commit.sh`

---

## 八、词条字段规范

每个 `word` 类型页面必须包含以下结构：

```markdown
## 基本信息
- **发音**：/pɹəˌnʌnsiˈeɪʃən/
- **词性**：n./v./a./ad.
- **释义**：中文释义

## 记忆方法
- **词根分析**：...
- **联想记忆**：...
- **形近词**：...

## 用法
- **常见搭配**：...
- **例句**：...

## 派生词
- 派生词1 / 派生词2
```

---

*本文档适用于 TOEFL词汇词根+联想记忆法 Wiki 项目，受 `$MEMEX_ROOT/CONSTITUTION.md` 约束。*
