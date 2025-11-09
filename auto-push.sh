#!/bin/bash
# Bash script to auto-push to GitHub
# Run this script to push all changes to GitHub

echo "=== Auto-Push to GitHub ==="

# Check if git is initialized
if [ ! -d .git ]; then
    echo "❌ Not a git repository. Initialize with: git init"
    exit 1
fi

# Check if remote is configured
REMOTE=$(git remote get-url origin 2>/dev/null)
if [ -z "$REMOTE" ]; then
    echo "⚠️  No remote 'origin' configured."
    echo "Set it up with:"
    echo "   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git"
    exit 1
fi

echo "Remote: $REMOTE"

# Get current branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "Branch: $BRANCH"

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo ""
    echo "📝 Staging changes..."
    git add .
    
    echo "💾 Committing changes..."
    COMMIT_MSG="Auto-commit: $(date '+%Y-%m-%d %H:%M:%S')"
    git commit -m "$COMMIT_MSG"
    
    if [ $? -ne 0 ]; then
        echo "❌ Commit failed. Check for errors above."
        exit 1
    fi
fi

# Push to GitHub
echo ""
echo "🚀 Pushing to GitHub..."
git push origin "$BRANCH"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo "   Repository: $REMOTE"
    echo "   Branch: $BRANCH"
else
    echo ""
    echo "❌ Failed to push. Check errors above."
    echo "You may need to:"
    echo "   1. Set upstream: git push -u origin $BRANCH"
    echo "   2. Pull first: git pull origin $BRANCH"
    exit 1
fi

