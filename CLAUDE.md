# TOEFL词汇词根+联想记忆法 — Claude 入口

> **首先阅读宪法：** `$MEMEX_ROOT/CONSTITUTION.md`（全局不可违背规则）
> **其次阅读本地法律：** `LAW.md`（本 wiki 补充规则）
> **然后启动 BIRTH：** `BIRTH.md`（引导建设流程）
> 如有冲突，宪法优先。本文档仅作入口说明。

告诉 Claude 本 wiki 的法律规范位于 `LAW.md`。

@LAW.md

---

## MEMEX_ROOT

共享代码源位于 `~/memex`（本机 symlink）。所有脚本、skills、CONSTITUTION 均通过此路径引用。

```bash
MEMEX_ROOT="$HOME/memex"
export MEMEX_ROOT
```

## Python 环境

Python 调用入口在 `local/config.md` 中配置（由 BIRTH 0-A 初始化）：

| 键 | 值（uv 模式） | 值（system 模式） |
|---|---|---|
| `PYTHON_ENV` | `uv` | `system` |
| `PYTHON_BIN` | `.venv/bin/python` | `python3` |
| `PIP_CMD` | `uv pip` | `pip3` |

- **uv 模式**（推荐）：项目有 `.venv/` 虚拟环境。首次调用 Python 前应验证 `PYTHON_BIN` 可用，不可用时提示 `uv sync`。
- **system 模式**（默认兼容）：沿用全局 `python3`，配置缺失时自动视为 system。

## /boot

定义在 `.claude/commands/boot.md`。执行 `BIRTH.md`，推进下一个未完成的 phase。

## 启动

BIRTH.md 不存在时，从 `$MEMEX_ROOT/BIRTH.spec.md` 复制并适配为本 wiki 的 BIRTH，然后执行 `/boot`。

## 项目配置

### PN 映射

| 范围 | 内容 |
|------|------|
| WL01-001–WL01-100+ | Word List 1 词条 |
| WL02-001–WL02-100+ | Word List 2 词条 |
| ... | ... |
| WL48-001–WL48-100+ | Word List 48 词条 |

### 页面类型

| type | 含义 |
|------|------|
| word | 单词词条 |
| root | 词根 |
| affix | 词缀（前缀/后缀） |
| wordlist | Word List 章节页 |
| overview | 综述/导引页 |
| list | 列表页（如 A-Z 索引） |

### Frontmatter

```yaml
---
id: word-slug
type: word
label: 单词
pronunciation: /pɹəˌnʌnsiˈeɪʃən/
aliases: []
tags: [TOEFL, 核心词汇]
description: 中文释义一句话
---
```

## 工作流

```bash
# 新建页面
python3 "$MEMEX_ROOT/wiki/scripts/add_page.py" SLUG - \
  --summary "新增：SLUG" --author butler << 'EOF'
[frontmatter + content]
EOF

# 本地预览
bash "$MEMEX_ROOT/wiki/wiki.sh"

# 发布（推荐用 /wiki skill 一键完成）
bash "$MEMEX_ROOT/wiki/scripts/publish.sh"
bash "$MEMEX_ROOT/wiki/scripts/wiki_commit.sh" -m "wiki: update"
git push
```
