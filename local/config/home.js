// Home page plugin configuration
export const CORE_FEATURED = [];
export const PREFACE_IDS = [];
export const APPENDIX_IDS = [];
export const HOME_SECTIONS = [
  { label: '核心词汇', tag: '核心词汇', type: 'word', featuredOnly: false, limit: 12 },
  { label: '词根词缀', tag: '词根', type: 'root', featuredOnly: false, limit: 8 },
];
export const SKIP_TYPES = new Set(['chapter', 'list', 'overview']);
