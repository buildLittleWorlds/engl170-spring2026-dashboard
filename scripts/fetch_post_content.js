const fs = require('fs');
const path = require('path');

/**
 * ENGL 170 Post Content Fetcher & Tracker
 *
 * - Fetches full text of NEW posts only (skips existing)
 * - Saves text to data/posts_text/
 * - Updates data/student-posts.json with posting history
 *
 * Run via cron every 15 minutes, or manually as needed.
 */

async function fetchPostContent() {
    const postsPath = path.join(__dirname, '..', 'data', 'posts.json');
    const configPath = path.join(__dirname, '..', 'config.json');
    const outputDir = path.join(__dirname, '..', 'data', 'posts_text');
    const trackingPath = path.join(__dirname, '..', 'data', 'student-posts.json');

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Load posts data and config
    const postsData = JSON.parse(fs.readFileSync(postsPath, 'utf8'));
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const posts = postsData.posts;

    // Load or initialize tracking data
    let tracking = loadOrInitializeTracking(trackingPath, config);

    // Backfill tracking from posts.json for posts we already have text for
    backfillTracking(tracking, posts, outputDir);

    console.log(`Found ${posts.length} posts to check.`);

    let newPostsCount = 0;

    for (const post of posts) {
        // Skip instructor posts for tracking (but still fetch content)
        const isStudent = post.authorRole === 'student';

        if (!post.url || post.url.endsWith('#')) {
            console.log(`Skipping invalid URL for: ${post.title}`);
            continue;
        }

        const safeTitle = post.title.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 50);
        const safeAuthor = post.author.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const dateStr = post.dateISO || 'unknown_date';
        const filename = `${safeAuthor}_${dateStr}_${safeTitle}.txt`;
        const filePath = path.join(outputDir, filename);

        // Check if we already have this post
        if (fs.existsSync(filePath)) {
            continue;
        }

        // New post - fetch it
        try {
            console.log(`Fetching: ${post.title} by ${post.author}`);
            const response = await fetch(post.url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const html = await response.text();

            const text = extractContent(html);

            fs.writeFileSync(filePath, text);
            console.log(`  Saved to ${filename}`);
            newPostsCount++;

            // Update tracking for students
            if (isStudent && post.dateISO) {
                addPostToTracking(tracking, post.author, {
                    date: post.dateISO,
                    title: post.title,
                    file: filename
                });
            }

        } catch (error) {
            console.error(`  Error processing ${post.title}: ${error.message}`);
        }
    }

    // Update tracking timestamp and save
    tracking.lastUpdated = new Date().toISOString();
    fs.writeFileSync(trackingPath, JSON.stringify(tracking, null, 2));

    console.log(`\nDone. ${newPostsCount} new posts fetched.`);
    console.log(`Tracking saved to: ${trackingPath}`);
}

/**
 * Load existing tracking data or initialize from config
 */
function loadOrInitializeTracking(trackingPath, config) {
    if (fs.existsSync(trackingPath)) {
        return JSON.parse(fs.readFileSync(trackingPath, 'utf8'));
    }

    // Initialize with all students from config
    const tracking = {
        lastUpdated: new Date().toISOString(),
        students: {}
    };

    for (const blog of config.blogs) {
        if (blog.role === 'student') {
            tracking.students[blog.author] = {
                url: blog.url,
                posts: []
            };
        }
    }

    return tracking;
}

/**
 * Backfill tracking from posts.json for posts we already have text files for
 */
function backfillTracking(tracking, posts, outputDir) {
    for (const post of posts) {
        if (post.authorRole !== 'student' || !post.dateISO) continue;

        const safeTitle = post.title.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 50);
        const safeAuthor = post.author.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const filename = `${safeAuthor}_${post.dateISO}_${safeTitle}.txt`;
        const filePath = path.join(outputDir, filename);

        // If we have the text file, add to tracking
        if (fs.existsSync(filePath)) {
            addPostToTracking(tracking, post.author, {
                date: post.dateISO,
                title: post.title,
                file: filename
            });
        }
    }
}

/**
 * Add a post to student's tracking record (avoid duplicates)
 */
function addPostToTracking(tracking, author, postInfo) {
    if (!tracking.students[author]) {
        tracking.students[author] = { url: '', posts: [] };
    }

    // Check for duplicate (same date and title)
    const exists = tracking.students[author].posts.some(
        p => p.date === postInfo.date && p.title === postInfo.title
    );

    if (!exists) {
        tracking.students[author].posts.push(postInfo);
        // Sort posts by date (newest first)
        tracking.students[author].posts.sort((a, b) => b.date.localeCompare(a.date));
    }
}

/**
 * Extract readable text content from HTML
 */
function extractContent(html) {
    // 1. Isolate main content if possible to reduce noise
    let content = html;
    const mainMatch = /<main[^>]*>([\s\S]*?)<\/main>/i.exec(html) ||
                      /<article[^>]*>([\s\S]*?)<\/article>/i.exec(html) ||
                      /<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i.exec(html);

    if (mainMatch) {
        content = mainMatch[1];
    } else {
        // Fallback: try to remove header/footer/nav manually
        content = content.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
                         .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
                         .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '');
    }

    // 2. Remove scripts and styles
    content = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                     .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

    // 3. Convert block elements to newlines
    content = content.replace(/<\/p>/gi, '\n\n')
                     .replace(/<br\s*\/?>/gi, '\n')
                     .replace(/<\/div>/gi, '\n')
                     .replace(/<\/li>/gi, '\n')
                     .replace(/<\/h[1-6]>/gi, '\n\n');

    // 4. Strip remaining tags
    content = content.replace(/<[^>]+>/g, '');

    // 5. Decode common entities
    content = content.replace(/&nbsp;/g, ' ')
                     .replace(/&amp;/g, '&')
                     .replace(/&lt;/g, '<')
                     .replace(/&gt;/g, '>')
                     .replace(/&quot;/g, '"')
                     .replace(/&#39;/g, "'")
                     .replace(/&rsquo;/g, "'")
                     .replace(/&ldquo;/g, '"')
                     .replace(/&rdquo;/g, '"')
                     .replace(/&mdash;/g, '--');

    // 6. Clean up whitespace
    content = content.split('\n').map(line => line.trim()).filter(line => line.length > 0).join('\n');

    return content;
}

fetchPostContent().catch(console.error);
