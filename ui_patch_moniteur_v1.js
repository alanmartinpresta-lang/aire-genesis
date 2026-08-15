/* AIRE Genesis — loader V2 */
(() => {
  'use strict';

  if (window.__AIRE_MONITEUR_V2_LOADER__) return;
  window.__AIRE_MONITEUR_V2_LOADER__ = true;

  const load = () => {
    if (window.AIRE_MONITEUR_V2) return;

    const s = document.createElement('script');
    s.src = 'ui_patch_moniteur_v2.js?v=3';
    s.async = false;

    document.head.appendChild(s);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load, { once: true });
  } else {
    load();
  }
})();
