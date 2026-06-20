/**
 * autolink 插件 — 自动 wikilink
 *
 * 默认关闭。通过 core.settings.autoWikilink 或 URL ?autolink=1 开启。
 * topnav 中的"自动链接：关/开"按钮调用 core.setSetting('autoWikilink', bool)。
 *
 * onBeforeRender hook 在 MD 渲染前对正文做自动 wikilink 替换。
 * 单字 CJK wikilink 需两侧都不是 CJK 汉字才链接。
 */

// Unicode 私用区占位符
const PH_OPEN = '';
const PH_CLOSE = '';

// 保护区域正则：代码块、行内代码、标题、已有 wikilink、Markdown 链接/图片、PN 定义/引注
const PROTECTED_RE = /```[\s\S]*?```|`[^`]+`|^#{1,6} .*$|\[\[[^\[\]]+?\]\]|!?\[[^\[\]]*\]\([^)]+\)|（\d{3}-\d{3}）|\[\d{3}-\d{3}\]/gm;

const CJK_START = 0x4E00;
const CJK_END   = 0x9FFF;

function isCJK(ch) {
  if (!ch) return false;
  const cp = ch.charCodeAt(0);
  return cp >= CJK_START && cp <= CJK_END;
}

let _trie = null;

function buildTrie(aliasIndex) {
  const root = {};
  for (const [term, canonical] of Object.entries(aliasIndex)) {
    let node = root;
    for (const ch of term) {
      if (!node[ch]) node[ch] = {};
      node = node[ch];
    }
    node.$ = canonical;
  }
  return root;
}

function scanAndLink(text) {
  const out = [];
  let i = 0;
  const trie = _trie;
  if (!trie) return text;

  while (i < text.length) {
    let node = trie;
    let bestMatch = null;
    for (let j = i; j < text.length; j++) {
      const ch = text[j];
      if (!node[ch]) break;
      node = node[ch];
      if (node.$) bestMatch = { start: i, end: j + 1, target: node.$ };
    }
    if (bestMatch) {
      const matchedText = text.slice(bestMatch.start, bestMatch.end);
      const isSingleCJK = matchedText.length === 1 && isCJK(matchedText);
      if (isSingleCJK) {
        const prevCh = i > 0 ? text[i - 1] : null;
        const nextCh = bestMatch.end < text.length ? text[bestMatch.end] : null;
        if (isCJK(prevCh) || isCJK(nextCh)) { out.push(text[i]); i++; continue; }
      }
      out.push(matchedText === bestMatch.target
        ? `[[${matchedText}]]`
        : `[[${bestMatch.target}|${matchedText}]]`);
      i = bestMatch.end;
    } else {
      out.push(text[i]); i++;
    }
  }
  return out.join('');
}

function splitProtectedZones(body) {
  const segments = [];
  let lastEnd = 0;
  PROTECTED_RE.lastIndex = 0;
  let m;
  while ((m = PROTECTED_RE.exec(body)) !== null) {
    if (m.index > lastEnd) segments.push({ type: 'text', content: body.slice(lastEnd, m.index) });
    segments.push({ type: 'protected', content: m[0] });
    lastEnd = m.index + m[0].length;
  }
  if (lastEnd < body.length) segments.push({ type: 'text', content: body.slice(lastEnd) });
  return segments;
}

function autoWikilink(body, registry) {
  if (!_trie) _trie = buildTrie(registry.alias_index);
  const segments = splitProtectedZones(body);
  return segments.map(seg => seg.type === 'text' ? scanAndLink(seg.content) : seg.content).join('');
}

export default {
  init(core, { STORAGE_KEY = 'wiki-autolink' } = {}) {
    core.hooks.onBeforeRender.add((body) => {
      const enabled = core.settings?.autoWikilink
        || new URLSearchParams(location.search).get('autolink') === '1';
      if (!enabled || !core.registry) return body;
      return autoWikilink(body, core.registry);
    });

    const saved = localStorage.getItem(STORAGE_KEY) === 'true';
    if (saved) core.setSetting('autoWikilink', true);

    document.dispatchEvent(new Event('wiki:coreReady'));
  },
};
