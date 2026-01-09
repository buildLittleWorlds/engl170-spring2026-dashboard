# ENGL 170 Blog Network Dashboard

## Purpose

This dashboard aggregates blog posts from all students and the instructor in ENGL 170 (First-Year Writing), allowing participants to discover and engage with each other's writing.

## Course Context

### About ENGL 170

ENGL 170 is a composition course focused on AI, writing, and intellectual work. The central assignment is a semester-long blog where students develop argumentative perspectives on these topics.

### Blog Requirements

Each student maintains a GitHub Pages blog with these requirements:

- **Frequency**: 3 posts per week (Sunday, Tuesday, Thursday by midnight)
- **Length**: 750-1500 words per post
- **Engagement**: Each post must link to and engage with at least one other blog in the course network
- **Sources**: Each post must use at least one source outside the class blog network
- **Platform**: All blogs are hosted on GitHub Pages (not WordPress, Wix, etc.)

### Why This Dashboard Exists

Because every post must engage with another class blog, students need an easy way to discover what their classmates have written. This dashboard:

1. Aggregates all posts from all course blogs in one place
2. Shows newest posts first so students can find recent content to respond to
3. Filters by author or date range
4. Updates automatically every hour

### The Instructor's Blog

The instructor (Dr. Plate) maintains a blog at `https://buildlittleworlds.github.io/plate-composition-blog/` that models the kind of writing expected and provides starting points for student engagement. The instructor's posts appear in the dashboard with an "Instructor" badge.

## Technical Architecture

### Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Student Blogs  │     │  GitHub Action   │     │   Dashboard     │
│  (GitHub Pages) │────▶│  (scraper.js)    │────▶│  (index.html)   │
│                 │     │  runs hourly     │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │  data/posts.json │
                        │  (aggregated)    │
                        └──────────────────┘
```

### How It Works

1. **Scraper** (`scripts/scraper.js`): A Node.js script that fetches each blog's `index.html`, parses the HTML to extract post titles, dates, and URLs, then writes everything to `data/posts.json`.

2. **GitHub Action** (`.github/workflows/scrape.yml`): Runs the scraper every hour on the hour. If new posts are found, it commits and pushes the updated `posts.json`.

3. **Dashboard** (`index.html` + `js/dashboard.js`): A static page that loads `posts.json` and displays posts with filtering options. Hosted on GitHub Pages.

### Student Blog Format Requirement

For the scraper to find posts, students must format their `index.html` like this:

```html
<ul class="post-list">
  <li>
    <a href="my-post.html">Post Title Here</a>
    <span class="date">January 15, 2026</span>
  </li>
</ul>
```

This requirement is documented in the student GitHub Pages setup instructions.

## File Structure

```
engl170-dashboard/
├── index.html                 # Dashboard webpage
├── style.css                  # Styling (ink/cream/sepia academic aesthetic)
├── config.json                # List of all blog URLs
├── data/
│   └── posts.json             # Aggregated post data (auto-generated)
├── js/
│   └── dashboard.js           # Frontend filtering and display logic
├── scripts/
│   └── scraper.js             # Node.js scraper (runs in GitHub Action)
├── .github/
│   └── workflows/
│       └── scrape.yml         # GitHub Action configuration
└── README.md                  # This file
```

## Configuration

### config.json

Contains the list of all blogs to scrape:

```json
{
  "course": "ENGL 170",
  "semester": "Spring 2026",
  "title": "ENGL 170 Blog Network",
  "description": "Aggregated posts from all course blogs",
  "blogs": [
    {
      "author": "Dr. Plate",
      "url": "https://buildlittleworlds.github.io/plate-composition-blog",
      "role": "instructor"
    },
    {
      "author": "Student Name",
      "url": "https://username.github.io",
      "role": "student"
    }
  ]
}
```

### Adding New Blogs

1. Edit `config.json`
2. Add a new entry with `author`, `url`, and `role` ("student" or "instructor")
3. Commit and push
4. The next hourly scrape will pick up the new blog

## Data Format

### posts.json

```json
{
  "lastUpdated": "2026-01-09T12:59:29.276Z",
  "course": "ENGL 170",
  "semester": "Spring 2026",
  "totalPosts": 6,
  "totalBlogs": 3,
  "blogsWithErrors": [],
  "posts": [
    {
      "title": "Post Title",
      "url": "https://username.github.io/post.html",
      "date": "January 14, 2026",
      "dateISO": "2026-01-14",
      "author": "Student Name",
      "authorRole": "student",
      "blogUrl": "https://username.github.io"
    }
  ]
}
```

Posts are sorted by date, newest first.

## Dashboard Features

### Display
- Post cards showing title, author, date
- Click to visit original post
- Instructor posts have a visual badge

### Filtering
- **By Author**: Dropdown to see one person's posts
- **By Date**: This week / Last 2 weeks / Last month / All posts

### Automatic Updates
- Scraper runs every hour via GitHub Actions
- Dashboard shows "Last updated: X minutes ago"

## Scraper Details

### Parsing Strategy

The scraper (`scripts/scraper.js`) uses this fallback strategy:

1. Look for `<ul class="post-list">` (preferred format)
2. Fall back to any `<ul>` with links in `<main>`
3. Extract title from link text
4. Extract date from `.date` span or date-like text patterns
5. Skip non-post links (index.html, about.html, external URLs)

### Error Handling

- Blogs that return HTTP errors are logged in `blogsWithErrors`
- The scraper continues even if some blogs fail
- Dashboard still displays posts from working blogs

## Deployment

### Live URLs

- **Dashboard**: https://buildlittleworlds.github.io/engl170-spring2026-dashboard/
- **Instructor Blog**: https://buildlittleworlds.github.io/plate-composition-blog/

### GitHub Repositories

- Dashboard: `buildLittleWorlds/engl170-spring2026-dashboard`
- Instructor Blog: `buildLittleWorlds/plate-composition-blog`

## Maintenance Tasks

### Semester Start
1. Collect all student blog URLs
2. Add each to `config.json`
3. Verify scraping works for each blog

### During Semester
- Monitor GitHub Actions for scraping errors
- Help students fix their `index.html` format if posts aren't appearing
- Add/remove blogs from `config.json` as needed

### If a Blog Has Issues
- Check that the blog URL is correct
- Verify the blog's `index.html` uses the `post-list` format
- Check GitHub Actions logs for specific error messages

## Design Aesthetic

The dashboard matches the course's visual identity:

- **Colors**: Ink (#2C3E50), cream (#F5F0E6), sepia (#8B5A2B)
- **Typography**: Georgia serif font
- **Style**: Clean, academic, no images
- **Responsive**: Works on mobile devices

## Related Files (Outside This Repository)

These files in the main course folder relate to the dashboard:

- `course-files-for-canvas/style-guide-and-example-files/github-pages-setup-instructions.md` - Student instructions that include the required `post-list` format
- `plate-blog/` - The instructor's blog that serves as a model
- `course-planning-files/course-planning-notes.md` - Course requirements that explain why blogs must link to each other

## Test Blogs

For development/testing, two dummy student blogs exist:

- `buildLittleWorlds/test-student-alpha` - Simulates a student who disagrees with Dr. Plate
- `buildLittleWorlds/test-student-beta` - Simulates a student responding to Alpha

These demonstrate the network effect where students engage with each other's posts.
