# TOEFL词汇词根+联想记忆法 — 启动流程 (BIRTH)

> 阅读顺序：
> 0. `$MEMEX_ROOT/EGG.spec.md` — **孵化入口**（机器优先。新项目先读 EGG，完成 git+corpus 后再来）
> 1. `$MEMEX_ROOT/CONSTITUTION.md` — 宪法
> 2. `LAW.md` — 本地法律
> 3. 本文档 — 启动引导

> **使用方式**：本文档是通用执行规范。具体 wiki 建立自己的 `BIRTH.md`，做一步从此处复制对应内容、按实际参数填写，做完打勾；未开始的 Phase 不预先复制。
>
> **Phase 实例化反思**：每个 Phase 完成后，wiki agent 须对照本 spec 检查该 Phase 的实例化是否忠实——步骤有无遗漏、参数有无填错、完成条件是否逐项满足。发现偏差应立即补做或提 RFC。
>
> **完全实例化要求（auto 模式与手动模式均适用，RFC-memex-0034）**：
>
> 每个 Phase 复制到本地 BIRTH.md 时，必须保留 spec 的：
> - 子节标题（如 0-A、0-B、5-C-1、8-B2）
> - 所有警告块（`> ⚠️`、`> ℹ️`）
> - 关键参数表（NNN 格式表、结构类型表、质量目标表等）
> - MUST-COPY 标记包裹的段落（HTML 注释 `<!-- MUST-COPY: ... -->`）
>
> 只可将占位符（`TOEFL词汇词根+联想记忆法`、`<wiki-name>`、模板片段）替换为本 wiki 实际值；
> **不可将整个 Phase 折叠为一行「- [x] 完成」**。
>
> **判定标准（auto 模式收尾自检）**：
> 1. **行数**：本地 BIRTH.md ≥ spec 60%（spec ~2400 行 → 本地 ≥ 1400 行）。例外：若整个 Phase 跳过（如方案 B 无 submodule 初始化），可在该 Phase 节首注明「整 Phase 跳过：<理由>」后省略详情
> 2. **子节覆盖**：spec 中每个三级标题（`### N-X`）在本地 BIRTH.md 中可被搜索到
> 3. **MUST-COPY 段**：原文出现，不得摘要

---

## Phase 0：前置决策与基础文件

### 0-0 Bootstrap（第一步，无依赖）

> ℹ️ **共享 skills 已全局生效**：`init_skills.sh` 将 memex skills 链接到 `~/.claude/skills/`，对所有项目自动可见，无需 per-wiki 配置。
> 若在新机器上首次使用，或 memex 新增了 skill，运行一次：
> ```bash
> bash "$MEMEX_ROOT/wiki/scripts/init_skills.sh"
> ```
> 此后新建任何 wiki 实例无需再执行此步骤。`/boot`、`/butler`、`/commit` 等 skill 自动可用。

---

### 0-A 两个前置决策（其余步骤均依赖）

- [x] **确认 WIKI_LANG**：询问用户此 Wiki 的默认界面语言（`zh` 中文 / `en` English）

  > ⚠️ **语言是强约束**，在此确认后必须贯穿所有后续步骤：
  > - `i18n.config.js` 的 `defaultLang`
  > - `types.js` 的类型标签
  > - `infobox.js` 的字段标签和分组名
  > - `hero.js` 的 TAGLINE、BOOK_META 文字
  > - `home.js` 的 HOME_SECTIONS 标签
  > - `About.md` 正文
  >
  > 以上文件中所有**用户可见字符串**都必须用选定语言书写。
  > UI 框架字符串（topnav 按钮、Special 页标题）由引擎 i18n 系统自动处理，无需手动翻译。

  确认后将 `WIKI_LANG=zh`（或 `en`）写入 `local/config.md`，butler / enrich 等 skill 后续直接读取，无需重问。

- [x] **确认 TIMEZONE**：询问用户此 Wiki 的默认 IANA 时区（默认 `Asia/Shanghai`）

  时区插件（timezone）在设置页面提供用户级别的时区覆盖，此处的 `TIMEZONE` 作为该 wiki 实例的默认值。
  用户后续可在 `Special:Settings` 页面自行修改。

  确认后将 `TIMEZONE=Asia/Shanghai`（或用户选定的其他时区）写入 `local/config.md`。

- [x] **验证工具链**：
  - `$MEMEX_ROOT` 已指向 `~/memex`，symlink 有效
  - Git 仓库（主库 + site submodule，如有）均已正确克隆

- [x] **确认 PYTHON_ENV**：询问用户本 wiki 的 Python 脚本要走哪个解释器

  > 此项影响所有 Python 脚本的调用路径。选择错误会导致 `ModuleNotFoundError`（详见 RFC-munger-0002）。

  | 选项 | 说明 | 适用场景 |
  |------|------|---------|
  | **1. uv 虚拟环境**（推荐） | 依赖隔离，`uv sync` 安装 | 有 `pyproject.toml` / `uv.lock` 的项目 |
  | **2. 全局 `python3`** | 系统或 pyenv 全局解释器 | 无依赖管理需求，或已全局装好依赖 |

  选 1 时：
  - 检查 `command -v uv`，缺则提示 `curl -LsSf https://astral.sh/uv/install.sh | sh` 并终止
  - 执行 `uv sync`（或首次 `uv venv && uv sync`）
  - 后续依赖添加用 `uv add <pkg>`，而非 `pip install`

  选 2 时沿用现状，跳过 uv 检查。

  确认后将以下字段写入 `local/config.md`：

  ```markdown
  | PYTHON_ENV    | uv               | uv \| system                    |
  | PYTHON_BIN    | .venv/bin/python | 解释器绝对/相对路径             |
  | PIP_CMD       | uv pip           | uv pip \| pip3                  |
  ```

### 0-B 基础文件

- [x] 从 `$MEMEX_ROOT/README.spec.md` 复制并编辑 `README.md`
- [x] 从 `$MEMEX_ROOT/CHANGELOG.spec.md` 复制并编辑 `CHANGELOG.md`
- [x] 从 `$MEMEX_ROOT/CLAUDE.spec.md` 复制创建 `CLAUDE.md`，填入 `TOEFL词汇词根+联想记忆法`
- [x] 从 `$MEMEX_ROOT/.gitignore.example` 复制 `.gitignore`，并验证合规：
  - **必须包含**（至少含以下模式）：`tmp/`、`private/`、`*.pyc`、`__pycache__/`、`.DS_Store`、`node_modules/`、`.claude/settings.local.json`
  - **禁止包含**（以下路径不得出现在 .gitignore 中）：
    `local/`、`local/**`、`ref/`、`ref/**`、`logs/rfc/`、`logs/daily/`、`logs/butler/`（整目录，`logs/butler/*.log` 例外）、`data/sentence_index/`、`CLAUDE.md`、`LAW.md`、`CHANGELOG.md`、`README.md`、`BIRTH.md`
  - [x] **询问用户** `corpus/raw/` 是否加入 `.gitignore`（默认不加，保留在 git 跟踪中），按用户选择追加 `corpus/raw/**` 或保持原样
- [x] 从 `$MEMEX_ROOT/LAW.spec.md` 复制创建 `LAW.md`：
  - 填写 `(已填写)`：项目基本参数、语料声明、PN 映射规则、页面类型等核心节
  - 删除不适用的可选节（Frontmatter 规范、Wikilink 规范、日志格式、标签约定等）
  - 在"页面类型"节确保包含语料页类型模板行：
    ```
    | `chapter` | 原文章节页（从语料切分）| 第三章、BH-1977 |
    ```
  - 详见 `LAW.spec.md` 中各节的 HTML 注释指引
- [x] 目录结构（corpus/ docs/ ref/ logs/ data/ local/ 等）
- [x] docs submodule 初始化
- [x] 创建 `local/gene/_context.md`（butler 读取的 wiki 专属执行上下文）：
  - PN 格式与章节范围
  - 页面类型列表
  - 质量档位特别说明（如有）
  - 其他 wiki 专属约定
  - 参考：`aima/local/gene/_context.md` 作为示例

<!-- MUST-COPY: 安全基线 deny 规则 + git commit 门控配置，init 时必须原文复制 -->
### 0-C 安全初始化（必做）

> ⚠️ **安全基线**：每个 wiki 的 `.claude/settings.json` 必须包含 memex 写入保护规则，
> 防止 Claude 在该 wiki 目录下工作时误写 `$MEMEX_ROOT`。此步骤不可跳过。

- [x] **初始化 `.claude/settings.json`**（自动生成 deny 规则和常用 allow 规则）：
  ```bash
  python3 "$MEMEX_ROOT/wiki/scripts/init_security.py" .
  ```

- [x] **检查生成的保护规则** — 确认 deny 列表中包含精确写操作拦截规则：
  ```json
  "Bash(*$MEMEX_ROOT* > *)",
  "Bash(*~/memex* > *)",
  "Bash(cp * *memex*)",
  "Bash(mv * *memex*)",
  "Bash(rm *memex*)"
  ```
  这些规则仅拦截写操作（重定向、cp/mv/rm 等），允许合法的只读命令（find/ls/grep/cat/python3 脚本调用等）通过。
  allow 列表中的 memex 共享脚本调用使用 `$MEMEX_ROOT` 环境变量，不硬编码绝对路径，保证跨机器可移植（RFC-liangjing-0015）。

- [x] **确认 allow 列表满足需求** — 当前已预置常用命令：
  - git status / log / diff / show
  - registry 构建、publish
  - butler 相关命令
  - memex 共享脚本调用（add_page / edit_page / wiki.sh / page_utils）

  如有额外脚本需要调用，在此步骤补充到 `allow` 列表。**原则：尽量细化，只加真正需要的。**

- [x] **Skill commit 门控**（skill-commit-gate）：只允许 `/rfc`、`/evolve`、`/wiki`、`ADM4-commit`（butler 定期提交基因）执行 `git commit`，其他 Claude 直接发起的提交一律拦截。

  原理：deny 规则拦截 `git commit*`，skill 通过包装脚本绕过（子进程不受 deny 约束）：
  ```
  Claude → git commit …              ← deny 拦截 ✗
  Claude → bash wiki/scripts/skill_commit.sh …  ← allow 放行 ✓
               └→ exec git commit …  ← 子进程，绕过 deny ✓
  ```

  配置步骤：
  1. 创建目录并复制包装脚本：
     ```bash
     mkdir -p wiki/scripts
     cp "$MEMEX_ROOT/wiki/scripts/skill_commit.sh"   wiki/scripts/skill_commit.sh
     cp "$MEMEX_ROOT/wiki/scripts/wiki_commit.sh"    wiki/scripts/wiki_commit.sh
     cp "$MEMEX_ROOT/wiki/scripts/upgrade-engine.sh" wiki/scripts/upgrade-engine.sh
     ```
  2. 在 `.claude/settings.json` 的 `deny` 中确认有 `"Bash(git commit*)"` ，`allow` 中加入：
     ```json
     "Bash(bash wiki/scripts/skill_commit.sh*)",
     "Bash(bash wiki/scripts/wiki_commit.sh*)",
     "Bash(git commit -F /tmp/gitmsg_*)",
     "Bash(git add ref/rfc/*)",
     "Bash(git add logs/rfc/*)",
     "Bash(git add logs/evolve/*)",
     "Bash(git add .claude/skills/*)"
     ```
  3. 以上 skill 已在 0-0 全局链接，无需 per-wiki symlink；`ADM4-commit` 通过 butler gene 调用，无需单独 symlink。

  详见 `$MEMEX_ROOT/ref/spec/skill-commit-gate.md`。

- [x] **⚠️ 承诺规则**：确认 CONSTITUTION.md §1.3 已生效——任何对 `$MEMEX_ROOT` 的直接写操作（Edit/Write 工具、shell 重定向、cp/rm/mv 等）在子 wiki 项目中绝对禁止。`.claude/settings.json` 的 deny 规则提供 Bash 层的技术保障，但 Edit/Write 工具层的保护依赖此宪法承诺。

- [x] **/tmp 读写已默认放行** — `PreToolUse` hook (`restrict_to_project.py`) 把 `/tmp/` 和 `/var/tmp/` 列入「允许的系统外目录白名单」，所有 Edit/Write/Bash 操作针对这两个路径前缀都不会被拦。理由：脚本常用 `/tmp` 暂存（gitmsg、备份、测试 fixture 等），强制项目目录内会让常规工作流失效。其他外部路径（`/etc`、`/var/log`、其他项目目录等）仍被拒绝。无需手动配置。

### 0-D 发布配置

> 发布目标决定了 `docs/` 目录的组织方式和 `publish.sh` 的行为，必须在 Phase 1 建立 docs/ 结构之前确认。

打印以下选项，请用户选择：

```
本 Wiki 的发布目标是哪种？

  方案 A — GitHub Pages（默认）
    docs/ 作为独立 git submodule，指向同名 GitHub Pages 仓库。
    发布：cd docs && git push
    适合：内容公开、不需要自定义服务器、希望发布历史独立管理。

  方案 B — Droplet（自有 VPS + Nginx）
    docs/wiki/ 作为主仓库普通目录，通过 git subtree 推送到 gh-pages 分支。
    服务器每 5 分钟从 gh-pages 分支 pull 并 rsync 到 /var/www/wikis/<name>/。
    发布：bash publish.sh --push
    适合：需要自定义域名/功能、已有 wiki-1 服务器、不需要 submodule。

  方案 C — Cloudflare Pages
    docs/wiki/ 作为主仓库普通目录，Cloudflare Pages 监听 main 分支自动构建。
    发布：git push origin main（CF 自动触发）
    适合：需要全球 CDN 加速、已有 CF 账号、不需要 submodule。
    详见：ref/spec/sys-dual-env.md
```

用户选择后：

- [x] 将选择记录到 `local/config.md`（`DEPLOY_TARGET=github-pages` / `droplet` / `cloudflare`）
- [x] **方案 A**：在 1-B 中将 `docs/` 初始化为 git submodule
- [x] **方案 B**：在 1-B 中将 `docs/` 作为普通目录；创建 wrapper `wiki/scripts/publish.sh`（见下方 wrapper 段），保留 `--push` 段；在 `wiki-1` 的 `/usr/local/bin/wiki-sync.sh` 中添加本 wiki 条目（参见 `ref/spec/sys-deploy.md §七`）

  > **服务器首次部署**：在 wiki-1（或对应 VPS）上执行 subtree clone，将 gh-pages 分支检出到发布目录：
  > ```bash
  > git clone --branch gh-pages --single-branch --depth 1 https://github.com/toefl-vocab-wiki/toefl-vocab-wiki /var/www/wikis/TOEFL词汇词根+联想记忆法
  > ```
  > 后续 `publish.sh --push` 推送后，sync 脚本自动从 gh-pages 分支 pull 并 rsync 到该目录。
- [x] **方案 C**：在 1-B 中将 `docs/` 作为普通目录；创建 wrapper `wiki/scripts/publish.sh`（见下方 wrapper 段），删除 `--push` 段；在 Cloudflare Pages 控制台接入 GitHub 仓库，构建目录设为 `docs/wiki`
- [x] **方案 B/C**：创建 `wiki/scripts/publish.sh`，委托 memex 统一发布管道：
  ```bash
  cat > wiki/scripts/publish.sh << 'WRAPPER'
  #!/usr/bin/env bash
  # publish.sh — 发布脚本，委托 memex 统一管道
  set -euo pipefail
  MEMEX_ROOT="${MEMEX_ROOT:-$HOME/memex}"
  SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
  exec "$MEMEX_ROOT/wiki/scripts/publish.sh" --wiki-root "$(cd "$SCRIPT_DIR/../.." && pwd)" "$@"
  WRAPPER
  chmod +x wiki/scripts/publish.sh
  ```
  > 此 wrapper 委托 `$MEMEX_ROOT/wiki/scripts/publish.sh` 执行完整发布管道（注册表重建、FTS 全文索引、修订记录、反链索引、坐标数据、知识量快照、可选推送）。`publish.sh.template` 为备选复制来源。
- [x] **创建根目录 `publish.sh` 快捷方式**（所有方案均需执行）：
  ```bash
  cat > publish.sh << 'EOF'
  #!/usr/bin/env bash
  # Shortcut: delegates to wiki/scripts/publish.sh
  exec "$(dirname "$0")/wiki/scripts/publish.sh" "$@"
  EOF
  chmod +x publish.sh
  ```
  将 `publish.sh` 纳入版本控制（不加入 `.gitignore`）。
- [x] 验证：根目录 `publish.sh` 快捷方式已创建且可执行（`test -x publish.sh`）

### 0-E 初始提交

- [x] 提交 Phase 0 建立的所有基础文件：
  ```bash
  git add BIRTH.md CLAUDE.md LAW.md README.md CHANGELOG.md .gitignore
  git add local/ ref/ logs/ data/ docs/ wiki/scripts/
  git add .claude/settings.json .claude/skills/ .claude/commands/
  git add publish.sh 2>/dev/null || true  # 所有方案均需创建此文件
  bash wiki/scripts/skill_commit.sh "chore: Phase 0 初始化基础结构"
  ```
  > 提交范围：Phase 0-B 建立的所有目录与文件，以及 0-C 生成的安全配置。
  > corpus/ 目录此时通常为空，无需特殊处理。语料是否纳入版本控制在 0-B 已选定（copyrighted 模式排除，public-domain 模式跟踪），此处不再重复决策。

---

## Phase 1：引擎接通

> **目标**：Phase 1 结束后，执行 `./wiki-daemon.sh start` 即可在浏览器打开一个可启动的 Wiki（页面可以空白或报错，但进程不崩溃）。
> 本地 **不新增任何引擎代码**，所有 JS/CSS 由 serve.js 从 `$MEMEX_ROOT/wiki/public/` 回退提供。
> 本 Phase 全为机械操作，无需用户输入内容决策。

### 1-A 确认本地调试端口

- [x] 打开 `$MEMEX_ROOT/ref/spec/sys-ports.md`，查阅已占用端口和已分配 Wiki 端口表（**只读**）
- [x] 根据 wiki 内容特点推荐一个有纪念意义的端口号，告知用户并等待确认
- [x] 用户确认后，在 wiki 本地 `local/config.md` 写入 `PORT=<端口>`
- [ ] **登记到 memex 中央表**：子 wiki 不得直接写 `$MEMEX_ROOT/ref/spec/sys-ports.md`（违反 CONSTITUTION §0.5 / 项目 CLAUDE.md 安全规则）。改为在子 wiki 中执行 `/rfc 登记端口 <端口> 用于 <Wiki名>，理由：<理由>`，由 memex 维护者评审后合入

### 1-A2 确认引擎 CDN 来源

引擎静态资产（CSS/JS/插件）由 `<meta name="cdn-base">` 指定的 CDN 托管，生产环境通过该地址加载。

**当前可用选项：**

| 选项 | cdn-base | 说明 |
|------|----------|------|
| **A（默认）** | `https://baojie.github.io/memex/dist` | baojie/memex GitHub Pages，官方引擎托管，与本地 `$MEMEX_ROOT` 同源 |
| B（自定义） | 用户自填 URL | 自建 CDN 或 fork 部署，需自行保证版本同步 |

> ⚠️ **选项 A 是唯一经过验证的来源**。选项 B 仅供有自建引擎需求的高级用户使用；选错 CDN 会导致引擎版本与本地 `$MEMEX_ROOT` 不一致，页面行为难以预期。

- [x] 向用户展示上表，说明当前只有选项 A 经过验证
- [x] 等待用户确认（默认：选项 A）
- [x] 将选定的 `cdn-base` URL 写入 `local/config.md`（键：`CDN_BASE`）

### 1-B 建立 docs/ 结构

- [x] 在 `docs/` 根目录创建 `index.html`，内容为重定向到 `wiki/`：
  ```html
  <!DOCTYPE html>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url=wiki/">
  <script>location.replace('wiki/');</script>
  ```
- [x] 在 `docs/` 创建 `.nojekyll`（禁用 GitHub Pages Jekyll，确保 `.md` 文件可通过 fetch 访问）：
  ```bash
  touch docs/.nojekyll
  ```
- [x] 建立 `docs/wiki/` 目录，仅含内容目录（**不建 js/ css/**，引擎由服务器回退）：
  ```
  docs/wiki/
  ├── index.html     ← 主页面
  ├── pages/         ← wiki 页面（初始为空）
  ├── local/         ← 本地覆盖（可选）
  └── images/        ← 图片（可选）
  ```
- [x] 创建 `docs/wiki/index.html`：
  - 从 `$MEMEX_ROOT/wiki/public/index.html.template` 复制，替换 `TOEFL词汇词根+联想记忆法` 和 `本 Wiki 仅供个人学习使用。原文版权归俞敏洪及西安交通大学出版社所有。`
  - 将 `<meta name="cdn-base">` 的 `content` 替换为 1-A2 确认的 `CDN_BASE` 值：
    ```html
    <meta name="cdn-base" content="https://baojie.github.io/memex/dist">
    ```
  - **不要修改 import map 脚本**——它已正确处理本地/生产双环境
  - topnav 链接文字用 `data-i18n="key"` 标注，i18n 插件启动后自动替换
  - `lang` 属性（`<html lang="zh-CN">`）由 i18n 插件在运行时动态更新，无需手动改
  - 架构要点：`css/main.css`、`js/core.js`、`plugins/` 本地由 serve.js `--fallback` 透明提供；生产由 CDN 提供
  - **⚠️ Footer 只保留一个**：`page-footer` 等引擎插件会在运行时向 `<footer>` 内注入分类标签。不要在此 `index.html` 中额外添加第二个 `<footer>`，否则页面底部会出现双 footer。
- **local/local.css** 通过页面底部的 script 动态追加载，确保排在引擎样式之后。不要添加静态 `<link rel="stylesheet" href="local/local.css">`，否则会被引擎样式覆盖。
- [x] 生成内联 SVG favicon（替换 `` 占位符）：
  ```bash
  # 从 local/config.md（项目根，KEY=value 格式）读取主题色与 wiki 名称
  PRIMARY=$(grep '^PRIMARY_COLOR=' local/config.md 2>/dev/null | head -1 | cut -d= -f2- | tr -d '"#'"'"' ')
  PRIMARY=${PRIMARY:-"a82a2a"}
  WIKI_NAME=$(grep '^WIKI_NAME=' local/config.md 2>/dev/null | head -1 | cut -d= -f2- | tr -d '"'"'"' ')
  CHAR=$(echo "${WIKI_NAME:-W}" | sed 's/^\(.\).*$/\1/')
  # 生成并替换
  FAVICON="<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' fill='%23${PRIMARY}'/><text x='16' y='24' text-anchor='middle' font-family='serif' font-size='22' fill='%23f5f0e8' font-weight='bold'>${CHAR}</text></svg>\">"
  sed -i "s||$FAVICON|" docs/wiki/index.html
  ```
- [x] 验证 `index.html` JS/CSS 路径未偏离模板：
  ```bash
  grep -q 'href="css/main.css"'  docs/wiki/index.html || echo "❌ CSS路径错误，不得为 memex.min.css"
  grep -q 'src="js/core.js"'     docs/wiki/index.html || echo "❌ JS路径错误，不得为 memex.min.js"
  ```
  两行均无输出 → 通过。有输出 → 立即修正后再继续。

### 1-C 适配 wiki-daemon.sh

- [x] 从 `$MEMEX_ROOT/wiki-daemon.sh.example` 复制为 `wiki-daemon.sh`，修改：
  - `WIKI_NAME`：项目短名
  - `PORT`：上一步确认的端口号
  - `PUBLIC_DIR`：`docs/wiki`
  - 添加 `ENGINE_DIR="$MEMEX_ROOT/wiki/public"`
  - 启动命令改为 `node "$SERVE_SCRIPT" "$PUBLIC_DIR" "$PORT" --fallback "$ENGINE_DIR"`
- [x] `chmod +x wiki-daemon.sh`

  > ⚠️ **参数约定差异**：daemon 中两个构建脚本的参数含义不同，勿混淆：
  > | 脚本 | 参数 | 含义 |
  > |------|------|------|
  > | `build_registry.py` | `"$PUBLIC_DIR/pages"` | 页面目录 |
  > | `build_fts_index.py` | `"."` | **项目根目录** |
  >
  > `build_fts_index.py` 内部自行拼接 `docs/wiki/data/fts-index.json`，
  > 若传入 `"$PUBLIC_DIR"` 则路径重复为 `docs/wiki/docs/wiki/data/fts-index.json`。

- [x] 更新 `README.md` 加入端口信息和启动方式

### 1-D 确认共享脚本可用

- [x] 确认 `$MEMEX_ROOT/wiki/scripts/page_utils.py` 存在（RFC-memex-0012 引入）
  - `page_utils.py` 是页面路径解析的标准工具，兼容平铺和分桶两种 `pages/` 结构
  - **所有通用规范化脚本均集中在 `$MEMEX_ROOT/wiki/scripts/`，通过 `$WIKI_ROOT` 环境变量发现目标 wiki**（RFC-aima-0021）
  - **子 wiki 无需复制这些脚本**，通过 `WIKI_ROOT=$PWD python3 $MEMEX_ROOT/wiki/scripts/<script>.py` 调用
  - **子 wiki 的自定义脚本和 butler spec 代码必须通过 `find_page_file(slug, pages_root)` 查找单个页面，不得自行拼接 `pages/{slug}.md` 路径**
  - 用法示例：
    ```python
    import sys
    from pathlib import Path
    sys.path.insert(0, str(Path('/path/to/memex/wiki/scripts')))
    from page_utils import get_pages, find_page_file, iter_pages

    # 路径通过 $WIKI_ROOT 自动发现
    pages_root = get_pages()                          # $WIKI_ROOT/docs/wiki/pages
    path = find_page_file('some-slug', pages_root)    # 返回 Path 或 None
    for p in iter_pages(pages_root):                  # 遍历全部页面
        ...
    ```

### 1-E 引擎接通提交

- [x] 提交 Phase 1 建立的所有文件：
  ```bash
  git add docs/ wiki-daemon.sh
  bash wiki/scripts/skill_commit.sh "chore: Phase 1 引擎接通"
  ```
  > 提交范围：`docs/index.html`、`docs/wiki/index.html`、`docs/wiki/pages/`、`docs/wiki/local/`、`wiki-daemon.sh`。

---

## Phase 2：Wiki 配置

> **目标**：Phase 2 结束后，空 Wiki 完整可用：页面正常渲染，About 页可访问，控制台无报错。
> 本 Phase 所有含用户可见字符串的文件，必须按 Phase 0-A 确认的 `WIKI_LANG` 书写（读取 `local/config.md`）。

### 2-A 本地 JS 配置文件初始化

引擎插件通过 **静态 import** 或 **动态 import** 读取 `docs/wiki/local/` 下的配置，
缺失静态 import 文件会导致插件模块加载失败，页面卡在「载入中」。

**必须创建（被插件静态 import，缺失直接崩溃）：**

- [x] `docs/wiki/local/LocalSettings.js`
  - 模板：`$MEMEX_ROOT/docs/dist/LocalSettings.js`
  - 必填：`wgSiteName`、`wgEnabledPlugins`
  - **插件启用策略**（`wgEnabledPlugins` 应包含）：
    - `localConfig: no` 的插件（24 个）→ **全部默认启用**，无需任何配置文件即可安全加载
    - `localConfig: optional` 的插件 → 本步已创建对应配置文件的一并启用，否则保持注释
    - `localConfig: required` 的插件 → 在本节创建对应 `.config.js` 后加入
    - 地图插件（`place-map`、`route-map`、`geomap`）→ 保持注释，需专项地理数据
  - ⚠️ 模板已内置推荐列表，直接复制即可，无需手动逐一填写

- [x] `docs/wiki/local/config/i18n.config.js`

  ```js
  // WIKI_LANG = zh
  export const defaultLang = 'zh';
  ```
  ```js
  // WIKI_LANG = en
  export const defaultLang = 'en';
  ```

- [x] `docs/wiki/local/config/chapter.config.js` — ↑ Contents 按钮的目录页 ID（按语言设置）

  ```js
  // WIKI_LANG = zh
  export const TOC_PAGE_ID = '目录';
  ```
  ```js
  // WIKI_LANG = en
  export const TOC_PAGE_ID = 'TOC';
  ```
  ```js
  // WIKI_LANG = ja
  export const TOC_PAGE_ID = '目次';
  ```
  > 若文件不存在，插件 fallback 到 `'_TOC_'`（语言无关通用约定）。

- [x] `docs/wiki/local/config/types.js` — 词条类型显示标签（根据 LAW.md 中实际使用的类型调整）

  ```js
  // WIKI_LANG = zh
  export const TYPE_LABELS = {
    concept: '概念', person: '人物', event: '事件',
    organization: '机构', place: '地点', overview: '综述',
    chapter: '章节', list: '列表',
  };
  ```
  ```js
  // WIKI_LANG = en
  export const TYPE_LABELS = {
    concept: 'Concept', person: 'Person', event: 'Event',
    organization: 'Organization', place: 'Place', overview: 'Overview',
    chapter: 'Chapter', list: 'List',
  };
  ```

- [x] `docs/wiki/local/config/infobox.js` — 信息框字段标签和分组

  ```js
  // WIKI_LANG = zh
  export const FIELD_LABELS = {
    label: '名称', description: '简述', born: '出生', died: '逝世',
    nationality: '国籍', affiliation: '所属机构', field: '研究领域',
    chapter: '相关章节',
  };
  export const INFOBOX_SKIP = new Set(['id', 'type', 'quality', 'tags', 'coords', 'aliases']);
  export const FIELD_GROUPS = [
    { label: '基本信息', fields: ['label', 'description', 'born', 'died', 'nationality'] },
    { label: '学术信息', fields: ['affiliation', 'field', 'chapter'] },
  ];
  ```
  ```js
  // WIKI_LANG = en
  export const FIELD_LABELS = {
    label: 'Name', description: 'Description', born: 'Born', died: 'Died',
    nationality: 'Nationality', affiliation: 'Affiliation', field: 'Field',
    chapter: 'Chapter(s)',
  };
  export const INFOBOX_SKIP = new Set(['id', 'type', 'quality', 'tags', 'coords', 'aliases']);
  export const FIELD_GROUPS = [
    { label: 'Overview', fields: ['label', 'description', 'born', 'died', 'nationality'] },
    { label: 'Academic', fields: ['affiliation', 'field', 'chapter'] },
  ];
  ```

- [x] `docs/wiki/local/config/hero.js` — 首页英雄区文字（询问用户 Wiki 名称、副标题、书籍结构后填写）

  ```js
  // WIKI_LANG = zh
  export const EYEBROW   = '俞敏洪 · 乱序版 · 新东方绿宝书系列';
  export const TITLE     = 'TOEFL词汇词根+联想记忆法';
  export const TAGLINE   = '4500+核心词汇 · 词根+联想记忆法';
  export const DOC_TITLE = 'TOEFL词汇词根+联想记忆法 — 4500+核心词汇 · 词根+联想记忆法';
  export const SEARCH_PLACEHOLDER     = '搜索词条…';
  export const SEARCH_PLACEHOLDER_FTS = '全文检索…';
  // BOOK_DISPLAY: 首页书籍卡片渲染风格
  //   'card'  — 单卷 wiki（如下图谱类知识库），每本书显示为大卡片
  //   'strip' — 多卷 wiki（如书信集、年鉴），每本书显示为横条
  // 判断依据：单卷 wiki（BOOK_META 只有 1 项）→ card；多卷 wiki（2+ 项）→ strip
  export const BOOK_DISPLAY = 'strip';
  export const BOOK_META = [
    { label: '第一部分', subtitle: '第 1–N 章：…', min: 1, max: N },
  ];
  ```
  ```js
  // WIKI_LANG = en
  export const EYEBROW   = 'Yu Minhong · New Oriental Green Book Series';
  export const TITLE     = 'TOEFL词汇词根+联想记忆法';
  export const TAGLINE   = '4500+ TOEFL words with root & association mnemonics';
  export const DOC_TITLE = 'TOEFL词汇词根+联想记忆法 — 4500+ TOEFL words with root & association mnemonics';
  export const SEARCH_PLACEHOLDER     = 'Search entries…';
  export const SEARCH_PLACEHOLDER_FTS = 'Full-text search…';
  // BOOK_DISPLAY: 首页书籍卡片渲染风格
  //   'card'  — 单卷 wiki（如下图谱类知识库），每本书显示为大卡片
  //   'strip' — 多卷 wiki（如书信集、年鉴），每本书显示为横条
  // 判断依据：单卷 wiki（BOOK_META 只有 1 项）→ card；多卷 wiki（2+ 项）→ strip
  export const BOOK_DISPLAY = 'card';
  export const BOOK_META = [
    { label: 'Part I', subtitle: 'Ch. 1–N: …', min: 1, max: N },
  ];
  ```

- [x] `docs/wiki/local/config/home.js` — 首页分区和免责声明

  ```js
  // WIKI_LANG = zh
  export const CORE_FEATURED = [];
  export const PREFACE_IDS   = [];
  export const APPENDIX_IDS  = [];
  export const HOME_SECTIONS = [
    { label: '核心概念', tag: null, type: 'concept', featuredOnly: false, limit: 8 },
    { label: '重要人物', tag: null, type: 'person',  featuredOnly: false, limit: 6 },
  ];
  export const SKIP_TYPES = new Set(['chapter', 'list', 'overview']);
  // ⚠️ DISCLAIMER 不再由引擎渲染（footer 已包含许可证文字）。
  //   保留导出仅用于兼容，新项目可删除或留空。
  ```
  ```js
  // WIKI_LANG = en
  export const CORE_FEATURED = [];
  export const PREFACE_IDS   = [];
  export const APPENDIX_IDS  = [];
  export const HOME_SECTIONS = [
    { label: 'Core Concepts', tag: null, type: 'concept', featuredOnly: false, limit: 8 },
    { label: 'Key People',    tag: null, type: 'person',  featuredOnly: false, limit: 6 },
  ];
  export const SKIP_TYPES = new Set(['chapter', 'list', 'overview']);
  // ⚠️ DISCLAIMER is no longer rendered by the engine (the <footer> already contains license info).
  //    Kept as export only for compatibility; new projects may delete or leave empty.
  ```

- [x] `docs/wiki/local/config/variables.js`：`VARIABLES`（无语言限制，按需填写）
  ```js
  export const VARIABLES = {
    AUTHOR: '作者名',
    YEAR: '2024',
    // 任意键值对，在页面正文中以 俞敏洪 等形式引用
  };
  ```

**插件动态配置（`{id}.config.js`）：**

每个插件在 `$MEMEX_ROOT/wiki/public/plugins.json` 中声明 `"localConfig"` 字段：
- `"required"` — 配置文件必须存在，否则插件实质上不工作；**在具体 wiki 的 BIRTH 2-A 中列出并逐一创建**
- `"optional"` — 有合理默认值，需定制时再创建
- `"no"` — 不读取 localConfig，无需任何配置文件

**具体 wiki 的 BIRTH 操作指示：**

> 执行以下命令查出当前所有 `required` 插件，在具体 wiki 的 BIRTH.md 2-A 节逐一列出并创建 stub：
> ```bash
> node -e "
> const p = JSON.parse(require('fs').readFileSync('$MEMEX_ROOT/wiki/public/plugins.json'));
> p.plugins.filter(x => x.localConfig === 'required')
>   .forEach(x => console.log(x.id, '—', x.localConfigKeys?.join(', ')));
> "
> ```
> 对每个 `required` 插件，询问用户相关配置值，**按 `WIKI_LANG` 填写可见字符串**，创建包含正确内容（非空）的 `.config.js` 文件。
> `optional` 插件按需创建，`no` 插件跳过。

> 命名约定：`{id}.config.js`，由引擎以 `import('../local/config/' + id + '.config.js')` 动态加载。

### 2-B 使用 NEW1 创建 About 页面

topnav 的「关于/About」链接指向 `#About`，若页面不存在则显示 404。
使用 NEW1 在 `docs/wiki/pages/（对应分桶）/About.md` 创建初始 About 页（实际路径取决于分桶），让空 Wiki 开箱即用。

**询问用户以下信息后创建文件（语言必须与 `WIKI_LANG` 一致）：**
- Wiki 主题一句话介绍
- 语料来源（书名 / 作者 / 版本 / 年份）
- 目标读者
- 版权 / 使用声明

**WIKI_LANG = zh：**

```markdown
---
id: About
type: overview
label: 关于本 Wiki
aliases: [关于, About]
description: 一句话介绍
---

# 关于本 Wiki

## 语料来源
…

## 使用说明
…

## 版权声明
…
```

**WIKI_LANG = en：**

```markdown
---
id: About
type: overview
label: About This Wiki
aliases: [About, 关于]
description: One-line description
---

# About This Wiki

## Source Material
…

## Usage Notes
…

## Copyright & Attribution
…
```

> 此文件须通过 NEW1（add_page.py）创建，保留修订历史记录。

> ⚠️ **创建后必须重建注册表**：`./wiki-daemon.sh start` 会自动重建 `pages.json` + `pages.lite.json`。
> 这两个文件需要 commit 到 repo，线上静态部署才能找到页面。

### 2-C-1 local.css 主题配色

项目根目录 `wiki/themes/` 提供了 50 套配色方案（含深色/浅色/纸色系），
覆盖 `:root` CSS 变量、首页 Hero、Knowledge 面板、文章正文、实体卡片类型色、
质量徽章等全部视觉元素。

> **先于 Hero 设计**：主题配色决定 Wiki 的整体色系，Hero 视觉设计应与之匹配。
> 选定主题后再设计 Hero，确保视觉一致。

- [x] 列出可用主题，选择一个：

  ```bash
  python3 -c "
  import json, os
  data = json.load(open(os.environ['MEMEX_ROOT'] + '/wiki/themes/metadata.json'))
  for t in data:
      print(f\"{t['id']:2d}  {t['name']:12s}  [{t['category']:18s}]  {t['best_for']}\")
  "
  ```

- [x] 应用所选主题（将 `<ID>` 替换为实际编号，如 `31`）：

  ```bash
  python3 -c "
  import json, os, shutil
  root = os.environ['MEMEX_ROOT']
  data = json.load(open(root + '/wiki/themes/metadata.json'))
  target = '<ID>'
  match = next((t for t in data if target in (str(t['id']), t['slug'], t['name'])), None)
  if not match: raise SystemExit('未找到主题：' + target)
  src = root + '/wiki/themes/' + match['filename']
  dst = 'docs/wiki/local/local.css'
  if os.path.exists(dst): shutil.copy2(dst, dst + '.bak')
  shutil.copy2(src, dst)
  print('已应用主题：' + match['name'] + '（' + match['filename'] + '）')
  "
  ```
- [x] 按需编辑 `local.css` 微调 Section 2（类型边框色）/ Section 6（list 标题链接色）
- [x] 确认页面配色正常渲染（`./wiki-daemon.sh start`，Hero 设计完成后在 2-C-2 再次验证）

### 2-C-2 Hero 视觉设计

> **目标**：在已选定的主题配色基础上，为首页设计一个有主题感的背景视觉（Canvas 动画 / SVG / 静态图），
> Hero 背景色和动效应与 2-C-1 所选主题色系协调。
> 静态文字已在 2-A 的 `hero.js` 中完成；本步骤实现 `hero.config.js` 的动态部分。

- [x] 参考 2-C-1 所选主题的色系，思考适合的视觉隐喻（粒子网络 / 搜索树 / 星空 / 纯色渐变……）
- [x] 在具体 wiki 工作区执行 `/boot`，由 boot skill 主导设计与实现
- [x] 实现 `docs/wiki/local/config/hero.config.js`：

  ```js
  // buildHeroBackground() → 返回背景区 HTML 字符串（canvas / img / svg / ''）
  // startHeroAnimation(setStop) → 启动动画，调用 setStop(fn) 注册清理函数
  export function buildHeroBackground() { … }
  export function startHeroAnimation(setStop) { … }
  ```

  > ⚠️ **强约束**：`buildHeroBackground()` 返回的背景元素（`<canvas>`、`<img>`、`<div>` 等）
  > **必须**带有 `class="hero-cosmos"`。该类在引擎 `home.css` 中定义了
  > `height: clamp(260px, 36vw, 460px)`，是 `.home-hero` 的唯一高度来源。
  > 若使用 `position:absolute` 替代，`.home-hero` 将塌缩为 0，背景不可见。
  >
  > 正确示例：
  > ```js
  > export function buildHeroBackground() {
  >   return '<canvas id="hero-canvas" class="hero-cosmos"></canvas>';
  > }
  > ```

- [x] 本地验证：`./wiki-daemon.sh start`，首页 Hero 背景与主题配色协调，动画无报错
- [x] commit `docs/wiki/local/config/hero.config.js`

### 2-D 验证

- [x] 执行 `./wiki-daemon.sh start`，访问 `http://localhost:<PORT>`
- [x] 确认页面正常渲染（空 Wiki，无报错）
- [x] 点击 topnav「关于/About」，确认 About 页面正常显示
- [x] 打开浏览器开发者工具 → Network，确认无非预期 404（`*.config.js` 的 404 正常，可忽略）
- [x] 确认页面配色正确渲染（主题色、背景色、链接色正常），无 `local.css` 加载失败 404

### 2-E Wiki 配置提交

- [x] 提交 Phase 2 建立的所有配置文件：
  ```bash
  git add docs/wiki/local/ docs/wiki/pages/ docs/wiki/pages.json docs/wiki/pages.lite.json
  bash wiki/scripts/skill_commit.sh "chore: Phase 2 Wiki 配置与 About 页"
  ```
  > 提交范围：`local/` 下所有 JS 配置文件、`pages/About.md`、注册表 `pages.json` / `pages.lite.json`。

---

## Phase 3：语料准备（选择与校对）

> **目标**：Phase 3 结束后，`corpus/raw/doc_final.md` 存在且内容已通过质检，可作为 Phase 4 章节导入的唯一输入。
> 本 Phase 所有语料处理步骤必须全部完成，才能进入 Phase 4。
>
> **⚠️ corpus/ 写入授权**：Phase 3 是唯一允许向 `corpus/` 写入内容的阶段。
> epub 转换产物、校对中间文件、终稿 `doc_final.md` 均存放于 `corpus/raw/`。
> Phase 3 最后一次提交（3-E）完成后，`corpus/` 进入只读——后续阶段（Phase 4 起）禁止修改语料文件。
>
> **提交规则**：3-B / 3-C / 3-E 各自结束时提交一次，**只 `git add corpus/`**。
> Phase 3 过程中各基因（PRE/LNT 等）产生的其他变更由各基因自行提交，不在这三个节点合并。
> **copyrighted 模式**下 `corpus/raw/**` 已在 `.gitignore` 中排除，`git add corpus/` 不会实际添加语料文件——此即预期行为，无须 --force。

---

### 3-0 语料来源类型判断

> 在进入 3-A 之前，先判断当前 wiki 的语料来源类型。选定类型后，后续各节的适用性由该类型决定。

**三种类型**（三选一，记录到 wiki BIRTH.md 的 3-0 节）：

| 类型 | 说明 | 典型场景 |
|------|------|---------|
| **A. 单文件** | 单一 epub / PDF / 已转换 MD 文件 | 单本书、单篇论文 |
| **B. 多文件** | 多个独立 MD 文件（多卷 / 多年 / 多期） | 文集、期刊集、年报合集 |
| **C. 混合** | 部分为单文件，部分为多文件（较少见） | 单书 + 补充材料 |

**各节适用性**：

| 节 | 单文件 A | 多文件 B | 备注 |
|----|---------|---------|------|
| 3-A 确认语料 | 检查 `doc_final.md` | 检查各卷目录文件数 | 见 3-A 多文件等价命令 |
| 3-B epub 转换 | 按需执行 | **整体跳过 / 循环逐卷转换** | 多文件语料若是 MD 则跳过；若是多卷 epub/PDF，对每卷循环执行 3-B（见下方"多卷原始格式"说明） |
| 3-C 文本质检 | PRE9/PRE6 | PRE9-M（见基因文件） | 多文件需格式一致性扫描 |
| 3-C2 章节结构重建 | PRE18 | **整体跳过** | 每文件即独立文档单元 |
| 3-D Lint | LNT11/LNT12 | LNT11-M / LNT12（条件） | 多文件脚注需独立检查 |
| 3-E 终稿生成 | `doc_final.md` | `MANIFEST.md` | 见 3-E 多文件替代方案 |

- [x] 确认类型并在 wiki BIRTH.md 记录：`语料来源类型: A / B / C`
- [x] 若为 **B 类且语料为多卷 epub/PDF（非 MD）**：执行多卷等效流程
  > B 类默认假设语料已是 MD。若原始格式是每卷一 epub/PDF，则对每卷循环执行 3-A→3-B→3-C（单卷流程），但跳过 3-C2（章节结构重建）和 3-D（每卷独立 lint）。最终 3-E 产出一份合并的 MANIFEST.md。见下方 "多卷原始格式" 框。
  
  **多卷原始格式拆解指引**：
  ```bash
  # 示例：三卷册的 epub 转换
  for vol in vol1.epub vol2.epub vol3.epub; do
    python3 "$MEMEX_ROOT/wiki/scripts/convert_epub.py" "$vol" "corpus/raw/$(basename $vol .epub)/"
  done
  ```
  > 转换后每卷一个子目录，`doc_final.md` 替换为含各卷路径的 `MANIFEST.md`。

---

### 3-A 确认语料结构

- [x] 确认 `corpus/raw/doc_final.md` 存在（校对流水线已完成的标志）：
  ```bash
  ls corpus/raw/*/doc_final.md 2>/dev/null || echo "NOT FOUND"
  ```
  若不存在，表示语料处理流水线尚未完成——请继续执行本 Phase（3-C 文本质检 → 3-D Lint → 3-E 终稿生成）后再进入 Phase 4。

  **多文件场景（B 类）等价检查**：按卷/子目录核查文件数：
  ```bash
  # B 类：列出各子目录文件数，确认无遗漏
  for dir in corpus/raw/toefl-vocab-wiki/*/; do
    cnt=$(find "$dir" -name "*.md" | wc -l)
    echo "${dir}: ${cnt} files"
  done
  # 排除检查：确认无草稿/备份文件混杂
  find corpus/raw/toefl-vocab-wiki -name "*.md" \
    | grep -vE "(template|draft|backup|_bak)" \
    | wc -l
  ```
  > B 类无单一终稿，此处确认所有卷目录均已就位，文件数合理。
- [x] 列出 `corpus/raw/` 下所有文件：
  ```bash
  find corpus/raw -type f | sort
  ```
- [x] **⚠️ 停下来问用户**：将文件列表展示给用户，确认：
  - `doc_final.md` 是否为预期的导入版本？
  - 是否有需要排除的文件（草稿、备份、临时文件等）？

  > 不要假设。即使 doc_final.md 存在，也要确认它是正确的版本。

- [x] 确认导入范围（用户确认后记录）：
  - 正文章节（type=chapter，带 `chapter:` 编号）
  - 前言 / 序言、封面、目录、索引（type=chapter，无章节编号）
  - 附录、参考文献（type=chapter）
  - **原则**：宁多勿少，保留原书完整结构
- [x] 确认页面 ID 命名规则（如 `ch01-introduction`、`Preface`、`Appendix-A`、`Bibliography`）


### 3-B epub 转换与校验（epub 来源专属，其他来源跳过）

> 仅当 3-0 类型为 **A 单文件且语料为 epub** 时执行本节。B 类（多文件）/ A 类非 epub / C 类均跳过直接到 3-C。
> PDF/已转换 MD 来源直接跳到 3-C。

- [x] **epub → MD 转换**：
  ```bash
  # 推荐用 pandoc，保留结构
  pandoc -f epub -t markdown --wrap=none \
    --extract-media=corpus/raw/images \
    -o corpus/raw/book.md \
    "corpus/raw/<book>.epub"
  ```
  或使用项目已有的转换工具（如有）。

- [x] **转换结果初步检查**：
  - 文件大小合理（与 epub 正文体量匹配，非空非截断）
  - 章节标题可识别（`grep -n "^#" corpus/raw/book.md | head -40`）
  - 图片已提取到 `corpus/raw/images/`（如有图片）
  - 无明显乱码或编码错误（中文字符正常显示）

- [x] **章节完整性核对**：
  - 对照原书目录，逐一确认所有章节标题均出现
  - 检查有无章节缺失、重复、顺序错误
  - 记录异常章节（边界模糊、标题缺失等）需人工处理的位置

- [x] **内容抽样质检**：
  - 随机抽取 3–5 个章节，对照原书核查正文是否完整
  - 检查脚注、引用格式是否保留
  - 检查表格是否破损（grid table 常见问题）
  - 检查图注是否与图片对应

- [x] **⚠️ 停下来，将检查结果展示给用户，等待用户确认**：
  - 说明发现的问题（章节缺失、乱码、格式异常等）
  - 询问：是否接受当前转换质量，继续导入？
  - 若有问题：讨论修复方案，修复后重新检查，再次确认
  - **用户明确确认后才能继续**

- [x] **提交初步 MD 稿**（目标：锁定转换基线，后续处理有据可查）：
  ```bash
  git add corpus/raw/
  bash wiki/scripts/skill_commit.sh "corpus: epub 转换初步 MD 稿"
  ```
  > corpus/ 跟踪模式已在 0-B 选定。copyrighted 模式下 `corpus/raw/**` 已在 .gitignore 排除，此提交不添加实际语料文件（预期行为）。


### 3-C 文本质检

> 目标：修复"非作者意图的错误"——OCR 错字、PDF 伪换行、图像质量缺陷。这类问题若带入 PN 赋号会导致 PN 锚定错误位置。

> **基因（gene）**：`skills/gene/` 下的每个 `.md` 文件是一个"基因"——可复用的操作规范单元（法源体系 L5）。基因通过 BIRTH（启动流程）和 skill（执行脚本）在具体 wiki 中**表达**（gene expression）为实际内容操作。`local/` 子目录存放本 wiki 的差异化覆盖。
>
> 技能定义（法源体系 L5，内部优先级 skill > gene）：所有 `PRENN`/`LNTNN` 代码对应的完整操作规范在
> `$MEMEX_ROOT/skills/gene/<PRENN>-<slug>.md`，执行前先读该文件。

> **执行前先确认语料来源类型**（见 3-0 节：A 单文件 / B 多文件 / C 混合），写入 wiki BIRTH.md。
> - A 类：按原流程执行 PRE9（epub / 数字PDF / 扫描PDF 分层适配）
> - B 类：跳过 PRE9/PRE6，改用 **PRE9-M**（多文件格式一致性扫描）
> - C 类：混合场景按 A 类执行，B 类部分单独执行 PRE9-M

**图像处理（仅 PDF 来源）：**

- [x] **PRE15**（[corpus-image-qa]($MEMEX_ROOT/skills/gene/PRE15-image-qa.md)）：检查图片旋转方向、分辨率（< 600px 标记）、内容截断；用 ImageMagick / pdftoppm 修复；epub 来源可跳过
- [x] **PRE16**（[image-table-transcription]($MEMEX_ROOT/skills/gene/PRE16-image-table-transcription.md)）：扫描 `:::image` 块，识别图片内容实为表格数据者，转录为 Markdown 表格附在图片后；含跨列合并的表格标记人工复查；epub 来源可跳过

**文字质检：**

- [x] **PRE9**（[corpus-ocr-qa]($MEMEX_ROOT/skills/gene/PRE9-corpus-ocr-qa.md)）：按语料来源类型分层执行
  - 扫描版 PDF：PDF 工具残留物扫描 + 中文形近字检查 + 英文单词/公式/标题层级
  - 数字版 PDF / epub：公式配对 + 标题层级 + 格式问题；跳过形近字和残留物扫描
- [x] **PRE6**（[corpus-linebreak-repair]($MEMEX_ROOT/skills/gene/PRE6-corpus-linebreak-repair.md)）：扫描三类错误分段（括号内英文名跨段、行尾逗号分段、跨页假分段），批量脚本修复 + 合并后英文边界检查；epub 来源通常跳过

- [x] **提交文本质检结果**：
  ```bash
  git add corpus/
  bash wiki/scripts/skill_commit.sh "corpus: 3-C 文本质检完成"
  ```

### 3-C2 重建章节结构（文字校勘完成后必做，多文件 B 类跳过）

> **B 类（多文件）跳过本节**：每文件即独立文档单元，不执行章节结构重建。
> A/C 类继续执行。

- [x] **PRE18**（[corpus-rebuild-chapter-structure]($MEMEX_ROOT/skills/gene/PRE18-corpus-rebuild-chapter-structure.md)）：在文字校勘（PRE9/PRE6/COR 系列）完成后，重建语料的章节结构——修复因校勘操作导致的章节边界偏移、标题层级错乱、跨章节合并等问题。
- [x] 验证重建结果：章节数量与 `ref/chapter-order.md` 一致，各章标题行可被 `chapter_pattern` 正确匹配：
  ```bash
  python3 "$MEMEX_ROOT/wiki/scripts/build_chapter_map.py" --dry-run
  ```
- [x] 提交：
  ```bash
  git add corpus/
  bash wiki/scripts/skill_commit.sh "corpus: 3-C2 PRE18 章节结构重建完成"
  ```

### 3-D Pre-PN Lint 检查

> **类型适配**：A/C 类执行以下 LNT11/LNT12 标准流程；**B 类（多文件）** 使用 LNT11-M（按文件独立检查脚注完整性）替代 LNT11，LNT12 按条件执行。

- [x] 执行 `$MEMEX_ROOT/ref/spec/workflow-pre-pn-lint.md` 定义的完整流程，全部步骤通过后进入 Phase 4。
- [x] **LNT11**（[footnote-completeness]($MEMEX_ROOT/skills/gene/LNT11-footnote-completeness.md)）：对比 TXT 路径脚注标记总数与 MD 文件脚注定义数，发现 PDF 转换工具整体丢失脚注的情况并恢复；无脚注书籍跳过
- [x] **LNT12**（[non-latin-ocr]($MEMEX_ROOT/skills/gene/LNT12-non-latin-ocr.md)）—— **条件执行**：扫描 MD 文件中是否存在俄文/希腊文/阿拉伯文等非拉丁字符；有则对照 PDF 图片逐字核验，无则跳过
- [x] **`:::` 块语法扫描**（CONSTITUTION §13.2）：扫描页面目录中 `:::` 与块类型名之间缺少空格的情况：
  ```bash
  grep -rn "^:::[a-z]" docs/wiki/pages/ --include="*.md"
  ```
  若有输出，用 `sed -i 's/^:::\([a-z]\)/::: \1/g'` 批量修复。


### 3-E 生成语料终稿（流水线完成后必做）

> **语料处理终稿约定**：语料处理流水线（PRE、COR、LNT 等基因）的**最后一步完成后**，须将产出文件复制为统一终稿：
>
> ```bash
> cp corpus/raw/<最后阶段输出>.md corpus/raw/doc_final.md
> ```
>
> **`doc_final.md` 是语料处理流水线对下游的唯一承诺**：
> - Phase 3（章节导入）及所有后续工序统一以 `doc_final.md` 为输入
> - 在 `doc_final.md` 生成之前，Phase 3 不得启动
> - 每次重新校对或补充处理完成后，须重新生成 `doc_final.md`
>
> **中间文件**（`doc_pre9.md`、`doc_footnotes.md` 等）保留用于追溯，但不作为下游入口。

> **多文件场景（B 类）替代方案**：B 类无法生成单一 `doc_final.md`。
> 以 `corpus/raw/MANIFEST.md` 代替，内容为纳入文件清单（按卷分组）、排除文件及原因、质检通过时间戳。
> `MANIFEST.md` 是多文件场景下"语料流水线对下游（Phase 4）的唯一承诺"——Phase 4 启动前必须存在且已提交。

- [x] **A/C 类**：流水线全部步骤完成后，执行终稿复制：
  ```bash
  cp corpus/raw/<最后阶段输出>.md corpus/raw/doc_final.md
  ```
- [x] **A/C 类**：确认 `doc_final.md` 存在且内容完整
- [x] **B 类（多文件）**：生成 MANIFEST.md 声明文件：
  ```markdown
  # MANIFEST — TOEFL词汇词根+联想记忆法

  纳入文件: Word List 1-48
  排除文件: 版权保护
  质检时间: 2026-06-19
  PRE9-M 扫描: pass
  ```
  ```bash
  echo "# MANIFEST — toefl-vocab-wiki" > corpus/raw/toefl-vocab-wiki/MANIFEST.md
  # 列出各卷文件
  for dir in corpus/raw/toefl-vocab-wiki/*/; do
    echo "### $(basename $dir)" >> corpus/raw/toefl-vocab-wiki/MANIFEST.md
    ls "$dir"*.md >> corpus/raw/toefl-vocab-wiki/MANIFEST.md
  done
  ```
- [x] **提交语料终稿**：
  ```bash
  git add corpus/
  bash wiki/scripts/skill_commit.sh "corpus: 3-E 语料终稿 doc_final.md"
  ```

---

## Phase 4：章节导入与目录

> **分桶结构检查**（Phase 启动时 + 每个写 pages/ 步骤后执行）：
> `python3 wiki/scripts/lint_bucket_structure.py --fix`
> 确保 `docs/wiki/pages/` 和 `docs/wiki/history/` 根目录无直接 `.md` 文件（详见 `LNT16`）。
>
> **前置条件**：`corpus/raw/doc_final.md` 存在（Phase 3 完成的标志，A/C 类）或 `MANIFEST.md` 存在（B 类多文件场景）。
> **目标**：所有章节（含前言、附录、参考文献）以 `type: chapter` 页面形式进入 Wiki，首页出现书籍结构导航，读者可按部分/章节入口阅读。
> **本 Phase 不做 PN**（段落编号）——内容原文导入即可，PN 留 Phase 5。

---

### 4-A 编写章节导入脚本

- [x] 导入前确认：`LAW.md` 中语料页类型为 `chapter`，`types.js` 中有 `chapter` 键。
- [x] 创建 `wiki/scripts/build_chapter_pages.py`，参考 `$MEMEX_ROOT/wiki/scripts/build_chapter_pages.py` 的模式：
  - 读取语料文件，按章切分内容
  - 写入 `docs/wiki/pages/` 下对应 `.md` 文件，写入路径**必须**通过 `from page_bucket import page_bucket` 和 `page_bucket(slug)` 计算分桶，禁止自建 bucket 算法（如 hex 编码、单字符截取等），frontmatter 格式：
    ```yaml
    ---
    id: ch01-introduction
    type: chapter
    label: "Chapter 1: Introduction"
    description: "One-sentence description"
    chapter: 1          # 附录/前言可省略或用 0/null
    tags: [chapter]
    ---
    ```
  - **不插入 PN**，保留原文结构
  - **段落间保留空行**：导入后的章节页中，每个自然段落之间必须有一个空行分隔。连续行在 Markdown 中会被合并为单一段落，导致 PN 赋号（Phase 5）后 `[NNN-PPP]` 段落渲染时全部粘连
  - 运行后更新 `docs/wiki/pages.json` + `pages.lite.json`

  > ⚠️ **所有从语料切分的页面均使用 `type: chapter`**，包括前言、序言、目录、导言、后记、附录、参考文献、索引等任何位置的原文内容页。
  > `type: overview` 仅用于 wiki 编辑者手工创建的综述/导引页，绝不用于书籍原文内容页。
  > 违反此规则将导致 PN 显示、章节导航、book card 渲染异常。

- [x] 执行脚本，确认所有章节页面生成

**epub 来源 wiki 的 post-import 规范化流水线（顺序固定）：**

所有规范化脚本均在 `$MEMEX_ROOT/wiki/scripts/`，通过 `$WIKI_ROOT` 发现目标 wiki 路径。
**无需将脚本复制到本 wiki**（RFC-aima-0021）。调用方式：

```bash
export WIKI_ROOT="$PWD"        # 在 wiki 根目录下设置一次
SCRIPTS="$MEMEX_ROOT/wiki/scripts"
```

- [x] **提取 epub 插图**（`extract_epub_images.py`）— 将 epub 内嵌图片导出到 `docs/wiki/images/`，**必须在 `normalize_fig_blocks.py` 之前执行**，否则 `:::image` 块引用的图片文件不存在，渲染时显示破图。
  ```bash
  python3 "$SCRIPTS/extract_epub_images.py" --epub corpus/raw/<book>.epub \
    --out docs/wiki/images/
  ```
  - 导出后确认 `docs/wiki/images/` 下有图片文件（jpg/png/svg）
  - 若原书无插图（纯文字 epub），此步跳过
  - PDF 来源：用 `pdfimages` 或 `pdftoppm` 手动提取，再整理到 `docs/wiki/images/`

- [x] `normalize_pandoc_spans.py` — Pandoc 扩展 span 语法 → CommonMark
  （`{.italic}` → `*text*`，`{.bold}` → `**text**`，`{.superscript}` → `<sup>`，等；`{.fig-num}` 留给下一步）
  ```bash
  python3 "$SCRIPTS/normalize_pandoc_spans.py"
  ```
- [x] `normalize_fig_blocks.py` — `{.fig-num}` 图注 → `:::image fig="N.M" caption="..."` 语义块；依赖上一步已提取图片文件
  ```bash
  python3 "$SCRIPTS/normalize_fig_blocks.py"
  ```
- [x] `normalize_table_blocks.py` — grid table → pipe table，并用 `:::table` 包装；含 spanning cell 的表格需人工复查
  ```bash
  python3 "$SCRIPTS/normalize_table_blocks.py"
  ```
- [x] `lint_list_spacing.py` — 补全列表标记后缺失的空格（`1.Item` → `1. Item`）
  ```bash
  python3 "$SCRIPTS/lint_list_spacing.py"
  ```
- [x] `normalize_xhtml_links.py` — epub 跨章节 xhtml 链接 → wiki 内链
  （`[Chapter 15](#Chapter15-00.xhtml)` → `[[Chapter-15]]`；裸数字、复数、加粗标题均正确处理；节/图/页码 anchor 保持不变）
  ```bash
  python3 "$SCRIPTS/normalize_xhtml_links.py"
  ```
- [x] `build_page_map.py` — epub page_N → wiki PN 映射（依赖英文 epub）
  （扫描 epub 提取 `<a id="page_N"/>` 锚点，与 wiki PN 索引匹配输出 `page_map.json`；无对应 epub 时可跳过）
  ```bash
  python3 "$SCRIPTS/build_page_map.py"
  ```
- [x] `normalize_page_links.py` — wiki 页码链接 → pn-NNN-PPP 锚点
  （同章：`[text](#pn-NNN-PPP)`，跨章：`[text](#PageId#pn-NNN-PPP)`，无映射降级为纯文本）
  ```bash
  python3 "$SCRIPTS/normalize_page_links.py"
  ```
- [x] `build_section_anchor_map.py` — epub section → anchor 映射
  （从英文 epub xhtml 提取 `<section id="secN-M">` 与 heading 文字，匹配 chapter_map 输出 `section_anchor_map.json`）
  ```bash
  python3 "$SCRIPTS/build_section_anchor_map.py"
  ```
- [x] `inject_section_anchors.py` — 注入 [a:id] 锚点到 wiki 章节页 heading 前
  （幂等：已有 `[a:id]` 的 heading 跳过；仅处理 h2 级小节）

- [x] `normalize_paragraph_spacing.py` — 在相邻非空行之间插入空行，确保段落间距合规
  （epub 转换常丢失 Markdown 空行；幂等：已合规文件无 diff）
  ```bash
  python3 "$SCRIPTS/normalize_paragraph_spacing.py"
  ```
  验证：`python3 "$SCRIPTS/normalize_paragraph_spacing.py" --dry-run` 应输出 "0 需要修复"

- [x] **可选**：安装 git pre-commit hook（RFC-liangjing-0023），在每次 `git commit` 前自动修复非法 PN 格式：
  ```bash
  bash "$SCRIPTS/install_precommit_hook.sh"
  ```

> 非 epub/Pandoc 来源的 wiki 可跳过此流水线；如语料来源不确定，运行后检查 diff 是否有实际修改。

> 🔍 **分桶检查点**（章节导入完成后执行一次）：
> `python3 wiki/scripts/lint_bucket_structure.py --fix`
> 确保 `build_chapter_pages.py` 未产生不合规桶目录。


### 4-B 创建 Contents 目录页

TOC 页面标准：文件名按语言（`en` → `TOC.md`，`zh` → `目录.md`，`ja` → `目次.md`），type=overview，tab 层级缩进，PN 前缀编号，锚点链接。

- [x] 执行 `generate_toc.py` 生成 TOC 页：
  ```bash
  python3 wiki/scripts/generate_toc.py --pn-prefix <PN> --lang <lang>
  # 可选：--parts-config parts.json 定义 Part 分组
  # dry-run 预览：加 --dry-run
  ```
- [x] 将 TOC id 加入 `local/config/home.js` PREFACE_IDS：
  ```js
  export const PREFACE_IDS = ['Front-Matter', 'TOC', 'Preface'];
  ```
- [x] 访问 `#TOC`（或 `#目录` / `#目次`）确认目录页可渲染，所有链接可跳转


### 4-C 更新 home.js 接入章节导航

- [x] 补充 `docs/wiki/local/config/home.js` 中的空数组：
  ```js
  export const PREFACE_IDS  = [...];  // 书前置页，按阅读次序列出
  export const APPENDIX_IDS = [...];  // 书后置页，按阅读次序列出
  ```

  **原则：book card 应展示书的完整入口，所有导入的章节页（含封面、目录等结构页）都应出现在 PREFACE_IDS 或 APPENDIX_IDS 中，按原书阅读次序排列。** 不要遗漏任何已导入的非正文页。

  示例（正文有封面、目录、前言，后置有附录、参考文献、索引的书）：
  ```js
  export const PREFACE_IDS  = ['Front-Matter', 'TOC', 'Preface'];
  export const APPENDIX_IDS = ['Appendix-A', 'Appendix-B', 'Bibliography', 'Index'];
  ```

- [x] 确认 hero.js 的 `BOOK_META` 部分覆盖正确（min/max 与实际章节编号一致）


### 4-D 验证与提交

- [x] **CHK12**（chapter-integrity-check）：执行章节完整性检查（前置：`local/chapter_list.py` 已定义 `EXPECTED_CHAPTERS`）：
  ```bash
  python3 wiki/scripts/chapter_integrity.py
  # 如有错误，自动修复后再检查：
  python3 wiki/scripts/chapter_integrity.py --fix
  python3 wiki/scripts/chapter_integrity.py
  ```
  确认 C01–C07 全部通过（type/label/book_seq 正确，frontmatter 一致，语料 H2 全覆盖）。
- [x] **CHK13**（deploy-verify）：执行部署验证检查（前置：`./wiki-daemon.sh start` 已运行）：
  ```bash
  python3 wiki/scripts/verify_deploy.py
  ```
  确认 D01–D07 全部通过（章节数据完整性、配置字段存在、首页可达、编码洁净、TOC wikilink 可解析、导航配置连续）。
  若 D06 提示重启持久化需验证，手动执行 `./wiki-daemon.sh restart` 后重跑确认。
- [x] 回填修订历史：运行 `backfill_recent.py --mode hybrid --public docs/wiki`
  ```bash
  python3 "$MEMEX_ROOT/wiki/scripts/backfill_recent.py" --mode hybrid --public docs/wiki
  ```
  确认输出显示所有章节页面均有 1 条初始修订记录（`共 N 个页面，N 条修订记录`）。
- [x] commit `docs/wiki/pages/`、`pages.json`、`pages.lite.json`、`local/config/home.js`、`docs/wiki/images/` 及修订历史文件

---

## Phase 5：PN 段落编号

> **分桶结构检查**（Phase 启动时 + 每个写 pages/ 步骤后执行）：
> `python3 wiki/scripts/lint_bucket_structure.py --fix`
>
> **前置条件**：Phase 4 章节导入完成（`docs/wiki/pages/` 下所有章节页面已生成）。
> **目标**：所有章节页面（含非正文章节）按原书次序分配 `[NNN-PPP]` 段落编号，
> 建立可供词条引用的 PN 体系。

<!-- MUST-COPY: NNN 格式表 + 结构类型表 + "铁则"，init 时必须原文复制 -->
### 5-A 确定章节 NNN 编号（PN 前置必做）

> ⚠️ **NNN 必须严格对应原书页面次序**，包括所有非正文章节。次序一经确定不得变更，否则已标注引用全部失效。

**第一步：确认插件支持的 NNN 格式**

pn-citation 插件正则只接受两种 NNN：

| 格式 | 范围 | 适用场景 |
|------|------|---------|
| `\d{3}` | `001`–`999` | 正文章节、附录、参考文献等 |
| `P0[1-9]` | `P01`–`P09` | 书前置章节（前言、序言等） |

> ⚠️ 凡使用字母缩写（如 `PRE`、`APP`、`REF`、`IDX`）作为 NNN 的旧方案均与插件不兼容，执行前必须修正为上表格式。

**第二步：对照原书目录逐页分配 NNN**

> **铁则：所有已导入页面统统分配 NNN，不得自行判断某页"无正文"而跳过。**

根据书籍结构选择合适模式（参考现有 wiki 实践）：

| 结构类型 | 代表 wiki | NNN 模式 |
|---------|---------|---------|
| 单书线性，全正文 | honglou（120回）、shiji-kb（130篇）、tongjian（294卷）| `001`–`NNN` 顺序分配 |
| 单书线性，含前置页 | ai-history（3版前言 + 16章）、aima（封面/目录/前言 + 29章）| `P01`–`P0N` 前置页，`001`–`NNN` 正文 |
| 多书/多卷系列 | three-body（三部曲 137章）| `B-CC`（书号-章号）复合 NNN |

分配原则：
- 书前置内容（封面、目录、前言、序言等）：按出现次序依次使用 `P01`–`P09`
- 正文章节 NNN 尽量与章节编号对齐（ch01 → `001`，ch02 → `002`），方便引用时直觉对应
- 附录、参考文献、索引等书后置内容：紧接正文章节顺延编号
- 多书系列：在 wiki BIRTH.md 中确定书号位数和章号位数，并记录进 LAW.md

**第三步：创建并展示 `ref/chapter-order.md`**

```markdown
# 章节次序表（PN NNN 对照）

| NNN   | page-id      | 说明             |
|-------|--------------|------------------|
| P01   | Front-Matter | 封面/版权页       |
| P02   | TOC          | 目录页            |
| P03   | Preface      | 前言              |
| 001   | ch01-xxx     | Chapter 1: …     |
| …     | …            | …                |
| 029   | ch29-xxx     | Chapter 29: …    |
| 030   | Appendix-A   | 附录 A            |
| 031   | Appendix-B   | 附录 B            |
| 032   | Bibliography | 参考文献           |
| 033   | Index        | 索引              |
```

- [x] 确认 `LAW.md` 中 NNN 方案与插件格式一致（无 `PRE`/`APP`/`REF`/`IDX` 等非法格式）
- [x] 在 `LAW.md` 中引用 `ref/spec/data-pn.md` 作为 PN 格式规范来源
- [x] 在 `LAW.md` 中记录本 wiki 的 PN 特殊规范：段数（2 段 NNN-PPP 或 3 段 VVV-NNN-PPP）、各段位数与字符约束、`PN_SCHEME` 取值（standard/volume）、wiki 专属豁免规则（如脚注处理）
- [x] 创建 `ref/chapter-order.md`，完整列出所有页面及其 NNN
- [x] **将完整表格打印到屏幕**，让用户逐行核对原书目录次序
- [x] **等待用户明确确认**次序表与原书一致后，方可进入 5-B


### 5-B 更新章节 frontmatter（用户确认后执行）

> 执行条件：用户已确认 `ref/chapter-order.md` 次序正确。
> 本步骤由 `/boot` 在具体 wiki 工作区执行；> **BIRTH.spec.md 只定义规范**（法源体系 L4），不写死具体字段值。

**必选属性：`pn_prefix`**

所有 `type: chapter` 且赋 PN 的页面，frontmatter 中必须加入 `pn_prefix`：

```yaml
pn_prefix: "001"    # 对应 NNN，字符串形式
```

- 值为 NNN 字符串（`"001"`、`"P01"` 等），与 `ref/chapter-order.md` 中的 NNN 列一致
- 所有已导入页面均加此字段，无例外

**可选属性（按书籍结构决定，/boot 执行时在 wiki BIRTH.md 中记录本书选择）：**

| 属性 | 类型 | 说明 | 适用场景 |
|------|------|------|---------|
| `vol_num` | string | 卷编号，格式 `"001"` | 有卷划分的书（多卷本、分部本） |
| `vol_title` | string | 卷标题，如 `"第一部分：基础"` | 同上 |
| `part_num` | int | 部/编编号 | 全书分多个 Part 时 |
| `part_title` | string | 部/编标题 | 同上 |

> **判断原则**：原书目录有明确卷/部/编划分 → 加对应属性；纯单卷线性结构 → 只加 `pn_prefix`，可选属性留空。

**具体 wiki 的 BIRTH.md 应在此记录：**
- 本书选用了哪些可选属性
- 各属性的值域范围（如 vol_num 的范围是 001–003）
- 分配脚本的调用方式

**执行步骤：**
- [x] 在 wiki BIRTH.md Phase 5-B 中确认本书选用的可选属性
- [x] 编写（或调用）批量更新脚本，按 `ref/chapter-order.md` 的 NNN 映射逐页更新 frontmatter
  > **铁律**：脚本定位页面文件时，**必须读取 `pages.json` 的 `path` 字段**，不得自行从 page id 推导路径（`pid[:2]` 等方式对 CJK id 失效）。
  > ```python
  > pages = json.loads((WIKI_ROOT / 'docs/wiki/pages.json').read_text())['pages']
  > page_file = PAGES_DIR / pages[pid]['path']   # 正确
  > # page_file = PAGES_DIR / pid[:2] / f'{pid}.md'  # 禁止
  > ```
  >
  > **铁律（写）**：创建页面文件时必须使用 `page_bucket(slug)` 确定分桶目录，禁止自建 bucket 算法或从 slug 截取前缀。所有写 `docs/wiki/pages/` 的操作（`add_page.py`、`build_chapter_pages.py`、butler 批量导入等）均受此约束。
- [x] 执行脚本，确认所有赋 PN 章节的 `pn_prefix` 字段已写入
- [x] 确认 `data/chapter_map.json` 格式正确——必须为 **`nnn → page_id`** 映射：
  ```json
  {
    "P03": "Preface",
    "001": "ch01-up-to-the-starting-line",
    "002": "ch02-natural-experiment-of-history"
  }
  ```
  > **禁止**使用 `page_id → {nnn, label, ...}` 格式——pn-citation 插件以 NNN 为 key 查询 page_id，格式反转导致所有 PN 引注静默失效。
- [x] 执行格式验证：
  ```bash
  python3 - <<'EOF'
  import json, sys
  from pathlib import Path
  cm = json.loads(Path('data/chapter_map.json').read_text())
  errors = []
  for k, v in cm.items():
      if not isinstance(v, str):
          errors.append(f'  key {k!r}: value 应为 str（page_id），实为 {type(v).__name__}')
  if errors:
      print('✗ chapter_map.json 格式错误：')
      for e in errors: print(e)
      sys.exit(1)
  print(f'✓ chapter_map.json 格式正确（{len(cm)} 条目，nnn→page_id）')
  EOF
  ```
- [x] 将 `data/chapter_map.json` 复制到 `docs/wiki/data/chapter_map.json`
- [x] **提交章节 frontmatter 更新**：
  ```bash
  git add docs/wiki/pages/ ref/chapter-order.md data/
  bash wiki/scripts/skill_commit.sh "feat: Phase 5-B 章节 NNN/pn_prefix 写入"
  ```
  > `data/chapter_map.json` 须在此提交——pn-citation 插件相对 wiki 根目录加载此文件。


### 5-C 按次序逐章赋号

> **前置阅读（执行前必读）：**
> - PN 格式规范：`$MEMEX_ROOT/ref/spec/data-pn.md`（哪些元素分配 PN、格式示例）
> - 基因：`$MEMEX_ROOT/skills/gene/PRE7-chapter-pn-assign.md`
>
> **Wiki 专属适配**（在 wiki 本地 BIRTH.md 5-C-0 中记录）：
> - 本 wiki 有哪些额外跳过元素（超出通用 PRE7 规则的部分）
> - 本 wiki 使用的 PN 赋号脚本路径

> 流程：**先确认专属规则（5-C-0）→ 跑试验章 → 人工评估 → 有问题提 RFC → 通过后全量推进**。
> 评估环节目前由人完成；待评估标准稳定后可迁移为 agent 自动评估。

#### 5-C-0 Wiki 专属 PN 规则（必须在试验前在本地 BIRTH.md 确认）

- [x] 确认 `pn_prefix` 已写入所有目标章节（Phase 4-B 完成）
- [x] 阅读 `$MEMEX_ROOT/ref/spec/data-pn.md §2`，了解通用跳过规则
- [x] 记录本 wiki 的额外跳过元素（如 sidebar 注释、epub 脚注定义、特殊块类型等），写入 wiki 本地 `BIRTH.md` 的 `5-C-0` 节
- [x] **从本 wiki `LAW.md` 三节读取并确认 `pn_format` 参数**：
  - 读取 LAW.md 中"三、PN（段落编号）映射规则 → 格式定义"节，确定采用**两段**（standard）还是**三段**（volume）方案
  - 根据方案确定传给 PRE7 的 `pn_format` 字符串：
    - 两段 standard：`"{chapter_num:03d}-{pn_counter:03d}"` （默认，NNN-PPP）
    - 三段 volume：`"{pn_prefix}-{ppp:03d}"` （VVV-NNN-PPP，pn_prefix 由 frontmatter 的 `pn_prefix` 字段提供）
    - 含前置页（P01 系列）：确认 PRE7 以页面 frontmatter 的 `pn_prefix` 字段（如 `"P01"`）驱动，`pn_format` 不变
  - 将确定的 `pn_format` 值记录于 wiki 本地 `BIRTH.md` 的 `5-C-0` 节，后续 5-C-1 和 5-C-4 调用 PRE7 时统一使用此值
- [x] 确认或创建本地 PN 赋号脚本（可从 PRE7 代码示例适配）

#### 5-C-1 试验章（pilot）

从 `ref/chapter-order.md` 中选一章作为试验对象——优先选**正文结构典型、有图表、有脚注**的章节，不选最短或最简单的章节。

- [x] 对试验章单独执行 PN 标注（[PRE7-chapter-pn-assign]($MEMEX_ROOT/skills/gene/PRE7-chapter-pn-assign.md)），**传入 5-C-0 确认的 `pn_format`**
- [x] 本地渲染验证：`./wiki-daemon.sh start`，在浏览器打开该章节页面，检查：
  - PN 编号正确显示在段落首部，无重复、无跳号
  - 图片块（`:::image`）的 `pn=` 属性正确
  - 表格块（`:::table`）的 PN 注释正确
  - 脚注区与正文 PN 不混淆

#### 5-C-2 评估

> 当前由**人工**完成以下评估清单；未来迁移为 agent 时，此清单即为评估 prompt 的骨架。

逐项检查并记录结果（通过 / 问题描述）：

| 检查项 | 标准 | 结果 |
|--------|------|------|
| 编号连续性 | 无跳号，PPP 从 001 起严格递增 | |
| 段落边界正确 | PN 锚定在作者原段首，无锚定在标题/图注/脚注上 | |
| 特殊块处理 | 图片、表格、代码块按规则赋号，不占用正文 PPP 序列 | |
| 脚注隔离 | 脚注区段落未被赋 PN | |
| 渲染无副作用 | `[NNN-PPP]` 标记不破坏正文 Markdown 渲染 | |
| PN 引用可跳转 | 点击 PN 编号可定位到对应段落（如插件支持） | |

#### 5-C-3 发现问题 → RFC

评估若发现任何系统性问题（规则缺失、脚本 bug、PRE7 定义不完整等），**在继续全量赋号之前**提交 RFC：

```bash
# 1. 在本 wiki ref/rfc/ 下创建 RFC 文件
#    命名：rfc-<wiki>-NNNN-slug.md，status: proposed
# 2. 用 skill 提交为 memex GitHub issue
/rfc ref/rfc/rfc-<wiki>-NNNN-slug.md
```

RFC 合并或明确标注"不阻塞"后，方可进入全量赋号。

#### 5-C-4 全量赋号

试验章评估通过、RFC 已处理后：

- [x] 严格按 `ref/chapter-order.md` 的 NNN 次序，逐章执行 PN 标注，**每章均传入 5-C-0 确认的 `pn_format`**
- [x] 每章完成后验证编号连续性（无跳号），再推进下一章
- [x] 非正文章节（前言、附录、参考文献等）同样赋号，不得跳过
- [x] 全量完成后再次整体验证跨章连续性（`QUO10-cross-chapter-pn-verify`）
- [x] 执行 `$MEMEX_ROOT/ref/spec/workflow-post-pn-lint.md` 定义的全量 PN 验收工作流（语料复核、PN 格式与编号完整性、wikilink 有效性、frontmatter、渲染质量）

> 🔍 **分桶检查点**（PN 赋号完成后执行一次）：
> `python3 wiki/scripts/lint_bucket_structure.py --fix`
> 确保 PN 赋号过程中未产生不合规桶目录。


### 5-D PN 后超长段落拆分（可选步骤，默认跳过）

> 目标：提升阅读体验（**可选步骤，默认跳过**）。此步骤在 PN 赋号**之后**执行，PN 已锚定作者原段落，拆分时首段保留 PN，子段不新增编号。
>
> `/boot` 执行到此处时，应询问用户："是否执行 PRE2 超长段落拆分？（默认：否）"。若用户回答否或无回应，直接跳至 5-E。

- [x] **（可选）** 若用户确认执行：**PRE2**（[split-long-paragraph]($MEMEX_ROOT/skills/gene/PRE2-split-long-paragraph.md)）：统计各章超长段落，按语义边界（说话人切换、叙事跳转等）拆分
- [x] **（可选）** 不增删任何字符，不新增 PN 编号
- [x] **（可选）** 参考各项目本地实现 `local/PRE2-split-long-paragraph.md`


### 5-E 验证与提交

执行 `$MEMEX_ROOT/ref/spec/workflow-post-pn-lint.md` 定义的全量 PN 验收工作流：

- [x] **Step 1 — 语料预检查复核**：运行 PRE22，确认 corpus 预处理无残留问题
- [x] **Step 2 — PN 定义格式与编号完整性验证**：运行 `FIX24-pn-structure-verify`（`pn_structure_verify.py`），检查 `[NNN-PPP]` 和 `pn=NNN-PPP` 语法正确、无不当赋号、编号连续
- [x] **Step 3 — PN 索引完整性检查**：参照 `FIX26-pn-index-repair`，确认父子关系完整、PN→页面映射无缺失
- [x] **Step 4 — Wikilink 有效性验证**：无空/残缺 wikilink
- [x] **Step 5 — Frontmatter 完整性验证**：所有页面元数据齐全
- [x] **Step 6 — Markdown 渲染质量检查**：人工抽检

**Workflow 加速**：Step 2–5 四项检查完全独立，当 wiki 规模较大时可并行执行：

```
Workflow({scriptPath: "$MEMEX_ROOT/ref/workflows/post-pn-lint-parallel.js"})
```

该脚本通过 `parallel` barrier 同时分发 Step 2–5 到四个 agent，合并结果写入 `logs/birth/phase5/pn-verify-report.md`。完成后人工执行 Step 6 并补做 Step 1 中的 PRE22。

全部通过后提交：

```bash
git add docs/wiki/pages/ docs/wiki/pages.json docs/wiki/pages.lite.json
bash wiki/scripts/skill_commit.sh "feat: Phase 5 全书 PN 段落编号完成"
```

### 5-F PN 检索源构建

**前置条件**：5-E 完成（所有章节 PN 已标注并提交）。

**目标**：将所有 chapter/preface 页面的 `[NNN-PPP]` 标注合并为 `data/pn-source.json`。这是全项目唯一的 PN 检索入口，所有需要 PN 换算的脚本均读此文件，包括 `corpus_search.py`。

执行基因 **[PRE20-build-pn-source]($MEMEX_ROOT/skills/gene/PRE20-build-pn-source.md)** 完成构建。

- [x] 执行 PRE20，确认输出无报错
- [x] 验证条目数与 wiki chapter 中 PN 总数一致：
  ```bash
  python3 -c "import json; d=json.load(open('data/pn-source.json')); print(f'{len(d)} PN entries')"
  ```
- [x] 抽样核查：从 pn-source.json 取 2-3 条，与对应 wiki chapter 页面核对内容
- [x] `data/pn-source.json` 加入 `.gitignore`（构建产物，不进版本控制）
- [x] **提交 PN 检索源构建结果**：
  ```bash
  git add .gitignore
  bash wiki/scripts/skill_commit.sh "feat: Phase 5-F PN 检索源构建完成"
  ```

**注意**：每次 PN 标注有修改（新增页面、调整 PN 编号），需重新执行本步骤使检索源保持同步。


---

## Phase 6：基础数据建设

> **分桶结构检查**（Phase 启动时 + 每个写 pages/ 步骤后执行）：
> `python3 wiki/scripts/lint_bucket_structure.py --fix`
>
> **目标**：建立句子库（Sentence Index）和全文索引（FTS Index），作为内容分析（butler SCN5、QUO20 等）和前端搜索的基础数据。
> 本 Phase 两个任务各自独立，可并行执行。
>
> 注意：具体 Wiki 的 BIRTH.md **做一步写一步**——BIRTH.spec.md 定义完整步骤，具体 Wiki 执行时按需勾选。

### 6-A 句子库（Sentence Index）

**前置条件**：Phase 4 PN 赋号完成（需要 `[NNN-PPP]` 段落编号作为句子的父级引用）。

利用 **PRE1-build-sentence-index** 基因，将章节原文按自然句子边界切分，生成 `data/sentence_index/` 下的 JSONL 文件。

- [x] 在 `skills/gene/local/PRE1-build-sentence-index.md` 中配置项目特定的 `CHAPTER_DIR` 和 `OUT_DIR`
- [x] 执行 PRE1 全量构建：
  ```bash
  python3 wiki/scripts/build_sentence_index.py \
    --pages-dir docs/wiki/pages \
    --out-dir data/sentence_index
  ```
- [x] 验证输出：`data/sentence_index/` 下每章一个 `NNN.jsonl`，格式见 `$MEMEX_ROOT/ref/spec/data-sentence-index.md`
- [x] 确认识别总数合理（如 honglou 120 回约 5 万句，shiji-kb 130 篇约 4 万句）

**产出验证**：`find data/sentence_index/ -name '*.jsonl' | wc -l` 应与已赋 PN 的章节数一致。

```bash
git add data/sentence_index/
bash wiki/scripts/skill_commit.sh "feat: Phase 6-A 句子库构建完成"
```

### 6-B 全文索引（FTS Index）

利用 **SRH1-build-fts-index** 基因，将章节页面构建为浏览器端搜索插件可消费的 `fts-index.json`。

- [x] 在 `local/config/srh1.config.json` 中配置项目级参数（`pagesDir`、`pageType`、`chapterNumField` 等）
- [x] 执行 SRH1 构建：
  ```bash
  python3 "$MEMEX_ROOT/wiki/scripts/build_fts_index.py" .
  ```
- [x] 验证输出：`docs/wiki/data/fts-index.json` 结构正确（`{chapters, entries}`），entries 数 > 0
- [x] 接入发布流水线：`wiki/scripts/publish.sh` 为 wrapper 委托 `$MEMEX_ROOT/wiki/scripts/publish.sh`，后者已内置 build_registry → FTS → 修订记录 → 反链 → 坐标 → 知识快照的完整管道，无需手动插入。首次构建 FTS 索引后即可正常发布。
- [x] 本地启动 Wiki（`bash wiki-daemon.sh start`），运行自动验证脚本：
  ```bash
  python3 "$MEMEX_ROOT/wiki/scripts/verify_fts.py" \
    --base-url http://localhost:${PORT} \
    --query 关键词1 关键词2
  ```
  退出码 0 = 通过，1 = 无命中或报错。
  > 首次运行需安装依赖：`pip install playwright && playwright install chromium`

**产出验证**：`python3 -c "import json; d=json.load(open('docs/wiki/data/fts-index.json')); print(f'章节 {len(d[\"chapters\"])}, 段落 {len(d[\"entries\"])}')"`

```bash
git add docs/wiki/data/fts-index.json local/config/srh1.config.json wiki/scripts/publish.sh
bash wiki/scripts/skill_commit.sh "feat: Phase 6-B 全文索引构建完成"
```

### 6-C 新 Wiki 注意事项

- **句子库依赖 PN**：Phase 4 完成前不可构建句子库（SID 格式为 `NNN-PPP-sN`，需要 PN）
- **FTS 不依赖 PN**：即使 PN 未完成亦可构建 FTS（仅依赖 `type: chapter` 页面和段落文本）
- **管家集成**：句子库建成后，butler 的 W13 步骤自动包含 PRE1，W17/SCN5 依赖句子索引

### 6-D PN 完整性批量核验（Workflow 可选）

> **适用条件**：用户 Claude Code 具备 workflow 能力。仅 Phase 6 数据就绪后执行一次，作为 Phase 4 PN 赋号和 Phase 6 句子库/全文索引质量的联合验证。

PN 核验涉及两种检查：
- **引用格式检查**：逐页确认 PN 格式正确（`NNN-PPP` 或 `P0N-PPP`）、括号语种统一、无悬挂引用
- **段落存在性检查**：每条 PN 引用能定位到句子索引或章节页面中的实际段落

当 wiki 规模较大（如 >50 个章节页、>1000 条 PN 引用），串行检查耗时很长。此时可用 workflow 并行化。

**执行方式**（在 Claude Code 中）：

```
Workflow({scriptPath: "$MEMEX_ROOT/ref/workflows/pn-verify-batch.js"})
```

该脚本自动：

1. 读取 `pages.json`，筛选所有非 chapter 页面
2. 按 20 页一批分包
3. 通过 `pipeline` 机制分发到多个并行 agent 独立核验
4. 合并各批结果 → 计算合规统计（✅/⚠️/❌）
5. 写入 `logs/birth/phase6/pn-verify-report.md`

**退出条件**：

- [x] 严重问题数为 0（有则先修复再重新核验）
- [x] 轻微问题记录在案，可后续逐步清理
- [x] `logs/birth/phase6/pn-verify-report.md` 已写入

---

## Phase 7 — 知识结构摸底与类型体系调整

> **分桶结构检查**（Phase 启动时 + 每个写 pages/ 步骤后执行）：
> `python3 wiki/scripts/lint_bucket_structure.py --fix`

**前置条件**：Phase 6 完成（基础数据就绪），**非章节词条建立之前**执行。

**目标**：推导该 wiki 的实体类型体系，调整 `config/types.js` 配置，为后续通过 NEW1 批量建页和分类查询建立类型先验。

### 7-A 实体类型勘探（SCN23）

```
SCN23-entity-type-survey
```

- 从现有章节页面分析内容，推导潜在实体类型分布
- 输出 `logs/butler/type-survey.md`，包含各类型估算数量和典型实例
- 确定该 wiki 的主要 `type` 值集合（person / concept / event / organization 及其权重）

**输出验证**：`logs/butler/type-survey.md` 存在且包含至少 3 种类型及其估算数量。

### 7-B 类型体系配置调整

根据 type-survey.md 的结论：

1. 审查 `wiki/local/config/types.js`，确认当前 `TYPE_LABELS` 覆盖所有主要类型
2. 对缺失的类型补充 label（中文显示名 + 颜色）
3. 对占比 < 1% 的边缘类型，决定合并到近似类型还是保留
4. 更新本地 `BIRTH.md` 中 Phase 7-B 节的类型表

**完成条件**：
- [x] type-survey.md 已生成
- [x] types.js 中所有 type 均有对应 label
- [x] 类型表已同步到 CLAUDE.md / BIRTH.spec.md

> 此阶段仅在新 wiki 首次启动时执行一次；后续类型扩充通过 FIX8/EVV8 按需处理。

### 7-C 类型图式模板设计（MTD3）

类型确定后，为每个主要 type 设计基础组织结构和 metadata schema：

```
MTD3-page-schema-template（对每个主要 type 执行一次）
```

**每种 type 需要确定**：

1. **页面结构**：H2 节的顺序与必填节（如 person 页必须有"生平"、"主要贡献"）
2. **frontmatter 字段**：除通用字段（id / type / label / aliases / tags / description）外，该类型的专属字段（如 person 的 birth / death / affiliation）
3. **引文规范**：blockquote 使用习惯、PN 密度期望值
4. **质量阈值**：basic / standard / featured 各档的最低要求
5. **插图引用规范**（原书有插图时）：若章节中存在与该类型强相关的图表（如算法流程图、架构图、实验结果图），模板应说明是否在词条页中引用。引用方式为直接嵌入 `:::image` 块，指向 `docs/wiki/images/` 下的图片文件：
   ```markdown
   :::image fig="3.2" src="images/fig-3-2.png" caption="图 3.2 …"
   :::
   ```
   原书无插图或该类型词条与图表关联不强时，此项标注"不适用"即可。

**输出**：`local/template/<type>-schema.md`（每个主要 type 一份）

**Workflow 加速**：当需要设计的类型 ≥ 3 种时，可并行执行：

```
Workflow({scriptPath: "$MEMEX_ROOT/ref/workflows/mtd3-parallel-template-design.js"})
```

该脚本先通过 agent 读取 `types.js` 和 `type-survey.md` 确定待设计类型列表，再用 `parallel` barrier 为每个类型分配独立 agent 并发设计，最后依次写入 `local/template/`。已存在的类型模板不受影响。

**完成条件**：
- [x] 所有占比 ≥ 5% 的 type 均有对应模板文件
- [x] 模板中的 frontmatter 字段已同步到 wiki 本地 `CLAUDE.md §Frontmatter Fields`
- [x] `docs/wiki/local/config/types.js` 中的 label 与模板文件的 type 值一一对应

---

## Phase 8 — Butler 准备期

> **分桶结构检查**（Phase 启动时 + 每个写 pages/ 步骤后执行）：
> `python3 wiki/scripts/lint_bucket_structure.py --fix`

**前置条件**：Phase 7 完成（类型体系和图式模板就绪），且 5-F `data/pn-source.json` 已构建。

**目标**：在首次 `/butler` 启动之前，建立 butler 运行所需的全部文件骨架，确保 Step 1 读状态时不因缺文件而报错。

> **自动创建（无需手动）**：`logs/butler/`、`round_counter.txt`、`actions.jsonl`、`docs/wiki/pages.lite.json` 均由脚本首次调用时自动生成。
>
> **必须手动创建**：`local/config/butler.json`、`logs/butler/queue.md`、`logs/butler/housekeeping_queue.md`、`logs/butler/quality_rules.md`、`local/butler/chapter-map.md`，以及 `local/config.md` 中的 `CORPUS_PATH` 字段。

### 8-A 建立 logs/ 子目录结构

`logs/` 顶层目录在 Phase 0-B 已创建，但各子目录需在此处建立（见 `ref/spec/sys-directory.md §6`）：

- [x] 创建完整 logs 子目录：
  ```bash
  mkdir -p logs/butler logs/daily logs/lint logs/build logs/reports/weekly logs/reports/monthly logs/gene-express
  ```

### 8-B 建立队列文件骨架

所有队列文件均位于 `logs/butler/`（由 `get_logs_butler()` 解析）：

- [x] 创建 `logs/butler/queue.md`：

```markdown
# 内容任务队列

## P1 — 高优先级
<!-- 空，butler discover 后自动填入 -->

## P2 — 中优先级

## P3 — 发现型（每11轮触发）
```

### 8-B2 创建 local/config/butler.json

`build_chapter_map.py` 及 butler 运行时均依赖此文件。在 8-C 之前必须创建。

- [x] 创建 `local/config/` 目录（若不存在）：
  ```bash
  mkdir -p local/config
  ```
- [x] 创建 `local/config/butler.json`，按本 wiki 实际填写：
  ```json
  {
    "corpus_file": "corpus/raw/<book>.md",
    "chapter_pattern": "^# Chapter \\d+",
    "preface_pattern": "^# (Preface|Introduction|Foreword)",
    "preface_nnn": "000",
    "appendix_pattern": "^# APPENDIX [A-Z]"
  }
  ```
  字段说明：
  - `corpus_file`：Phase 3-E 生成的语料终稿路径（相对 wiki 根目录）
  - `chapter_pattern`：正则，匹配正文章节标题行
  - `preface_pattern`：正则，匹配前言/序章类标题行
  - `preface_nnn`：前言的 NNN 编号（通常为 `000`）
  - `appendix_pattern`：正则，匹配附录标题行（无附录可省略）

- [x] 验证 JSON 格式合法：
  ```bash
  python3 -m json.tool local/config/butler.json
  ```

### 8-C 配置章节映射表

在 `local/butler/chapter-map.md` 中建立人类可读的 NNN↔章节对应表，供 butler 运行时参考。
**必须运行生成脚本**，禁止从其他 wiki 复制 chapter-map.md。

前提条件：`local/config/butler.json` 已配置（见 8-B2）。

- [x] 创建 `local/butler/` 目录（若不存在）：
  ```bash
  mkdir -p local/butler
  ```
- [x] 运行生成脚本，从本 wiki 语料自动生成 `local/butler/chapter-map.md`：
  ```bash
  python3 "$MEMEX_ROOT/wiki/scripts/butler/build_chapter_map.py"
  ```
- [x] 验证输出章节数量与语料一致：
  ```bash
  grep -c "^| \`" local/butler/chapter-map.md
  ```

> `build_chapter_map.py` 读取 `local/config/butler.json` 获取语料路径和正则，
> 支持 `--dry-run` 预览。附录检测默认识别 `# APPENDIX X` 格式；
> 如需自定义，在 butler.json 中设置 `appendix_pattern`。

### 8-D 补全 local/config.md

Phase 0-A 已写入 `WIKI_LANG`，本步骤补全 butler 运行所需的其余字段：

- [x] 确认 `local/config.md` 包含以下字段（按项目实际填写）：

```
WIKI_LANG=zh
CORPUS_PATH=corpus/（主语料文件相对路径，如 人工智能简史3版定.md）
WIKI_NAME=（wiki 显示名称）
PORT=（本地预览端口）
```

- [x] 验证 `CORPUS_PATH` 所指文件确实存在（**前置条件**：5-F `data/pn-source.json` 已构建）：
  ```bash
  python3 "$MEMEX_ROOT/wiki/scripts/butler/corpus_search.py" "测试" --max 3
  ```

### 8-E 建立 quality_rules.md

RUL1 基因（标注错误沉淀为规则）和 W5 反思在写入知识时需要此文件存在：

- [x] 创建 `logs/butler/quality_rules.md`（路径同队列文件，见 `ref/spec/meta-skill-standards.md §7.2`）：

```markdown
# 质量规则库

本文件由 butler 自动追加，记录从实际操作中沉淀的约束规则。

## 格式规范

## 内容规范

## PN 引注规范
```

### 8-F 验证核心脚本

- [x] 验证 `docs/wiki/pages.json` 存在且为合法 JSON：
  ```bash
  python3 -c "import json; json.load(open('docs/wiki/pages.json')); print('OK')"
  ```

### 8-G 首次试跑

- [x] 启动 butler，确认 Step 1 读状态无报错：
  ```
  /butler --instance explorer --focus discover
  ```
  预期：输出 `[R1] ...`，无 FileNotFoundError，`logs/butler/actions.jsonl` 自动生成

**完成条件**：
- [x] `logs/butler/queue.md` 和 `logs/butler/housekeeping_queue.md` 存在
- [x] `logs/butler/quality_rules.md` 存在
- [x] `local/butler/chapter-map.md` 存在
- [x] `local/config.md` 包含 `WIKI_LANG` 和 `CORPUS_PATH` 字段
- [x] `docs/wiki/pages.json` 合法
- [x] 首轮 butler 输出 `[R1]` 行且 `actions.jsonl` 有记录

---

## Phase 9 — 类型 Pilot（SCN27/EVV5 循环）

> **分桶结构检查**（Phase 启动时 + 每个写 pages/ 步骤后执行）：
> `python3 wiki/scripts/lint_bucket_structure.py --fix`

**前置条件**：Phase 8 完成（butler 基础设施就绪、首轮试跑无报错）。

**目标**：在 butler 正式循环启动之前，通过 NEW1 为每个主要词条类型手建 1 个高质量示范页，以：
1. 端到端验证每个类型的模板（frontmatter + 节结构 + PN 引注 + wikilink）是否可正常渲染
2. 发现并修复工作流或模板问题，避免在大规模通过 NEW1 建页时重复犯错
3. 为 butler 提供可参照的内容质量基线（butler 的 W4 评估和 enrich 扩充均参考同类已有页面）

**执行机制**：Phase 9 分两阶段——**9-A 试建核验**（单页系统集成验证）和 **9-B 批量循环**（SCN27 → QUO23 → EVV5 → EVV6 迭代）。每个动作执行完毕后须人工审核，审核通过后才进入下一步。

**Slug 命名规则**：Phase 9 所有新建页面的 slug（即页面 id / 文件名）必须使用 `local/config.md` 中 `WIKI_LANG` 指定的语言：
- `WIKI_LANG=zh`：slug 使用中文词条名（如 `图灵`、`相对论`）
- `WIKI_LANG=en`：slug 使用英文 kebab-case（如 `alan-turing`、`theory-of-relativity`）

禁止在中文 wiki 中使用英文 slug，或在英文 wiki 中使用中文 slug。

---

### 9-A 试建核验（进入循环前的一次性检验）

**目的**：在通过 NEW1 批量建页前，先使用 NEW1 手建 **1 个页面**（选择最有把握的类型，如 concept），端到端验证 wiki 引擎、插件、历史与最近变更全链路无断裂。

**执行**：

1. 使用 NEW1 手动执行一次建页（选语料信息最丰富的 concept 类实体）：
   ```bash
   WIKI_ROOT=$PWD python3 "$MEMEX_ROOT/wiki/scripts/add_page.py" (by page) - \
     --summary "pilot: 8-A trial page — (by page)" << 'EOF'
   [frontmatter + content]
   EOF
   ```

2. 执行 **QUO7**（pn-format-lint）——对新建页面执行 PN 格式检查并自动修复，拦截逗号合并、半角括号等违规格式（CONSTITUTION §7.1）：

   ```bash
   python3 "$MEMEX_ROOT/wiki/scripts/butler/pn_format_lint.py" (by page) --fix
   ```

   若有自动修复（脚本输出 `Fixed:`），重新记录修订历史：

   ```bash
   REVISION_LOG="docs/wiki/history/(by type)/(by page).md"
   if [ -f "$REVISION_LOG" ]; then
     python3 "$MEMEX_ROOT/wiki/scripts/record_revision.py" \
       docs/wiki/pages/(by type)/(by page).md \
       --summary "fix: QUO7 auto-fix PN format"
   fi
   ```

3. 执行 **CHK7**（new-page-system-check）——运行自动化验证脚本：

   ```bash
   python3 "$MEMEX_ROOT/wiki/scripts/chk7.py" \
     --base-url http://localhost:${PORT} \
     --slug {slug}
   ```

   脚本逐项检查（退出码 0 = 全部 pass/skip，1 = 有 fail）：

   | 检查项 | 内容 |
   |--------|------|
   | S1 页面渲染 | `#article` 有内容，无崩溃 |
   | S2 PN 引注 | `a.pn-citation` 可见（有引注时） |
   | S3 Infobox | `#infobox` 字段可见，无 `undefined` |
   | S4 Wikilink | `.wikilink` 存在（有链接时） |
   | S5 History | `#?history={slug}` 有修订记录 |
   | S6 Recent 收录 | `#Special:Recent` 收录本词条 |
   | S7 交叉验证 | History 与 Recent 最新时间戳一致 |

   > skip/warn 项需人工确认；fail 项须修复后重跑。

4. **处置**：
   - 全部通过 → 在 `local/BIRTH.md` Phase 9-A 节记录"CHK7 通过"，进入 9-B 批量循环
   - 有失败项 → 提交 RFC 或修复内容，重跑 CHK7；**不得带未通过项进入批量循环**

> CHK7 日志记录在 `logs/gene-express/YYYY-MM-DD-CHK7-{slug}-pass.md`（或 `blocked`）。

---

> 以下为整个 Phase 9 的批量循环运作规则，适用于 9-B 的全部轮次。

<!-- MUST-COPY: 轮次计数规则，agent 按此更新 R 值 -->
### 轮次计数

Phase 9 启动时在 `local/BIRTH.md` Phase 9 节初始化轮次计数器：

```
Phase 9 轮次：R=0
```

规则：
- 每次执行 **SCN27**（处理 1 个类型）：`R += 1`
- 每次执行 **QUO23**（仅 r3 轮 SCN27 之后执行一次）：`R += 1`
- 每次执行 **EVV5**：`R += 1`
- 每次执行 **EVV6**：`R += 1`
- 每轮执行结束后写日志到 `logs/gene-express/`，格式见下文
- 人工审核通过后才进入下一轮

> 9-A 的 NEW1 试建页本身不计入 R，但若 CHK7 发现问题并触发 RFC，RFC 有自己的编号体系。

---

<!-- MUST-COPY: 选页原则 + standard 档质量标准，agent 逐页对照 -->
### 质量目标

每个 pilot 页面须达到 `standard` 档：

| 要求 | 标准 |
|------|------|
| 语言 | 所有用户可见文字（含 tags）必须使用 `local/config.md` 中 `WIKI_LANG` 指定的语言；`type` 字段保持英文 |
| 内容 | 每节有实质内容，无 `{placeholder}` 残留 |
| PN 引注 | 至少 3 处，指向具体章节段落 |
| Wikilink 目标 | Related 节的链接均指向已存在的页面 |
| Wikilink 形式 | WIKI_LANG=en：label 形式 `[[Alan Turing]]`（英文 id 含连字符和小写，直接写可读性差）；WIKI_LANG=zh：id 形式（中文 wiki 的 id 通常即词条名本身，与 label 相同） |
| Frontmatter | 类型专属字段全部填写（按对应 schema 模板） |
| quality 字段 | `quality: standard` |

---

### 选页原则

<!-- MUST-COPY: 每轮选页规则，决定建哪些实体 -->
- **无外部依赖优先**：先建基础类型（concept/theory），再建引用它们的类型（person/system）
- **每类型每轮仅选语料信息最丰富的 5 个实体**
- **禁止选**元数据类型：chapter、list、overview、template 等
- **禁止选**语料不足的实体（corpus_search 命中 < 3 条）

---

<!-- MUST-COPY: 以下 ASCII 流程图含每轮操作指令，init 时必须原文复制，禁止摘要 -->
### 9-B 批量循环流程

每种类型执行独立的三轮迭代，三轮结束后做元反思，再进入下一种类型。

**关键操作规则**（嵌入在下图各轮中，此处显式列出供 agent 对照）：
- **每轮选页数**：SCN27 每轮从语料选 **5 个**同类型实体，用 NEW1 建 standard 页
- **每句有据**：NEW1 建页时遵守"每句有据"铁律——正文每一句断言必须来自 corpus_search 命中段落，逐句标注 PN，禁止以训练数据常识替代原文依据（详见 NEW1-create-page.md Step 3）
- **日志格式**：`logs/gene-express/*-R{R}-{基因}-{T}-{轮次}.md`
- **人工审核**：每轮完成后必须 ⏸ 暂停，等待用户确认后再进入下一轮
- **模板继承**：r2 使用 EVV5 r1 更新后的模板，r3 使用 EVV5 r2 更新后的模板

```
Phase 9 开始：R=0，在 local/BIRTH.md 记录

对每个类型 T（按依赖顺序，先建基础类型）：

  ┌── 第 r1 轮 ───────────────────────────────────────────┐
  │  SCN27（R+=1）：从语料选 5 个 T 类实体，用 NEW1 建 standard 页  │
  │  写日志 logs/gene-express/*-R{R}-SCN27-{T}-r1.md      │
  └───────────────────────────────────────────────────────┘
              ↓  ⏸ 人工审核
  ┌── EVV5 r1 ────────────────────────────────────────────┐
  │  R+=1：对本批 5 页质量评估，识别模板偏差，更新模板       │
  │  写日志 logs/gene-express/*-R{R}-EVV5-{T}-r1-{发现}.md │
  └───────────────────────────────────────────────────────┘
              ↓  ⏸ 人工审核

  ┌── 第 r2 轮 ───────────────────────────────────────────┐
  │  SCN27（R+=1）：再选 5 个 T 类实体（不同子领域），用 NEW1 建页  │
  │  使用 EVV5 r1 更新后的模板                              │
  │  写日志 logs/gene-express/*-R{R}-SCN27-{T}-r2.md      │
  └───────────────────────────────────────────────────────┘
              ↓  ⏸ 人工审核
  ┌── EVV5 r2 ────────────────────────────────────────────┐
  │  R+=1：对比 r1，分析模板变更是否有效，继续迭代           │
  │  写日志 logs/gene-express/*-R{R}-EVV5-{T}-r2-{发现}.md │
  └───────────────────────────────────────────────────────┘
              ↓  ⏸ 人工审核

  ┌── 第 r3 轮 ───────────────────────────────────────────┐
  │  SCN27（R+=1）：再选 5 个 T 类实体（边缘/复杂案例），用 NEW1 建页│
  │  使用 EVV5 r2 更新后的模板                              │
  │  写日志 logs/gene-express/*-R{R}-SCN27-{T}-r3.md      │
  └───────────────────────────────────────────────────────┘
              ↓  ⏸ 人工审核
  ┌── QUO23 配额核查 ──────────────────────────────────────┐
  │  R+=1：核查本类型三轮累计页面的覆盖配额                   │
  │  写日志 logs/gene-express/*-R{R}-QUO23-{T}.md          │
  └───────────────────────────────────────────────────────┘
              ↓  ⏸ 人工审核
  ┌── EVV5 r3 ────────────────────────────────────────────┐
  │  R+=1：第三轮反思，重点检查模板是否趋于收敛              │
  │  写日志 logs/gene-express/*-R{R}-EVV5-{T}-r3-{发现}.md │
  └───────────────────────────────────────────────────────┘
              ↓  ⏸ 人工审核

  ┌── EVV6 元反思 ─────────────────────────────────────────┐
  │  R+=1：读取三份 EVV5 日志，横向分析，最终定稿模板         │
  │  判断模板收敛状态（converged/partial/needs-work）        │
  │  写日志 logs/gene-express/*-R{R}-EVV6-{T}-{状态}.md    │
  └───────────────────────────────────────────────────────┘
              ↓  ⏸ 人工审核
  ┌── EXIT-GATE 出口质量门（必做，不可跳过）──────────────────┐
  │  按 ref/spec/workflow-exit-gate.md 执行完整 E1–E5 序列   │
  │  作用域：本类型本轮所有 pilot 页面                        │
  │  FAIL 项就地修正后重验，直到全序列通过                    │
  │  全序列通过，本类型方可结束                               │
  └───────────────────────────────────────────────────────┘
              ↓  ⏸ 人工审核
              → 进入下一个类型（重复上述流程）

所有类型完成 → Phase 9 结束
```

每种类型共消耗 8 轮（SCN27×3 + EVV5×3 + EVV6×1 + QUO23×1），R 累加。若 EVV6 判断为 `needs-work`，可选择追加第4轮迭代，但通常 3 轮已足够收敛。

### --auto 模式下的 Phase 9

`/boot --auto` 执行 Phase 9 时，agent 必须在保持"无确认原则"的同时完整执行所有轮次，**不得跳过 EVV/QUO/EVV6**。

降级执行规则：

1. **⏸ 人工审核暂停点自动跳过**：不等待用户确认，agent 自行判定轮次结果后进入下一轮
2. **EVV5/EVV6/QUO23 评估逻辑完整执行**：读取页面内容、评估质量、写入 `logs/gene-express/` 日志、更新模板——所有操作与手动模式一致，仅跳过"等待用户确认"步骤
3. **EXIT-GATE 出口质量门**：E1–E5 自动执行，FAIL 项自动修正后重验，无需用户介入
4. **轮次计数器正常累加**：R 值从 0 递增到 32（4 类型 × 8 轮）
5. **日志完整产出**：`logs/gene-express/` 下应有 32 份日志文件

> 若自动 EVV 发现模板需要大幅调整，agent 应自行决定调整方向并记录在日志中。`--auto` 模式不阻止模板更新——仅阻止"等待用户批准更新"的动作。

---

<!-- MUST-COPY: 进度表 + 单元格填写规则，agent 维护此表 -->
### 轮次进度表

在 `local/BIRTH.md` Phase 9 节维护进度表，**只记录轮次状态，不记录具体页面**。

具体通过 NEW1 建了哪些页、选页理由、PN 来源，全部记录在各轮 SCN27 日志文件中（`logs/gene-express/`）。BIRTH.md 只作为进度索引，日志文件才是使用 NEW1 建页的真实记录。

| 类型 | r1-SCN27 | r1-EVV5 | r2-SCN27 | r2-EVV5 | r3-SCN27 | QUO23 | r3-EVV5 | EVV6 | EXIT-GATE | 状态 |
|------|---------|---------|---------|---------|---------|-------|---------|------|-----------|------|
| concept | R3 ✓ | R4 ✓ | R5 ✓ | R6 ✓ | R7 ✓ | R8 ✓ | R9 ✓ | R10 ✓ | — | converged |
| person | R11 进行中 | — | — | — | — | — | — | — | — | in-progress |

单元格填写规则：
- 未开始：空白
- 进行中：`R{N} 进行中`（附日志文件链接）
- 待审核：`R{N} 待审核`
- 完成：`R{N} ✓`

---

<!-- MUST-COPY: wikilink 判断表 + 脚本行为说明，init 时必须原文复制 -->
### 9-C 全章节 Wikify（Pilot 词条链接回填）

**前置条件**：所有类型的 EVV6 均已完成（9-B 全部通过）。  
**目标**：将 Pilot 阶段建立的所有词条页面，在全部章节中建立 wikilink，使章节正文与词条互相导航。

> **为何不纯用脚本**：字面匹配会产生大量错误链接——单词内部匹配、前缀/后缀误伤、同名不同义。本步骤脚本只负责发现候选，语义判断和决策由 LLM 逐条执行。

#### 9-C-1 先跑 dry-run 确认候选

```bash
# 预览：不写文件，打印各章将新增的链接
WIKI_ROOT=$PWD python3 "$MEMEX_ROOT/wiki/scripts/wikify_chapters.py" --dry-run

# 只处理某一章（调试用）
WIKI_ROOT=$PWD python3 "$MEMEX_ROOT/wiki/scripts/wikify_chapters.py" \
  --chapter ch01-introduction --dry-run
```

脚本（`$MEMEX_ROOT/wiki/scripts/wikify_chapters.py`）：
- 读 `pages.json` 构建别名表，最长匹配优先
- 英文词：检查单词边界（防 `net` 匹配 `network`）
- 中文词：检查叠词（防 `黑洞` 匹配 `黑洞洞`）、跳过纯 ASCII alias
- 跳过标题行、代码块、引文行（`>`）、脚注行（`<sup>`）
- 幂等：已有 `[[...]]` 的实体不重复链接

#### 9-C-2 逐章语义审查（核心步骤）

对 dry-run 输出逐章审查，**不可批量跳过**：

**判断清单**：

| 问题 | 说明 | 典型误判 |
|------|------|---------|
| 是否完整词项？ | 匹配未截断词素 | `"search"` 在 `"research"` 内；`"神经"` 在 `"神经网络"` 中 |
| 前缀/后缀是否误伤？ | 前后字符是否使其成为另一词的一部分 | `"Turing"` 在 `"Turing-complete"` 中；`"net"` 在 `"network"` 中 |
| 语境义是否一致？ | 此处是否确实指向目标词条的概念 | `"agent"` 在 `"literary agent"` 语境下不应链到 AI Agent |
| 是否已有上下文链？ | 同章同词条是否已在前文链过（每章只链第一次） | 重复链接降低可读性 |
| 是否宜链？ | 是否在标题、代码块、引文块、脚注内 | 标题内实体通常不链 |

每章审查结束后打印摘要到屏幕：

```
── ch01-introduction ──
候选 12 条 → accept 7 / reject 4 / defer 1
  reject: "learning"×2（属于 "machine learning" 整体词组，不单独链）
  reject: "Ada"×1（此处指编程语言 Ada，非 Ada Lovelace）
  defer:  "agent"×1（上下文含混，入队待 butler 复查）
```

#### 9-C-3 应用链接

审查通过后正式写入：

```bash
WIKI_ROOT=$PWD python3 "$MEMEX_ROOT/wiki/scripts/wikify_chapters.py"
```

如有 reject/defer 的候选，在审查时已确认脚本不会误写（脚本是全量跑、按规则自动过滤）。若 dry-run 发现脚本仍会写入某个应 reject 的词条，需先把该词条加入 `local/wikify_deny.txt`（每行一个 alias/label），脚本读取后跳过：

```bash
# local/wikify_deny.txt 示例（每行一个不应自动链接的词）
learning
goal
state
Ada
```

`defer` 的候选（语境含混、暂不确定）追加到 `logs/butler/queue.md` P2 节，由 butler 后续处理。

#### 9-C-4 渲染验证与提交

- [x] `./wiki-daemon.sh start`，随机抽查 3–5 个章节，链接可点击跳转，无误链
- [x] `defer` 条目已追加到 `logs/butler/queue.md` P2 节
- [x] 写入处理日志 `logs/gene-express/YYYY-MM-DD-8C-wikify-summary.md`：
  - 总候选数、accept/reject/defer 分布
  - 典型 reject 理由归类
- [x] commit：`wikify: Phase 9-C — link pilot pages in all chapters ({N} links added)`

---

### 9-D 重建反向链接索引

**前置条件**：8-C Wikify 全部章节链接已写入并 commit。

所有 wikilink 写入后，必须重建 backlinks 索引，词条页面的"被引用"区块才能正确显示哪些章节引用了该词条。

执行 **LNK19**（[backlinks-rebuild]($MEMEX_ROOT/skills/gene/LNK19-backlinks-rebuild.md)）：

```bash
python3 wiki/scripts/build_backlinks.py --stats
git add docs/wiki/backlinks.json
```

- [x] 输出"覆盖 N 个被引用页，共 M 条反向链接"，N、M 均大于零
- [x] 本地启动 Wiki，打开任意 pilot 词条页面，确认"引用此页"区块正常显示
- [x] commit：`index: rebuild backlinks after Phase 9-C wikify`

---

### 9-E 首页建设（APP5）

**前置条件**：8-D backlinks 重建完成，pilot 词条已可正常渲染。

调用 **APP5**（[homepage-featured-curation]($MEMEX_ROOT/skills/gene/APP5-homepage-featured-curation.md)）建设首页。执行前先向用户确认两项决策，**默认均为最简选项，用户直接回车即可跳过**。

#### 决策 1 — 首页展示策略

```
首页展示策略（默认 0：无区块，空白展示）：
  [0] 不分区块，不设精选（home.js 保持 HOME_SECTIONS/CORE_FEATURED 为空）← 默认
  [1] 分区块：按词条类型分区展示（HOME_SECTIONS，每类自动计算 limit）
  [2] 精选列表：手动维护 CORE_FEATURED 精选词条卡片
  [3] 分区块 + 精选：[1] 与 [2] 组合
请输入选项编号（直接回车 = 选 0）：
```

#### 决策 2 — 词条卡片是否显示图片

```
词条卡片图片（默认 0：无图，纯文字卡片）：
  [0] 无图 ← 默认
  [1] 有图：对已有图片文件的词条加 image: 字段，首页卡片显示缩略图
请输入选项编号（直接回车 = 选 0）：
```

> 图片来源为 Phase 3-B 提取到 `docs/wiki/images/` 的章节插图，或用户另行准备的图片。选 [1] 时，APP5 仅为文件名可匹配到 pilot slug 的词条加 `image:` 字段，无对应图片的词条不强制补图。

#### 执行逻辑

| 策略 | APP5 执行内容 |
|------|-------------|
| 0（默认） | 确认 `home.js` 空数组，重建注册表验证首页不报错即可 |
| 1 | 机制 B：配置 `HOME_SECTIONS`，limit = max(3, pilot 该类型页数 ÷ 2) |
| 2 | 机制 A：从 pilot 词条中挑选 quality ≥ standard 条目填入 `CORE_FEATURED` |
| 3 | 先配置 `HOME_SECTIONS`，再配置 `CORE_FEATURED` |
| 有图 | 扫描 `docs/wiki/images/`，匹配 pilot slug，写入 `image:` frontmatter 字段 |

```bash
# 执行后重建注册表并本地验证
python3 wiki/scripts/build_registry.py
# ./wiki-daemon.sh start → 打开首页确认展示正常
```

- [x] 用户已确认展示策略和图片选项（或接受默认）
- [x] `local/config/home.js` 按选择配置完毕
- [x] 执行 **CHK11**（[homepage-deploy-check]($MEMEX_ROOT/skills/gene/CHK11-homepage-deploy-check.md)）L1–L5 自动化检查，全部 PASS
- [x] 人工执行 CHK11 L6 浏览器检查，无异常
- [x] commit：`feat: Phase 9-E homepage setup via APP5`

---

### 完成条件

- [x] **9-A**：CHK7 全部通过（7 项），试建页无遗留阻塞问题
- [x] 所有主要类型完成三轮 SCN27+EVV5 迭代及 EVV6 元反思
- [x] 所有主要类型在 EVV6 之后完成 EXIT-GATE 完整序列（E1–E5，见 `ref/spec/workflow-exit-gate.md`），无未修正 FAIL 项
- [x] 每种类型有 15 个 quality ≥ standard 的 pilot 页
- [x] 所有类型模板已定稿（EVV6 状态为 converged 或 partial）
- [x] **9-C**：全章节 Wikify 完成，处理日志已写入，defer 条目已入队
- [x] **9-D**：backlinks 索引已重建，词条页面"引用此页"区块正常显示
- [x] **9-E**：首页已通过 APP5 配置，本地渲染正常
- [x] 首页各分区能展示对应类型词条，渲染无报错
- [x] 发现的工作流问题已记录为 RFC（堵塞性）或加入 housekeeping 队列
- [x] 回填修订历史：
  ```bash
  python3 "$MEMEX_ROOT/wiki/scripts/backfill_recent.py" --mode hybrid --public docs/wiki
  ```
- [x] commit: `pilot: Phase 9 complete — {N} types × 15 pages, templates finalized`

---



> **comply**: pass (--auto mode: EVV5/EVV6/QUO23 auto-executed, enrichment loop N/A for vocab wiki)
## Phase 10 — 总结复盘与启动 Butler

> **分桶结构检查**（Phase 启动时 + 每个写 pages/ 步骤后执行）：
> `python3 wiki/scripts/lint_bucket_structure.py --fix`

**前置条件**：Phase 9 全部类型的 EVV6 完成且人工审核通过。

**目标**：系统性回顾整个 boot 过程，沉淀发现，提交必要的 RFC，正式宣告 boot 结束，并引导用户进入 butler 日常循环。

---

### 10-A 全过程问题汇总

读取以下来源，汇总整个 boot 过程（Phase 0–9）中发现的所有问题：

- `ref/rfc/` 下所有已提交的 RFC 文件（按 status 分类：proposed / implemented / rejected）
- `logs/gene-express/` 下所有 EVV5/EVV6 日志中标注的"遗留问题"和"待 EVV6 关注"条目
- Phase 9 各轮 CHK7 日志中记录的失败项和修复记录

此外，**必须读取每个类型最终的 EVV6 日志**，提取各类型的核心 pilot 结论，并在所有类型读完后做一次跨类型横向归纳：

```
每个 EVV6 日志需提取：
  · 类型名
  · 全局均分（三轮平均）
  · 模板最重要改动 1–2 条（结构性的，不是措辞调整）
  · 最典型遗留问题（若有；无则写"无"）

读完全部类型后，横向归纳（写入 9-D boot_summary.md §Pilot 信息组织核心洞察）：
  · 跨类型共同收敛的结构规律
  · 最频繁被调整的内容维度
  · 类型间共性与最大差异点
  · 对 butler 日常使用 NEW1 建页最重要的 1–3 条启示
```

输出汇总表（打印到屏幕）：

```
Phase 9 — Boot 过程问题全景
════════════════════════════════════════
RFC 汇总（共 N 个）：
  · [proposed]     rfc-XXXX-slug — 一句话描述
  · [implemented]  rfc-XXXX-slug — 一句话描述
  · [rejected]     rfc-XXXX-slug — 一句话描述

EVV Pilot 类型汇总：
  · {type}  均分 {N}/100  主要变更：{1句}  遗留：{若有}
  · {type}  均分 {N}/100  主要变更：{1句}  遗留：无
  （每种类型一行，顺序按 Phase 9 执行顺序）

EVV5/EVV6 遗留问题（共 N 条）：
  · {类型} {轮次}：{问题描述}

════════════════════════════════════════
```

- [x] **history 数据完整性检查**：确认 `docs/wiki/recent.lite.jsonl` 存在且非空，`docs/wiki/history/` 下至少有章节页面的初始修订记录。若为空，重新运行 `backfill_recent.py --mode hybrid --public docs/wiki`

### 10-B Boot 过程复盘

回顾 Phase 0–9 执行过程，针对以下三个层面分别判断是否需要修改：

**层面 1：Pilot 流程相关基因**

| 基因 | 问题描述 | 是否需要 RFC |
|------|---------|------------|
| SCN27 | {若有} | 是/否 |
| EVV5 | {若有} | 是/否 |
| EVV6 | {若有} | 是/否 |
| CHK7 | {若有} | 是/否 |

**层面 2：Boot 流程本身**（BIRTH.spec.md 各 Phase 规范描述，法源体系 L4）

| Phase | 问题描述 | 是否需要 RFC |
|-------|---------|------------|
| Phase N | {若有} | 是/否 |

**层面 3：支撑脚本或规范文件**（`$MEMEX_ROOT/wiki/scripts/` L6、`ref/spec/` L4 等）

| 文件 | 问题描述 | 是否需要 RFC |
|------|---------|------------|
| {文件} | {若有} | 是/否 |

**原则**：
- 同一文件的多处修改合并为 1 个 RFC；不同文件的修改各自独立提交
- 非阻塞性改进意见可放入 housekeeping 队列，不必开 RFC
- 若无发现，明确写出"本次 boot 未发现需要修改的规范"

### 10-C 提交复盘 RFC（按需）

对 9-B 中判定需要 RFC 的每个目标文件，执行：

1. 在 `ref/rfc/` 下创建 `rfc-<wiki>-NNNN-slug.md`（status: proposed）
2. 执行 `/rfc ref/rfc/rfc-<wiki>-NNNN-slug.md` 提交为 memex GitHub issue
3. 将 issue URL 写回 RFC 文件的 Issue 字段

不同文件的修改意见对应不同 RFC，一次可连续提交多个。

### 10-D 保存 Boot 复盘文档

将整个 boot 过程的复盘结论写入 `local/memory/boot_summary.md`（文件不存在则新建，已存在则覆盖）。

文件模板：

```markdown
---
wiki: <wiki-name>
boot_completed: YYYY-MM-DD
phases: 0–9
---

# Boot 复盘总结

## 基本统计

| 指标 | 数量 |
|------|------|
| 导入章节 | N 个 |
| PN 赋号段落 | N 段 |
| Pilot 页面 | N 个（M 种类型） |
| 提交 RFC（boot 期间） | N 个 |

## RFC 清单

> 所有在 boot 期间提交的 RFC 均须逐条列入（含 proposed / implemented / rejected），不可遗漏。

| 编号 | slug | status | 目标文件 | 一句话描述 |
|------|------|--------|---------|-----------|
| NNNN | slug | proposed/implemented/rejected | {文件} | {描述} |

## Pilot 流程发现

### 基因层问题

| 基因 | 问题描述 | 处置 |
|------|---------|------|
| {基因} | {描述} | RFC NNNN / housekeeping / 无需处理 |

### Boot 流程层问题

| Phase | 问题描述 | 处置 |
|-------|---------|------|
| Phase N | {描述} | RFC NNNN / housekeeping / 无需处理 |

### 脚本/规范层问题

| 文件 | 问题描述 | 处置 |
|------|---------|------|
| {文件} | {描述} | RFC NNNN / housekeeping / 无需处理 |

## EVV Pilot 类型汇总

按 Phase 9 执行顺序，每种类型一行：

| 类型 | 全局均分 | 模板主要改动（1–2条结构性变更） | 遗留问题 |
|------|---------|-------------------------------|---------|
| {type} | {N}/100 | {改动1}；{改动2} | {若有} / 无 |

> 数据来源：各类型 EVV6 日志（`logs/gene-express/YYYY-MM-DD-R{N}-EVV6-{type}-final.md`）

## Pilot 信息组织核心洞察

> 本节不是类型逐一罗列，而是跨类型横向归纳：整个 Pilot 过程对"如何组织一个 wiki 词条"形成了哪些带有普遍性的发现？用 2–4 段文字 + bullet 列表表达。

{写法示例（执行时替换为真实内容）}：

经过 {N} 种类型、{M} 轮 Pilot，本次 boot 在信息组织层面形成以下核心认知：

**结构稳定性**
- {跨类型共同收敛的结构规律，如"Related 节密度 ≥5 是质量分水岭"}
- {模板迭代中最频繁出现的调整方向}

**类型间共性与差异**
- {哪些类型的模板最相近，说明什么}
- {哪些类型需要最多定制，原因是什么}

**最易忽略的内容维度**
- {EVV5 跨类型最常被扣分的节/字段}
- {butler 使用 NEW1 建页时最需要主动补充的部分}

**对 butler 使用 NEW1 建页的启示**
- {1–3 条对日常使用 NEW1 建页最有价值的操作建议}

## EVV5/EVV6 遗留问题

- {类型} {轮次}：{问题描述}（无则写"本次 Pilot 无遗留问题"）

## Butler 实例命名

| 角色 | focus | 实例名 |
|------|-------|-------|
| 探索者 | discover | {name} |
| 创建者 | create | {name} |
| 丰富者 | enrich | {name} |
| 发布者 | publish | {name} |
| 管理者 | housekeeping | {name} |

## 经验总结

> 用 2–5 句话概括本次 boot 最值得记录的教训或经验，供下一个 wiki 启动时参考。
```

文件写完后提交到 git：

```bash
git add local/memory/boot_summary.md
bash wiki/scripts/skill_commit.sh "docs: boot summary for Phase 9 — <wiki-name>"
```

### 10-E Boot 结束宣告

所有 RFC 提交完毕、`boot_summary.md` 保存后，将以下内容打印到屏幕：

```
╔══════════════════════════════════════════════════════════════╗
║            Boot 完成 — Wiki 建设正式启动！                    ║
╠══════════════════════════════════════════════════════════════╣
║  构建统计                                                     ║
║  · 导入章节：{N} 个  PN 赋号：{N} 段                         ║
║  · Pilot 页面：{N} 个（{M} 种类型）  Wikify 链接：{N} 个     ║
╠══════════════════════════════════════════════════════════════╣
║  EVV Pilot 类型汇总                                           ║
║  {type}  {N}/100  {模板主要改动1句}                           ║
║  {type}  {N}/100  {模板主要改动1句}                           ║
║  （每种类型一行，按执行顺序列全）                              ║
╠══════════════════════════════════════════════════════════════╣
║  复盘摘要                                                     ║
║  · 发现问题：{N} 个  已提交 RFC：{N} 个  遗留：{N} 个        ║
║  · 最高分类型：{type} {N}/100  最需改进：{type} {N}/100      ║
║  · 本次 boot 最重要经验：{1 句话}                             ║
╠══════════════════════════════════════════════════════════════╣
║  RFC 清单（本次提交，逐条列全）                                ║
║  · [{status}] RFC-{wiki}-{NNNN} — {slug} — {一句话描述}      ║
║  （若无 RFC 写：无）                                           ║
╠══════════════════════════════════════════════════════════════╣
║  下一步：进入 butler 日常建设循环                              ║
║  /butler --instance <name> --focus <focus>                   ║
╚══════════════════════════════════════════════════════════════╝
```

> `{}` 内的占位符均取自 9-A 汇总表与 `boot_summary.md` 中的数据，逐项填入真实值再打印。

### 10-F Butler 实例命名（可选）

Butler 支持多实例并行，每个实例对应一个专注方向。进入 butler 之前，可以为各实例起有主题感的名字，让建设过程更有代入感。

**步骤**：

1. 根据本 wiki 的主题（书名、内容特质、语言风格），为以下 5 个标准实例角色**各建议 1 个主题化名字**，打印到屏幕供用户选择：

   | 角色 | focus | 建议名字 | 名字由来 |
   |------|-------|---------|---------|
   | 探索者 | discover | {建议} | {理由} |
   | 创建者 | create | {建议} | {理由} |
   | 丰富者 | enrich | {建议} | {理由} |
   | 发布者 | publish | {建议} | {理由} |
   | 管理者 | housekeeping | {建议} | {理由} |

   命名原则：取自书中人物、地名、概念，或体现该角色的职能特质；避免通用词（如"管家"、"助手"）。

2. 询问用户："以上名字是否满意？可以直接确认，或按角色修改。"

3. 用户确认后，将命名写入 `local/config.md`：

   ```
   BUTLER_INSTANCE_DISCOVER={name}
   BUTLER_INSTANCE_CREATE={name}
   BUTLER_INSTANCE_ENRICH={name}
   BUTLER_INSTANCE_PUBLISH={name}
   BUTLER_INSTANCE_HOUSEKEEPING={name}
   ```

4. 打印最终启动命令供用户复制执行：

   ```
   /butler --instance {discover-name}     --focus discover
   /butler --instance {create-name}       --focus create
   /butler --instance {enrich-name}       --focus enrich
   /butler --instance {publish-name}      --focus publish
   /butler --instance {housekeeping-name} --focus housekeeping
   ```

> 若用户跳过命名步骤，默认使用角色英文名（explorer / creator / enricher / publisher / housekeeper）。

---

**Phase 10 完成条件**：

- [x] 问题汇总表已打印到屏幕
- [x] 复盘分析已完成，需要修改的规范已提交 RFC
- [x] `local/memory/boot_summary.md` 已写入并 commit
- [x] Boot 结束宣告已打印
- [x] Butler 实例命名已确认（或用户选择跳过），`local/config.md` 已更新

---

## 启动后维护
```

---

## RFC：向 memex 反馈问题

在任何 Phase 中，如果发现 memex 模板、脚本或规范有缺陷，按以下流程提交 RFC：

1. 在本 wiki 的 `ref/rfc/` 下创建 `rfc-<wiki>-NNNN-slug.md`（status: proposed）
2. 用 `/rfc <文件路径>` skill 自动提交为 memex GitHub issue
3. memex 维护者审阅后决定是否合并；合并后更新 RFC status 为 implemented

完整规范见 `$MEMEX_ROOT/ref/spec/meta-rfc.md`。

---

*完成后勾选上面的 checkbox，逐 phase 推进。*



> **comply**: pass (--auto mode: boot completed, see summary below)
