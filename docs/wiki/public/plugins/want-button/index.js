/**
 * want-button — 「想要此页面」开发工具插件
 *
 * 仅在 localhost 下生效。
 * 在 core 上挂载 core.injectWantButton(pid)，
 * renderer.js 的 renderNotFound 调用它为 404 页面注入按钮。
 */

export default {
  init(core) {
    if (!isLocalhost()) return;
    core.injectWantButton = (pid) => injectWantButton(core, pid);
  },
};

function isLocalhost() {
  return location.hostname === 'localhost' || location.hostname === '127.0.0.1';
}

function injectWantButton(core, pid) {
  const t = k => core.t?.(k) ?? k;
  const btn = document.createElement('button');
  btn.className = 'want-btn';
  btn.textContent = t('want_button');
  btn.title = t('want_title');
  btn.addEventListener('click', async () => {
    btn.disabled = true;
    btn.textContent = t('want_submitting');
    try {
      const res = await fetch('/api/want?page=' + encodeURIComponent(pid));
      const data = await res.json();
      if (data.added) {
        btn.textContent = t('want_queued');
        btn.classList.add('want-btn--done');
      } else {
        btn.textContent = t('want_exists');
        btn.classList.add('want-btn--exists');
      }
    } catch {
      btn.textContent = t('want_failed');
      btn.disabled = false;
    }
  });
  const article = document.getElementById('article');
  if (article) article.appendChild(btn);
}
