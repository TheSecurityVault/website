/** search-ui.js — search overlay open/close (Cmd+K, Escape). */
(function () {
  'use strict';
  try {
    var searchOpen    = document.getElementById('searchOpen');
    var searchOverlay = document.getElementById('searchOverlay');
    var searchClose   = document.getElementById('searchClose');
    var searchInput   = document.getElementById('search');

    if (!searchOpen || !searchOverlay) return;

    function openSearch() {
      searchOverlay.classList.add('search-overlay--open');
      document.body.style.overflow = 'hidden';
      setTimeout(function () { if (searchInput) searchInput.focus(); }, 100);
    }
    function closeSearch() {
      searchOverlay.classList.remove('search-overlay--open');
      document.body.style.overflow = '';
    }

    searchOpen.addEventListener('click', openSearch);
    if (searchClose) searchClose.addEventListener('click', closeSearch);
    searchOverlay.addEventListener('click', function (e) {
      if (e.target === searchOverlay) closeSearch();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeSearch();
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); openSearch(); }
    });
  } catch (e) {
    if (typeof console !== 'undefined') console.warn('[search-ui]', e);
  }
})();
