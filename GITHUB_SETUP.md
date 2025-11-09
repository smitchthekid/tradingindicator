# How to Add GitHub Remote and Push

## Step 1: Create GitHub Repository

1. **Go to GitHub:**
   - Visit: https://github.com/new
   - Or click the "+" icon in top right → "New repository"

2. **Fill in repository details:**
   - **Repository name:** `TradingIndicator` (or your preferred name)
   - **Description:** (optional) "Trading Indicator Configurator"
   - **Visibility:** Choose Public or Private
   - **⚠️ IMPORTANT:** Do NOT check:
     - ❌ "Add a README file"
     - ❌ "Add .gitignore"
     - ❌ "Choose a license"
   - (We already have these files)

3. **Click "Create repository"**

## Step 2: Add Remote to Your Local Repository

After creating the repository, GitHub will show you commands. Use this one:

```bash
git remote add origin https://github.com/YOUR_USERNAME/TradingIndicator.git
```

**Replace `YOUR_USERNAME` with your actual GitHub username.**

**Example:**
```bash
git remote add origin https://github.com/johnsmith/TradingIndicator.git
```

## Step 3: Verify Remote Was Added

Check that the remote was added correctly:

```bash
git remote -v
```

You should see:
```
origin  https://github.com/YOUR_USERNAME/TradingIndicator.git (fetch)
origin  https://github.com/YOUR_USERNAME/TradingIndicator.git (push)
```

## Step 4: Push to GitHub

### Option A: Use Auto-Push Script (Easiest)
```powershell
.\auto-push.ps1
```

This will:
- Stage all changes
- Commit with timestamp
- Push to GitHub

### Option B: Manual Push
```bash
# First time (sets upstream branch)
git push -u origin main

# Or if your branch is called 'master'
git push -u origin master
```

## Troubleshooting

### "remote origin already exists"
If you get this error, you already have a remote. You can:

**Option 1: Remove and re-add**
```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/TradingIndicator.git
```

**Option 2: Update existing remote**
```bash
git remote set-url origin https://github.com/YOUR_USERNAME/TradingIndicator.git
```

### "Authentication failed"
You need to authenticate with GitHub:

**Option 1: Use Personal Access Token (Recommended)**
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Give it a name (e.g., "TradingIndicator")
4. Select scopes: `repo` (full control of private repositories)
5. Click "Generate token"
6. Copy the token
7. When Git asks for password, paste the token instead

**Option 2: Use GitHub CLI**
```bash
gh auth login
```

**Option 3: Use SSH (Advanced)**
```bash
# Generate SSH key (if you don't have one)
ssh-keygen -t ed25519 -C "your_email@example.com"

# Add to GitHub: Settings → SSH and GPG keys → New SSH key
# Then use SSH URL:
git remote set-url origin git@github.com:YOUR_USERNAME/TradingIndicator.git
```

### "branch 'main' does not exist"
Your branch might be called `master` instead:

```bash
# Check current branch
git branch

# If it's 'master', use:
git push -u origin master

# Or rename to 'main':
git branch -M main
git push -u origin main
```

## Quick Reference

```bash
# Add remote
git remote add origin https://github.com/YOUR_USERNAME/TradingIndicator.git

# Check remote
git remote -v

# Push (first time)
git push -u origin main

# Push (after first time)
git push

# Or use auto-push script
.\auto-push.ps1
```

## After Setup

Once the remote is added and you've pushed once, you can:

- **Auto-push:** Just run `.\auto-push.ps1`
- **Manual push:** `git push`
- **Check status:** `git status`
- **View remote:** `git remote -v`


