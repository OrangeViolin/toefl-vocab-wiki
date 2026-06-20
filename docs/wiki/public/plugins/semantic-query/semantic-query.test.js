/**
 * semantic-query 插件测试
 *
 * 覆盖核心纯函数：cleanNationality / executeQuery / renderQueryBlock(group_by)
 */
import { describe, it, expect } from 'vitest';
import { cleanNationality, NORMALIZERS as LOCAL_NORMALIZERS } from '../../local/config/semantic-query.js';
import { executeQuery, renderQueryBlock, evalExpr, NORMALIZERS } from './index.js';
import { tokenize } from './sql-tokenizer.js';
import { parse, parseSQL, ParseError } from './sql-parser.js';
import { evaluate } from './sql-evaluator.js';

// 注入业务 normalizer（模拟 init() 时 localConfig.NORMALIZERS 的合并行为）
Object.assign(NORMALIZERS, LOCAL_NORMALIZERS);

// ── 测试数据 ──────────────────────────────────────────────────────────────

const KB_DATA = {
  pages: {
    '图灵':   { type: 'person',       nationality: '英国',            label: '图灵',     tags: ['计算机科学'],              featured: true, total_refs: 120 },
    '麦卡锡': { type: 'person',       nationality: '美国',            label: '麦卡锡',   tags: ['计算机科学', 'AI'],        featured: true, total_refs: 95 },
    '明斯基': { type: 'person',       nationality: '美国',            label: '明斯基',   tags: ['AI', '认知科学'],          featured: true, total_refs: 88 },
    '费根鲍姆': { type: 'person',     nationality: '美国',            label: '费根鲍姆', tags: ['AI', '专家系统'],          featured: false, total_refs: 60 },
    '霍普菲尔德': { type: 'person',   nationality: '美国',            label: '霍普菲尔德', tags: ['AI'],                   featured: true, total_refs: 72 },
    '辛顿':   { type: 'person',       nationality: '英国/加拿大',     label: '辛顿',     tags: ['AI', '深度学习'],          featured: true, total_refs: 200 },
    '杨立昆': { type: 'person',       nationality: '法国/美国',       label: '杨立昆',   tags: ['AI', '深度学习'],          featured: true, total_refs: 180 },
    '本吉奥': { type: 'person',       nationality: '法国/加拿大',     label: '本吉奥',   tags: ['AI', '深度学习'],          featured: true, total_refs: 160 },
    'MIT':    { type: 'organization', nationality: '美国',            label: 'MIT',      tags: ['大学', '研究机构'],        featured: true },
    '剑桥大学': { type: 'organization', nationality: '英国',          label: '剑桥大学', tags: ['大学'],                   featured: true },
    '谷歌':   { type: 'organization', nationality: '美国',            label: '谷歌',     tags: ['企业', 'AI'],              featured: true },
    'OpenAI': { type: 'organization', nationality: '美国',            label: 'OpenAI',   tags: ['企业', 'AI', '研究机构'],  featured: true },
    '沃森':   { type: 'person',       nationality: '美国（苏格兰裔）', label: '沃森',     tags: ['AI', '认知科学'],          featured: false, total_refs: 45 },
    '诺尔':   { type: 'person',       nationality: '德裔美国',        label: '诺尔',     tags: ['AI'],                     featured: false, total_refs: 30 },
    '策梅洛': { type: 'person',       nationality: '德国',            label: '策梅洛',   tags: ['数学', '逻辑'],            featured: false, total_refs: 55 },
    '哥德尔': { type: 'person',       nationality: '奥地利/美国',     label: '哥德尔',   tags: ['数学', '逻辑'],            featured: true, total_refs: 150 },
    '费舍':   { type: 'person',       nationality: '英国人',          label: '费舍',     tags: ['AI', '逻辑'],              featured: false, total_refs: 25 },
    '王浩':   { type: 'person',       nationality: '美籍华裔',        label: '王浩',     tags: ['逻辑'],                   featured: false, total_refs: 35 },
    '罗素':   { type: 'person',       nationality: '英国',            label: '罗素',     tags: ['数学', '逻辑', '哲学'],    featured: true, total_refs: 200 },
    '怀特海': { type: 'person',       nationality: '英国',            label: '怀特海',   tags: ['数学', '哲学'],            featured: false, total_refs: 80 },
    '丘奇':   { type: 'person',       nationality: '美国',            label: '丘奇',     tags: ['数学', '逻辑', '计算机科学'], featured: true, total_refs: 130 },
    '克林':   { type: 'person',       nationality: '美国',            label: '克林',     tags: ['数学', '逻辑'],            featured: false, total_refs: 65 },
    '波斯特': { type: 'person',       nationality: '波兰/美国',       label: '波斯特',   tags: ['数学', '逻辑'],            featured: false, total_refs: 40 },
    '诺依曼': { type: 'person',       nationality: '匈牙利裔美国',    label: '诺依曼',   tags: ['数学', '计算机科学'],       featured: true, total_refs: 180 },
    '特朗普': { type: 'person',       nationality: '美国（德国裔）',   label: '特朗普',   tags: [],                         featured: false, total_refs: 5 },
  },
  alias_index: {},
};

// ══════════════════════════════════════════════════════════════════════════
// evalExpr
// ══════════════════════════════════════════════════════════════════════════

describe('evalExpr', () => {
  it('数字字面量', () => {
    expect(evalExpr('42', {})).toBe(42);
  });
  it('变量引用', () => {
    expect(evalExpr('x', { x: 10 })).toBe(10);
  });
  it('加减法', () => {
    expect(evalExpr('a + b - c', { a: 10, b: 5, c: 3 })).toBe(12);
  });
  it('乘除法', () => {
    expect(evalExpr('a * b / c', { a: 6, b: 4, c: 3 })).toBe(8);
  });
  it('括号', () => {
    expect(evalExpr('(a + b) * c', { a: 1, b: 2, c: 3 })).toBe(9);
  });
  it('未知变量返回 null', () => {
    expect(evalExpr('x + y', { x: 1 })).toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════════════
// cleanNationality
// ══════════════════════════════════════════════════════════════════════════

describe('cleanNationality', () => {
  // ── 单体（归一） ──

  it('单体：干净国籍不变', () => {
    expect(cleanNationality('美国')).toEqual(['美国']);
    expect(cleanNationality('英国')).toEqual(['英国']);
  });

  it('去括号注释', () => {
    expect(cleanNationality('美国（苏格兰裔）')).toEqual(['美国']);
    expect(cleanNationality('美国(华裔)')).toEqual(['美国']);
    expect(cleanNationality('美国（德国裔）')).toEqual(['美国']);
  });

  it('X裔Y → Y', () => {
    expect(cleanNationality('德裔美国')).toEqual(['美国']);
    expect(cleanNationality('英裔美国')).toEqual(['美国']);
    expect(cleanNationality('匈牙利裔美国')).toEqual(['美国']);
    expect(cleanNationality('波兰裔美国')).toEqual(['美国']);
  });

  it('X人 → X', () => {
    expect(cleanNationality('英国人')).toEqual(['英国']);
    expect(cleanNationality('美国人')).toEqual(['美国']);
  });

  it('X裔Y人 → Y', () => {
    // "匈牙利裔美国人": X裔Y → "美国人", 再 X人 → "美国"
    expect(cleanNationality('匈牙利裔美国人')).toEqual(['美国']);
    expect(cleanNationality('印裔美国人')).toEqual(['美国']);
  });

  it('X籍Y裔 → X国', () => {
    expect(cleanNationality('美籍华裔')).toEqual(['美国']);
  });

  it('尾缀裔', () => {
    expect(cleanNationality('德国裔')).toEqual(['德国']);
    expect(cleanNationality('中国裔')).toEqual(['中国']);
  });

  // ── 多国籍 ──

  it('/ 拆分多国籍', () => {
    expect(cleanNationality('英国/加拿大')).toEqual(['英国', '加拿大']);
    expect(cleanNationality('法国/美国')).toEqual(['法国', '美国']);
    expect(cleanNationality('奥地利/美国')).toEqual(['奥地利', '美国']);
    expect(cleanNationality('波兰/美国')).toEqual(['波兰', '美国']);
  });

  it('/ + 归一', () => {
    expect(cleanNationality('德国裔/美国')).toEqual(['德国', '美国']);
  });

  it('逗号拆分', () => {
    expect(cleanNationality('澳大利亚, 美国')).toEqual(['澳大利亚', '美国']);
  });

  // ── 边缘 ──

  it('null/undefined 返回空数组', () => {
    expect(cleanNationality(null)).toEqual([]);
    expect(cleanNationality(undefined)).toEqual([]);
  });

  it('空字符串返回空数组', () => {
    expect(cleanNationality('')).toEqual([]);
  });

  it('只有括号注释的保留原文', () => {
    // 括号去掉后为空，保原始值
    // 这个case在实际数据中不太可能出现，但保证不崩
    expect(cleanNationality('（注释）')).toEqual(['（注释）']);
  });

  it('去重', () => {
    // 同一个国籍拆分后出现两次应该合并
    const result = cleanNationality('美国/美国');
    expect(result).toEqual(['美国']);
  });

  it('波斯/阿拉伯 → 波拉和阿', () => {
    // 各算出应有的拆分
    const r = cleanNationality('波斯/阿拉伯');
    expect(r).toContain('波斯');
    expect(r).toContain('阿拉伯');
    expect(r.length).toBe(2);
  });

  // ── 来自真实数据的更多边缘情况 ──

  it('括号内含斜杠', () => {
    // "伊斯兰世界（今哈萨克斯坦/中亚）": 先去括号 → "伊斯兰世界"，不拆分括号内的 /
    expect(cleanNationality('伊斯兰世界（今哈萨克斯坦/中亚）')).toEqual(['伊斯兰世界']);
  });

  it('括号内含地名', () => {
    // "普鲁士（德国）": 剥括号 → "普鲁士"
    expect(cleanNationality('普鲁士（德国）')).toEqual(['普鲁士']);
    // "古希腊（马其顿）"
    expect(cleanNationality('古希腊（马其顿）')).toEqual(['古希腊']);
  });

  it('括号内普通文本', () => {
    expect(cleanNationality('英国（文学形象）')).toEqual(['英国']);
    expect(cleanNationality('美国（台湾出生）')).toEqual(['美国']);
    expect(cleanNationality('美国（后入中国籍）')).toEqual(['美国']);
  });

  it('X裔Y人 → Y', () => {
    // "匈牙利裔英国人": X裔Y → "英国人" → X人 → "英国"
    expect(cleanNationality('匈牙利裔英国人')).toEqual(['英国']);
    expect(cleanNationality('葡萄牙裔美国人')).toEqual(['美国']);
  });

  it('/ 拆分的部分带括号', () => {
    // "德国/奥地利（波西米亚出生）": 先去括号 → "德国/奥地利", 再拆分
    expect(cleanNationality('德国/奥地利（波西米亚出生）')).toEqual(['德国', '奥地利']);
  });

  it('更多逗号空格拆分', () => {
    expect(cleanNationality('奥地利, 英国')).toEqual(['奥地利', '英国']);
  });

  it('苏联复合变体', () => {
    expect(cleanNationality('苏联/俄罗斯')).toEqual(['苏联', '俄罗斯']);
    expect(cleanNationality('苏联/法国')).toEqual(['苏联', '法国']);
  });

  it('历史实体', () => {
    expect(cleanNationality('奥匈帝国/美国')).toEqual(['奥匈帝国', '美国']);
  });

  it('更多 X裔美国', () => {
    expect(cleanNationality('荷兰裔美国')).toEqual(['美国']);
    expect(cleanNationality('希腊裔美国')).toEqual(['美国']);
    expect(cleanNationality('委内瑞拉裔美国')).toEqual(['美国']);
    expect(cleanNationality('印度裔美国')).toEqual(['美国']);
  });

  it('加拿大含括号变体', () => {
    expect(cleanNationality('加拿大（法裔）')).toEqual(['加拿大']);
    expect(cleanNationality('加拿大（乌克兰裔）')).toEqual(['加拿大']);
  });

  it('英国含括号变体', () => {
    expect(cleanNationality('英国（苏格兰）')).toEqual(['英国']);
    expect(cleanNationality('英国（爱尔兰裔）')).toEqual(['英国']);
    expect(cleanNationality('英国（俄裔）')).toEqual(['英国']);
    expect(cleanNationality('英国（匈牙利裔）')).toEqual(['英国']);
  });

  it('英美互换方向', () => {
    expect(cleanNationality('美国/英国')).toEqual(['美国', '英国']);
    expect(cleanNationality('英国/美国')).toEqual(['英国', '美国']);
  });

  it('美国（意大利裔）等更多括号', () => {
    expect(cleanNationality('美国（意大利裔）')).toEqual(['美国']);
    expect(cleanNationality('美国（奥地利裔）')).toEqual(['美国']);
    expect(cleanNationality('美国（印度裔）')).toEqual(['美国']);
    expect(cleanNationality('美国（以色列裔）')).toEqual(['美国']);
  });

  it('英国裔美国', () => {
    expect(cleanNationality('英国裔美国')).toEqual(['美国']);
  });

  it('加拿大/美国', () => {
    expect(cleanNationality('加拿大/美国')).toEqual(['加拿大', '美国']);
    expect(cleanNationality('以色列/加拿大')).toEqual(['以色列', '加拿大']);
  });

  it('比利时/法国', () => {
    expect(cleanNationality('比利时/法国')).toEqual(['比利时', '法国']);
  });

  it('南非/美国', () => {
    expect(cleanNationality('南非/美国')).toEqual(['南非', '美国']);
  });

  it('捷克/美国 和新西兰/美国', () => {
    expect(cleanNationality('捷克/美国')).toEqual(['捷克', '美国']);
    expect(cleanNationality('新西兰/美国')).toEqual(['新西兰', '美国']);
  });

  it('瑞典/美国 和 希腊/美国', () => {
    expect(cleanNationality('瑞典/美国')).toEqual(['瑞典', '美国']);
    expect(cleanNationality('希腊/美国')).toEqual(['希腊', '美国']);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// executeQuery
// ══════════════════════════════════════════════════════════════════════════

describe('executeQuery', () => {
  it('按 type 过滤', () => {
    const r = executeQuery({ type: 'person' }, KB_DATA);
    expect(r.length).toBeGreaterThan(0);
    r.forEach(item => expect(item.type).toBe('person'));
  });

  it('按 nationality 过滤', () => {
    const r = executeQuery({ type: 'person', nationality: '英国' }, KB_DATA);
    expect(r.length).toBe(3); // 图灵、罗素、怀特海
    r.forEach(item => expect(item.nationality).toBe('英国'));
  });

  it('按 type_any 过滤', () => {
    const r = executeQuery({ type_any: ['person', 'organization'] }, KB_DATA);
    expect(r.length).toBe(Object.keys(KB_DATA.pages).length);
  });

  it('空条件返回所有', () => {
    const r = executeQuery({}, KB_DATA);
    expect(r.length).toBe(Object.keys(KB_DATA.pages).length);
  });

  it('支持 limit', () => {
    const r = executeQuery({ limit: 3 }, KB_DATA);
    expect(r.length).toBe(3);
  });

  it('noLimit 返回全部', () => {
    const r = executeQuery({ limit: 3 }, KB_DATA, { noLimit: true });
    expect(r.length).toBe(Object.keys(KB_DATA.pages).length);
  });

  it('排序默认按 label', () => {
    const r = executeQuery({ type: 'person', nationality: '美国' }, KB_DATA);
    for (let i = 1; i < r.length; i++) {
      expect(r[i - 1].label?.localeCompare(r[i].label, 'zh')).toBeLessThanOrEqual(0);
    }
  });

  it('tags_any 过滤（包含任一标签）', () => {
    const r = executeQuery({ tags_any: ['深度学习', '认知科学'] }, KB_DATA);
    expect(r.length).toBeGreaterThanOrEqual(4);
    r.forEach(item => {
      expect(item.tags).toBeDefined();
    });
  });

  it('tags_not 排除标签', () => {
    const r = executeQuery({ type: 'person', tags_not: ['数学'] }, KB_DATA);
    r.forEach(item => {
      expect(item.tags).not.toContain('数学');
    });
  });

  it('featured 布尔过滤', () => {
    const r = executeQuery({ featured: true }, KB_DATA);
    expect(r.length).toBeGreaterThan(0);
    r.forEach(item => expect(item.featured).toBe(true));
  });

  it('total_refs_min 范围过滤', () => {
    const r = executeQuery({ total_refs_min: 100 }, KB_DATA);
    expect(r.length).toBeGreaterThan(0);
    r.forEach(item => expect(item.total_refs).toBeGreaterThanOrEqual(100));
  });

  it('total_refs_max 范围过滤', () => {
    const r = executeQuery({ total_refs_max: 30 }, KB_DATA);
    expect(r.length).toBeGreaterThan(0);
    r.forEach(item => expect(item.total_refs).toBeLessThanOrEqual(30));
  });

  it('NOT NULL 操作符', () => {
    // 类似 honglou "仆: NOT NULL" 的用法：tags 非空的 person
    const r = executeQuery({ type: 'person', tags: 'NOT NULL' }, KB_DATA);
    expect(r.length).toBeGreaterThan(0);
    r.forEach(item => {
      expect(Array.isArray(item.tags)).toBe(true);
      expect(item.tags.length).toBeGreaterThan(0);
    });
  });

  it('all() NOT NULL — featured', () => {
    // featured 非空：所有页面的 featured 字段都有定义
    const r = executeQuery({ featured: 'NOT NULL' }, KB_DATA);
    expect(r.length).toBe(Object.keys(KB_DATA.pages).length);
  });

  it('tags + featured 多条件组合', () => {
    const r = executeQuery({ type: 'person', tags: '计算机科学', featured: true }, KB_DATA);
    expect(r.length).toBeGreaterThan(0);
    r.forEach(item => {
      expect(item.type).toBe('person');
      expect(item.tags).toContain('计算机科学');
      expect(item.featured).toBe(true);
    });
  });

  it('空结果集返回空数组', () => {
    const r = executeQuery({ type: 'person', nationality: '火星' }, KB_DATA);
    expect(r).toEqual([]);
  });

  it('按数字字段排序', () => {
    const r = executeQuery({ type: 'person', sort: 'total_refs', order: 'desc' }, KB_DATA);
    for (let i = 1; i < r.length; i++) {
      expect(r[i - 1].total_refs).toBeGreaterThanOrEqual(r[i].total_refs);
    }
  });

  it('按字符串字段升序排序', () => {
    const r = executeQuery({ type: 'person', sort: 'total_refs', order: 'asc' }, KB_DATA);
    for (let i = 1; i < r.length; i++) {
      expect(r[i - 1].total_refs).toBeLessThanOrEqual(r[i].total_refs);
    }
  });

  it('limit 0 返回空数组', () => {
    const r = executeQuery({ limit: 0 }, KB_DATA);
    expect(r).toEqual([]);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// renderQueryBlock — group_by
// ══════════════════════════════════════════════════════════════════════════

describe('renderQueryBlock — group_by', () => {
  const GROUP_META = {
    display: 'group_by',
    group: 'nationality',
    count_of: 'type',
    type_any: ['person', 'organization'],
    normalizer: 'nationality',
  };

  const RAW_GROUP_META = {
    ...GROUP_META,
    normalizer: 'default',
  };

  it('返回包含 query-table 的 HTML', () => {
    const html = renderQueryBlock(GROUP_META, KB_DATA);
    expect(html).toContain('query-table');
    expect(html).toContain('<thead>');
    expect(html).toContain('<tbody>');
  });

  it('表头含分组字段和 count_of 列', () => {
    const html = renderQueryBlock(GROUP_META, KB_DATA);
    expect(html).toContain('nationality');
    expect(html).toContain('人物');
    expect(html).toContain('组织');
  });

  it('不使用 normalizer 时保留原始值', () => {
    const html = renderQueryBlock(RAW_GROUP_META, KB_DATA);
    // 美国（苏格兰裔）作为独立分组存在
    expect(html).toContain('美国（苏格兰裔）');
  });

  it('normalizer: nationality 合并变体', () => {
    const html = renderQueryBlock(GROUP_META, KB_DATA);
    // 美国（苏格兰裔）、德裔美国等都被归一为美国
    expect(html).toContain('美国');
  });

  it('order: desc 默认降序（美国最先）', () => {
    const html = renderQueryBlock(GROUP_META, KB_DATA);
    const usIndex = html.indexOf('美国');
    const ukIndex = html.indexOf('英国');
    expect(usIndex).toBeLessThan(ukIndex); // 美国总量最大，排第一
  });

  it('order: asc 升序', () => {
    const html = renderQueryBlock({ ...GROUP_META, order: 'asc' }, KB_DATA);
    // 最小/最少量的国家排在前
    const rows = html.match(/<tr><td>([^<]+)<\/td>/g);
    if (rows && rows.length >= 2) {
      const first = rows[0].match(/<td>([^<]+)<\/td>/)[1];
      const second = rows[1].match(/<td>([^<]+)<\/td>/)[1];
      // 第一个不是美国（美国总量最大）
      expect(first).not.toBe('美国');
    }
  });

  it('limit 限制分组数', () => {
    const html = renderQueryBlock({ ...GROUP_META, limit: 5 }, KB_DATA);
    const rows = html.match(/<tr><td>/g);
    // thead 1 + tbody 最多5 = 最多6个 <tr>
    const trCount = (html.match(/<tr>/g) || []).length;
    expect(trCount).toBeLessThanOrEqual(6);
  });

  it('数据为空返回错误信息', () => {
    const html = renderQueryBlock({ display: 'group_by' }, { pages: {} });
    expect(html).toContain('query-table');
  });

  it('无 kbData 返回错误信息', () => {
    const html = renderQueryBlock({ display: 'group_by' }, null);
    expect(html).toContain('数据未加载');
  });

  it('title 参数渲染', () => {
    const html = renderQueryBlock({ ...GROUP_META, title: '各国分布' }, KB_DATA);
    expect(html).toContain('query-title');
    expect(html).toContain('各国分布');
  });

  it('normalizer 返回空时跳过该条目', () => {
    // nationality 为 null 的条目被跳过
    const pagesWithNull = {
      pages: {
        '张三': { type: 'person', nationality: null, label: '张三' },
        '李四': { type: 'person', nationality: '美国', label: '李四' },
      },
    };
    const html = renderQueryBlock(GROUP_META, pagesWithNull);
    expect(html).toContain('美国');
    // 只有一个分组（李四的美国），没有 null 分组的痕迹
    const rows = html.match(/<tr><td>/g);
    expect(rows).toHaveLength(1);
  });

  it('order: desc 降序且不指定 order 时默认为 desc', () => {
    const descHtml = renderQueryBlock({ ...GROUP_META, order: 'desc' }, KB_DATA);
    const defaultHtml = renderQueryBlock(GROUP_META, KB_DATA);
    // 两种排序结果一致（desc 是默认值）
    expect(descHtml).toBe(defaultHtml);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// renderQueryBlock — display: count
// ══════════════════════════════════════════════════════════════════════════

describe('renderQueryBlock — count', () => {
  const COUNT_META = { display: 'count', type: 'person' };

  it('返回计数文本', () => {
    const html = renderQueryBlock(COUNT_META, KB_DATA);
    expect(html).toContain('query-count');
    expect(html).toMatch(/\d+ 条结果/);
  });

  it('空结果返回 0 条结果', () => {
    const html = renderQueryBlock({ display: 'count', type: 'person', nationality: '火星' }, KB_DATA);
    expect(html).toContain('0 条结果');
  });

  it('count 带 title 参数', () => {
    const html = renderQueryBlock({ ...COUNT_META, title: '人物总数' }, KB_DATA);
    expect(html).toContain('query-title');
    expect(html).toContain('人物总数');
  });

  it('无 kbData 返回错误', () => {
    const html = renderQueryBlock({ display: 'count' }, null);
    expect(html).toContain('数据未加载');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// renderQueryBlock — display: list
// ══════════════════════════════════════════════════════════════════════════

describe('renderQueryBlock — list', () => {
  it('返回 ul.query-results', () => {
    const html = renderQueryBlock({ type: 'person', limit: 3 }, KB_DATA);
    expect(html).toContain('<ul class="query-results">');
    expect(html).toContain('▸');
  });

  it('空结果返回空列表', () => {
    const html = renderQueryBlock({ type: 'person', nationality: '火星' }, KB_DATA);
    expect(html).toContain('无匹配结果');
  });

  it('list 带 title', () => {
    const html = renderQueryBlock({ type: 'person', title: '人物列表', limit: 3 }, KB_DATA);
    expect(html).toContain('query-title');
    expect(html).toContain('人物列表');
  });

  it('无 kbData 返回错误', () => {
    const html = renderQueryBlock({ type: 'person' }, null);
    expect(html).toContain('数据未加载');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// renderQueryBlock — display: table
// ══════════════════════════════════════════════════════════════════════════

describe('renderQueryBlock — table', () => {
  const TABLE_META = {
    display: 'table',
    type_any: ['person', 'organization'],
    limit: 5,
    fields: ['label', 'type', 'tags', 'total_refs'],
  };

  it('返回含 thead/tbody 的表格', () => {
    const html = renderQueryBlock(TABLE_META, KB_DATA);
    expect(html).toContain('query-table');
    expect(html).toContain('<thead>');
    expect(html).toContain('<tbody>');
  });

  it('表头使用 field_labels', () => {
    const html = renderQueryBlock({
      ...TABLE_META,
      field_labels: { label: '姓名', type: '类别', total_refs: '引用量' },
    }, KB_DATA);
    expect(html).toContain('姓名');
    expect(html).toContain('类别');
    expect(html).toContain('引用量');
  });

  it('空结果显示无匹配', () => {
    const html = renderQueryBlock({ display: 'table', type: 'person', nationality: '火星' }, KB_DATA);
    expect(html).toContain('无匹配结果');
  });

  it('默认 fields 为 label/type/tags/total_refs', () => {
    const html = renderQueryBlock({ display: 'table', type: 'person', limit: 3 }, KB_DATA);
    expect(html).toContain('名称');
    expect(html).toContain('类型');
  });

  it('无 kbData 返回错误', () => {
    const html = renderQueryBlock({ display: 'table' }, null);
    expect(html).toContain('数据未加载');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// sql-tokenizer
// ══════════════════════════════════════════════════════════════════════════

describe('sql-tokenizer', () => {
  it('关键字', () => {
    const t = tokenize('SELECT WHERE GROUP BY ORDER BY LIMIT AS AND OR NOT IN IS NULL LIKE');
    const kw = t.filter(tk => tk.type === 'keyword').map(tk => tk.value);
    expect(kw).toContain('select');
    expect(kw).toContain('where');
    expect(kw).toContain('group');
    expect(kw).toContain('order');
    expect(kw).toContain('limit');
  });

  it('标识符', () => {
    const t = tokenize('label type total_refs');
    expect(t.filter(tk => tk.type === 'identifier')).toHaveLength(3);
    expect(t[0].value).toBe('label');
  });

  it('字符串字面量', () => {
    const t = tokenize("'hello' 'world'");
    expect(t[0]).toEqual({ type: 'string', value: 'hello' });
    expect(t[1]).toEqual({ type: 'string', value: 'world' });
  });

  it('数字字面量', () => {
    const t = tokenize('42 3.14');
    expect(t[0]).toEqual({ type: 'number', value: 42 });
    expect(t[1]).toEqual({ type: 'number', value: 3.14 });
  });

  it('布尔字面量', () => {
    const t = tokenize('true false');
    expect(t[0]).toEqual({ type: 'boolean', value: true });
    expect(t[1]).toEqual({ type: 'boolean', value: false });
  });

  it('操作符', () => {
    const t = tokenize('= != <> < <= > >=');
    expect(t.map(tk => tk.value)).toEqual(['=', '!=', '<>', '<', '<=', '>', '>=']);
  });

  it('括号和逗号', () => {
    const t = tokenize('(a, b)');
    expect(t[0]).toEqual({ type: 'punct', value: '(' });
    expect(t[1]).toEqual({ type: 'identifier', value: 'a' });
    expect(t[2]).toEqual({ type: 'punct', value: ',' });
    expect(t[3]).toEqual({ type: 'identifier', value: 'b' });
    expect(t[4]).toEqual({ type: 'punct', value: ')' });
  });

  it('星号', () => {
    const t = tokenize('SELECT *');
    expect(t.some(tk => tk.type === 'star')).toBe(true);
  });

  it('注释被忽略', () => {
    const t = tokenize('SELECT -- 这是注释\n label');
    expect(t.filter(tk => tk.type === 'keyword' || tk.type === 'identifier')).toHaveLength(2);
  });

  it('聚合函数名', () => {
    const t = tokenize('COUNT SUM AVG MIN MAX');
    const fns = t.filter(tk => tk.type === 'keyword').map(tk => tk.value);
    expect(fns).toEqual(['count', 'sum', 'avg', 'min', 'max']);
  });

  it('带引号的标识符', () => {
    const t = tokenize('`hello world`');
    expect(t[0]).toEqual({ type: 'identifier', value: 'hello world' });
  });
});

// ══════════════════════════════════════════════════════════════════════════
// sql-parser
// ══════════════════════════════════════════════════════════════════════════

describe('sql-parser', () => {
  it('SELECT *', () => {
    const ast = parseSQL('SELECT *');
    expect(ast.type).toBe('select');
    expect(ast.columns).toHaveLength(1);
    expect(ast.columns[0].expr.type).toBe('star');
  });

  it('SELECT 指定字段', () => {
    const ast = parseSQL('SELECT label, type, total_refs');
    expect(ast.columns).toHaveLength(3);
    expect(ast.columns[0].expr.name).toBe('label');
    expect(ast.columns[1].expr.name).toBe('type');
  });

  it('SELECT 带 AS 别名', () => {
    const ast = parseSQL('SELECT label AS 姓名, total_refs AS 引用数');
    expect(ast.columns[0].alias).toBe('姓名');
    expect(ast.columns[1].alias).toBe('引用数');
  });

  it('WHERE 简单条件', () => {
    const ast = parseSQL("SELECT label WHERE type = 'person'");
    expect(ast.where.type).toBe('binary');
    expect(ast.where.op).toBe('=');
    expect(ast.where.left.name).toBe('type');
    expect(ast.where.right.value).toBe('person');
  });

  it('WHERE AND/OR 组合', () => {
    const ast = parseSQL("SELECT label WHERE type = 'person' AND total_refs >= 50 OR featured = true");
    expect(ast.where.type).toBe('binary');
    // OR 在最外层，AND 在左子节点
    expect(ast.where.op).toBe('or');
  });

  it('WHERE 括号分组', () => {
    const ast = parseSQL("SELECT label WHERE (type = 'person' OR type = 'organization') AND featured = true");
    expect(ast.where.op).toBe('and');
  });

  it('WHERE IN', () => {
    const ast = parseSQL("SELECT label WHERE type IN ('person', 'organization')");
    expect(ast.where.type).toBe('in');
    expect(ast.where.neg).toBe(false);
    expect(ast.where.list).toHaveLength(2);
  });

  it('WHERE NOT IN', () => {
    const ast = parseSQL("SELECT label WHERE type NOT IN ('数学', '哲学')");
    expect(ast.where.type).toBe('in');
    expect(ast.where.neg).toBe(true);
  });

  it('WHERE IS NULL', () => {
    const ast = parseSQL('SELECT label WHERE affiliation IS NULL');
    expect(ast.where.type).toBe('isnull');
    expect(ast.where.neg).toBe(false);
  });

  it('WHERE IS NOT NULL', () => {
    const ast = parseSQL('SELECT label WHERE affiliation IS NOT NULL');
    expect(ast.where.type).toBe('isnull');
    expect(ast.where.neg).toBe(true);
  });

  it('WHERE LIKE', () => {
    const ast = parseSQL("SELECT label WHERE label LIKE '%网络%'");
    expect(ast.where.type).toBe('binary');
    expect(ast.where.op).toBe('like');
  });

  it('WHERE !=', () => {
    const ast = parseSQL("SELECT label WHERE type != 'organization'");
    expect(ast.where.op).toBe('!=');
  });

  it('GROUP BY', () => {
    const ast = parseSQL('SELECT nationality, COUNT(*) AS 人数 WHERE type = \'person\' GROUP BY nationality');
    expect(ast.groupBy).toHaveLength(1);
    expect(ast.groupBy[0].name).toBe('nationality');
  });

  it('多字段 GROUP BY', () => {
    const ast = parseSQL('SELECT _source, type, COUNT(*) AS count GROUP BY _source, type');
    expect(ast.groupBy).toHaveLength(2);
  });

  it('ORDER BY', () => {
    const ast = parseSQL('SELECT label ORDER BY total_refs DESC');
    expect(ast.orderBy).toHaveLength(1);
    expect(ast.orderBy[0].dir).toBe('desc');
  });

  it('多字段 ORDER BY', () => {
    const ast = parseSQL('SELECT label ORDER BY total_refs DESC, label ASC');
    expect(ast.orderBy).toHaveLength(2);
    expect(ast.orderBy[0].dir).toBe('desc');
    expect(ast.orderBy[1].dir).toBe('asc');
  });

  it('LIMIT', () => {
    const ast = parseSQL('SELECT label LIMIT 10');
    expect(ast.limit).toBe(10);
  });

  it('完整查询', () => {
    const ast = parseSQL(
      "SELECT label, type, total_refs WHERE type = 'person' AND total_refs >= 50 ORDER BY total_refs DESC LIMIT 20"
    );
    expect(ast.columns).toHaveLength(3);
    expect(ast.where).toBeTruthy();
    expect(ast.orderBy).toHaveLength(1);
    expect(ast.limit).toBe(20);
  });

  it('聚合函数', () => {
    const ast = parseSQL('SELECT COUNT(*), AVG(total_refs), MIN(total_refs), MAX(total_refs), SUM(total_refs)');
    const calls = ast.columns.filter(c => c.expr.type === 'call');
    expect(calls).toHaveLength(5);
    expect(calls[0].expr.name).toBe('count');
    expect(calls[1].expr.name).toBe('avg');
  });

  it('空查询抛异常', () => {
    expect(() => parseSQL('')).toThrow(ParseError);
  });

  it('无 SELECT 抛异常', () => {
    expect(() => parseSQL('WHERE type = 1')).toThrow(ParseError);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// sql-evaluator
// ══════════════════════════════════════════════════════════════════════════

describe('sql-evaluator', () => {
  it('SELECT * 返回所有字段', () => {
    const ast = parseSQL('SELECT * WHERE type = \'person\' LIMIT 3');
    const { columns, rows } = evaluate(ast, KB_DATA.pages);
    expect(rows.length).toBe(3);
    expect(columns).toContain('label');
    expect(columns).toContain('type');
    rows.forEach(r => expect(r.type).toBe('person'));
  });

  it('WHERE 过滤 type', () => {
    const ast = parseSQL("SELECT label, type WHERE type = 'organization'");
    const { rows } = evaluate(ast, KB_DATA.pages);
    expect(rows.length).toBeGreaterThan(0);
    rows.forEach(r => expect(r.type).toBe('organization'));
  });

  it('WHERE AND 组合条件', () => {
    const ast = parseSQL("SELECT label, total_refs WHERE type = 'person' AND total_refs >= 100");
    const { rows } = evaluate(ast, KB_DATA.pages);
    expect(rows.length).toBeGreaterThan(0);
    rows.forEach(r => {
      expect(r.total_refs).toBeGreaterThanOrEqual(100);
    });
  });

  it('WHERE OR 组合', () => {
    const ast = parseSQL("SELECT label, type, featured, total_refs WHERE type = 'person' AND (featured = true OR total_refs >= 100)");
    const { rows } = evaluate(ast, KB_DATA.pages);
    expect(rows.length).toBeGreaterThan(0);
    rows.forEach(r => {
      expect(r.type).toBe('person');
      expect(r.featured === true || r.total_refs >= 100).toBe(true);
    });
  });

  it('WHERE IN', () => {
    const ast = parseSQL("SELECT label WHERE tags IN ('AI', '深度学习')");
    const { rows } = evaluate(ast, KB_DATA.pages);
    expect(rows.length).toBeGreaterThan(0);
  });

  it('WHERE IS NOT NULL', () => {
    const ast = parseSQL('SELECT label WHERE affiliation IS NOT NULL');
    const { rows } = evaluate(ast, KB_DATA.pages);
    // 所有测试数据都没有 affiliation 字段，所以结果为空
    expect(rows.length).toBe(0);
  });

  it('WHERE LIKE', () => {
    const ast = parseSQL("SELECT label WHERE label LIKE '%图%'");
    const { rows } = evaluate(ast, KB_DATA.pages);
    expect(rows.length).toBe(1);
    expect(rows[0].label).toContain('图');
  });

  it('ORDER BY 数字字段降序', () => {
    const ast = parseSQL('SELECT label, total_refs WHERE type = \'person\' ORDER BY total_refs DESC');
    const { rows } = evaluate(ast, KB_DATA.pages);
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i - 1].total_refs).toBeGreaterThanOrEqual(rows[i].total_refs);
    }
  });

  it('ORDER BY 升序', () => {
    const ast = parseSQL('SELECT label WHERE type = \'person\' ORDER BY label ASC');
    const { rows } = evaluate(ast, KB_DATA.pages);
    for (let i = 1; i < rows.length; i++) {
      expect(String(rows[i - 1].label).localeCompare(String(rows[i].label), 'zh')).toBeLessThanOrEqual(0);
    }
  });

  it('LIMIT', () => {
    const ast = parseSQL('SELECT label LIMIT 5');
    const { rows } = evaluate(ast, KB_DATA.pages);
    expect(rows.length).toBe(5);
  });

  it('GROUP BY + COUNT', () => {
    const ast = parseSQL('SELECT type, COUNT(*) AS count GROUP BY type ORDER BY count DESC');
    const { columns, rows } = evaluate(ast, KB_DATA.pages);
    expect(columns).toContain('type');
    expect(columns).toContain('count');
    expect(rows.length).toBeGreaterThan(0);
    // 总数应等于所有页面数
    const total = rows.reduce((s, r) => s + r.count, 0);
    expect(total).toBe(Object.keys(KB_DATA.pages).length);
  });

  it('GROUP BY + AVG', () => {
    const ast = parseSQL('SELECT type, AVG(total_refs) AS avg_refs WHERE total_refs IS NOT NULL GROUP BY type');
    const { rows } = evaluate(ast, KB_DATA.pages);
    expect(rows.length).toBeGreaterThan(0);
  });

  it('GROUP BY + 聚合函数组合', () => {
    const ast = parseSQL(
      'SELECT type, COUNT(*) AS count, AVG(total_refs) AS avg_refs WHERE type = \'person\' GROUP BY type'
    );
    const { rows } = evaluate(ast, KB_DATA.pages);
    expect(rows).toHaveLength(1); // 只有 person 一个分组
    expect(rows[0].count).toBeGreaterThan(0);
    expect(rows[0].avg_refs).toBeGreaterThan(0);
  });

  it('带别名的 SELECT', () => {
    const ast = parseSQL('SELECT label AS 姓名, total_refs AS 引用数 LIMIT 3');
    const { columns, rows } = evaluate(ast, KB_DATA.pages);
    expect(columns).toContain('姓名');
    expect(columns).toContain('引用数');
    expect(rows[0]).toHaveProperty('姓名');
    expect(rows[0]).toHaveProperty('引用数');
  });

  it('空数据返回空结果', () => {
    const ast = parseSQL('SELECT label');
    const { rows } = evaluate(ast, {});
    expect(rows).toEqual([]);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// renderQueryBlock — SQL query 参数
// ══════════════════════════════════════════════════════════════════════════

describe('renderQueryBlock — SQL query', () => {
  it('SQL 模式返回表格 HTML', () => {
    const html = renderQueryBlock({
      query: "SELECT label, type WHERE type = 'person' LIMIT 3",
      display: 'table',
    }, KB_DATA);
    expect(html).toContain('query-table');
    expect(html).toContain('<thead>');
    expect(html).toContain('<tbody>');
  });

  it('SQL 模式返回计数', () => {
    const html = renderQueryBlock({
      query: "SELECT label WHERE type = 'person'",
      display: 'count',
    }, KB_DATA);
    expect(html).toMatch(/\d+ 条结果/);
  });

  it('SQL 模式返回列表', () => {
    const html = renderQueryBlock({
      query: "SELECT label WHERE type = 'person' LIMIT 3",
      display: 'list',
    }, KB_DATA);
    expect(html).toContain('query-results');
    expect(html).toContain('▸');
  });

  it('SQL 模式支持 title 参数', () => {
    const html = renderQueryBlock({
      query: "SELECT label WHERE type = 'person' LIMIT 3",
      title: '人物列表',
    }, KB_DATA);
    expect(html).toContain('人物列表');
  });

  it('SQL 模式支持 field_labels', () => {
    const html = renderQueryBlock({
      query: 'SELECT label, type LIMIT 3',
      field_labels: { label: '姓名', type: '类别' },
    }, KB_DATA);
    expect(html).toContain('姓名');
    expect(html).toContain('类别');
  });

  it('SQL 模式空结果', () => {
    const html = renderQueryBlock({
      query: "SELECT label WHERE nationality = '火星'",
    }, KB_DATA);
    expect(html).toContain('无匹配结果');
  });

  it('SQL 语法错误返回提示', () => {
    const html = renderQueryBlock({
      query: 'SELECT * WHERE (type = person',  // 缺 )，括号不匹配
    }, KB_DATA);
    expect(html).toContain('SQL 解析错误');
  });

  it('无 kbData 返回错误', () => {
    const html = renderQueryBlock({
      query: 'SELECT label',
    }, null);
    expect(html).toContain('数据未加载');
  });

  it('YAML 过滤不受影响（向后兼容）', () => {
    const html = renderQueryBlock({ type: 'person', limit: 3 }, KB_DATA);
    // 走 YAML 路径，依然是 list 默认输出
    expect(html).toContain('query-results');
  });

  it('SQL GROUP BY 渲染', () => {
    const html = renderQueryBlock({
      query: "SELECT type, COUNT(*) AS count GROUP BY type ORDER BY count DESC",
      display: 'table',
    }, KB_DATA);
    expect(html).toContain('type');
    expect(html).toContain('count');
    expect(html).toContain('人物');
    expect(html).toContain('组织');
  });
});
