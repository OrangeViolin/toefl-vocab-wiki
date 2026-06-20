/**
 * line-resolver.js — v2 history format: line-hash decoding utilities
 *
 * 992-bucket hash index: hash[0] + (ALPHABET.indexOf(hash[1]) % 16).hex
 * Ported from tongjian/docs/wiki/js/renderer.js
 */

const LINE_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const _cache = {};

export function hashBucket(hash) {
  return hash[0] + (LINE_ALPHABET.indexOf(hash[1]) % 16).toString(16);
}

export async function resolveLineHash(hash) {
  if (!hash) return '';
  const bucket = hashBucket(hash);
  if (!_cache[bucket]) {
    const r = await fetch(`line_index/${bucket}.jsonl`);
    if (!r.ok) return '';
    const text = await r.text();
    const map = {};
    for (const raw of text.split('\n')) {
      const s = raw.trim();
      if (!s) continue;
      try { const e = JSON.parse(s); map[e.h] = e.l; } catch (_) {}
    }
    _cache[bucket] = map;
  }
  return _cache[bucket][hash] || '';
}

export function applyDelta(ln, dl) {
  const result = ln.slice();
  for (const op of dl) {
    if (op[0] === 'del') result.splice(op[1], 1);
    else if (op[0] === 'ins') result.splice(op[1], 0, op[2]);
  }
  return result;
}

/**
 * Reconstruct full markdown for targetRevId by walking the snap→delta chain.
 * @param {object[]} entries - all history entries in ascending (oldest-first) order
 * @param {string} targetRevId - the id to reconstruct
 */
export async function reconstructContentV2(entries, targetRevId) {
  let ln = null;
  for (const e of entries) {
    const eid = e.id || e.rev_id;
    if (e.t === 'snap') {
      ln = e.ln.split(' ');
    } else if (e.t === 'delta' && ln) {
      ln = applyDelta(ln, e.dl);
    }
    if (eid === targetRevId) break;
  }
  if (!ln) return '';
  const lines = await Promise.all(ln.map(h => resolveLineHash(h)));
  return lines.join('\n');
}
