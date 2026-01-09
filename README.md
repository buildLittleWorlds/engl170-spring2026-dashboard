# ENGL 170 Blog Network Dashboard

A web dashboard that aggregates posts from all course blogs, helping students find posts to engage with.

## How It Works

1. **Scraper** (`scripts/scraper.js`) fetches each blog's `index.html`
2. **GitHub Action** (`.github/workflows/scrape.yml`) runs the scraper on a schedule
3. **Posts data** (`data/posts.json`) stores the aggregated post information
4. **Dashboard** (`index.html`) displays posts with filtering options

## Setup

### 1. Create GitHub Repository

1. Create a new repository (e.g., `engl170-spring2026-dashboard`)
2. Copy all files from this directory into the repository
3. Enable GitHub Pages:
   - Go to Settings > Pages
   - Set Source to "Deploy from a branch"
   - Select `main` branch, `/ (root)` folder
   - Click Save

### 2. Add Blog URLs

Edit `config.json` to add all course blogs:

```json
{
  "course": "ENGL 170",
  "semester": "Spring 2026",
  "blogs": [
    {
      "author": "Dr. Plate",
      "url": "https://buildlittleworlds.github.io/plate-composition-blog",
      "role": "instructor"
    },
    {
      "author": "Student Name",
      "url": "https://studentusername.github.io",
      "role": "student"
    }
  ]
}
```

### 3. Run Initial Scrape

Either:
- Push a change to `config.json` or `scripts/scraper.js` (triggers automatic scrape)
- Go to Actions tab and manually run "Scrape Blogs" workflow
- Run locally: `node scripts/scraper.js`

## Maintenance

### Adding New Blogs

1. Edit `config.json`
2. Add new blog entry with author name, URL, and role
3. Commit and push
4. The scraper will automatically run and pick up the new blog

### Checking for Errors

1. Go to the Actions tab in GitHub
2. Click on the latest "Scrape Blogs" run
3. Check the logs for any blogs that returned errors

### Manual Refresh

Go to Actions > Scrape Blogs > Run workflow

## Student Requirements

Students must format their `index.html` post list like this:

```html
<ul class="post-list">
  <li>
    <a href="post-filename.html">Post Title</a>
    <span class="date">January 15, 2026</span>
  </li>
</ul>
```

This format allows the scraper to find and extract post information.

## Schedule

The scraper runs automatically:
- Every 4 hours normally
- Every hour around deadlines (Sunday/Tuesday/Thursday evenings, UTC)

## Files

```
engl170-dashboard/
├── index.html              # Dashboard page
├── style.css               # Styling
├── config.json             # Blog URLs
├── data/
│   └── posts.json          # Scraped post data
├── js/
│   └── dashboard.js        # Frontend logic
├── scripts/
│   └── scraper.js          # Node.js scraper
├── .github/
│   └── workflows/
│       └── scrape.yml      # GitHub Action
└── README.md               # This file
```

## Troubleshooting

**Posts not appearing:**
- Check that the blog URL is correct in `config.json`
- Verify the blog's `index.html` uses the `post-list` format
- Check GitHub Actions logs for errors

**Dashboard shows old data:**
- Wait for the next scheduled scrape, or trigger a manual run
- Check that the GitHub Action completed successfully

**Scraper can't find posts:**
- The blog may use a different HTML structure
- Add custom parsing logic to `scripts/scraper.js` if needed
