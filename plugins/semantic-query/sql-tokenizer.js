/**
 * SQL 词法分析器 — semantic-query 插件
 *
 * 将 SQL 查询字符串拆分为 token 数组。
 * 支持子集：SELECT / WHERE / GROUP BY / ORDER BY / LIMIT / 聚合函数
 */

const KEYWORDS = new Set([
  'select', 'where', 'group', 'by', 'order', 'asc', 'desc', 'limit', 'as',
  'and', 'or', 'not', 'in', 'is', 'null', 'like',
  'count', 'sum', 'avg', 'min', 'max',
]);

export function tokenize(sql) {
  const tokens = [];
  let i = 0;

  while (i < sql.length) {
    // Whitespace
    if (/\s/.test(sql[i])) { i++; continue; }

    // Single-line comment: -- ... \n
    if (sql[i] === '-' && sql[i + 1] === '-') {
      i += 2;
      while (i < sql.length && sql[i] !== '\n') i++;
      continue;
    }

    // String literal
    if (sql[i] === "'") {
      let j = i + 1;
      let escaped = false;
      while (j < sql.length) {
        if (escaped) { escaped = false; j++; continue; }
        if (sql[j] === '\\') { escaped = true; j++; continue; }
        if (sql[j] === "'") break;
        j++;
      }
      tokens.push({ type: 'string', value: sql.slice(i + 1, j) });
      i = (j < sql.length) ? j + 1 : j + 1;
      continue;
    }

    // Number literal
    if (/[\d]/.test(sql[i]) || (sql[i] === '-' && /[\d]/.test(sql[i + 1]))) {
      let j = i + 1;
      while (j < sql.length && /[\d.eE]/.test(sql[j])) {
        if ((sql[j] === 'e' || sql[j] === 'E') && (sql[j + 1] === '-' || sql[j + 1] === '+')) j++;
        j++;
      }
      tokens.push({ type: 'number', value: parseFloat(sql.slice(i, j)) });
      i = j;
      continue;
    }

    // Multi-char operators
    const twoChar = sql.slice(i, i + 2);
    if (twoChar === '<=' || twoChar === '>=' || twoChar === '!=' || twoChar === '<>') {
      tokens.push({ type: 'operator', value: twoChar });
      i += 2;
      continue;
    }

    // Single-char operators
    if ('=<>'.includes(sql[i])) {
      tokens.push({ type: 'operator', value: sql[i] });
      i++;
      continue;
    }

    // Punctuation
    if ('(),'.includes(sql[i])) {
      tokens.push({ type: 'punct', value: sql[i] });
      i++;
      continue;
    }

    // Star (used in SELECT * and COUNT(*))
    if (sql[i] === '*') {
      tokens.push({ type: 'star' });
      i++;
      continue;
    }

    // Identifier or keyword
    if (/[a-zA-Z_一-鿿]/.test(sql[i]) || sql[i] === '`') {
      let j = i;
      if (sql[i] === '`') {
        j++;
        while (j < sql.length && sql[j] !== '`') j++;
        tokens.push({ type: 'identifier', value: sql.slice(i + 1, j) });
        i = j + 1;
        continue;
      }
      while (j < sql.length && /[a-zA-Z0-9_一-鿿]/.test(sql[j])) j++;
      const word = sql.slice(i, j);
      const lower = word.toLowerCase();
      if (lower === 'true') {
        tokens.push({ type: 'boolean', value: true });
      } else if (lower === 'false') {
        tokens.push({ type: 'boolean', value: false });
      } else if (KEYWORDS.has(lower)) {
        tokens.push({ type: 'keyword', value: lower });
      } else {
        tokens.push({ type: 'identifier', value: word });
      }
      i = j;
      continue;
    }

    // Unknown char — skip (prevents infinite loop on bad input)
    i++;
  }

  return tokens;
}
