/**
 * page-marker — print-page boundary annotation plugin
 *
 * Syntax: [p:N]  — marks where print page N begins
 *
 * Renders [p:N] as <span id="page-N" class="page-marker">, enabling
 * anchor links of the form #page-N or #PageId$page-N to navigate correctly.
 *
 * Hook: onAfterRender
 */

const PLUGIN_NAME = 'page-marker';

const RE_PAGE_MARKER = /\[p:(\d+)\]/g;

function expandMarkers(html) {
  return html.replace(RE_PAGE_MARKER, (_match, n) =>
    `<span id="page-${n}" class="page-marker" data-page="${n}" aria-label="p.${n}" title="p.${n}">${n}</span>`
  );
}

export default {
  name: PLUGIN_NAME,
  version: '1.0.0',

  async init(core) {
    const style = document.createElement('style');
    style.textContent = `
      .page-marker {
        display: none;
        color: var(--fg-subtle, #aaa);
        font-size: 0.6em;
        font-family: var(--mono, monospace);
        user-select: none;
        scroll-margin-top: 60px;
      }

      @media (min-width: 1200px) {
        article[data-type="chapter"] .page-marker {
          display: inline-block;
          vertical-align: middle;
          font-size: 0.58em;
          line-height: 1.6;
          padding: 0 0.4em;
          margin-right: 0.3em;
          background: color-mix(in srgb, var(--accent, #4a6fa5) 20%, transparent);
          color: var(--accent, #4a6fa5);
          border-radius: 3px;
          transition: background 0.15s;
        }
        article[data-type="chapter"] .page-marker:hover {
          background: color-mix(in srgb, var(--accent, #4a6fa5) 35%, transparent);
        }
      }

      @media print {
        .page-marker {
          display: inline;
          color: #999;
          font-size: 0.6em;
          vertical-align: super;
        }
      }
    `;
    document.head.appendChild(style);

    core.hooks.onAfterRender.add((html) => expandMarkers(html));
  },
};
