/** toc.js — floating table of contents for post pages. */
(function () {
  'use strict';
  try {
    var panel = document.getElementById('tocPanel');
    var nav   = document.getElementById('tocNav');
    if (!panel || !nav) return;

    var headings = document.querySelectorAll('.prose h2, .prose h3, .prose h4');
    if (headings.length < 2) { panel.style.display = 'none'; return; }

    var items = [];
    headings.forEach(function (h) {
      if (!h.id) return;
      var a = document.createElement('a');
      a.href = '#' + h.id;
      a.className = 'toc-link toc-link--' + h.tagName.toLowerCase();
      var clone = h.cloneNode(true);
      var icon  = clone.querySelector('.heading-anchor');
      if (icon) icon.remove();
      a.textContent = clone.textContent.trim();
      a.title = a.textContent;
      nav.appendChild(a);
      items.push({ id: h.id, el: h, link: a });
    });

    var activeId = null;
    function setActive(id) {
      if (id === activeId) return;
      activeId = id;
      items.forEach(function (item) {
        item.link.classList.toggle('is-active', item.id === id);
      });
    }

    var OFFSET = 80;
    function onScroll() {
      var current = items[0] && items[0].id;
      for (var i = 0; i < items.length; i++) {
        if (items[i].el.getBoundingClientRect().top < OFFSET) current = items[i].id;
      }
      if (current) setActive(current);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  } catch (e) {
    if (typeof console !== 'undefined') console.warn('[toc]', e);
  }
})();
