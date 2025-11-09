# Auto-Push to GitHub Setup

I've set up multiple ways to automatically push your code to GitHub:

## Option 1: PowerShell Script (Windows - Recommended) ⭐

**For Windows users - easiest option:**

1. **Run the script:**
   ```powershell
   .\auto-push.ps1
   ```

2. **First time setup:**
   - If no remote is configured, the script will tell you
   - Add remote: `git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git`
   - Then run the script again

3. **What it does:**
   - Stages all changes
   - Commits with timestamp
   - Pushes to GitHub automatically

## Option 2: Git Post-Commit Hook

**Automatically pushes after every commit:**

1. **Make hook executable (if on Linux/Mac):**
   ```bash
   chmod +x .git/hooks/post-commit
   ```

2. **On Windows, the hook may not work** - use the PowerShell script instead

3. **What it does:**
   - Runs automatically after `git commit`
   - Pushes to GitHub without extra steps

## Option 3: Manual Push Script

**Quick push command:**

```bash
# Windows PowerShell
.\auto-push.ps1

# Linux/Mac
./auto-push.sh
```

## Option 4: GitHub Actions (Automatic on Push)

**Already configured!** When you push to GitHub:
- Automatically builds your project
- Runs tests
- Verifies everything works

## Quick Start

### First Time Setup:

1. **Create GitHub repository:**
   - Go to https://github.com/new
   - Create repository (don't initialize with README)

2. **Add remote:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   ```

3. **Push everything:**
   ```powershell
   # Windows
   .\auto-push.ps1
   
   # Or manually
   git push -u origin main
   ```

### Daily Use:

**Just run the script:**
```powershell
.\auto-push.ps1
```

It will:
- ✅ Stage all changes
- ✅ Commit with timestamp
- ✅ Push to GitHub
- ✅ Show success/failure

## Troubleshooting

### "No remote configured"
```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
```

### "Failed to push"
- Check your GitHub credentials
- Try: `git push -u origin main` (first time)
- Make sure you have write access to the repo

### "Permission denied"
- Set up SSH keys or use HTTPS with personal access token
- Or use GitHub CLI: `gh auth login`

## Recommended Workflow

1. **Make changes to your code**
2. **Run:** `.\auto-push.ps1`
3. **Done!** Code is on GitHub

No need to remember `git add`, `git commit`, `git push` - the script does it all!

