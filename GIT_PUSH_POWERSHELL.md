# Git Commands for PowerShell (Windows)

## ⚡ Quick Commands for PowerShell

### Step 1: Remove invalid file
```powershell
Remove-Item -Force nul -ErrorAction SilentlyContinue
```

### Step 2: Add all changes
```powershell
git add .
```

### Step 3: Commit
```powershell
git commit -m "Fix Firebase Admin initialization for Cloud Run - Payment error resolved"
```

### Step 4: Add GitHub remote
```powershell
# REPLACE 'YOUR_USERNAME/YOUR_REPO' with your actual GitHub repository!
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
```

### Step 5: Push to GitHub
```powershell
git push -u origin main
```

---

## 📋 Copy-Paste Ready (All in One)

```powershell
# Remove invalid file
Remove-Item -Force nul -ErrorAction SilentlyContinue

# Add all changes
git add .

# Commit
git commit -m "Fix Firebase Admin Cloud Run error - Payment verification resolved

- Fixed Firebase Admin SDK initialization with 3 fallback methods
- Removed explicit credential requirement for Cloud Run auto-auth
- Added comprehensive diagnostic logging
- Updated next.config.ts (fixed deprecation)
- Added Playwright test suite
- Created deployment documentation"

# Add remote (REPLACE WITH YOUR GITHUB URL!)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Push
git push -u origin main
```

---

## 🔍 Find Your GitHub Repository URL

1. **Go to your GitHub repository** in browser
2. **Click green "Code" button**
3. **Copy the HTTPS URL**

Example: `https://github.com/username/aicolouringstudio.git`

---

## 🚀 After Pushing

### Deploy to Firebase:
```powershell
firebase login
firebase deploy --only hosting
```

### Check if everything is staged:
```powershell
git status
```

---

## ⚠️ Troubleshooting

### If remote already exists:
```powershell
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
```

### If you need to pull first:
```powershell
git pull origin main --rebase
git push -u origin main
```

### Check what will be committed:
```powershell
git status
git diff --stat
```

---

## ✅ Ready to Deploy!

After pushing to GitHub:
1. **Deploy:** `firebase deploy --only hosting`
2. **Monitor:** Check Cloud Run logs
3. **Test:** Visit /subscribe and test payment

---

**PowerShell-ready commands above!** 🚀
