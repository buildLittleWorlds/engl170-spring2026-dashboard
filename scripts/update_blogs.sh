#!/bin/bash

# ENGL 170 Blog Update Script
# Fetches content for new posts and updates student-posts.json tracking
#
# Note: The scraper (posts.json metadata) runs via GitHub Actions every 5 min.
# This script handles local content fetching and tracking only.

# Resolve absolute path to the project root
# This allows the script to be run from anywhere (like cron)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Log start time
echo "----------------------------------------"
echo "Starting content fetch at $(date)"
echo "Project Root: $PROJECT_ROOT"

# Go to project root
cd "$PROJECT_ROOT"

NODE_PATH="/Users/familyplate/.nvm/versions/node/v22.19.0/bin/node"

# Pull latest posts.json from GitHub (in case Actions updated it)
echo "Step 1: Pulling latest from GitHub..."
git pull --quiet origin main 2>/dev/null || echo "  (git pull skipped or failed)"

# Fetch content for new posts and update tracking
echo "Step 2: Fetching new post content..."
$NODE_PATH scripts/fetch_post_content.js

echo "Update complete at $(date)"
echo "----------------------------------------"
