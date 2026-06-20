// 通用系统变量，任何 wiki 项目可复用，不含项目专属信息。
// 函数签名：(core, ctx) => value
//   core — wiki core 对象（含 registry、siteName 等）
//   ctx  — 当前页上下文 { pid, meta, front }（页面级变量使用）

const MONTH_NAMES_ZH = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];

function countByType(core, type) {
  return Object.values(core.registry.pages).filter(p => p.type === type).length;
}

export const DEFAULT_VARIABLES = {
  // 统计
  pageCount:      (core)       => core.registry.page_count ?? Object.keys(core.registry.pages).length,
  articleCount:   (core)       => Object.values(core.registry.pages).filter(p => p.quality && p.quality !== 'stub').length,
  imageCount:     (core)       => Object.values(core.registry.pages).filter(p => p.image).length,
  personCount:    (core)       => countByType(core, 'person'),
  conceptCount:   (core)       => countByType(core, 'concept'),
  referenceCount: (core)       => countByType(core, 'reference'),

  // 站点
  siteTitle:      (core)       => core.siteName,
  lastUpdated:    (core)       => (core.registry.generated || '').slice(0, 10),

  // 日期
  currentYear:    ()           => new Date().getFullYear(),
  currentMonth:   ()           => String(new Date().getMonth() + 1).padStart(2, '0'),
  currentMonthName: ()         => MONTH_NAMES_ZH[new Date().getMonth()] + '月',
  currentDay:     ()           => new Date().getDate(),

  // 页面（依赖 ctx）
  PAGENAME:       (_c, ctx)    => ctx?.pid ?? '',
  PAGELABEL:      (_c, ctx)    => ctx?.front?.label ?? ctx?.meta?.label ?? ctx?.pid ?? '',
  PAGETYPE:       (_c, ctx)    => ctx?.front?.type  ?? ctx?.meta?.type  ?? '',
};
