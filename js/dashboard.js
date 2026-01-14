/**
 * ENGL 170 Blog Network Dashboard
 * Client-side logic for displaying and filtering aggregated posts
 * Redesigned with editorial magazine aesthetic
 */

(function () {
  'use strict';

  let allPosts = [];
  let authors = new Set();
  let totalBlogs = 0;

  // DOM Elements
  const postFeed = document.getElementById('post-feed');
  const featuredSection = document.getElementById('featured-section');
  const authorFilter = document.getElementById('author-filter');
  const dateFilter = document.getElementById('date-filter');
  const statusText = document.getElementById('status-text');
  const lastUpdate = document.getElementById('last-update');
  const networkStats = document.getElementById('network-stats');

  // Initialize
  async function init() {
    try {
      await loadPosts();
      setupFilters();
      renderPosts();
      renderStats();
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
    totalBlogs = data.totalBlogs || 0;

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
      featuredSection.innerHTML = '';
      showEmpty();
    } else {
      // Render featured post (most recent)
      renderFeatured(filtered[0]);

      // Render remaining posts in grid
      const remainingPosts = filtered.slice(1);
      if (remainingPosts.length > 0) {
        postFeed.innerHTML = remainingPosts.map((post, index) =>
          renderPostCard(post, index)
        ).join('');
      } else {
        postFeed.innerHTML = '';
      }
    }
  }

  // Render featured post
  function renderFeatured(post) {
    const isInstructor = post.authorRole === 'instructor';
    const dateDisplay = post.date || 'Date unknown';

    featuredSection.innerHTML = `
      <article class="featured-card">
        <span class="featured-label">Latest</span>
        <div class="featured-content">
          <h2 class="featured-title">
            <a href="${escapeHtml(post.url)}" target="_blank" rel="noopener">${escapeHtml(post.title)}</a>
          </h2>
          <div class="featured-meta">
            <p class="featured-author">
              by <span class="name">${escapeHtml(post.author)}</span>
              ${isInstructor ? '<span class="instructor-tag">Instructor</span>' : ''}
            </p>
            <p class="featured-date">${escapeHtml(dateDisplay)}</p>
          </div>
        </div>
        <div class="featured-visual"></div>
      </article>
    `;
  }

  // Render a single post card
  function renderPostCard(post, index) {
    const isInstructor = post.authorRole === 'instructor';
    const cardClass = isInstructor ? 'post-card instructor' : 'post-card';
    const dateDisplay = post.date || 'Date unknown';

    return `
      <article class="${cardClass}" style="animation-delay: ${0.05 + (index * 0.05)}s">
        <h2 class="post-title">
          <a href="${escapeHtml(post.url)}" target="_blank" rel="noopener">${escapeHtml(post.title)}</a>
        </h2>
        <div class="post-meta">
          <span class="post-author">
            <span class="author-indicator"></span>
            <span class="post-author-name">${escapeHtml(post.author)}</span>
            ${isInstructor ? '<span class="instructor-tag">Instructor</span>' : ''}
          </span>
          <span class="post-date">${escapeHtml(dateDisplay)}</span>
        </div>
        <a class="post-link" href="${escapeHtml(post.url)}" target="_blank" rel="noopener">
          Read post <span class="post-link-arrow">→</span>
        </a>
      </article>
    `;
  }

  // Render network statistics
  function renderStats() {
    const studentPosts = allPosts.filter(p => p.authorRole !== 'instructor').length;
    const instructorPosts = allPosts.filter(p => p.authorRole === 'instructor').length;

    networkStats.innerHTML = `
      <div class="stat-item">
        <span class="stat-value">${allPosts.length}</span>
        <span class="stat-label">Total Posts</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">${totalBlogs}</span>
        <span class="stat-label">Active Blogs</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">${authors.size}</span>
        <span class="stat-label">Writers</span>
      </div>
    `;
  }

  // Update status text
  function updateStatus(showing, total) {
    if (showing === total) {
      statusText.innerHTML = `<span class="count">${total}</span> post${total !== 1 ? 's' : ''} in the network`;
    } else {
      statusText.innerHTML = `Showing <span class="count">${showing}</span> of ${total}`;
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
    featuredSection.innerHTML = '';
    postFeed.innerHTML = `
      <div class="error-state">
        <h3>Unable to load posts</h3>
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
