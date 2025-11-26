# Fix 404 Error on Start Route

## Problem
```
POST /api/resurrections/c8877728-94de-41cd-b598-41b0578aee0b/start 404
```

The start route exists but Next.js is returning 404.

## Root Cause
Next.js dev server hasn't fully recompiled the route after the file was modified.

## Solution

### Option 1: Hard Restart (Recommended)
```bash
# Stop the dev server (Ctrl+C)
# Delete Next.js cache
rm -rf .next

# Regenerate Prisma
npx prisma generate

# Start fresh
npm run dev
```

### Option 2: Just Restart
```bash
# Stop the dev server (Ctrl+C)
npm run dev
```

### Option 3: Touch the File
If server is still running, modify and save the route file to trigger recompilation.

## Verification

After restart, test the route:
```bash
curl -X POST http://localhost:3000/api/resurrections/YOUR_ID/start
```

Should return 202 (Accepted) not 404.

## Why This Happens

Next.js dev server caches routes. When files are modified by external tools (like Kiro's autofix), the cache can get out of sync. A full restart clears the cache.

## Quick Test

1. Stop server
2. Delete `.next` folder
3. Run `npx prisma generate`
4. Run `npm run dev`
5. Create new resurrection
6. Should work!

---

**Status:** Waiting for server restart
**Impact:** Blocking all resurrections
**Fix Time:** 1 minute
