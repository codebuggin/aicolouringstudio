# Git Commit & Push Instructions

## Quick Commands

### Step 1: Clean up invalid files
```bash
# Remove the 'nul' file (caused by Windows command)
rm -f nul
```

### Step 2: Add all changes
```bash
git add .
```

### Step 3: Commit changes
```bash
git commit -m "Fix Firebase Admin initialization for Cloud Run - Payment error resolved

- Fixed Firebase Admin SDK initialization with 3 fallback methods
- Removed explicit credential requirement (Cloud Run auto-auth)
- Added comprehensive diagnostic logging
- Updated next.config.ts to fix deprecated warning
- Added Playwright test suite for debugging
- Created deployment documentation

Fixes #[issue-number]"
```

### Step 4: Add GitHub remote (if needed)
```bash
# Replace with your actual GitHub repository URL
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

### Step 5: Push to GitHub
```bash
# Push to main branch
git push -u origin main

# Or if your default branch is 'master'
git push -u origin master
```

---

## Detailed Instructions

### If you don't know your GitHub repository URL:

1. **Go to your GitHub repository** in a browser
2. **Click the green "Code" button**
3. **Copy the HTTPS URL** (looks like: `https://github.com/username/repo.git`)

### If you're using SSH instead of HTTPS:

```bash
# Add remote with SSH URL
git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO_NAME.git

# Push
git push -u origin main
```

---

## Alternative: One-Line Commands

```bash
# Clean, add, commit, and configure remote
rm -f nul && \
git add . && \
git commit -m "Fix Firebase Admin Cloud Run error - Payment verification now works" && \
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git && \
git push -u origin main
```

---

## What Gets Committed

### Core Fixes:
- ✅ src/lib/firebaseAdmin.ts (Firebase Admin initialization fix)
- ✅ next.config.ts (Deprecated config warning fix)
- ✅ src/app/api/verify-payment/route.ts (Already correct)
- ✅ src/app/api/generate-image/route.ts (Already correct)

### Testing:
- ✅ playwright.config.ts
- ✅ tests/payment-debug.spec.ts
- ✅ tests/payment-authenticated.spec.ts
- ✅ package.json (with Playwright)
- ✅ package-lock.json

### Documentation:
- ✅ DEPLOYMENT_READY.md
- ✅ PLAYWRIGHT_TEST_RESULTS.md
- ✅ FINAL_SUMMARY.md
- ✅ README_DEPLOYMENT.md
- ✅ PAYMENT_DEBUG_INSTRUCTIONS.md
- ✅ deploy.sh
- ✅ GIT_PUSH_INSTRUCTIONS.md (this file)

### Build Artifacts (NOT committed - in .gitignore):
- ❌ .next/
- ❌ node_modules/
- ❌ test-results/
- ❌ playwright-report/

---

## Troubleshooting

### Error: "fatal: adding files failed"
**Cause:** Invalid file like `nul`
**Solution:** `rm -f nul` then try again

### Error: "fatal: remote origin already exists"
**Cause:** Remote was already added
**Solution:**
```bash
# Remove existing remote
git remote remove origin

# Add new one
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

### Error: "failed to push some refs"
**Cause:** Remote has changes you don't have locally
**Solution:**
```bash
# Pull first
git pull origin main --rebase

# Then push
git push -u origin main
```

### Error: "Authentication failed"
**Cause:** GitHub requires personal access token (not password)
**Solution:**
1. Go to GitHub Settings → Developer Settings → Personal Access Tokens
2. Generate new token with 'repo' scope
3. Use token as password when prompted

---

## After Pushing

### Deploy to Production:
```bash
firebase deploy --only hosting
```

### Monitor Cloud Run logs:
https://console.cloud.google.com/run/detail/us-central1/ssrstudio8922232553e935/logs

### Test payment flow:
https://studio-8922232553-e9354.web.app/subscribe

---

## Git Status Check

Before committing, you can check what will be committed:
```bash
# See all changed files
git status

# See what changed in each file
git diff

# See what's staged for commit
git diff --cached
```

---

**Ready to commit and push!** 🚀
