/**
 * search.js — client-side search (lunr.js).
 * Handles both the search overlay and the /search page.
 * No innerHTML — all DOM built via createElement/appendChild.
 */
(function () {
  'use strict';

  try {
    var idx = null;

    function buildIndex() {
      if (idx || !window.searchIndex) return;
      idx = lunr(function () {
        this.ref('id');
        this.field('title', { boost: 15 });
        this.field('tags');
        this.field('content', { boost: 10 });
        for (var key in window.searchIndex) {
          this.add({
            id: key,
            title: window.searchIndex[key].title,
            tags: (window.searchIndex[key].tags || []).join(' '),
            content: window.searchIndex[key].content
          });
        }
      });
    }

    function getResults(query) {
      if (!query || query.trim().length < 2) return [];
      buildIndex();
      if (!idx) return [];
      var results;
      try { results = idx.search(query.trim() + '*'); }
      catch (e) { results = idx.search(query.trim()); }
      results.sort(function (a, b) {
        var da = (window.searchIndex[a.ref] || {}).date || 0;
        var db = (window.searchIndex[b.ref] || {}).date || 0;
        return db - da;
      });
      return results;
    }

    // ── helpers ─────────────────────────────────────────────────────────────────
    function stripTags(str) {
      return String(str).replace(/<[^>]*>/g, '');
    }

    function escapeRegExp(str) {
      return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Build an excerpt with <mark> highlights. Returns a DocumentFragment.
    function buildExcerptFrag(item, query) {
      var term    = query.trim().toLowerCase();
      var content = stripTags(item.content || '');
      var i       = content.toLowerCase().indexOf(term);
      var frag    = document.createDocumentFragment();

      if (i !== -1) {
        var R      = 120;
        var start  = Math.max(0, i - R);
        var end    = Math.min(content.length, i + term.length + R);
        var snippet = content.slice(start, end);
        if (start > 0) frag.appendChild(document.createTextNode('…'));

        // Split snippet around all case-insensitive matches and highlight them
        var re    = new RegExp('(' + escapeRegExp(term) + ')', 'gi');
        var parts = snippet.split(re);
        parts.forEach(function (part) {
          if (part.toLowerCase() === term) {
            var mark = document.createElement('mark');
            mark.textContent = part;
            frag.appendChild(mark);
          } else {
            frag.appendChild(document.createTextNode(part));
          }
        });
        if (end < content.length) frag.appendChild(document.createTextNode('…'));
      } else {
        frag.appendChild(document.createTextNode(stripTags(item.summary || '').slice(0, 250)));
      }
      return frag;
    }

    // ── OVERLAY ──────────────────────────────────────────────────────────────────
    var overlayInput   = document.querySelector('.search-overlay-input');
    var overlayResults = document.querySelector('.search-overlay-results');

    if (overlayInput && overlayResults) {
      overlayInput.addEventListener('input', function () {
        var q = this.value.trim();
        // clear results
        while (overlayResults.firstChild) overlayResults.removeChild(overlayResults.firstChild);
        if (!q) return;

        var results = getResults(q);
        if (!results.length) {
          var empty = document.createElement('p');
          empty.style.cssText = 'padding:16px 20px;color:var(--color-muted);font-size:.875rem;';
          empty.textContent = 'No results found.';
          overlayResults.appendChild(empty);
          return;
        }

        results.slice(0, 8).forEach(function (r) {
          var item = window.searchIndex[r.ref];
          if (!item) return;

          var a = document.createElement('a');
          a.href = item.url;
          a.className = 'search-result-item';

          if (item.preview) {
            var img = document.createElement('img');
            img.src = item.preview;
            img.alt = '';
            img.className = 'search-result-img';
            img.loading = 'lazy';
            a.appendChild(img);
          }

          var info = document.createElement('div');

          var title = document.createElement('div');
          title.className = 'search-result-title';
          title.textContent = item.title;
          info.appendChild(title);

          var summary = document.createElement('div');
          summary.className = 'search-result-summary';
          summary.textContent = stripTags(item.summary || '');
          info.appendChild(summary);

          a.appendChild(info);
          overlayResults.appendChild(a);
        });
      });

      overlayInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && this.value.trim()) {
          e.preventDefault();
          window.location.href = '/search?q=' + encodeURIComponent(this.value.trim());
        }
      });
    }

    // ── SEARCH PAGE ──────────────────────────────────────────────────────────────
    var searchPageInput   = document.querySelector('.search-page-input');
    var searchPageResults = document.querySelector('.search-page-results');

    if (searchPageInput && searchPageResults) {
      var qParam = new URLSearchParams(window.location.search).get('q');
      if (qParam) {
        searchPageInput.value = qParam;
        renderPageResults(qParam, searchPageResults);
      }
      searchPageInput.addEventListener('input', function () {
        renderPageResults(this.value, searchPageResults);
      });
    }

    function renderPageResults(query, container) {
      while (container.firstChild) container.removeChild(container.firstChild);
      if (!query || query.trim().length < 2) return;

      var results = getResults(query);
      if (!results.length) {
        var empty = document.createElement('p');
        empty.className = 'search-empty';
        empty.style.display = 'block';
        empty.textContent = 'No results found for "' + query + '".';
        container.appendChild(empty);
        return;
      }

      results.forEach(function (r) {
        var item = window.searchIndex[r.ref];
        if (!item) return;

        var article = document.createElement('article');
        article.className = 'post-card';

        if (item.preview) {
          var imgLink = document.createElement('a');
          imgLink.href = item.url;
          imgLink.className = 'post-card-img-link';
          imgLink.tabIndex = -1;
          imgLink.setAttribute('aria-hidden', 'true');
          var img = document.createElement('img');
          img.src = item.preview;
          img.alt = '';
          img.className = 'post-card-img';
          img.loading = 'lazy';
          imgLink.appendChild(img);
          article.appendChild(imgLink);
        }

        var body = document.createElement('div');
        body.className = 'post-card-body';

        var h3 = document.createElement('h3');
        h3.className = 'post-card-title';
        var titleLink = document.createElement('a');
        titleLink.href = item.url;
        titleLink.textContent = item.title;
        h3.appendChild(titleLink);
        body.appendChild(h3);

        var excerpt = document.createElement('p');
        excerpt.className = 'post-card-excerpt';
        excerpt.appendChild(buildExcerptFrag(item, query));
        body.appendChild(excerpt);

        var meta = document.createElement('div');
        meta.className = 'post-card-meta';
        var readMore = document.createElement('a');
        readMore.href = item.url;
        readMore.className = 'btn btn--ghost btn--sm';
        readMore.textContent = 'Read more →';
        meta.appendChild(readMore);
        body.appendChild(meta);

        article.appendChild(body);
        container.appendChild(article);
      });
    }

  } catch (e) {
    if (typeof console !== 'undefined') console.warn('[search]', e);
  }
})();
