/**
 * i18n/strings.js — UI 字符串翻译表
 *
 * 结构：{ [key]: { zh: '...', en: '...', ja: '...' } }
 *
 * 新増语言：在每个条目中增加对应语言代码，并将语言代码加入 SUPPORTED_LANGS。
 * 新增字符串：在 STRINGS 中增加新 key，同时填写所有已支持语言的翻译。
 * 漏掉某语言的 key 时，降级到 DEFAULT_LANG；DEFAULT_LANG 也缺失则返回 key 本身。
 */

export const SUPPORTED_LANGS = ['zh', 'en', 'ja'];
export const DEFAULT_LANG = 'en';

export const STRINGS = {

  // ── 通用 ──────────────────────────────────────────────────────────────────
  loading:           { zh: '载入中…',             en: 'Loading…',                ja: '読み込み中…' },
  not_found:         { zh: '未找到',               en: 'Not Found',               ja: '見つかりません' },
  error:             { zh: '加载失败',             en: 'Load failed',             ja: '読み込み失敗' },
  no_results:        { zh: '无匹配结果',           en: 'No results',              ja: '結果なし' },
  copy_ok:           { zh: '✓ 已复制',             en: '✓ Copied',                ja: '✓ コピー済み' },

  // ── 导航 / topnav ─────────────────────────────────────────────────────────
  home:              { zh: '首页',                 en: 'Home',                    ja: 'ホーム' },
  all_pages:         { zh: '所有页面',             en: 'All Pages',               ja: '全ページ' },
  special_pages:     { zh: '特殊页面',             en: 'Special Pages',           ja: '特別ページ' },
  random:            { zh: '随机页面',             en: 'Random Page',             ja: 'ランダムページ' },
  recent:            { zh: '最近修订',             en: 'Recent Changes',          ja: '最近の更新' },
  about:             { zh: '关于',                 en: 'About',                   ja: 'について' },
  settings:          { zh: '设置',                 en: 'Settings',                ja: '設定' },
  feedback:          { zh: '反馈',                 en: 'Feedback',                ja: 'フィードバック' },

  // ── 页面操作 ──────────────────────────────────────────────────────────────
  source:            { zh: '查看源码',             en: 'View Source',             ja: 'ソースを表示' },
  history:           { zh: '修订历史',             en: 'History',                 ja: '履歴' },
  redirect_to:       { zh: '重定向至',             en: 'Redirect to',             ja: 'リダイレクト先' },

  // ── 质量标签 ──────────────────────────────────────────────────────────────
  quality_stub:      { zh: '存根',                 en: 'Stub',                    ja: 'スタブ' },
  quality_basic:     { zh: '基础',                 en: 'Basic',                   ja: '基本' },
  quality_standard:  { zh: '标准',                 en: 'Standard',                ja: '標準' },
  quality_featured:  { zh: '精品',                 en: 'Featured',                ja: '優良' },
  quality_premium:   { zh: '旗舰',                 en: 'Premium',                 ja: '最優良' },

  // ── 侧边栏 / infobox ──────────────────────────────────────────────────────
  tags:              { zh: '标签',                 en: 'Tags',                    ja: 'タグ' },
  type:              { zh: '类型',                 en: 'Type',                    ja: '種類' },
  see_also:          { zh: '参见',                 en: 'See Also',                ja: '関連項目' },
  referenced_by:     { zh: '被以下页面引用',       en: 'Referenced by',           ja: '参照元ページ' },

  // ── 分类 / 浏览 ───────────────────────────────────────────────────────────
  filter_initial:    { zh: '按拼音首字母过滤',     en: 'Filter by first letter',  ja: '頭文字で絞り込む' },
  no_pages_in_cat:   { zh: '此分类下暂无页面。',   en: 'No pages in this category.', ja: 'このカテゴリにはページがありません。' },
  type_filter:       { zh: '类型',                 en: 'Type',                    ja: '種類' },
  tag_filter:        { zh: '标签',                 en: 'Tag',                     ja: 'タグ' },

  // ── 修订历史 ──────────────────────────────────────────────────────────────
  no_revisions:      { zh: '暂无修订记录。',       en: 'No revision history.',    ja: '編集履歴がありません。' },
  latest_badge:      { zh: '最新',                 en: 'Latest',                  ja: '最新' },
  first_version:     { zh: '首个版本（无上一版），全部显示为新增', en: 'First version (no previous), all shown as added', ja: '初版（前版なし）、すべて追加として表示' },

  // ── 搜索 ──────────────────────────────────────────────────────────────────
  search_placeholder:     { zh: '搜索页面名称或别名…',  en: 'Search pages or aliases…',  ja: 'ページ名または別名で検索…' },
  search_placeholder_fts: { zh: '全文检索…',            en: 'Full-text search…',          ja: '全文検索…' },
  fts_toggle:             { zh: '全文检索',              en: 'Full-text search',           ja: '全文検索' },

  // ── 特殊页面标题 ──────────────────────────────────────────────────────────
  special_all:        { zh: '所有页面',             en: 'All Pages',               ja: '全ページ' },
  special_recent:     { zh: '最近修订记录',         en: 'Recent Changes',          ja: '最近の更新一覧' },
  special_statistics: { zh: '统计 (Statistics)',    en: 'Statistics',              ja: '統計' },
  special_plugins:    { zh: '已安装插件列表',       en: 'Installed Plugins',       ja: 'インストール済みプラグイン' },
  special_settings:   { zh: '用户设置',             en: 'User Settings',           ja: 'ユーザー設定' },
  special_sem_hist:   { zh: '语义历史',             en: 'Semantic History',        ja: 'セマンティック履歴' },

  // ── 设置面板 ──────────────────────────────────────────────────────────────
  auto_wikilink:     { zh: '自动链接',              en: 'Auto-wikilink',           ja: '自動リンク' },
  lang_label:        { zh: '语言',                  en: 'Language',                ja: '言語' },
  lang_zh:           { zh: '中文',                  en: '中文',                    ja: '中文' },
  lang_en:           { zh: 'English',               en: 'English',                 ja: 'English' },
  lang_ja:           { zh: '日语',                  en: 'Japanese',                ja: '日本語' },

  // ── want-button ───────────────────────────────────────────────────────────
  want_button:       { zh: '⭐ 想要此页面',         en: '⭐ Want this page',        ja: '⭐ このページが欲しい' },
  want_queued:       { zh: '✅ 已加入队列',         en: '✅ Added to queue',        ja: '✅ キューに追加済み' },
  want_failed:       { zh: '❌ 提交失败',           en: '❌ Submission failed',     ja: '❌ 送信失敗' },
  want_submitting:   { zh: '提交中…',               en: 'Submitting…',             ja: '送信中…' },
  want_exists:       { zh: '已在队列中',            en: 'Already queued',          ja: 'すでにキューにあります' },
  want_title:        { zh: '标记此页面待改进',      en: 'Mark for improvement',    ja: '改善候補としてマーク' },

  // ── 地图 ──────────────────────────────────────────────────────────────────
  map_zoom:          { zh: '点击放大',              en: 'Click to enlarge',        ja: 'クリックして拡大' },
  no_coord:          { zh: '无可用坐标数据',        en: 'No coordinate data available', ja: '座標データがありません' },
  map_missing_coords:{ zh: '坐标缺失',              en: 'Missing coordinates',     ja: '座標が不明' },
  map_iframe_title:  { zh: '地图',                  en: 'Map',                     ja: '地図' },

  // ── 页面状态 ──────────────────────────────────────────────────────────────
  page_not_found:     { zh: '页面不存在',           en: 'Page Not Found',          ja: 'ページが見つかりません' },
  page_not_found_msg: { zh: '未找到页面 %s。',      en: 'Page %s not found.',      ja: 'ページ %s が見つかりません。' },
  back_to_home:       { zh: '回到首页',             en: 'Back to Home',            ja: 'ホームへ戻る' },
  broken_links:       { zh: '断链',                 en: 'Broken links',            ja: '壊れたリンク' },
  wl_unresolved:      { zh: '未解析',               en: 'Unresolved',              ja: '未解決' },
  source_file:        { zh: '源文件',               en: 'Source file',             ja: 'ソースファイル' },
  route_error:        { zh: '路由错误',             en: 'Routing error',           ja: 'ルーティングエラー' },

  // ── special 页面标签 ──────────────────────────────────────────────────────
  sp_recent:          { zh: '最近修订',             en: 'Recent Changes',          ja: '最近の更新' },
  sp_all_pages:       { zh: '所有页面',             en: 'All Pages',               ja: '全ページ' },
  sp_statistics:      { zh: '统计',                 en: 'Statistics',              ja: '統計' },
  sp_settings:        { zh: '设置',                 en: 'Settings',                ja: '設定' },
  sp_plugins:         { zh: '插件列表',             en: 'Installed Plugins',       ja: 'プラグイン一覧' },
  sp_all:             { zh: '所有特殊页面',         en: 'All Special Pages',       ja: '全特別ページ' },
  sp_random:          { zh: '随机页',               en: 'Random Page',             ja: 'ランダムページ' },
  sp_variables:       { zh: '模板变量',             en: 'Template Variables',      ja: 'テンプレート変数' },
  sp_sem_hist:        { zh: '语义历史',             en: 'Semantic History',        ja: 'セマンティック履歴' },

  // ── 统计页 ────────────────────────────────────────────────────────────────
  stat_current_k:        { zh: '当前 K 值',           en: 'Current K Score',          ja: '現在の K スコア' },
  stat_total_pages:      { zh: '总页数',              en: 'Total Pages',              ja: '総ページ数' },
  stat_premium_pages:    { zh: '旗舰页',              en: 'Premium Pages',            ja: '最優良ページ' },
  stat_link_hit_rate:    { zh: '链接命中率',          en: 'Link Hit Rate',            ja: 'リンク命中率' },
  stat_k_chart:          { zh: 'K 值增长曲线',        en: 'K Score Growth',           ja: 'K スコア推移' },
  stat_premium_chart:    { zh: '旗舰页增长',          en: 'Premium Page Growth',      ja: '最優良ページ推移' },
  stat_quality_time:     { zh: '质量分布随时间变化',  en: 'Quality Distribution Over Time', ja: '品質分布の推移' },
  stat_quality_current:  { zh: '当前质量分布',        en: 'Current Quality Distribution', ja: '現在の品質分布' },
  stat_top10:            { zh: 'Top 10 页面',         en: 'Top 10 Pages',             ja: 'トップ 10 ページ' },
  stat_no_data:          { zh: '（暂无历史数据）',    en: 'No historical data yet',   ja: '（履歴データなし）' },
  stat_no_premium_data:  { zh: '（暂无旗舰页历史数据）', en: 'No premium page history yet', ja: '（最優良ページの履歴データなし）' },
  stat_formula_title:    { zh: 'K 值公式定义',        en: 'K-Score Formula',          ja: 'K スコアの計算式' },
  stat_design_goals:     { zh: '设计目标',            en: 'Design Goals',             ja: '設計目標' },
  stat_always_on:        { zh: '始终启用',            en: 'always enabled',           ja: '常時有効' },
  stat_col_var:          { zh: '变量',                en: 'Variable',                 ja: '変数' },
  stat_col_meaning:      { zh: '含义',                en: 'Meaning',                  ja: '意味' },
  stat_col_level:        { zh: '级别',                en: 'Level',                    ja: '等級' },
  stat_col_count:        { zh: '数量',                en: 'Count',                    ja: '数' },
  stat_col_ratio:        { zh: '占比',                en: 'Ratio',                    ja: '割合' },
  stat_col_dist:         { zh: '分布',                en: 'Distribution',             ja: '分布' },
  stat_note_excl:        { zh: 'Special 系统页本身不计入 K。', en: 'Special system pages are not counted in K.', ja: 'Special システムページは K に含まれません。' },
  stat_k_chart_desc:     { zh: '每次提交后计算的知识量总分。K 值越高，代表知识库的信息密度与覆盖深度越大。单次跳跃通常对应批量新增页面；平缓上升对应现有页面的深化扩写。', en: 'Total knowledge score calculated after each commit. A higher K score indicates greater information density and depth. Single jumps correspond to bulk page additions; gradual rises reflect deepening of existing pages.', ja: '各コミット後に計算される知識量の総スコア。K が高いほど情報密度と網羅深度が大きい。急上昇は一括追加、緩やかな上昇は既存ページの深化に対応します。' },
  stat_premium_chart_desc: { zh: '旗舰页（premium）是通过 compute_quality.py 自动评定的最高质量词条，满足：有图 + ≥5节 + 散文≥1000字 + (PN≥10 或引文≥10 或散文≥2500)。旗舰页数量增长反映了知识库的深化进度。', en: 'Premium pages are the highest-quality entries assessed by compute_quality.py, meeting: has image + ≥5 sections + prose ≥1000 chars + (PN≥10 or citations≥10 or prose≥2500). Growth reflects knowledge base maturity.', ja: '最優良ページ（premium）は compute_quality.py で自動評定された最高品質の項目。条件：画像あり + 5節以上 + 散文≥1000字 + (PN≥10 または引用≥10 または散文≥2500)。増加数は知識ベースの成熟度を示します。' },
  stat_premium_chart_warn: { zh: '曲线中的下降并不代表内容缩水，而是因为评定标准提高（如门槛字数或 PN 要求上调），导致部分页面从旗舰降为精品，待持续扩写后将重新升级。', en: 'Drops in the curve do not indicate content reduction; they reflect raised evaluation criteria (e.g., higher word or PN thresholds), causing some pages to be downgraded from premium to featured until further expanded.', ja: 'グラフの下降は内容の減少ではなく、評定基準の引き上げ（字数や PN 要件の向上）により一部ページが最優良から優良に降格したためです。追記後に再昇格します。' },
  stat_quality_chart_desc: { zh: '各质量级别页面数量随时间的堆叠变化。数据从引入五级质量体系起积累。', en: 'Stacked change in page count per quality level over time. Data accumulated since the five-tier quality system was introduced.', ja: '各品質等級のページ数の推移（積み上げ）。5段階品質体系導入以降のデータ。' },
  stat_quality_table_desc: { zh: '五级质量体系由 compute_quality.py 自动评定。只有 premium 旗舰页可出现在首页。', en: 'The five-tier quality system is automatically assessed by compute_quality.py. Only premium pages appear on the home page.', ja: '5段階品質体系は compute_quality.py で自動評定されます。最優良（premium）のみホームページに表示されます。' },
  stat_k_axis:           { zh: 'K 值',               en: 'K Score',                  ja: 'K スコア' },
  stat_date_axis:        { zh: '提交日期',            en: 'Commit date',              ja: 'コミット日' },
  stat_premium_axis:     { zh: '旗舰页数',            en: 'Premium pages',            ja: '最優良ページ数' },
  stat_goal_depth:       { zh: '反映知识深度，而非单纯字数——链接密度奖励内联结构', en: 'Reflects knowledge depth, not just word count — link density rewards inline structure', ja: '知識の深さを反映し、単なる文字数ではない — リンク密度が内部構造を評価' },
  stat_goal_nodump:      { zh: '防止刷字数——log₂ 压缩使扩张收益递减',           en: 'Prevents padding — log₂ compression yields diminishing returns on expansion',       ja: '水増しを防ぐ — log₂ 圧縮により拡張の利得が逓減' },
  stat_goal_quality:     { zh: '区分内容质量——Q 乘子激励高质量页面',             en: 'Distinguishes content quality — Q multiplier incentivizes high-quality pages',      ja: 'コンテンツ品質を区別する — Q 乗数が高品質ページを奨励' },
  stat_goal_chapter:     { zh: '章节存根不淹没实体页——章节权重 0.4 刻意压缩',   en: 'Chapter stubs don\'t overshadow entity pages — chapter weight 0.4 is intentionally reduced', ja: '章節スタブが実体ページを圧迫しない — 章節重み 0.4 は意図的に抑えられている' },
  stat_var_b_meaning:    { zh: '页面字节数',          en: 'Page byte count',          ja: 'ページバイト数' },
  stat_var_b_note:       { zh: '去除 frontmatter 后 UTF-8 字节数', en: 'UTF-8 bytes after frontmatter removal', ja: 'frontmatter 除去後の UTF-8 バイト数' },
  stat_var_d_meaning:    { zh: '链接密度（封顶 5.0）', en: 'Link density (cap 5.0)',  ja: 'リンク密度（上限 5.0）' },
  stat_var_d_note:       { zh: 'wikilink 数 / (B/1000)', en: 'wikilink count / (B/1000)', ja: 'wikilink 数 / (B/1000)' },
  stat_var_w_meaning:    { zh: '类型权重',            en: 'Type weight',              ja: 'タイプ重み' },
  stat_var_w_note:       { zh: 'person/event/place=1.0 · topic=0.8 · chapter=0.4', en: 'person/event/place=1.0 · topic=0.8 · chapter=0.4', ja: 'person/event/place=1.0 · topic=0.8 · chapter=0.4' },
  stat_var_q_meaning:    { zh: '质量分（0–90）',      en: 'Quality score (0–90)',     ja: '品質スコア（0–90）' },
  stat_var_q_note:       { zh: '归一化为 Q∈[1, 3]', en: 'Normalized to Q∈[1, 3]',  ja: 'Q∈[1, 3] に正規化' },

  // ── 插件列表页 ────────────────────────────────────────────────────────────
  plugin_core_title:    { zh: '核心插件',            en: 'Core Plugins',            ja: 'コアプラグイン' },
  plugin_core_badge:    { zh: '🔒 核心',             en: '🔒 Core',                 ja: '🔒 コア' },
  plugin_enabled_badge: { zh: '✅ 已启用',           en: '✅ Enabled',               ja: '✅ 有効' },
  plugin_optional_title:{ zh: '可选插件',            en: 'Optional Plugins',        ja: 'オプションプラグイン' },
  plugin_col_plugin:    { zh: '插件',                en: 'Plugin',                  ja: 'プラグイン' },
  plugin_col_id:        { zh: 'ID',                  en: 'ID',                      ja: 'ID' },
  plugin_col_status:    { zh: '状态',                en: 'Status',                  ja: '状態' },
  plugin_col_desc:      { zh: '说明',                en: 'Description',             ja: '説明' },

  // ── Special:All 列表头 ────────────────────────────────────────────────────
  sp_col_id:            { zh: '页面 ID',             en: 'Page ID',                 ja: 'ページ ID' },
  sp_col_title:         { zh: '标题',                en: 'Title',                   ja: 'タイトル' },
  sp_col_desc:          { zh: '说明',                en: 'Description',             ja: '説明' },

  // ── Settings 页 ───────────────────────────────────────────────────────────
  settings_note:        { zh: '所有插件默认启用，无需手动配置。', en: 'All plugins are enabled by default.', ja: 'すべてのプラグインはデフォルトで有効です。' },
  settings_special:     { zh: '特殊页面',            en: 'Special Pages',           ja: '特別ページ' },

  // ── timezone plugin ───────────────────────────────────────────────────────
  tz_settings_title:    { zh: '时区',                en: 'Timezone',                ja: 'タイムゾーン' },
  tz_settings_label:    { zh: '本地时区',            en: 'Local timezone',          ja: 'ローカルタイムゾーン' },
  tz_settings_hint:     { zh: '更改后立即生效。显示所有时间时将使用此时区。', en: 'Takes effect immediately. All timestamps will use this timezone.', ja: '即座に反映されます。すべての時刻表示にこのタイムゾーンが使用されます。' },

  // ── 首页 ──────────────────────────────────────────────────────────────────
  home_more_recent:     { zh: '更多修订记录 →',      en: 'More recent changes →',   ja: 'さらに表示 →' },
  home_random:          { zh: '随机词条 →',          en: 'Random entry →',          ja: 'ランダム →' },
  hero_entries:         { zh: '词条',                en: 'entries',                 ja: '項目' },

  // ── 知识量面板（k-panel）──────────────────────────────────────────────────
  kpanel_pages:         { zh: '页',                  en: 'pages',                   ja: 'ページ' },
  kpanel_premium:       { zh: '旗舰',                en: 'premium',                 ja: '最優良' },
  kpanel_link_hit:      { zh: '链接命中',            en: 'link hit',                ja: 'リンク命中' },
  kpanel_top:           { zh: 'TOP',                 en: 'TOP',                     ja: 'TOP' },
  kpanel_snapshot:      { zh: '快照',                en: 'Snapshot',                ja: 'スナップショット' },

  // ── 修订历史列表列头 ──────────────────────────────────────────────────────
  rc_col_time:          { zh: '时间',                en: 'Time',                    ja: '日時' },
  rc_col_page:          { zh: '页面',                en: 'Page',                    ja: 'ページ' },
  rc_col_author:        { zh: '作者',                en: 'Author',                  ja: '編集者' },
  rc_col_size:          { zh: '大小',                en: 'Size',                    ja: 'サイズ' },
  rc_col_summary:       { zh: '摘要',                en: 'Summary',                 ja: '概要' },
  rc_col_revision:      { zh: '修订',                en: 'Revision',                ja: 'リビジョン' },
  rc_col_changes:       { zh: '变化',                en: 'Changes',                 ja: '変更' },
  rc_col_lines:         { zh: '行数',                en: 'Lines',                   ja: '行数' },
  rc_back_home:         { zh: '← 首页',              en: '← Home',                  ja: '← ホーム' },
  rc_prev_page:         { zh: '← 上一页',            en: '← Prev',                  ja: '← 前へ' },
  rc_next_page:         { zh: '下一页 →',            en: 'Next →',                  ja: '次へ →' },
  rc_hist_badge:        { zh: '修订历史',            en: 'Revision History',        ja: '編集履歴' },
  rc_back_to_page:      { zh: '← 返回阅读页',        en: '← Back to article',       ja: '← 記事に戻る' },
  rc_page_num:          { zh: '第 %s/%s 页',         en: 'page %s/%s',              ja: '%s/%s ページ' },
  rc_revisions_summary: { zh: '显示 %s 条修订 · %s 个页面', en: '%s revisions · %s pages', ja: '%s 件の編集 · %s ページ' },
  rc_total_clamp:       { zh: '（共 %s 条，显示最新 %s 条）', en: '(%s total, showing latest %s)', ja: '（全 %s 件、最新 %s 件を表示）' },
  rv_hist_version:      { zh: '历史版本',            en: 'Historical version',      ja: '過去のバージョン' },
  rv_current:           { zh: '→ 当前版本',          en: '→ Current version',       ja: '→ 現在のバージョン' },
  rv_all_revisions:     { zh: '→ 全部修订',          en: '→ All revisions',         ja: '→ 全リビジョン' },
  rv_diff_prev:         { zh: '→ vs 上版 diff',      en: '→ diff vs prev',          ja: '→ 前版との差分' },

  // ── Infobox 固定字段标签 ──────────────────────────────────────────────────
  ib_canonical_name:    { zh: '规范名',              en: 'Canonical Name',          ja: '正式名称' },
  ib_birth_ce:          { zh: '生',                  en: 'Born',                    ja: '生' },
  ib_death_ce:          { zh: '卒',                  en: 'Died',                    ja: '没' },

  // ── 源码查看 ──────────────────────────────────────────────────────────────
  source_badge:         { zh: '源码',                en: 'Source',                  ja: 'ソース' },

  // ── diff 视图 ─────────────────────────────────────────────────────────────
  diff_title:           { zh: '版本差异',            en: 'Diff',                    ja: '差分' },
  diff_all_revisions:   { zh: '全部修订',            en: 'All revisions',           ja: '全リビジョン' },
  diff_view_rev:        { zh: '查看该版',            en: 'View revision',           ja: 'このバージョンを表示' },
  diff_cur_rev:         { zh: '本版',                en: 'Current',                 ja: '現在版' },
  diff_prev_rev:        { zh: '上版',                en: 'Parent',                  ja: '前版' },
  diff_first_version:   { zh: '首个版本（无上版），全部显示为新增', en: 'First version (no parent), all shown as added', ja: '初版（前版なし）、すべて追加として表示' },
  diff_no_summary:      { zh: '（无）',              en: '(none)',                  ja: '（なし）' },

  // ── browse ────────────────────────────────────────────────────────────────
  browse_n_pages:       { zh: '%s 个页面',           en: '%s pages',                ja: '%s ページ' },
  browse_all_types:     { zh: '全部类型',            en: 'All types',               ja: 'すべての種類' },
  browse_all_volumes:   { zh: '全部书册',            en: 'All volumes',             ja: 'すべての巻' },
  browse_quality:       { zh: '内容质量',            en: 'Quality',                 ja: '品質' },
  browse_filter_title:  { zh: '筛选',                en: 'Filter',                  ja: '絞り込み' },
  browse_clear:         { zh: '清除',                en: 'Clear',                   ja: 'クリア' },

  // ── search ────────────────────────────────────────────────────────────────
  search_no_match:      { zh: '没有匹配',            en: 'No match',                ja: '一致なし' },
  search_no_fts_match:  { zh: '原文中没有匹配',      en: 'No match in source',      ja: '本文中に一致なし' },
  search_view_all:      { zh: '查看全部结果 →',      en: 'View all results →',      ja: 'すべての結果を表示 →' },
  chap_preface:         { zh: '前言',                en: 'Preface',                 ja: '序文' },
  chap_first:           { zh: '已是第一章',          en: 'First chapter',           ja: '最初の章です' },
  chap_last:            { zh: '已是最后一章',        en: 'Last chapter',            ja: '最後の章です' },

  // ── semantic-history ─────────────────────────────────────────────────────
  sh_total_note:        { zh: '（共 %s 条）',        en: '(%s total)',              ja: '（合計 %s 件）' },
  sh_date_since:        { zh: '起始日期',            en: 'From date',               ja: '開始日' },
  sh_date_until:        { zh: '截止日期',            en: 'To date',                 ja: '終了日' },
  sh_major:             { zh: '重大',                en: 'Major',                   ja: '大規模' },
  sh_minor:             { zh: '轻微',                en: 'Minor',                   ja: '軽微' },
  sh_no_results:        { zh: '无匹配修订。',        en: 'No matching revisions.',  ja: '一致する編集がありません。' },
  sh_prev_page:         { zh: '← 上页',              en: '← Prev',                  ja: '← 前へ' },
  sh_next_page:         { zh: '下页 →',              en: 'Next →',                  ja: '次へ →' },
  sh_all_types:         { zh: '所有类型',            en: 'All types',               ja: 'すべての種類' },
  sh_all_authors:       { zh: '所有作者',            en: 'All authors',             ja: 'すべての編集者' },
  sh_all_changes:       { zh: '所有变更类型',        en: 'All change types',        ja: 'すべての変更種別' },
  sh_any_scale:         { zh: '任意规模',            en: 'Any scale',               ja: '規模を問わない' },
  sh_filter:            { zh: '过滤',                en: 'Filter',                  ja: '絞り込む' },
  sh_reset:             { zh: '重置',                en: 'Reset',                   ja: 'リセット' },
  sh_col_page:          { zh: '页面',                en: 'Page',                    ja: 'ページ' },
  sh_col_change:        { zh: '变更类型',            en: 'Change Type',             ja: '変更種別' },
  sh_col_delta:         { zh: '大小变化',            en: 'Size Change',             ja: 'サイズ変化' },

  // ── backlinks / misc ──────────────────────────────────────────────────────
  bl_other:             { zh: '其他',                en: 'Other',                   ja: 'その他' },
  bool_yes:             { zh: '是',                  en: 'Yes',                     ja: 'はい' },
  bool_no:              { zh: '否',                  en: 'No',                      ja: 'いいえ' },
  seealso_see:          { zh: '📖 详细参见',         en: '📖 See also',              ja: '📖 関連項目' },
  collapse:             { zh: '折叠',                en: 'Collapse',                ja: '折りたたむ' },
  expand:               { zh: '展开',                en: 'Expand',                  ja: '展開する' },

  // ── 目录 / 首字过滤 ───────────────────────────────────────────────────────
  toc_title:            { zh: '章节目录',            en: 'Contents',                ja: '目次' },
  firstchar_all:        { zh: '全',                  en: 'All',                     ja: '全' },

  // ── 页面类型标签 ──────────────────────────────────────────────────────────
  type_person:       { zh: '人物',   en: 'Person',       ja: '人物' },
  type_organization: { zh: '组织',   en: 'Organization', ja: '組織' },
  type_event:        { zh: '事件',   en: 'Event',        ja: '出来事' },
  type_concept:      { zh: '概念',   en: 'Concept',      ja: '概念' },
  type_chapter:      { zh: '章节',   en: 'Chapter',      ja: '章節' },
  type_overview:     { zh: '概述',   en: 'Overview',     ja: '概要' },
  type_list:         { zh: '列表',   en: 'List',         ja: 'リスト' },
  type_place:        { zh: '地点',   en: 'Place',        ja: '場所' },
  type_work:         { zh: '作品',   en: 'Work',         ja: '作品' },
  type_topic:        { zh: '主题',   en: 'Topic',        ja: 'トピック' },

  // ── export plugin ─────────────────────────────────────────────────────────
  export_button:        { zh: '⬇ 导出',             en: '⬇ Export',                ja: '⬇ エクスポート' },
  export_title:         { zh: '导出页面元数据',      en: 'Export page metadata',     ja: 'ページメタデータをエクスポート' },
  export_json:          { zh: 'JSON',                en: 'JSON',                    ja: 'JSON' },
  export_turtle:        { zh: 'RDF/Turtle',          en: 'RDF/Turtle',              ja: 'RDF/Turtle' },
  export_markdown:      { zh: 'Markdown',            en: 'Markdown',                ja: 'Markdown' },

  // ── 错误 / 系统 ───────────────────────────────────────────────────────────
  error_title:          { zh: '错误',               en: 'Error',                   ja: 'エラー' },

  // ── semantic-query ────────────────────────────────────────────────────────
  sq_n_results:         { zh: '%s 条结果',           en: '%s results',              ja: '%s 件' },
  sq_no_data:           { zh: '数据未加载',          en: 'Data not loaded',         ja: 'データ未読み込み' },
  sq_parse_error:       { zh: 'SQL 解析错误',        en: 'SQL parse error',         ja: 'SQL 解析エラー' },
  sq_exec_error:        { zh: 'SQL 执行错误',        en: 'SQL execution error',     ja: 'SQL 実行エラー' },

  // ── chapter ───────────────────────────────────────────────────────────────
  chap_back_toc:        { zh: '目录',               en: 'Contents',                ja: '目次' },

  // ── semantic-history ─────────────────────────────────────────────────────
  sh_revisions:         { zh: '条修订',             en: 'revisions',               ja: '件の編集' },

  // ── 模板变量页 ────────────────────────────────────────────────────────────
  var_col_name:         { zh: '变量名',              en: 'Variable',                ja: '変数名' },
  var_col_value:        { zh: '当前值',              en: 'Value',                   ja: '現在値' },
  var_col_source:       { zh: '来源',                en: 'Source',                  ja: 'ソース' },
  var_page_level:       { zh: '（页面级）',          en: '(page-level)',            ja: '（ページ単位）' },
  var_eval_failed:      { zh: '（求值失败）',        en: '(failed)',                ja: '（評価失敗）' },
};
