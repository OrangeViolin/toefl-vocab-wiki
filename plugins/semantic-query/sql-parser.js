/**
 * SQL 语法分析器 — semantic-query 插件
 *
 * 递归下降解析器，将 token 数组转为 AST。
 * 解析 SELECT / WHERE / GROUP BY / ORDER BY / LIMIT 子句。
 */

import { tokenize } from './sql-tokenizer.js';

export class ParseError extends Error {
  constructor(msg, token) {
    super(`${msg} (near token: ${JSON.stringify(token)})`);
    this.name = 'ParseError';
  }
}

export function parse(tokens) {
  let pos = 0;
  const peek = () => tokens[pos];
  const consume = () => tokens[pos++];
  const expect = (type, value) => {
    const t = peek();
    if (!t || t.type !== type || (value !== undefined && t.value !== value)) {
      throw new ParseError(`Expected ${type}${value ? ' ' + value : ''}, got ${JSON.stringify(t)}`, t);
    }
    return consume();
  };

  /** 检查下一个 token 是否为某 keyword（不消费） */
  const peekKeyword = (kw) => peek() && peek().type === 'keyword' && peek().value === kw;

  /** 可选 keyword：如果匹配则消费并返回 true */
  const matchKeyword = (kw) => {
    if (peekKeyword(kw)) { pos++; return true; }
    return false;
  };

  // ════════════════════════════════════════════════
  // 表达式解析（优先级：OR < AND < NOT < comparison）
  // ════════════════════════════════════════════════

  function parsePrimary() {
    const t = peek();
    if (!t) throw new ParseError('Unexpected end of statement', tokens[pos - 1]);

    if (t.type === 'string')  { consume(); return { type: 'string', value: t.value }; }
    if (t.type === 'number')  { consume(); return { type: 'number', value: t.value }; }
    if (t.type === 'boolean') { consume(); return { type: 'boolean', value: t.value }; }
    if (t.type === 'star')    { consume(); return { type: 'star' }; }

    if (t.type === 'identifier') {
      consume();
      if (peek() && peek().type === 'punct' && peek().value === '(') {
        return parseCall(t.value);
      }
      return { type: 'identifier', name: t.value };
    }

    // 聚合函数关键字：只有后面跟 ( 时才作为函数调用，否则作为标识符（别名引用）
    if (t.type === 'keyword' && ['count', 'sum', 'avg', 'min', 'max'].includes(t.value)) {
      consume();
      if (peek() && peek().type === 'punct' && peek().value === '(') {
        return parseCall(t.value);
      }
      return { type: 'identifier', name: t.value };
    }

    // 其他关键字在表达式上下文中作为标识符（避免别名引用时报错）
    if (t.type === 'keyword') {
      consume();
      return { type: 'identifier', name: t.value };
    }

    if (t.type === 'punct' && t.value === '(') {

    if (t.type === 'punct' && t.value === '(') {
      consume(); // '('
      const expr = parseOr();
      expect('punct', ')');
      return expr;
    }

    throw new ParseError(`Unexpected token: ${JSON.stringify(t)}`, t);
  }
  }

  function parseCall(name) {
    consume(); // '('
    let args = [];
    if (peek().type === 'star') {
      consume(); // '*'
      args = [{ type: 'star' }];
    } else if (peek().type === 'punct' && peek().value === ')') {
      // COUNT(*)
      args = [{ type: 'star' }];
    } else {
      args = [parseOr()];
    }
    expect('punct', ')');
    return { type: 'call', name: name.toLowerCase(), args };
  }

  function parseComparison() {
    let left = parsePrimary();
    const t = peek();
    if (!t) return left;

    // IS [NOT] NULL
    if (t.type === 'keyword' && t.value === 'is') {
      consume();
      const neg = matchKeyword('not');
      expect('keyword', 'null');
      return { type: 'isnull', neg, expr: left };
    }

    // [NOT] IN (...)
    if (t.type === 'keyword' && (t.value === 'in' || t.value === 'not')) {
      const neg = t.value === 'not';
      if (neg) { consume(); expect('keyword', 'in'); } else { consume(); }
      expect('punct', '(');
      const list = [];
      while (peek().type !== 'punct' || peek().value !== ')') {
        list.push(parseOr());
        if (peek().type === 'punct' && peek().value === ',') consume();
      }
      expect('punct', ')');
      return { type: 'in', neg, expr: left, list };
    }

    // LIKE
    if (t.type === 'keyword' && t.value === 'like') {
      consume();
      const right = parsePrimary();
      return { type: 'binary', op: 'like', left, right };
    }

    // =, !=, <>, <, <=, >, >=
    if (t.type === 'operator') {
      consume();
      const right = parsePrimary();
      return { type: 'binary', op: t.value, left, right };
    }

    return left;
  }

  function parseNot() {
    if (matchKeyword('not')) {
      const expr = parseComparison();
      return { type: 'unary', op: 'not', expr };
    }
    return parseComparison();
  }

  function parseAnd() {
    let left = parseNot();
    while (peekKeyword('and')) {
      consume();
      left = { type: 'binary', op: 'and', left, right: parseNot() };
    }
    return left;
  }

  function parseOr() {
    let left = parseAnd();
    while (peekKeyword('or')) {
      consume();
      left = { type: 'binary', op: 'or', left, right: parseAnd() };
    }
    return left;
  }

  // ════════════════════════════════════════════════
  // 语句解析
  // ════════════════════════════════════════════════

  /** 读取别名：可以是 identifier 或 keyword（如 AS count、AS type） */
  function parseAlias() {
    const t = peek();
    if (!t) throw new ParseError('Expected alias after AS', tokens[pos - 1]);
    if (t.type === 'identifier' || t.type === 'keyword') {
      pos++;
      return t.value;
    }
    throw new ParseError('Expected identifier or keyword after AS', t);
  }

  function parseColumn() {
    const expr = parseOr();
    let alias = null;
    if (peekKeyword('as')) {
      consume();
      alias = parseAlias();
    }
    return { expr, alias };
  }

  function parseColumnList() {
    const list = [parseColumn()];
    while (peek() && peek().type === 'punct' && peek().value === ',') {
      consume();
      list.push(parseColumn());
    }
    return list;
  }

  function parseOrderItem() {
    const expr = parseOr();
    let dir = 'asc';
    if (peekKeyword('asc')) { consume(); }
    else if (peekKeyword('desc')) { consume(); dir = 'desc'; }
    return { expr, dir };
  }

  function parseOrderList() {
    const list = [parseOrderItem()];
    while (peek() && peek().type === 'punct' && peek().value === ',') {
      consume();
      list.push(parseOrderItem());
    }
    return list;
  }

  // ── 主解析入口 ──

  const ast = {
    type: 'select',
    columns: null,
    where: null,
    groupBy: null,
    orderBy: null,
    limit: null,
  };

  // SELECT
  expect('keyword', 'select');
  ast.columns = parseColumnList();

  // WHERE (optional)
  if (peekKeyword('where')) {
    consume();
    ast.where = parseOr();
  }

  // GROUP BY (optional)
  if (peekKeyword('group')) {
    consume(); expect('keyword', 'by');
    ast.groupBy = [];
    ast.groupBy.push(parseOr());
    while (peek() && peek().type === 'punct' && peek().value === ',') {
      consume();
      ast.groupBy.push(parseOr());
    }
  }

  // ORDER BY (optional)
  if (peekKeyword('order')) {
    consume(); expect('keyword', 'by');
    ast.orderBy = parseOrderList();
  }

  // LIMIT (optional)
  if (peekKeyword('limit')) {
    consume();
    const t = expect('number');
    ast.limit = t.value;
  }

  return ast;
}

/** 便捷方法：tokenize + parse 一步完成 */
export function parseSQL(query) {
  const tokens = tokenize(query);
  if (tokens.length === 0) throw new ParseError('Empty query', null);
  return parse(tokens);
}
