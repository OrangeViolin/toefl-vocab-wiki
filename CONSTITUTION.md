# Wiki 项目宪法

> 本文档记录所有 Wiki 项目通用的不可违背约定。
> 各 Wiki 项目不复制本文件，通过 `MEMEX_ROOT` 引用共享的原始文件。
> 各项目在 `CLAUDE.md`（入口）、`LAW.md`（本地法律）中补充项目特定规范。

---

**▌ Part A — 架构基础**

---

## 一、多 Wiki 共享架构

### 1.1 MEMEX_ROOT 约定

所有 Wiki 项目将 memex 仓库作为共享代码源，通过 `~/memex` 引用（本机 symlink 指向实际位置）。

每个 Wiki 项目根目录下不复制共享代码，只保留独有内容与本地配置。

### 1.2 通用目录约定

```
wiki-root/
├── publish.sh               # 发布脚本：打包资源 → docs/wiki/
├── .claude/                  # Claude 配置
│   ├── settings.json         # 本 wiki 权限设置
│   ├── commands/             # 斜杠命令（symlink 或本地）
│   └── skills/               # symlinks → $MEMEX_ROOT/.claude/skills/
├── corpus/                   # 原文语料（只读，不可修改）
├── docs/                     # 发布网站（git submodule，对应 GitHub Pages 仓库）
│   └── wiki/                 # publish.sh 的目标目录
│       ├── pages/            # 构建好的页面（支持分桶，见 §二）
│       ├── history/          # 页面修订历史（支持分桶，见 §二）
│       ├── recent.lite.jsonl # 全局最近修改（轻量日志）
│       ├── recent.diff.jsonl # 全局最近修改（带 diff）
│       ├── pages.json        # 注册表
│       ├── pages.lite.json   # 精简注册表
│       ├── js/
│       │   └── local/        # local/config/ → minify → *.min.js
│       └── index.html        # 引用 CDN: memex@vX.Y.Z/memex.min.js + memex-plugins.min.js
├── ref/                      # 项目参考文档（工作流、规范、架构说明等）
├── logs/                     # 运行日志
│   ├── butler/               # butler 日志、队列
│   └── build/                # 页面建立过程记录
├── data/                     # 核心数据资产（标注数据、结构化知识、句子库、索引等）
├── private/                  # 本地数据（gitignored）
├── labs/                     # 实验性工作（研究、原型、探索）
├── tmp/                      # 临时数据
├── local/                    # 本地定制（均为 git 跟踪）
│   ├── config.md             # 项目基础配置（WIKI_LANG、PORT、WIKI_NAME、MEMEX_ROOT 等）
│   ├── butler/               # butler 专属扩展（chapter-map.md、自定义规则等）
│   ├── gene/                 # 本 wiki 独有的扩展基因（skills/gene/ 中没有的新基因）
│   ├── config/               # 插件本地设定（→ publish → docs/wiki/js/local/*.min.js）
│   ├── script/               # 本 wiki 特有的脚本
│   ├── template/             # 页面图式模板（由 MTD3 生成，<type>-schema.md）
│   ├── skills/               # 本 wiki 扩展的 skills
│   └── memory/               # 本 wiki 积累的知识（Claude memory）
├── README.md                 # 项目说明
├── CHANGELOG.md              # 变更日志
├── .gitignore                # git 忽略规则
├── CLAUDE.md                 # 入口文件，说明如何载入所有其他内容
└── LAW.md                    # 宪法之下的本地法律，不可违背
```

### 1.3 Skills 不复制

所有 skills 集中存放在 `$MEMEX_ROOT/.claude/skills/`，各 wiki 通过 symlink 引用：

```bash
ln -s ../memex/.claude/skills/butler   .claude/skills/butler
ln -s ../memex/.claude/skills/enrich   .claude/skills/enrich
ln -s ../memex/.claude/skills/wiki     .claude/skills/wiki
# ... 各 wiki 选择性链接所需 skills
```

本 wiki 扩展的 skills 放在 `local/skills/`，由 CLAUDE.md 显式加载。

### 1.4 TODO.md 约定

各 wiki 根目录可存放 `TODO.md` 作为工作追踪文件。用户说"写入TODO"/"加入TODO"时，指的是编辑此文件，**而非**使用 `TodoWrite` 工具。功能需求应迁移至 GitHub Issues。

### 1.5 法源体系

本项目实行六层法源体系，从高到低：**宪法 > 本地法律 > 实施条例 > 技术规范 > 基因/技能定义 > 配置/规则/脚本**。各层级定义、适用范围及冲突解决原则详见 `ref/spec/sys-norm-hierarchy.md`。

核心结构：

| 层级 | 文件 | 性质 |
|------|------|------|
| L1 | `CONSTITUTION.md`（本文件） | 宪法，全局最高，不可违背 |
| L2 | `LAW.md`（各 wiki 根目录） | 本地法律，宪法之下的原则性约束 |
| L3 | `CLAUDE.md`（各 wiki 根目录） | 实施条例，PN 映射/页面类型/端口等 binding 规则 |
| L4 | `ref/spec/*.md` | 技术规范，L3 的具体化 |
| L5 | `.claude/skills/*/SKILL.md` → `skills/gene/*.md` | 基因/技能定义，可执行的操作逻辑；内部 skill > gene |
| L6 | `local/config/*` → `_context.md` → 内嵌规则 → `wiki/scripts/*.py` | 配置/规则/脚本，最底层实现；内部 config > context > rules > script |

**冲突时**：层级数字越小越优先（L1 > L2 > ... > L6）。

`CLAUDE.md` 是 Claude 进入项目时首先读取的入口文件，必须说明：
- `MEMEX_ROOT` 位置
- 引用了哪些共享 skills
- 本 wiki 特定规范（PN 映射、页面类型等）

`ref/spec/` 下的文件是 L3 声明规范的具体化，不得与上位法律矛盾。参见 `ref/spec/sys-norm-hierarchy.md` 获取完整法源体系定义。

### 1.6 Wiki 引擎版本与 CDN 分发

Wiki 引擎 JS 代码在发布时打包为单一文件，上传 CDN 供所有 wiki 共享：

- `memex@vX.Y.Z/memex.min.js` — 核心引擎（core, renderer, router, parser 等）

插件保持独立目录形式，不合并入 CDN 文件；各 wiki 按需引用本地插件目录。

本地配置从 `local/config/` 编译后发布到 `docs/wiki/js/local/*.min.js`，每个 wiki 独立。

### 1.7 本地预览端口约定

各 wiki 本地预览服务的端口号**建议使用与项目相关的历史年份**（成书年、奠基年等），避免 8080/3000 等通用端口冲突：

| wiki | 端口 | 含义 |
|------|------|------|
| ai-history | 1956 | 达特茅斯会议年 |
| honglou | 1763 | 曹雪芹逝世年 |
| tongjian | 1084 | 《资治通鉴》完成年 |

新建 wiki 时在 `wiki.sh` 中选定一个项目专属端口并在 `LAW.md` 中记录。

### 1.8 会话启动强制检查

Claude 在每次会话的**第一次响应前**，必须按顺序执行以下检查：

1. 读取本项目 `CLAUDE.md`（了解项目规则与禁止行为）
2. 读取本项目 `LAW.md`（了解本 wiki 特有规则与约束）
3. 执行 `git status`（了解当前工作状态）

跳过任一步骤均可能导致违规操作或破坏已有工作。

---

## 二、页面分片规范

> RFC-tongjian-0002 引入。适用于所有 wiki，在 `pages/` 文件数超过 5,000 后强制执行。

### 2.1 共享模块：`page_bucket.py`

`$MEMEX_ROOT/wiki/scripts/page_bucket.py` 是所有 wiki 的**页面路由共享模块**。

核心接口：

```python
def page_bucket(name: str) -> str:
    """页面名 → 桶名（如 '刘备' → 'li'，'About' → 'ab'）"""

def page_path(slug: str) -> str:
    """页面名 → pages/ 下相对路径（如 '刘备' → 'li/刘备.md'）"""

def resolve_page_file(root: Path, slug: str) -> Path | None:
    """按 slug 在 pages_root 下查找文件（先查桶子目录，再 fallback 根目录）"""
```

**算法原则**：「拉丁化后的两字母」——中文用拼音前 2 字母、ASCII 直取前 2 字母数字、
其他 Unicode 字符用 NFD 正规化后取 alpha 字符、无法拉丁化时 fallback 到 UTF-8 前 2 字节 hex。

### 2.2 Registry `path` 字段

`pages.json` 中每个条目**必须**包含 `path` 字段，表示页面文件在 `pages/` 目录下的相对路径：

```json
{
  "刘备": { "type": "person", "label": "刘备", "path": "li/刘备.md" },
  "About": { "type": "concept", "label": "About", "path": "ab/About.md" }
}
```

- 未分桶 wiki（平铺目录）：`path` 等于 `"{slug}.md"`
- `build_registry.py` 对所有页面自动输出 `path` 字段
- `pages.lite.json` 同样包含 `path` 字段

### 2.3 前端路径统一通过工具函数

**禁止在前端 JS 中直接拼接 `pages/${pid}.md` 或 `history/${page}.jsonl`**，必须使用 `util.js` 提供的工具函数：

```javascript
// util.js 导出
export function _pageFile(pid, meta) {
  return (meta && meta.path) || pid + '.md';
}

export function _historyBucket(page, registry) {
  const p = registry?.pages?.[page]?.path;
  if (!p) return null;
  const idx = p.indexOf('/');
  return idx > 0 ? p.slice(0, idx) : null;
}

export async function historyAll(page, registry) { /* ... */ }
```

| 场景 | 必须使用 |
|------|---------|
| 读取页面文件 | `_pageFile(pid, meta)` |
| 构造 history 路径 | `_historyBucket(page, registry)` |
| 读取全部修订 | `historyAll(page, registry)` |

`_pageFile()` 在 `meta.path` 缺失时自动 fallback 到平铺路径，保证向前兼容。每次分桶迁移后，grep `'pages/\${'` 和 `'history/\${'` 确认无残留硬编码。

### 2.4 History 文件路径约定

`history/<page>.jsonl` 的实际路径由 `page_bucket(page)` 决定：

```
写入：history/{bucket}/{page}.jsonl
读取：从 registry path 提取 bucket，拼入路径
```

平铺 wiki（未分桶）：保持 `history/{page}.jsonl`，无需迁移。

---

## 三、本地基因规范

> 适用于所有 wiki 实例的 `local/gene/` 目录。

### 3.1 本地新基因命名

本 wiki 独有、不打算升格为 memex 通用基因的新基因，文件名格式：

```
LOCAL-<wiki名><两位序号>-<kebab-case描述>.md
```

示例：
- `LOCAL-investor01-table-proofread.md`
- `LOCAL-aima03-hybrid-pn-verify.md`
- `LOCAL-shijikb02-timeline-sanity.md`

**规则**：
- `<wiki名>` 取 `local/config.md` 中 `WIKI_NAME=` 的值，去除空格和特殊字符，全小写
- 序号从 01 起，同 wiki 内不重用
- `LOCAL-` 前缀大写，其余全小写
- 不得使用 memex 已有的三字母前缀（ADM/CHK/PRE 等），以免被 `gene_lookup.sh` 误判为覆盖

frontmatter 最低要求：

```yaml
---
id: LOCAL-<wiki名><序号>-<描述>
group: LOCAL
wu: <预估 WU>
scope: <wiki名>        # 明确声明只适用于本 wiki
applicable: true
born: YYYY-MM-DD
---
```

### 3.2 覆盖 memex 基因

若本 wiki 需要修改 memex 基因的行为，在 `local/gene/` 下放**与 memex 同名**的文件，`gene_lookup.sh` 优先级机制自动生效（RFC-memex-0016）。

`gene_lookup.sh` 位于 `$MEMEX_ROOT/wiki/scripts/gene_lookup.sh`，实现三级优先级查找：
```
local/gene/  >  $MEMEX_ROOT/skills/gene/local/  >  $MEMEX_ROOT/skills/gene/
```
任何需要读取基因定义的操作，必须通过此脚本获取路径，禁止直接硬编码 `skills/gene/<ID>.md`。

覆盖文件**必须**在 frontmatter 声明：

```yaml
---
id: <memex-gene-id>        # 与被覆盖基因相同
overrides: skills/gene/<memex-gene-id>.md
override_reason: <一句话说明差异原因>
born: YYYY-MM-DD
---
```

正文只写与 memex 版本的**差异**，其余内容标注"同 memex 版本"。禁止整文复制 memex 基因再修改——必须用 `overrides:` 字段声明来源，便于同步 memex 上游更新。

### 3.3 升格为 memex 基因

当本地基因满足以下任一条件时，应通过 RFC 升格为 memex 通用基因：
- 被 2 个或以上 wiki 独立使用
- 覆盖基因的修改被确认适用于所有 wiki

升格后，`local/gene/` 中原文件改为指向 memex 版本的单行 stub：

```markdown
> 本基因已升格为 memex 通用基因，见 `skills/gene/<id>.md`。
```

**已升格的 memex 通用 gene（按升格时间）**：

| Gene ID | 升格来源 | 说明 | RFC |
|---------|---------|------|-----|
| `SCN29-pn-reflect-discover` | tongjian | PN 颗粒度语义反思发现，覆盖单字名/官职名/别名等机械匹配盲区 | RFC-tongjian-0005 |

---

**▌ Part B — 安全铁律**

---

## 四、核心铁律（绝对禁止，无一例外）

### 4.1 内容保护原则

**禁止整节或整页的无差别替换。** 以内容量级区分允许的操作范围：

| 操作范围 | 规则 |
|---------|------|
| 目标节不存在 | ✅ 可新建追加 |
| 目标字段为空 | ✅ 可填入新值 |
| 对已有行/段落进行措辞润色、信息补充、质量提升 | ✅ 允许，属于正常编辑 |
| 基因（如 enrich、重组）对整页进行结构化升级 | ✅ 允许，但必须保留所有已有节标题 |
| 用新内容整段替换现有节，不保留旧内容 | ❌ 禁止 |
| 以"更完整"为由整页覆盖 | ❌ 禁止 |

**核心禁忌**：不得悄悄丢掉已有内容。enrich 操作必须在新版中保留旧版的全部 `##` 节（节内内容可提升，节标题不得消失）。

血泪教训：史记 wiki（2026-04-24）用新内容替换 136 个页面的原文引文节，丢失全部精心编写的内容；红楼梦 wiki（2026-04-28）enrich 操作覆盖 13 个页面的已有章节。

### 4.2 Git 安全操作铁律

以下命令**不得以任何理由执行**，且已在所有 wiki 的 `.claude/settings.json` deny 列表中强制拦截：

```bash
❌ git commit*              — 直接提交须走授权路径（见本节末）
❌ git add -A / git add . / git add --all
❌ git push --force / git push -f
❌ git reset --hard
❌ git checkout -- <file> / git restore <file>   — 会覆盖工作区
❌ git checkout <commit> -- <file>               — 同样会覆盖工作区文件
```

**deny 规则对应**（`init_security.py` DEFAULT_DENY 维护，`init_security.py <wiki>` 可同步到新 wiki）：

| deny 规则 | 拦截目标 |
|-----------|---------|
| `Bash(git commit*)` | 所有 `git commit` 变体 |
| `Bash(git push --force*)` / `Bash(git push -f*)` | 强制推送 |
| `Bash(git reset --hard*)` | 硬重置 |
| `Bash(git checkout --*)` | `git checkout -- <file>` |
| `Bash(git checkout * -- *)` | `git checkout <commit> -- <file>` |
| `Bash(git restore*)` | restore 覆盖 |
| `Bash(git add -A*)` / `Bash(git add .*)` / `Bash(git add --all*)` | 批量暂存 |

**授权提交路径**（以下三条在 allow 列表，其余所有 `git commit` 形式仍被 deny）：
- `bash wiki/scripts/wiki_commit.sh "<msg>"` — 供 `/wiki`、`/rfc` 调用
- `bash wiki/scripts/skill_commit.sh "<msg>"` — 供 `ADM4-commit`（butler 定期提交基因）调用
- `git commit -F /tmp/gitmsg_*` — 供 `/commit --auto` 技能调用

提交消息格式规范见 §五。

**适用范围**：以上禁令对所有 wiki（含 memex 仓库自身）均有效。§4.3 允许在 memex 自身目录下写文件，但不解除本节的 git 操作限制。

恢复旧版内容的正确替代方案：
```bash
✅ git diff <commit> -- <file>   # 查看差异
✅ git show <commit>:<file>      # 查看旧版，手动编辑修复
✅ git stash + 征求用户同意
```

血泪教训：史记 wiki（2026-04-01/02）两次擅自 `git checkout` 恢复文件，第二次丢失 64 个章节的 PN 修复和人名修复，用户极度愤怒。

### 4.3 Memex 只读——子 Wiki 禁止写入 Memex

**任何独立 Wiki 项目（ai-history、honglou、shiji-kb、three-body、tongjian、aima 等）在 Claude 操作时，绝对禁止对 memex 目录的任何写操作。只有直接在 memex 项目自身目录下工作时才允许写入。**

保护范围（包括但不限于）：

| 禁止的操作 | 示例 |
|-----------|------|
| 禁止 Edit/Write 工具操作 memex 下的任何文件 | 禁止修改 `$MEMEX_ROOT/wiki/public/js/` 下的 JS 文件 |
| 禁止 Bash 命令在 memex 下创建/修改/删除文件 | 禁止 `touch "$MEMEX_ROOT/..."`、`rm "$MEMEX_ROOT/..."` |
| **禁止任何方式**在 memex 下写入文件，包括 Python/Node/Perl 等脚本通过文件 API 写入、shell 重定向、`sed -i`、`tee`、`dd` 等 | 禁止 `python3 -c "open('$MEMEX_ROOT/...', 'w')"` 等绕过工具名检查的写入手段；**禁止的依据是写操作的效果，而非调用的工具名** |
| 禁止 `git` 操作改变 memex 仓库状态 | 禁止在非 memex 项目下对 `$MEMEX_ROOT` 执行 `git add/commit/push` |

**允许的操作**（只读执行，不改变 memex 状态）：

| 允许的操作 | 示例 |
|-----------|------|
| 调用 memex 的共享脚本（只执行不写入） | `python3 "$MEMEX_ROOT/wiki/scripts/add_page.py"` |
| 读取 memex 的宪法和配置 | `cat "$MEMEX_ROOT/CONSTITUTION.md"` |
| 读取 memex 的文件内容 | Read 工具读取 memex 下的文件 |
| 通过 symlink 引用 memex 的 skills | `.claude/skills/ → $MEMEX_ROOT/.claude/skills/` |

**路径识别**：

- `$MEMEX_ROOT` 环境变量（通常为 `~/memex` 或实际路径 `/home/baojie/work/knowledge/memex`）
- `~/memex` symlink 指向的实际路径
- `/home/baojie/work/knowledge/memex/` 完整路径

以上任一路径匹配即触发本规则。子 Wiki 项目中如果检测到文件路径以 memex 路径开头，必须拒绝执行写操作，报告用户该操作应在 memex 项目自身目录下进行。

血泪教训（一）：ai-history wiki 的 enrich 操作曾试图直接写入 `$MEMEX_ROOT/wiki/public/js/` 修改引擎代码以适配中文标点渲染，实际上引擎修改应在 memex 项目目录下进行，子 wiki 只应调整本地配置。

血泪教训（二）：2026-05-17，aima wiki 排查 diff 404 问题时，Edit 工具被钩子拦截后改用 Python heredoc 脚本通过 Bash 写入 memex 文件，同时绕过了 `restrict_to_project.py`（只检查工具名）和 denylist（只覆盖 shell 原生操作）两层防护。此即 RFC-aima-0036 的来源。禁止的依据必须是写操作的效果，而非工具名。

**技术保障**：新建 wiki 须运行 `python3 "$MEMEX_ROOT/wiki/scripts/init_security.py" .` 生成 `.claude/settings.json`。该脚本在 deny 列表中写入针对三类 memex 路径（`$MEMEX_ROOT`、`~/memex`、绝对路径）的拦截规则，并注册 PreToolUse hook `restrict_to_project.py`，覆盖 Edit/Write/NotebookEdit 及 Bash 命令中的写操作（静态扫描 Python open/shell redirect/cp/mv/tee/dd/sed -i 等模式）。详见 `BIRTH.spec.md §0-C`。

### 4.4 原文保护

- `corpus/` 下的原文文本：**自动化脚本和 Claude 自主操作禁止修改**；用户明确指令下可修改（如勘误、版本替换）
- 由导入脚本生成的章节页面（如 `第???章.md`）禁止手工编辑；修改格式需重跑导入脚本

### 4.5 禁止捏造

- 所有事实陈述必须有原文依据
- 每条引文必须标注 PN 编号
- 不确定时写「（待考证）」，禁止伪造 PN

### 4.6 修订记录铁律

**任何页面内容发生变更后，必须立即调用 `record_revision.py` 留下修订记录。** `add_page.py` 和 `edit_page.py` 已内置此步骤；若通过任何其他途径修改了页面文件（批量脚本、直接写入等），必须手动补调：

```bash
python3 "$MEMEX_ROOT/wiki/scripts/record_revision.py" SLUG \
  --summary "操作描述（如：enrich: 补充生平年表）" \
  --author butler
```

参数说明：
- `SLUG`：页面文件名（不含 `.md`），如 `刘备`、`value-investing`
- `--summary`：本次修改的一句话描述，写入修订历史，供 Recent Changes 展示
- `--author`：操作者标识，默认 `butler`，人工操作可填 `human`
- `--action`：`edit`（默认）或 `delete`

`record_revision.py` 同时写入三处：`history/{bucket}/{slug}.jsonl`（页面级历史，支持分桶；平铺 wiki 无 bucket 前缀）、`recent.lite.jsonl`（全局最近修改）、`recent.diff.jsonl`（带 diff 的全局日志）。漏调导致的历史缺口可事后用 `backfill_recent.py` 批量回填，但应尽量避免。

**正确 enrich 示例**（旧节必须完整保留，新内容追加在后）：

```markdown
## 性格
（旧有内容，一字不动保留）

## 原文引用        ← 旧有节，保留
（旧有引文，保留）

## 生平年表        ← 新增节，追加在最后
（新写内容）
```

---

## 五、Git Commit 格式规范

安全禁止见 §4.2。格式规范如下：

- **只显式暂存**：`git add <具体路径>`，禁止 `git add -A`
- **消息格式**：首行 ≤50 字，说明做了什么；正文用 `Wiki:` 小标题分组列出各词条变更

```
wiki: 新增词条「图灵」「达特茅斯会议」

Wiki:
- 新增 图灵（英国数学家，图灵测试提出者）
- 新增 达特茅斯会议（1956，AI 命名会议）
```

---

**▌ Part C — 内容标注规范**

---

## 六、页面编辑工具链

**禁止直接用 Write/Edit 工具写页面文件。所有页面操作必须通过脚本。**

每个 wiki 使用 `$MEMEX_ROOT` 下的共享脚本（保证 revision 历史完整性）：

```bash
# 新建页面（从任意 wiki 目录执行）
python3 "$MEMEX_ROOT/wiki/scripts/add_page.py" SLUG - \
  --summary "新增：SLUG" --author butler << 'EOF'
[完整页面内容]
EOF

# 编辑页面（--enrich 自动检查旧版所有 ## 节在新版中保留）
python3 "$MEMEX_ROOT/wiki/scripts/edit_page.py" SLUG - \
  --summary "更新：SLUG" --author butler --enrich << 'EOF'
[完整新内容，必须保留旧版所有 ## 节]
EOF
```

原因：直接写文件绕过自动 revision 记录，`recent.lite.jsonl` 和 `history/<page>.jsonl` 将缺失条目。修订记录铁律见 §4.6。

---

## 七、PN（段落号）引注系统

### 7.1 PN 格式

PN 格式三条规则（详见 `ref/spec/data-pn.md`——代码位置注册表与规范）：
```
1. PN 有 2 段或 3 段：  NNN-PPP 或 VVV-NNN-PPP
2. 第一段：3 位大写字母或数字（003、GEN、2CO、P01）
3. 第二、三段：3–4 位数字（001、1234）
```

**章节标识规则**：
- 正文章节：三位数字零填充，如 `001`–`294`
- 章节数超过 999 时，使用四位数字，如 `1001`
- 特殊章节（前言、附录、序等）：可使用非纯数字标识，如 `P01`、`APP`
- 无法按自然结构分段的书（诗集、碎片文本等）：使用六位随机字母+数字 ID，如 `a3fK9m`

具体章节标识映射在各项目 CLAUDE.md 中定义。

### 7.2 使用规则

**括号类型由 `WIKI_LANG` 决定**（见各项目 `local/config.md`）：

| WIKI_LANG | 行内引注 / blockquote PN | 章节页段落标注 |
|-----------|------------------------|--------------|
| `zh` 中文 | **全角括号** `（NNN-PPP）` | 半角方括号 `[NNN-PPP]` |
| `en` 英文 | **半角括号** `(NNN-PPP)` | 半角方括号 `[NNN-PPP]` |

章节页段落标注两种语言一致，均用半角方括号。

**行内引注**（实体页，句末）：
```markdown
<!-- WIKI_LANG=zh -->
图灵在 1950 年提出了著名的"图灵测试"（001-017）。

<!-- WIKI_LANG=en -->
Turing proposed the famous "Turing Test" in 1950. (001-017)
```

**章节页段落标注**（段首，两种语言一致）：
```markdown
[001-017]图灵在 1950 年提出了著名的"图灵测试"……
```

**blockquote 引文**（引文末另起一行写 PN）：
```markdown
<!-- WIKI_LANG=zh -->
> 我建议我们 1956 年夏天在新罕布什尔州汉诺威……
>
> （001-023）

<!-- WIKI_LANG=en -->
> We propose that a 2-month, 10-man study of artificial intelligence…
>
> (001-023)
```

**PN 范围格式**（分隔词必须在括号外）：
```
✓ 正确（zh）：（001-015）至（001-018）
✓ 正确（en）：(001-015) to (001-018)
✗ 错误：（001-015至001-018）
```

**多个 PN 并列时，每个 PN 独立一对括号**：
```
✓ 正确（zh）：（001-038）（003-001）
✓ 正确（en）：(001-038)(003-001)
✗ 错误：（001-038，003-001）
```

血泪教训：麦卡锡词条（2026-05-10）写出 `（001-038，003-001）` 这种括号内逗号分隔的格式，pn-citation 插件只能识别独立括号，合并写法导致两个 PN 都无法跳转。

**表格内 PN 列格式与行内引注一致**（按 WIKI_LANG 选括号类型，禁止裸写编号）：
```
✓ 正确（zh）：| 1948 | 发表《通信的数学理论》 | （001-054） |
✓ 正确（en）：| 1948 | Published "A Mathematical Theory" | (001-054) |
✗ 错误：| 1948 | 发表《通信的数学理论》 | 001-054 |
```

血泪教训：香农词条（2026-05-10）生平年表 PN 列写成裸文本 `001-054`，无法触发 pn-citation 插件跳转。

**禁止用 wikilink 替代 PN**：
```
✗ 错误：（[[第一章]]）
✓ 正确：（001-PPP）
```

---

## 八、Wikilink 规范

### 8.1 基本格式

```markdown
[[词条名]]
[[词条名|显示文字]]
```

### 8.2 禁止 wikilink 的位置

- **H1/H2/H3 标题**禁止包含 `[[wikilink]]`
- 章节标题（如 `## 第一章 图灵的思想实验`）也不加链接
- 链接应放在正文或引文中

### 8.3 修辞性描写的链接原则

- 不链接：颜色词、通用修饰语（金丝、八宝等）
- 链接核心名词：具有独立词条的实体
- 禁止把整个修饰短语包成链接

### 8.4 消歧义规则

同名词条：禁止使用无后缀的单字/短名作页面 id，必须加括号后缀：
```
✓ 罗素_(哲学家).md   id: 罗素_(哲学家)
✗ 罗素.md            id: 罗素
```

### 8.5 单字禁链

**单字页面禁止使用裸字作为 id**（如 `蕙.md`），自动 wikifier 会将正文中所有出现该字的地方错误链接到该页面（如"佳蕙"被拆分为"佳[[蕙]]"）。

必须使用带消歧义后缀的完整词条名，正文中通过竖线语法隐藏后缀：

```
✓ 正确：[[蕙_(植物)|蕙]]
✗ 错误：[[蕙]]·`蕙.md`
```

**正文中的裸单字链接同样违规**：`[[字]]`（双括号内仅一个汉字，无消歧义后缀）属于编辑错误，无论该页面是否存在。必须消歧义到正确页面：

```
✓ [[蕙_(植物)|蕙]]   — 指向带后缀的消歧义页面
✗ [[蕙]]             — 裸单字链接，来源不明
```

无法确定类别时，用 `_(概念)` 兜底；若该字不值得链接，直接去掉链接即可。

标准化消歧义后缀表：

| 类别 | 后缀 | 类别 | 后缀 |
|------|------|------|------|
| 植物 | `_(植物)` | 动物 | `_(动物)` |
| 器物 | `_(器物)` / `_(用具)` | 首饰 | `_(首饰)` |
| 建筑 | `_(建筑)` | 身份 | `_(身份)` |
| 自然 | `_(自然)` / `_(气象)` | 织物 | `_(织物)` |
| 乐器 | `_(乐器)` | 药物 | `_(药物)` / `_(丹药)` |
| 书法 | `_(书法)` | 交通 | `_(交通)` |
| 礼器 | `_(礼器)` | 地貌 | `_(地貌)` |
| 香料 | `_(香料)` | 游戏 | `_(游戏)` |
| 家具 | `_(家具)` | 鞋履 | `_(鞋履)` |
| 其他 | `_(概念)` 兜底 |

### 8.6 链接禁忌

以下类型的词汇不应添加 wikilink：

1. **单字不链**：单个汉字不加链接（指向单字页面时用消歧义后缀 + 竖线语法，见 8.5）
2. **截断不链**：末尾带省略号（`…`）的链接是编辑错误，应修复为完整词条名或去掉链接
3. **时空外不链**：不属于本 wiki 作品时代背景的现代/外部词汇（如"中国""东南亚"），除非在原著中直接提及且 wiki 中有专属页面
4. **通用词汇不链**：过于泛指的普通名词（"作者""习俗""京城""太太"等），除非在原著中有特定含义且有专属页面
5. **语料未验证不链**：链接目标必须在原著原文中有直接提及（经 `corpus_search` 验证至少 1 条命中），自动脚本添加的链接不受此限

**一句话原则**：红链应当是"尚未创建的页面"，而非"不应创建的页面"。

### 8.7 历史人物必链

> **适用范围**：honglou、tongjian、shiji-kb（含历史人物的 wiki）；ai-history、three-body 不适用。

**正文中出现的非虚构历史人物名（帝王、后妃、名将、文人等），一律添加 wikilink**，即使目标页面尚未创建（保持红链以待后续补页）。

示例：
```markdown
案上设著[[武则天]]当日镜室中设的宝镜，一边摆著[[赵飞燕|飞燕]]立著舞过的金盘。
```

---

## 九、Frontmatter 规范

### 9.1 Frontmatter 字段模板

**基础字段**（所有词条类型适用）：

```yaml
---
id: 词条名
type: person       # 见 9.2 页面类型表
label: 显示名
aliases: [别名1, 别名2]
tags: [标签]
description: 一句话描述
featured: true     # 可选，首页精选
---
```

**人物扩展字段**（type: person 时可选）：

```yaml
era: 年代（如 1950s）
field: 领域
affiliation: 所属机构
nationality: 国籍
born: 出生年
died: 逝世年
```

### 9.2 页面类型

| type | 含义 | 适用项目 |
|------|------|---------|
| person | 人物 | 所有项目 |
| concept | 概念/技术/制度 | 所有项目 |
| event | 事件 | 所有项目 |
| organization | 机构/组织 | 所有项目 |
| chapter | 原文章节页 | 所有项目 |
| overview | 综述页 | 所有项目 |
| list | 列表页 | 所有项目 |
| theory | 理论/模型 | ai-history, three-body, aima |
| system | 系统/程序 | ai-history, aima |
| place | 地点 | three-body, honglou, tongjian |
| quote | 名句 | three-body, tongjian |
| book | 书册/卷 | three-body |
| story | 故事 | three-body |
| civilization | 文明 | three-body |
| era | 纪元 | three-body |
| law | 物理/宇宙法则 | three-body |
| technology | 科技/设备 | three-body |
| weapon | 武器 | three-body |
| family | 家族 | honglou |
| object | 器物/珍宝 | honglou |
| time | 时间/节气 | honglou |
| poem | 诗词 | honglou |

各项目可在 `LAW.md` 或 `CLAUDE.md` 中补充项目特定的页面类型。

### 9.3 YAML 特殊字符处理

自由文本字段（description、label 等）值**含冒号或引号时，必须用单引号包裹整个值**，否则 `build_registry.py` 的 YAML 解析失败，整个 frontmatter 被丢弃（type 变成 `"unknown"`、aliases 变成 `[]`）：

```yaml
# ❌ 错误：含冒号
description: A knowledge base from "AI: A Modern Approach" by Russell.
# ❌ 错误：外层双引号内含双引号
description: "达特茅斯会议组织者，"人工智能"命名推广者"

# ✅ 正确：一律用单引号包裹
description: 'A knowledge base from "AI: A Modern Approach" by Russell.'
description: '达特茅斯会议组织者，"人工智能"命名推广者'
```

血泪教训：麦卡锡词条（2026-05-10）description 外层双引号内含 `"人工智能"`，YAML 解析失败，整个 frontmatter 无法读取，infobox 不显示。

### 9.4 项目特定可选字段

各项目可根据需要添加以下字段（均在 `LAW.md` 中声明）：

**`dynasty`**（所属朝代，tongjian 推荐）：周 / 春秋 / 战国 / 秦 / 西汉 / 东汉 / 三国 / 隋 / 唐 / 宋 等

**`event_type`**（事件分类，tongjian 必填）：战争 / 战役 / 政变 / 改革 / 外交 / 叛乱 / 继位 / 礼制 / 灾害

**`books`**（所属书册，three-body 推荐）：如 `[三体I, 三体II, 三体III]`

---

## 十、页面质量等级

| 等级 | 显示徽章 | 含义 |
|------|---------|------|
| stub | （无）| 存根，仅基本信息 |
| basic | （无）| 基础，含 1–2 个 `##` 节 |
| standard | 标准 | 完整内容 + PN 引注 + 引文 |
| featured | 精品 | 深度 + 交叉链接 + 原文详注 |
| premium | 旗舰 | 完整知识图谱集成，最高质量 |

---

**▌ Part D — 格式与写作规范**

---

## 十一、写作风格禁令

### 11.1 禁止滥用破折号 / 禁止链式文风

**严禁以 `——` 作为万能句间连接符。** 替代规则：

- **说明/结果/转折** → 用句号
- **引出冒号内容** → 用 `：`
- **并列关系** → 用逗号或分号
- **补充修饰** → 用逗号

**仅以下三种用法允许破折号**：
1. 强调插入语：`这是全书最关键的物件——通灵宝玉——也是全书叙事的起点。`
2. 表示声音延长：`宝玉喊道：「黛玉——」`
3. 话题突转：`宝玉正要说话——忽听门外有人喊道。`

**❌ 严禁万能破折号链式文风（AI 生成腔）**：

> X 是一种重要技术——它能够处理大规模数据——同时保持高效运算——并在多个领域广泛应用——对AI发展产生了深远影响。

这种"A——B——C——D"无限串联必须拆为独立句子。判断原则：一处 `——` 若可替换为逗号/句号/冒号且语义不变，则必须替换。enrich 操作生成的散文须逐段检查此问题。

血泪教训：红楼梦 wiki（2026-05-08）批量修复 11 个页面，每页 5–12 处 `——` 被滥用为句读。

### 11.2 禁止巨型段落

**一个段落只讲一个子话题，段落超过 5–6 句时必须拆分。** 拆分原则：
- 每段有独立的中心论点
- 论证、举例、总结可各占一段
- 并列的多个子话题（A / B / C）各自独立成段

---

## 十二、引文格式规范

blockquote 引文的完整格式：

```markdown
> 完整引用句子，保持原文标点。
>
> （NNN-PPP）
```

长引文在自然断句处插入空行分段（门槛：CJK 超过 100 字符，拉丁字母超过 65 词）：
```markdown
> 第一句话，「引用开始，……很长很长的内容，
>
> 续行内容」（NNN-PPP）
```

---

## 十三、语义块 `:::` 规范

### 13.1 `:::` 块前必须空行

`::: query`、`::: infobox`、`::: image` 等语义块前**必须空行**，否则 markdown-it 会将其与前文渲染到同一个 `<p>` 中，导致占位符正则无法匹配、块内容不渲染：

```markdown
✓ 正确：
前文内容。

::: infobox
块内容
:::

✗ 错误：
前文内容。
::: infobox
块内容
```

`:::` 块后建议空行（非强制），保持源文件可读性。

### 13.2 `:::` 块开启行必须含空格

`:::` 与块类型名之间**必须有至少一个空格**，否则 `semantic-block` 解析正则 `/^:::[ \t]+(\w+)/` 不匹配，整个块静默失效、渲染为原始文字：

```markdown
✓ 正确：
::: query
::: infobox
::: seealso [[A]] · [[B]]

✗ 错误（静默失效，不报错）：
:::query
:::infobox
:::seealso [[A]]
```

**适用范围**：所有生成 `:::` 块的工具、脚本、gene、enrich 等，写入时必须使用 `::: <type>` 格式。关闭行 `:::` 后可无空格。

---

**▌ Part E — 技术运维**

---

## 十四、JS/CSS 修改安全规范

每次修改 JS 文件后必须执行语法检查：

```bash
# MEMEX_ROOT 已由各 wiki 的环境配置设定，或手动指定：
# export MEMEX_ROOT=~/memex
node --check "$MEMEX_ROOT/wiki/public/js/renderer.js"
node --check "$MEMEX_ROOT/wiki/public/js/router.js"
```

常见高发故障：
- 多余/缺少 `}` `)` → 整个 app 不加载
- 注释块未闭合 `/**` → `*/` → 部分功能失效
- CSS 选择器未闭合 `{` → 样式全部错乱

---

## 十五、本地开发

```bash
# 本地预览（从任意 wiki 目录执行）
bash "$MEMEX_ROOT/wiki/wiki.sh"

# 构建注册表
python3 "$MEMEX_ROOT/wiki/scripts/build_registry.py" docs/wiki/pages \
  --out docs/wiki/pages.json \
  --out-lite docs/wiki/pages.lite.json

# 发布到 docs/wiki/
bash publish.sh
git add docs
bash wiki/scripts/wiki_commit.sh "wiki: 发布"
git push
```

---

## 十六、插件 i18n 规范

详见 **[ref/spec/content-i18n.md](ref/spec/content-i18n.md)**。

核心原则：所有共享引擎插件（`wiki/public/plugins/` 及 `wiki/public/js/`）不得硬编码任何语言的 UI 字符串，一律通过 `core.t(key)` 获取，确保英文 wiki 不出现中文界面字符串。

---

**▌ Part F — 项目管理**

---

## 十七、命名规约

### 17.1 Butler → 管家

Butler（编辑自动化系统）在中文语境中一律称**管家**，禁止使用"但丁"。所有中文文档、日志、对话中引用时用"管家"。

英文语境或代码标识符中保留 `butler`（如 `logs/butler/`、`SKILL_W*` 文件、`--author butler`）。

---

## 十八、工作记录规范：Journal 与 Log 的区别

### 18.1 两种记录的定位

| 维度 | Log（运行日志） | Journal（工作日志） |
|------|---------------|-------------------|
| 性质 | 例行运营记录 | 问题调查与经验沉淀 |
| 触发 | 自动/定期 | 手动/按需 |
| 内容 | 做了什么、处理了多少条目 | 遇到什么问题、为什么、怎么解决、经验 |
| 目标读者 | 系统监控、队列状态追踪 | 未来的自己或协作者 |
| 存放位置 | `logs/butler/`、`logs/build/` | `ref/journal/` |
| 文件命名 | 脚本自动生成（含时间戳） | `YYYY-MM-DD_短标题.md`（手动命名） |

**一句话区分**：Log 是运营流水账，Journal 是问题调查笔记。

### 18.2 Journal 文件规范

**位置**：`ref/journal/`

**命名**：`YYYY-MM-DD_短标题.md`
- 日期用当天日期
- 短标题用英文 kebab-case，描述问题主题，≤5 词
- 示例：`2026-05-16_section-xhtml-link-conversion.md`

**内容模板**：

```markdown
# YYYY-MM-DD 问题简述

## 问题
（遇到了什么现象）

## 调查
（查了哪些文件/代码，发现了什么）

## 解决方案
（做了什么改动，为什么这样改）

## 结果
（验证数据）

## 经验
（对未来有参考价值的规律，精炼成条目）
```

**写作原则**：专注于「为什么」，而非「做了什么」（做了什么看 CHANGELOG 和 git log）。

### 18.3 何时写 Journal

满足以下任一条件时应当写 Journal：

1. 调查了不止一个文件才找到根因
2. 修复涉及两个或以上独立组件
3. 遇到意外行为或反直觉的设计
4. 为此专门写了一个 RFC

### 18.4 RFC 与 Journal 的配合

- **RFC**：对外——记录「系统有什么问题，应该怎么修」，提交到 memex GitHub Issues
- **Journal**：对内——记录「我如何调查并临时解决了这个问题」，留在 wiki 项目的 `ref/journal/`

同一个问题可以同时产生 RFC（推动 memex 修复）和 Journal（记录本地 workaround 过程）。

---

## 十九、pages.json 作为页面路径的唯一可信来源

所有访问 wiki 页面文件的脚本，**必须以 `pages.json` 的 `path` 字段为唯一可信来源**获取文件路径，不得从 page id 自行推导路径。

**禁止的模式**（对 CJK id 失效）：
```python
prefix = pid[:2]            # 禁止：中文 id 截取无意义
page_file = PAGES_DIR / prefix / f'{pid}.md'
```

**正确的模式**：
```python
pages = json.loads((WIKI_ROOT / 'docs/wiki/pages.json').read_text())['pages']
page_file = PAGES_DIR / pages[pid]['path']
```

此约定适用于 memex 共享脚本和所有 wiki 本地脚本（`wiki/scripts/`、`ref/` 下的辅助脚本等）。

---

*本文档适用于所有 Wiki 项目。各 Wiki 项目通过 `$MEMEX_ROOT` 引用本文件，本地补充见各项目的 `LAW.md` 和 `CLAUDE.md`。*
