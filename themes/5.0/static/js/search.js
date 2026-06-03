/**
 * Search functionality for The Security Vault (theme 5.0)
 * Uses lunr.js for client-side full-text search.
 * Handles both:
 *   1. The search overlay (navbar search button)
 *   2. The /search page (full-page search)
 */

(function () {
  'use strict';

  // Build the lunr index once
  let idx = null;
  function buildIndex() {
    if (idx || !window.searchIndex) return;
    idx = lunr(function () {
      this.ref('id');
      this.field('title', { boost: 15 });
      this.field('tags');
      this.field('content', { boost: 10 });

      for (const key in window.searchIndex) {
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
    try {
      return idx.search(query.trim() + '*');
    } catch (e) {
      return idx.search(query.trim());
    }
  }

  // ─── Overlay search ──────────────────────────────────────────────────────────
  const overlayInput = document.getElementById('search');
  const overlayResults = document.getElementById('search-results');

  if (overlayInput && overlayResults) {
    overlayInput.addEventListener('input', function () {
      const q = this.value.trim();
      if (!q) { overlayResults.innerHTML = ''; return; }

      const results = getResults(q);
      if (!results.length) {
        overlayResults.innerHTML = '<p style="padding:16px 20px;color:#64748B;font-size:.875rem;">No results found.</p>';
        return;
      }

      const html = results.slice(0, 8).map(function (r) {
        const item = window.searchIndex[r.ref];
        if (!item) return '';
        const img = item.preview
          ? `<img src="${item.preview}" alt="" class="search-result-img" loading="lazy">`
          : '';
        return `<a href="${item.url}" class="search-result-item">
          ${img}
          <div>
            <div class="search-result-title">${escapeHtml(item.title)}</div>
            <div class="search-result-summary">${escapeHtml(stripTags(item.summary || ''))}</div>
          </div>
        </a>`;
      }).join('');

      overlayResults.innerHTML = html;
    });

    // Navigate to search page on Enter
    overlayInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && this.value.trim()) {
        e.preventDefault();
        window.location = '/search?q=' + encodeURIComponent(this.value.trim());
      }
    });
  }

  // ─── Search page ─────────────────────────────────────────────────────────────
  const pageInput = document.getElementById('search'); // reused id on search page
  const pageResults = document.getElementById('search-results');

  // The search page check: if we have a .search-page-input, wire up differently
  const searchPageInput = document.querySelector('.search-page-input');
  const searchPageResults = pageResults;

  if (searchPageInput && searchPageResults) {
    // Populate from URL query param on load
    const qParam = new URLSearchParams(window.location.search).get('q');
    if (qParam) {
      searchPageInput.value = qParam;
      renderPageResults(qParam, searchPageResults);
    }

    searchPageInput.addEventListener('input', function () {
      renderPageResults(this.value, searchPageResults);
    });
  }

  function renderPageResults(query, container) {
    if (!query || query.trim().length < 2) { container.innerHTML = ''; return; }
    const results = getResults(query);

    if (!results.length) {
      container.innerHTML = '<p class="search-empty" style="display:block">No results found for "' + escapeHtml(query) + '".</p>';
      return;
    }

    const html = results.map(function (r) {
      const item = window.searchIndex[r.ref];
      if (!item) return '';
      const img = item.preview
        ? `<a href="${item.url}" class="post-card-img-link" tabindex="-1" aria-hidden="true"><img src="${item.preview}" alt="" class="post-card-img" loading="lazy"></a>`
        : '';
      const summary = stripTags(item.summary || '').slice(0, 130);
      return `<article class="post-card">
        ${img}
        <div class="post-card-body">
          <h3 class="post-card-title"><a href="${item.url}">${escapeHtml(item.title)}</a></h3>
          <p class="post-card-excerpt">${escapeHtml(summary)}</p>
          <div class="post-card-meta"><a href="${item.url}" class="btn btn--ghost btn--sm">Read more →</a></div>
        </div>
      </article>`;
    }).join('');

    container.innerHTML = html;
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function stripTags(str) {
    return String(str).replace(/<[^>]*>/g, '');
  }

})();
