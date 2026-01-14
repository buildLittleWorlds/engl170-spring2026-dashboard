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
├── style.css                  # Styling (editorial/literary magazine aesthetic)
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
- **Featured post**: Most recent post displayed prominently at top
- **Post grid**: Remaining posts in responsive card layout
- **Network stats**: Footer shows total posts, active blogs, and writer count
- Instructor posts have visual distinction (warm accent, badge)

### Filtering
- **By Author**: Dropdown labeled "Voice" to see one person's posts
- **By Date**: "Window" dropdown for This week / Last 2 weeks / Last month / All time

### Automatic Updates
- Scraper runs every hour via GitHub Actions
- Dashboard shows "Last collected: X minutes ago"

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

---

## Front-End Design System

The dashboard uses an **editorial / literary magazine aesthetic**—dark, sophisticated, and typography-forward. This section documents the complete design system for replicating in other dashboards.

### Design Philosophy

- **Tone**: Refined digital publication, like *The Paris Review* meets modern web
- **Mood**: Intellectual, sophisticated, writing-focused
- **Key features**: Strong typography hierarchy, dramatic dark palette, warm amber accents, subtle animations

### Typography

**Fonts** (loaded from Google Fonts):

```html
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Instrument+Sans:wght@400;500;600&display=swap" rel="stylesheet">
```

| Purpose | Font | Usage |
|---------|------|-------|
| Display | Cormorant Garamond (italic) | Site title, post titles, featured title, stats |
| Body | Instrument Sans | All other text, labels, metadata, UI elements |

**Type Scale**:
- Site title: `clamp(2.5rem, 6vw, 4rem)` — fluid, dramatic
- Featured title: `clamp(1.75rem, 3vw, 2.25rem)`
- Post titles: `1.35rem`
- Body text: `1rem` (16px base)
- Labels/meta: `0.75rem - 0.875rem`
- Micro text (tags): `0.65rem`

### Color Palette

**CSS Variables** (defined in `:root`):

```css
:root {
  /* Backgrounds - deep charcoal progression */
  --bg-deep: #0D0D0F;      /* Page background */
  --bg-surface: #151518;    /* Cards, header */
  --bg-elevated: #1C1C21;   /* Hover states, inputs */
  --bg-hover: #252529;      /* Active states */

  /* Text hierarchy - cream to muted */
  --text-primary: #F5F3F0;   /* Headings, important */
  --text-secondary: #A8A5A0; /* Body text */
  --text-tertiary: #6B6863;  /* Labels, dates */
  --text-muted: #4A4845;     /* Least important */

  /* Accent - warm amber/copper */
  --accent-warm: #C4956A;        /* Primary accent */
  --accent-warm-muted: #8B6B4A;  /* Subtle accent */
  --accent-highlight: #E8D5C4;   /* Hover accent */
  --accent-glow: rgba(196, 149, 106, 0.15); /* Background glow */

  /* Borders */
  --border-subtle: rgba(168, 165, 160, 0.08);
  --border-medium: rgba(168, 165, 160, 0.15);
  --border-accent: rgba(196, 149, 106, 0.3);
}
```

### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  HEADER                                                 │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Spring 2026                                     │   │
│  │ The Network (italic, large)                     │   │
│  │ ENGL 170 · Composition II                       │   │
│  └─────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│  FILTER BAR (sticky)                                    │
│  Voice: [dropdown]  Window: [dropdown]    X posts...   │
├─────────────────────────────────────────────────────────┤
│  MAIN CONTENT                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │  FEATURED POST (2-column card)                   │   │
│  │  Latest | Title | Author | Date | Visual        │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                   │
│  │ Post    │ │ Post    │ │ Post    │  ← Grid           │
│  │ Card    │ │ Card    │ │ Card    │                   │
│  └─────────┘ └─────────┘ └─────────┘                   │
├─────────────────────────────────────────────────────────┤
│  FOOTER                                                 │
│  Last collected: X ago          10 Posts | 4 Blogs     │
└─────────────────────────────────────────────────────────┘
```

**Grid**: `repeat(auto-fill, minmax(340px, 1fr))` — responsive cards

### Component Patterns

#### Featured Post Card
- 2-column grid layout (content | visual)
- Left accent bar (4px gradient)
- "Latest" label badge
- Large decorative quotation mark in visual area
- Lifts on hover with shadow

#### Post Card
- Rounded corners (`10px`)
- Subtle border, accent border on hover
- Staggered fade-in animation on load
- "Read post →" link slides in on hover
- Instructor cards have warm gradient background and accent dot

#### Filter Controls
- Uppercase micro labels ("VOICE", "WINDOW")
- Custom select styling with SVG dropdown arrow
- Accent glow on focus

#### Instructor Distinction
- Warm gradient background
- Amber accent dot (top-right)
- "INSTRUCTOR" tag badge
- Glowing author indicator dot

### Visual Effects

**Grain Overlay**:
```css
.grain-overlay {
  position: fixed;
  pointer-events: none;
  z-index: 1000;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,..."); /* SVG noise filter */
}
```

**Header Accent Line**:
```css
.site-header::before {
  background: linear-gradient(90deg, transparent 0%, var(--accent-warm-muted) 50%, transparent 100%);
}
```

**Card Hover**:
```css
.post-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px -12px rgba(0, 0, 0, 0.4);
  border-color: var(--border-accent);
}
```

**Staggered Animation**:
```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
.post-card:nth-child(1) { animation-delay: 0.05s; }
.post-card:nth-child(2) { animation-delay: 0.1s; }
/* etc. */
```

### Responsive Breakpoints

| Breakpoint | Changes |
|------------|---------|
| `900px` | Featured card becomes single column |
| `768px` | Header stacks, filter bar stacks, grid becomes single column |
| `480px` | Reduced padding, smaller titles |

### Spacing Scale

```css
--space-xs: 0.25rem;   /* 4px */
--space-sm: 0.5rem;    /* 8px */
--space-md: 1rem;      /* 16px */
--space-lg: 1.5rem;    /* 24px */
--space-xl: 2rem;      /* 32px */
--space-2xl: 3rem;     /* 48px */
--space-3xl: 4rem;     /* 64px */
```

### Adapting for Another Course

To replicate this design for a different course dashboard:

1. **Copy these files**: `index.html`, `style.css`, `js/dashboard.js`

2. **Update text content in `index.html`**:
   - Change "Spring 2026" to your semester
   - Change "The Network" title if desired
   - Change "ENGL 170 · Composition II" to your course

3. **Update `config.json`** with your course info and blog URLs

4. **Optional customizations**:
   - Change `--accent-warm` color family for a different accent
   - Modify the site title in `.site-title`
   - Adjust filter labels ("Voice", "Window") if desired

The scraper and data format remain the same—only the front-end styling and text change.

---

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
