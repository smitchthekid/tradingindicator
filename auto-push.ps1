# PowerShell script to auto-push to GitHub
# Run this script to push all changes to GitHub

Write-Host "=== Auto-Push to GitHub ===" -ForegroundColor Cyan

# Check if git is initialized
if (-not (Test-Path .git)) {
    Write-Host "ERROR: Not a git repository. Initialize with: git init" -ForegroundColor Red
    exit 1
}

# Check if remote is configured
$remote = git remote get-url origin 2>$null
if (-not $remote) {
    Write-Host "WARNING: No remote 'origin' configured." -ForegroundColor Yellow
    Write-Host "Set it up with:" -ForegroundColor Yellow
    Write-Host "   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git" -ForegroundColor Yellow
    exit 1
}

Write-Host "Remote: $remote" -ForegroundColor Gray

# Get current branch
$branch = git rev-parse --abbrev-ref HEAD
Write-Host "Branch: $branch" -ForegroundColor Gray

# Check for uncommitted changes
$status = git status --porcelain
if ($status) {
    Write-Host ""
    Write-Host "Staging changes..." -ForegroundColor Yellow
    git add .
    
    Write-Host "Committing changes..." -ForegroundColor Yellow
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $commitMessage = "Auto-commit: $timestamp"
    git commit -m $commitMessage
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Commit failed. Check for errors above." -ForegroundColor Red
        exit 1
    }
}

# Push to GitHub
Write-Host ""
Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
git push origin $branch

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "SUCCESS: Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host "   Repository: $remote" -ForegroundColor Gray
    Write-Host "   Branch: $branch" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "ERROR: Failed to push. Check errors above." -ForegroundColor Red
    Write-Host "You may need to:" -ForegroundColor Yellow
    Write-Host "   1. Create repository on GitHub first: https://github.com/new" -ForegroundColor Yellow
    Write-Host "   2. Set upstream: git push -u origin $branch" -ForegroundColor Yellow
    Write-Host "   3. Pull first: git pull origin $branch" -ForegroundColor Yellow
    exit 1
}
