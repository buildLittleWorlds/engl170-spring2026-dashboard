#!/usr/bin/env node

/**
 * ENGL 170 Blog Network Scraper
 *
 * Fetches index pages from all course blogs and extracts post metadata.
 * Outputs aggregated data to data/posts.json
 */

const fs = require('fs');
const path = require('path');

// Simple HTML parsing helpers (no external dependencies)
function extractText(html, startTag, endTag) {
  const startIdx = html.indexOf(startTag);
  if (startIdx === -1) return null;
  const contentStart = startIdx + startTag.length;
  const endIdx = html.indexOf(endTag, contentStart);
  if (endIdx === -1) return null;
  return html.slice(contentStart, endIdx);
}

function parsePostList(html, baseUrl) {
  const posts = [];

  // Look for post-list class or fall back to any ul with links
  let listHtml = extractText(html, '<ul class="post-list">', '</ul>');
  if (!listHtml) {
    // Try finding main content area
    listHtml = extractText(html, '<main>', '</main>') || html;
  }

  // Extract all list items with links
  const liPattern = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let match;

  while ((match = liPattern.exec(listHtml)) !== null) {
    const liContent = match[1];

    // Extract link
    const linkMatch = /<a\s+href="([^"]+)"[^>]*>([^<]+)<\/a>/i.exec(liContent);
    if (!linkMatch) continue;

    const href = linkMatch[1];
    const title = linkMatch[2].trim();

    // Skip non-post links (about, index, etc.)
    if (href === 'index.html' || href === 'about.html' || href.startsWith('http')) continue;

    // Extract date from .date span or other patterns
    let date = null;
    const dateSpanMatch = /<span[^>]*class="date"[^>]*>([^<]+)<\/span>/i.exec(liContent);
    if (dateSpanMatch) {
      date = dateSpanMatch[1].trim();
    } else {
      // Try to find any date-like text
      const datePattern = /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/i;
      const dateMatch = datePattern.exec(liContent);
      if (dateMatch) {
        date = dateMatch[0];
      }
    }

    // Construct full URL (ensure baseUrl ends with / for proper resolution)
    const base = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
    const fullUrl = new URL(href, base).href;

    posts.push({
      title,
      url: fullUrl,
      date,
      dateISO: date ? parseDate(date) : null
    });
  }

  return posts;
}

function parseDate(dateStr) {
  try {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
  } catch (e) {
    // Ignore parsing errors
  }
  return null;
}

async function fetchBlog(blog) {
  const indexUrl = blog.url.endsWith('/') ? `${blog.url}index.html` : `${blog.url}/index.html`;

  try {
    console.log(`Fetching: ${indexUrl}`);
    const response = await fetch(indexUrl, {
      headers: {
        'User-Agent': 'ENGL170-Blog-Aggregator/1.0'
      }
    });

    if (!response.ok) {
      console.error(`  Error: HTTP ${response.status} for ${blog.author}`);
      return { blog, posts: [], error: `HTTP ${response.status}` };
    }

    const html = await response.text();
    const posts = parsePostList(html, blog.url);

    console.log(`  Found ${posts.length} posts from ${blog.author}`);

    return {
      blog,
      posts: posts.map(post => ({
        ...post,
        author: blog.author,
        authorRole: blog.role,
        blogUrl: blog.url
      }))
    };
  } catch (error) {
    console.error(`  Error fetching ${blog.author}: ${error.message}`);
    return { blog, posts: [], error: error.message };
  }
}

async function main() {
  const configPath = path.join(__dirname, '..', 'config.json');
  const outputPath = path.join(__dirname, '..', 'data', 'posts.json');

  // Read config
  console.log('Reading config...');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  // Filter to only active blogs (active defaults to true if not specified)
  const activeBlogs = config.blogs.filter(blog => blog.active !== false);

  // Fetch all blogs in parallel
  console.log(`\nFetching ${activeBlogs.length} active blog(s) (${config.blogs.length - activeBlogs.length} inactive)...\n`);
  const results = await Promise.all(activeBlogs.map(fetchBlog));

  // Aggregate all posts
  const allPosts = results.flatMap(r => r.posts);

  // Sort by date (newest first)
  allPosts.sort((a, b) => {
    if (!a.dateISO && !b.dateISO) return 0;
    if (!a.dateISO) return 1;
    if (!b.dateISO) return -1;
    return b.dateISO.localeCompare(a.dateISO);
  });

  // Build output
  const output = {
    lastUpdated: new Date().toISOString(),
    course: config.course,
    semester: config.semester,
    totalPosts: allPosts.length,
    totalBlogs: activeBlogs.length,
    blogsWithErrors: results.filter(r => r.error).map(r => ({
      author: r.blog.author,
      error: r.error
    })),
    posts: allPosts
  };

  // Write output
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`\nWrote ${allPosts.length} posts to ${outputPath}`);

  // Summary
  if (output.blogsWithErrors.length > 0) {
    console.log('\nBlogs with errors:');
    output.blogsWithErrors.forEach(b => {
      console.log(`  - ${b.author}: ${b.error}`);
    });
  }
}

main().catch(console.error);
