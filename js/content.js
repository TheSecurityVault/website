/** content.js — external links open in new tab; heading anchor icons. */
(function () {
  'use strict';
  try {
    // External links
    document.querySelectorAll('a[href]').forEach(function (a) {
      var href = a.getAttribute('href');
      if (href && href.indexOf('http') === 0 && href.indexOf(window.location.origin) !== 0) {
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer');
      }
    });

    // Heading anchors — build SVG via DOM, no innerHTML
    document.querySelectorAll('.prose h2, .prose h3, .prose h4').forEach(function (h) {
      if (!h.id) return;
      var a = document.createElement('a');
      a.href = '#' + h.id;
      a.className = 'heading-anchor';
      a.setAttribute('aria-hidden', 'true');

      var NS = 'http://www.w3.org/2000/svg';
      var svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('width', '16');
      svg.setAttribute('height', '16');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'currentColor');
      svg.setAttribute('stroke-width', '2');
      svg.setAttribute('stroke-linecap', 'round');
      svg.setAttribute('stroke-linejoin', 'round');

      var p1 = document.createElementNS(NS, 'path');
      p1.setAttribute('d', 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71');
      var p2 = document.createElementNS(NS, 'path');
      p2.setAttribute('d', 'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71');

      svg.appendChild(p1);
      svg.appendChild(p2);
      a.appendChild(svg);
      h.appendChild(a);
    });
  } catch (e) {
    if (typeof console !== 'undefined') console.warn('[content]', e);
  }
})();
