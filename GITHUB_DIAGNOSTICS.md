# GitHub Upload Diagnostics & Troubleshooting

## Diagnostic Results

Run this to check your GitHub setup:
```powershell
cd "C:\Users\juxwa\Desktop\apps.pleasecart.net\TradingIndicator"
.\auto-push.ps1
```

## Common Issues & Solutions

### Issue 1: Repository Not Found

**Error:**
```
remote: Repository not found.
fatal: repository 'https://github.com/pleasecart/tradingindicator.git/' not found
```

**Solution:**
1. **Create the repository on GitHub:**
   - Go to: https://github.com/new
   - Repository name: `tradingindicator`
   - Choose Public or Private
   - **⚠️ DO NOT** check "Initialize with README"
   - Click "Create repository"

2. **Then push:**
   ```powershell
   .\auto-push.ps1
   ```

### Issue 2: Authentication Failed

**Error:**
```
remote: Support for password authentication was removed.
fatal: Authentication failed
```

**Solution:**
1. **Use Personal Access Token:**
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token" → "Generate new token (classic)"
   - Name: `TradingIndicator`
   - Select scopes: `repo` (full control)
   - Click "Generate token"
   - **Copy the token** (you won't see it again!)

2. **Use token as password:**
   - When Git asks for password, paste the token
   - Username: `pleasecart`

3. **Or configure Git credential helper:**
   ```powershell
   git config --global credential.helper wincred
   ```

### Issue 3: Permission Denied

**Error:**
```
remote: Permission denied (publickey).
fatal: Could not read from remote repository.
```

**Solution:**
1. **Check SSH keys (if using SSH):**
   - Or switch to HTTPS (recommended)

2. **Use HTTPS instead:**
   ```powershell
   git remote set-url origin https://github.com/pleasecart/tradingindicator.git
   ```

### Issue 4: Branch Not Found

**Error:**
```
error: src refspec master does not match any
```

**Solution:**
1. **Check your branch name:**
   ```powershell
   git branch
   ```

2. **If branch is `main` instead of `master`:**
   ```powershell
   git push -u origin main
   ```

3. **Or rename branch:**
   ```powershell
   git branch -M master
   git push -u origin master
   ```

### Issue 5: Remote URL Wrong

**Error:**
```
fatal: remote origin already exists.
```

**Solution:**
1. **Check current remote:**
   ```powershell
   git remote -v
   ```

2. **Update remote URL:**
   ```powershell
   git remote set-url origin https://github.com/pleasecart/tradingindicator.git
   ```

3. **Verify:**
   ```powershell
   git remote -v
   ```

### Issue 6: Nothing to Push

**Status:**
```
Everything up-to-date
```

**This is normal!** Your code is already pushed. No action needed.

## Step-by-Step Troubleshooting

### Step 1: Verify Git Setup

```powershell
# Check Git is installed
git --version

# Check current directory
Get-Location

# Check if Git repository
Test-Path .git
```

### Step 2: Check Remote Configuration

```powershell
# View remote URL
git remote -v

# Should show:
# origin  https://github.com/pleasecart/tradingindicator.git (fetch)
# origin  https://github.com/pleasecart/tradingindicator.git (push)
```

### Step 3: Test Connection

```powershell
# Test if repository exists
git ls-remote origin

# If error, repository doesn't exist or wrong URL
```

### Step 4: Check Local Status

```powershell
# Check for uncommitted changes
git status

# Check branch
git branch

# Check commits ahead
git log origin/master..HEAD
```

### Step 5: Manual Push Test

```powershell
# Try manual push
git push origin master

# Or if branch is main
git push origin main
```

## Quick Fix Commands

### Reset Remote URL
```powershell
git remote set-url origin https://github.com/pleasecart/tradingindicator.git
```

### Check What Needs Pushing
```powershell
git status
git log origin/master..HEAD --oneline
```

### Force Push (Use with caution!)
```powershell
git push -u origin master --force
```

### Create and Push New Branch
```powershell
git checkout -b master
git push -u origin master
```

## Complete Setup Checklist

- [ ] Git is installed (`git --version`)
- [ ] In correct directory (`C:\Users\juxwa\Desktop\apps.pleasecart.net\TradingIndicator`)
- [ ] Git repository initialized (`.git` folder exists)
- [ ] Remote configured (`git remote -v` shows correct URL)
- [ ] Repository exists on GitHub (https://github.com/pleasecart/tradingindicator)
- [ ] Authentication configured (Personal Access Token)
- [ ] Branch exists (`git branch` shows `master` or `main`)
- [ ] Changes committed (`git status` shows clean)
- [ ] Ready to push (`.\auto-push.ps1`)

## Manual Push Steps

If auto-push doesn't work, try manual:

```powershell
# 1. Check status
git status

# 2. Stage changes (if any)
git add .

# 3. Commit (if needed)
git commit -m "Your commit message"

# 4. Push
git push -u origin master
```

## Authentication Setup

### Option 1: Personal Access Token (Recommended)

1. **Generate token:**
   - https://github.com/settings/tokens
   - Generate new token (classic)
   - Select `repo` scope
   - Copy token

2. **Use token:**
   - Username: `pleasecart`
   - Password: (paste token)

### Option 2: GitHub CLI

```powershell
# Install GitHub CLI
winget install GitHub.cli

# Login
gh auth login

# Then push works automatically
```

## Verify Upload Success

After pushing, verify:

1. **Check GitHub:**
   - https://github.com/pleasecart/tradingindicator
   - Should show your files

2. **Check commits:**
   - Should see your commit history
   - Latest commit should match local

3. **Check Railway:**
   - Railway should detect new commit
   - Auto-trigger deployment

## Still Having Issues?

1. **Check Git version:**
   ```powershell
   git --version
   ```

2. **Check Git config:**
   ```powershell
   git config --list
   ```

3. **Check network:**
   - Can you access github.com in browser?
   - Firewall blocking Git?

4. **Try different method:**
   - Use GitHub Desktop
   - Use VS Code Git integration
   - Use GitHub CLI

## Next Steps After Successful Push

1. ✅ Code pushed to GitHub
2. ✅ Railway detects new commit
3. ✅ Railway auto-deploys
4. ✅ Check Railway dashboard for deployment status
5. ✅ Configure DNS in Cloudflare

