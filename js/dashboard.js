/**
 * ENGL 170 Blog Network Dashboard
 * Client-side logic for displaying and filtering aggregated posts
 */

(function () {
  'use strict';

  let allPosts = [];
  let authors = new Set();

  // DOM Elements
  const postFeed = document.getElementById('post-feed');
  const authorFilter = document.getElementById('author-filter');
  const dateFilter = document.getElementById('date-filter');
  const statusText = document.getElementById('status-text');
  const lastUpdate = document.getElementById('last-update');

  // Initialize
  async function init() {
    try {
      await loadPosts();
      setupFilters();
      renderPosts();
    } catch (error) {
      showError(error.message);
    }
  }

  // Load posts from JSON file
  async function loadPosts() {
    const response = await fetch('data/posts.json');

    if (!response.ok) {
      throw new Error('Could not load posts. The data file may not exist yet.');
    }

    const data = await response.json();

    allPosts = data.posts || [];

    // Collect unique authors
    allPosts.forEach(post => {
      if (post.author) {
        authors.add(post.author);
      }
    });

    // Update last updated time
    if (data.lastUpdated) {
      const date = new Date(data.lastUpdated);
      lastUpdate.textContent = formatRelativeTime(date);
    }
  }

  // Setup filter dropdowns
  function setupFilters() {
    // Populate author dropdown
    const sortedAuthors = Array.from(authors).sort((a, b) => {
      // Put instructor first
      const aPost = allPosts.find(p => p.author === a);
      const bPost = allPosts.find(p => p.author === b);
      if (aPost?.authorRole === 'instructor') return -1;
      if (bPost?.authorRole === 'instructor') return 1;
      return a.localeCompare(b);
    });

    sortedAuthors.forEach(author => {
      const option = document.createElement('option');
      option.value = author;
      option.textContent = author;
      authorFilter.appendChild(option);
    });

    // Event listeners
    authorFilter.addEventListener('change', renderPosts);
    dateFilter.addEventListener('change', renderPosts);
  }

  // Render posts based on current filters
  function renderPosts() {
    const selectedAuthor = authorFilter.value;
    const selectedDays = dateFilter.value;

    let filtered = [...allPosts];

    // Filter by author
    if (selectedAuthor !== 'all') {
      filtered = filtered.filter(post => post.author === selectedAuthor);
    }

    // Filter by date
    if (selectedDays !== 'all') {
      const days = parseInt(selectedDays, 10);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);

      filtered = filtered.filter(post => {
        if (!post.dateISO) return true; // Show posts without dates
        const postDate = new Date(post.dateISO);
        return postDate >= cutoff;
      });
    }

    // Update status
    updateStatus(filtered.length, allPosts.length);

    // Render
    if (filtered.length === 0) {
      showEmpty();
    } else {
      postFeed.innerHTML = filtered.map(renderPostCard).join('');
    }
  }

  // Render a single post card
  function renderPostCard(post) {
    const isInstructor = post.authorRole === 'instructor';
    const cardClass = isInstructor ? 'post-card instructor' : 'post-card';
    const badge = isInstructor ? '<span class="instructor-badge">Instructor</span>' : '';

    const dateDisplay = post.date || 'Date unknown';

    return `
      <article class="${cardClass}">
        <h2><a href="${escapeHtml(post.url)}" target="_blank" rel="noopener">${escapeHtml(post.title)}</a></h2>
        <p class="meta">
          <span class="author">${escapeHtml(post.author)}</span>${badge}
          &middot; ${escapeHtml(dateDisplay)}
        </p>
        <a class="read-link" href="${escapeHtml(post.url)}" target="_blank" rel="noopener">Read post &rarr;</a>
      </article>
    `;
  }

  // Update status text
  function updateStatus(showing, total) {
    if (showing === total) {
      statusText.innerHTML = `Showing <span class="count">${total}</span> post${total !== 1 ? 's' : ''}`;
    } else {
      statusText.innerHTML = `Showing <span class="count">${showing}</span> of ${total} posts`;
    }
  }

  // Show empty state
  function showEmpty() {
    postFeed.innerHTML = `
      <div class="empty-state">
        <h3>No posts found</h3>
        <p>Try adjusting your filters or check back later.</p>
      </div>
    `;
  }

  // Show error state
  function showError(message) {
    statusText.textContent = '';
    postFeed.innerHTML = `
      <div class="error-state">
        <p><strong>Unable to load posts</strong></p>
        <p>${escapeHtml(message)}</p>
      </div>
    `;
  }

  // Format relative time
  function formatRelativeTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  // Escape HTML to prevent XSS
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Start
  document.addEventListener('DOMContentLoaded', init);
})();
