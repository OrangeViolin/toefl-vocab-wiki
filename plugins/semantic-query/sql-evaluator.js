/**
 * SQL 求值执行器 — semantic-query 插件
 *
 * 对 AST 在 pages 数据上求值：
 *   WHERE → GROUP BY + 聚合 → ORDER BY → LIMIT → SELECT 投影
 */

/** 从 page 对象读取字段值，嵌套字段用 '.' 分隔 */
function resolveField(name, page) {
  if (name === '_source') return page._source;
  const parts = name.split('.');
  let v = page;
  for (const p of parts) {
    if (v == null || typeof v !== 'object') return undefined;
    v = v[p];
  }
  return v;
}

/** 对表达式在 page 上下文中求值 */
function evalExpr(node, page) {
  if (!node) return null;

  switch (node.type) {
    case 'string':  return node.value;
    case 'number':  return node.value;
    case 'boolean': return node.value;
    case 'star':    return '*';
    case 'identifier': {
      const v = resolveField(node.name, page);
      return v !== undefined ? v : null;
    }
    case 'call': {
      const args = node.args.map(a => evalExpr(a, page));
      const val = args[0];
      switch (node.name) {
        case 'count': return args.length === 1 && args[0] === '*' ? 1 : (val == null ? 0 : 1);
        case 'sum':   return val == null ? 0 : (typeof val === 'number' ? val : 0);
        case 'avg':   return val; // avg 在 GROUP BY 后处理
        case 'min':   return val;
        case 'max':   return val;
        default: return null;
      }
    }
    case 'unary': {
      if (node.op === 'not') return !evalExpr(node.expr, page);
      return null;
    }
    case 'binary': {
      const l = evalExpr(node.left, page);
      const r = evalExpr(node.right, page);
      switch (node.op) {
        case 'and': return l && r;
        case 'or':  return l || r;
        case '=':   return l == r;  // loose equality for cross-type (null safe)
        case '!=': case '<>': return l != r;
        case '<':  return l != null && r != null && l < r;
        case '<=': return l != null && r != null && l <= r;
        case '>':  return l != null && r != null && l > r;
        case '>=': return l != null && r != null && l >= r;
        case 'like': return likeMatch(String(l || ''), String(r || ''));
        default: return null;
      }
    }
    case 'isnull': {
      const v = evalExpr(node.expr, page);
      return node.neg ? (v != null) : (v == null);
    }
    case 'in': {
      const v = evalExpr(node.expr, page);
      const list = node.list.map(e => evalExpr(e, page));
      const found = list.some(item => item == v);
      return node.neg ? !found : found;
    }
    default:
      return null;
  }
}

/** LIKE 模式匹配：% 匹配任意序列，_ 匹配单个字符 */
function likeMatch(str, pattern) {
  const reStr = '^' + pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/%/g, '.*')
    .replace(/_/g, '.') + '$';
  try {
    return new RegExp(reStr).test(str);
  } catch { return false; }
}

/**
 * 在 pages 上执行 SQL 查询。
 *
 * @param {object} ast       — parse() 产出的 AST
 * @param {object} pages     — kbData.pages (pid → page)
 * @param {function} [normalizer] — 对 GROUP BY 键做归一化
 * @returns {{ columns: string[], rows: object[] }}
 */
export function evaluate(ast, pages, normalizer) {
  if (!pages) return { columns: [], rows: [] };

  const pageList = Object.values(pages);

  // ── 1. WHERE 过滤 ──
  let filtered = pageList;
  if (ast.where) {
    filtered = pageList.filter(page => {
      const r = evalExpr(ast.where, page);
      return r === true;
    });
  }

  let rows;
  let columns;

  // ── 2. GROUP BY + 聚合 ──
  if (ast.groupBy && ast.groupBy.length > 0) {
    const groupKeys = ast.groupBy;
    const groups = new Map();

    for (const page of filtered) {
      const rawKey = groupKeys.map(gk => {
        const v = evalExpr(gk, page);
        return v == null ? '\x00null' : String(v);
      }).join('\x00');

      const baseKeys = groupKeys.map(gk => {
        const v = evalExpr(gk, page);
        return v == null ? null : v;
      });

      let targetKeys;
      if (normalizer && groupKeys.length === 1) {
        // 单字段 GROUP BY 时应用 normalizer
        const raw = evalExpr(groupKeys[0], page);
        targetKeys = normalizer(raw);
        if (targetKeys.length === 0) continue;
      } else {
        targetKeys = [baseKeys[0]];
      }

      for (const tk of targetKeys) {
        const compositeKey = tk == null ? '\x00null' : String(tk);
        if (!groups.has(compositeKey)) {
          const row = {};
          groupKeys.forEach((gk, i) => {
            row[gk.type === 'identifier' ? gk.name : `group_${i}`] = baseKeys[i];
          });
          // 对 single-field GROUP BY 用归一化后的值
          if (normalizer && groupKeys.length === 1) {
            const fieldName = groupKeys[0].type === 'identifier' ? groupKeys[0].name : 'group';
            row[fieldName] = tk;
          }
          groups.set(compositeKey, { row, agg: {} });
        }

        const grp = groups.get(compositeKey);
        // 为聚合函数累计值
        for (const col of ast.columns) {
          if (col.expr.type === 'call') {
            const fname = col.expr.name;
            if (fname === 'count') {
              grp.agg[col.alias || col.expr.name] = (grp.agg[col.alias || col.expr.name] || 0) + 1;
            } else {
              const argVal = evalExpr(col.expr.args[0], page);
              const key = col.alias || col.expr.name;
              if (!grp.agg[key]) grp.agg[key] = { sum: 0, count: 0, min: Infinity, max: -Infinity, vals: [] };
              const acc = grp.agg[key];
              if (argVal != null && typeof argVal === 'number') {
                acc.sum += argVal;
                acc.count++;
                if (argVal < acc.min) acc.min = argVal;
                if (argVal > acc.max) acc.max = argVal;
                acc.vals.push(argVal);
              }
            }
          }
        }
      }
    }

    // 展开聚合结果
    rows = [...groups.values()].map(g => {
      const row = { ...g.row };
      for (const col of ast.columns) {
        if (col.expr.type === 'call') {
          const fname = col.expr.name;
          const key = col.alias || fname;
          const agg = g.agg[key];
          switch (fname) {
            case 'count': row[key] = g.agg[key] || 0; break;
            case 'sum':   row[key] = agg ? agg.sum : 0; break;
            case 'avg':   row[key] = agg && agg.count > 0 ? agg.sum / agg.count : null; break;
            case 'min':   row[key] = agg ? agg.min : null; break;
            case 'max':   row[key] = agg ? agg.max : null; break;
          }
        }
      }
      return row;
    });

    // 投影列：GROUP BY 字段 + 聚合字段
    columns = ast.columns.map(c => c.alias || (
      c.expr.type === 'call' ? c.expr.name :
      c.expr.type === 'identifier' ? c.expr.name :
      c.expr.type === 'star' ? '*' : '?'
    ));

  } else {
    // ── 3. 非 GROUP BY：直接投影 ──
    const isStar = ast.columns.length === 1 && ast.columns[0].expr.type === 'star';

    rows = filtered.map(page => {
      if (isStar) return { ...page };
      const row = {};
      for (const col of ast.columns) {
        const name = col.alias || (col.expr.type === 'identifier' ? col.expr.name : 'expr');
        row[name] = evalExpr(col.expr, page);
      }
      return row;
    });

    columns = isStar
      ? [...new Set(rows.flatMap(r => Object.keys(r)))]
      : ast.columns.map(c => c.alias || (
          c.expr.type === 'identifier' ? c.expr.name :
          c.expr.type === 'call' ? c.expr.name : 'expr'
        ));
  }

  // ── 4. ORDER BY ──
  if (ast.orderBy && ast.orderBy.length > 0) {
    rows.sort((a, b) => {
      for (const ob of ast.orderBy) {
        // eval order expr on row (not on original page)
        const va = resolveSortValue(ob.expr, a);
        const vb = resolveSortValue(ob.expr, b);
        if (va === vb) continue;
        const cmp = va == null ? -1 : vb == null ? 1 :
          typeof va === 'number' && typeof vb === 'number' ? va - vb :
          String(va).localeCompare(String(vb), 'zh');
        return ob.dir === 'desc' ? -cmp : cmp;
      }
      return 0;
    });
  }

  // ── 5. LIMIT ──
  if (ast.limit != null && ast.limit >= 0) {
    rows = rows.slice(0, ast.limit);
  }

  return { columns, rows };
}

/** 从结果行获取排序值（支持标识符和聚合别名） */
function resolveSortValue(expr, row) {
  if (expr.type === 'identifier') {
    const v = row[expr.name];
    return v !== undefined ? v : null;
  }
  if (expr.type === 'number') return expr.value;
  if (expr.type === 'string') return expr.value;
  return null;
}
